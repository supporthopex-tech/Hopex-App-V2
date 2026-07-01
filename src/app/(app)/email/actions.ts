"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { sendCompanyEmail, parseEmailList, type PreparedAttachment } from "@/lib/email/send";
import { emailTemplateKeys, templateOptions, type EmailTemplateContext, type EmailTemplateKey } from "@/lib/email/templates";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type ActionState = { ok: boolean; message: string };
type MutationClient = {
  from: (table: string) => {
    insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } | Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    select: (columns?: string) => { eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  };
  storage?: {
    from: (bucket: string) => {
      upload: (path: string, file: File, options?: { upsert?: boolean; contentType?: string }) => Promise<{ error: { message: string } | null }>;
    };
  };
};

export async function sendEmail(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("email.send");
  const saveDraft = formData.get("intent") === "draft";
  const templateKey = normalizeTemplateKey(String(formData.get("template_key") ?? "general"));
  const toEmail = String(formData.get("to_email") ?? "").trim();
  const cc = String(formData.get("cc") ?? "").trim();
  const bcc = String(formData.get("bcc") ?? "").trim();
  const subject = String(formData.get("subject") ?? "").trim();
  const body = String(formData.get("body") ?? "").trim();
  const relatedCustomerId = String(formData.get("related_customer_id") || "") || null;
  const relatedShipmentId = String(formData.get("related_shipment_id") || "") || null;
  const relatedQuoteId = String(formData.get("related_quote_id") || "") || null;
  const relatedInvoiceId = String(formData.get("related_invoice_id") || "") || null;

  try {
    parseEmailList(toEmail, "To");
    if (cc) parseEmailList(cc, "CC");
    if (bcc) parseEmailList(bcc, "BCC");
  } catch (error) {
    return { ok: false, message: error instanceof Error ? error.message : "Invalid email address." };
  }
  if (!subject) return { ok: false, message: "Subject is required." };
  if (!body) return { ok: false, message: "Message body is required." };

  if (!isSupabaseConfigured()) {
    revalidatePath("/email");
    redirect(saveDraft ? "/email/drafts" : "/email/sent");
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const context = await buildEmailContext(supabase, formData, tenant.company.id);
  const result = supabase.from("email_messages").insert({
    company_id: tenant.company.id,
    folder: saveDraft ? "drafts" : "sent",
    from_email: tenant.company.email ?? tenant.user.email,
    to_email: toEmail,
    cc,
    bcc,
    recipient: toEmail,
    subject,
    body,
    status: saveDraft ? "draft" : "pending",
    is_read: true,
    sent_at: null,
    related_customer_id: relatedCustomerId,
    related_shipment_id: relatedShipmentId,
    related_quote_id: relatedQuoteId,
    related_invoice_id: relatedInvoiceId,
    created_by: tenant.user.id,
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data, error } = await result.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not save email." };
  let attachments: PreparedAttachment[];
  try {
    attachments = await uploadEmailAttachments(supabase, tenant.company.id, tenant.user.id, String(data.id), formData);
  } catch (attachmentError) {
    return { ok: false, message: attachmentError instanceof Error ? attachmentError.message : "Could not upload email attachments." };
  }

  const emailId = String(data.id);
  if (saveDraft) {
    await insertEmailLog(supabase, {
      tenant,
      emailId,
      eventType: "draft_saved",
      status: "pending",
      recipient: toEmail,
      subject,
      relatedCustomerId,
      relatedShipmentId,
    });
    await audit(supabase, tenant.company.id, tenant.user.id, "email.draft_saved", emailId);
    revalidatePath("/email");
    redirect("/email/drafts");
  }

  await insertEmailLog(supabase, {
    tenant,
    emailId,
    eventType: "send_pending",
    status: "pending",
    recipient: toEmail,
    subject,
    relatedCustomerId,
    relatedShipmentId,
  });

  try {
    const sendResult = await sendCompanyEmail({
      tenant,
      to: toEmail,
      cc,
      bcc,
      subject,
      body,
      templateKey,
      context,
      attachments,
    });
    const sentAt = new Date().toISOString();
    await supabase.from("email_messages").update({ status: "sent", sent_at: sentAt, from_email: sendResult.fromEmail }).eq("id", emailId);
    await insertEmailLog(supabase, {
      tenant,
      emailId,
      eventType: "resend_sent",
      status: "sent",
      recipient: sendResult.recipients.join(", "),
      subject: sendResult.subject,
      relatedCustomerId,
      relatedShipmentId,
      resendMessageId: sendResult.resendMessageId,
      sentAt,
    });
    await audit(supabase, tenant.company.id, tenant.user.id, "email.sent", emailId);
  } catch (sendError) {
    const message = sendError instanceof Error ? sendError.message : "Could not send email through Resend.";
    await supabase.from("email_messages").update({ status: "failed" }).eq("id", emailId);
    await insertEmailLog(supabase, {
      tenant,
      emailId,
      eventType: "resend_failed",
      status: "failed",
      recipient: toEmail,
      subject,
      relatedCustomerId,
      relatedShipmentId,
      errorMessage: message,
    });
    await audit(supabase, tenant.company.id, tenant.user.id, "email.failed", emailId);
    revalidatePath("/email");
    return { ok: false, message };
  }

  revalidatePath("/email");
  redirect(`/email/${emailId}`);
}

export async function updateEmailState(formData: FormData) {
  const id = String(formData.get("email_id") ?? "");
  const tenant = await requireAnyPermission(["email.send", "email.manage"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/email");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const payload: Record<string, unknown> = {};
  const action = String(formData.get("action") ?? "");
  if (action === "trash") payload.folder = "trash";
  if (action === "read") payload.is_read = true;
  if (action === "unread") payload.is_read = false;
  await supabase.from("email_messages").update(payload).eq("id", id);
  await audit(supabase, tenant.company.id, tenant.user.id, `email.${action}`, id);
  revalidatePath("/email");
  revalidatePath(`/email/${id}`);
}

export async function deleteEmail(formData: FormData) {
  await requirePermission("email.manage");
  const id = String(formData.get("email_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/email");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("email_messages").delete().eq("id", id);
  revalidatePath("/email");
}

async function audit(supabase: MutationClient, companyId: string, actorId: string, action: string, recordId: string) {
  await supabase.from("audit_logs").insert({ company_id: companyId, actor_id: actorId, action, table_name: "email_messages", record_id: recordId, created_by: actorId });
  await supabase.from("notifications").insert({ company_id: companyId, user_id: actorId, title: action.replaceAll(".", " "), body: "Email activity recorded.", created_by: actorId });
}

async function uploadEmailAttachments(supabase: MutationClient, companyId: string, userId: string, emailId: string, formData: FormData): Promise<PreparedAttachment[]> {
  const allowed = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
  ]);
  const files = formData.getAll("attachments").filter((value): value is File => value instanceof File && value.size > 0);
  const prepared: PreparedAttachment[] = [];
  let encodedBytes = 0;
  for (const file of files) {
    if (!allowed.has(file.type)) throw new Error("Email attachments must be images, PDF, DOC, or DOCX files.");
    if (file.size > 10 * 1024 * 1024) throw new Error("Each email attachment must be 10MB or smaller.");
    const content = Buffer.from(await file.arrayBuffer()).toString("base64");
    encodedBytes += Buffer.byteLength(content);
    if (encodedBytes > 36 * 1024 * 1024) throw new Error("Total email attachments are too large for Resend.");
    const safeName = file.name.replace(/[^\w.\-() ]+/g, "_");
    const path = `${companyId}/${emailId}/${Date.now()}-${safeName}`;
    const upload = await supabase.storage?.from("email-attachments").upload(path, file, { upsert: false, contentType: file.type });
    if (upload?.error) throw new Error(upload.error.message);
    await supabase.from("email_attachments").insert({
      company_id: companyId,
      email_message_id: emailId,
      file_name: safeName,
      file_path: path,
      file_type: file.type,
      file_size: file.size,
      created_by: userId,
    });
    prepared.push({ filename: safeName, content, contentType: file.type, size: file.size });
  }
  return prepared;
}

async function buildEmailContext(supabase: MutationClient, formData: FormData, companyId: string): Promise<EmailTemplateContext> {
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const message = String(formData.get("body") ?? "");
  const shipmentId = String(formData.get("related_shipment_id") || "");
  const quoteId = String(formData.get("related_quote_id") || "");
  const invoiceNumber = String(formData.get("invoice_number") ?? "");
  const context: EmailTemplateContext = { customerName, message };

  if (shipmentId) {
    const { data } = await supabase.from("shipments").select("tracking_number,status,origin,destination,estimated_delivery,qr_code_value,customer_name").eq("id", shipmentId).single();
    if (data) {
      const trackingNumber = String(data.tracking_number ?? "");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
      context.customerName ||= String(data.customer_name ?? "");
      context.shipment = {
        trackingNumber,
        status: String(data.status ?? ""),
        origin: String(data.origin ?? ""),
        destination: String(data.destination ?? ""),
        estimatedDelivery: String(data.estimated_delivery ?? ""),
        trackingLink: appUrl && trackingNumber ? `${appUrl}/track/${encodeURIComponent(trackingNumber)}` : "",
        qrCodeUrl: String(data.qr_code_value ?? "").startsWith("http") ? String(data.qr_code_value) : "",
      };
    }
  }

  if (quoteId) {
    const { data } = await supabase.from("quote_requests").select("customer_name,origin,destination,cargo_description,quoted_amount,currency").eq("id", quoteId).single();
    if (data) {
      context.customerName ||= String(data.customer_name ?? "");
      context.quote = {
        id: quoteId,
        amount: `${String(data.currency ?? "")} ${Number(data.quoted_amount ?? 0).toLocaleString()}`,
        origin: String(data.origin ?? ""),
        destination: String(data.destination ?? ""),
        cargoDescription: String(data.cargo_description ?? ""),
      };
    }
  }

  if (invoiceNumber) {
    context.invoice = {
      invoiceNumber,
      amountDue: String(formData.get("amount_due") ?? ""),
      dueDate: String(formData.get("due_date") ?? ""),
      paymentLink: String(formData.get("payment_link") ?? ""),
    };
  }

  if (!context.customerName) {
    const customerId = String(formData.get("related_customer_id") || "");
    if (customerId) {
      const { data } = await supabase.from("customers").select("company_name,full_name").eq("id", customerId).single();
      context.customerName = String(data?.company_name ?? data?.full_name ?? "");
    }
  }

  context.message = message.replaceAll("{{company_id}}", companyId);
  return context;
}

function normalizeTemplateKey(value: string): EmailTemplateKey {
  return emailTemplateKeys.includes(value as EmailTemplateKey) ? (value as EmailTemplateKey) : templateOptions[0].key;
}

async function insertEmailLog(
  supabase: MutationClient,
  input: {
    tenant: Awaited<ReturnType<typeof requirePermission>>;
    emailId: string;
    eventType: string;
    status: "sent" | "failed" | "pending";
    recipient: string;
    subject: string;
    relatedCustomerId?: string | null;
    relatedShipmentId?: string | null;
    resendMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
) {
  await supabase.from("email_logs").insert({
    company_id: input.tenant.company.id,
    email_message_id: input.emailId,
    event_type: input.eventType,
    status: input.status,
    recipient: input.recipient,
    subject: input.subject,
    sent_by: input.tenant.user.id,
    related_customer_id: input.relatedCustomerId ?? null,
    related_shipment_id: input.relatedShipmentId ?? null,
    resend_message_id: input.resendMessageId ?? null,
    error_message: input.errorMessage ?? null,
    sent_at: input.sentAt ?? null,
    metadata: {
      recipient: input.recipient,
      subject: input.subject,
      resend_message_id: input.resendMessageId ?? null,
      error_message: input.errorMessage ?? null,
    },
    created_by: input.tenant.user.id,
  });
}
