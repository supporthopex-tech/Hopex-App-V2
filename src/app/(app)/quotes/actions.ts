"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeCurrency } from "@/lib/currencies";
import { normalizeDestination } from "@/lib/destinations";
import { generateTrackingNumber } from "@/lib/shipments/tracking";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type ActionState = { ok: boolean; message: string };
type MutationClient = {
  from: (table: string) => {
    select: (columns?: string) => QueryBuilder;
    insert: (payload: Record<string, unknown>) => { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } } | Promise<{ error: { message: string } | null }>;
    upsert: (payload: Record<string, unknown>, options?: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

type QueryBuilder = {
  eq: (column: string, value: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
};

export async function createQuoteRequest(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("quotes.create");
  if (!isSupabaseConfigured()) {
    revalidatePath("/quotes");
    redirect("/quotes");
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const result = supabase.from("quote_requests").insert({
    company_id: tenant.company.id,
    customer_name: String(formData.get("customer_name") ?? ""),
    customer_phone: String(formData.get("customer_phone") ?? ""),
    customer_email: String(formData.get("customer_email") ?? ""),
    origin: String(formData.get("origin") ?? ""),
    destination: normalizeDestination(formData.get("destination")),
    cargo_description: String(formData.get("cargo_description") ?? ""),
    cargo_type: String(formData.get("cargo_type") ?? "Air Freight"),
    estimated_weight: Number(formData.get("estimated_weight") || 0),
    estimated_pieces: Number(formData.get("estimated_pieces") || 0),
    estimated_volume: Number(formData.get("estimated_volume") || 0),
    requested_date: String(formData.get("requested_date") || "") || null,
    quoted_amount: Number(formData.get("quoted_amount") || 0),
    currency: normalizeCurrency(formData.get("currency") || tenant.company.currency),
    status: String(formData.get("status") || "new"),
    notes: String(formData.get("notes") ?? ""),
    created_by: tenant.user.id,
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data, error } = await result.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create quote request." };
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "quote.created", "quote_requests", String(data.id), "Quote request created");
  revalidatePath("/quotes");
  redirect(`/quotes/${data.id}`);
}

export async function updateQuoteStatus(formData: FormData) {
  const id = String(formData.get("quote_id") ?? "");
  const status = String(formData.get("status") ?? "new");
  if (!isSupabaseConfigured()) {
    revalidatePath("/quotes");
    return;
  }
  const tenant = await requireAnyPermission(["quotes.edit", "quotes.create"]);
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("quote_requests").update({ status }).eq("id", id);
  await supabase.from("quote_status_logs").insert({ company_id: tenant.company.id, quote_request_id: id, to_status: status, created_by: tenant.user.id });
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, `quote.${status}`, "quote_requests", id, `Quote marked ${status}`);
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function updateQuoteRequest(formData: FormData) {
  const id = String(formData.get("quote_id") ?? "");
  const tenant = await requireAnyPermission(["quotes.edit", "quotes.create"]);
  if (!isSupabaseConfigured()) {
    revalidatePath(`/quotes/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("quote_requests").update({
    customer_name: String(formData.get("customer_name") ?? ""),
    customer_phone: String(formData.get("customer_phone") ?? ""),
    customer_email: String(formData.get("customer_email") ?? ""),
    origin: String(formData.get("origin") ?? ""),
    destination: normalizeDestination(formData.get("destination")),
    cargo_description: String(formData.get("cargo_description") ?? ""),
    cargo_type: String(formData.get("cargo_type") ?? ""),
    quoted_amount: Number(formData.get("quoted_amount") || 0),
    notes: String(formData.get("notes") ?? ""),
  }).eq("id", id);
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "quote.updated", "quote_requests", id, "Quote request updated");
  revalidatePath("/quotes");
  revalidatePath(`/quotes/${id}`);
}

export async function deleteQuoteRequest(formData: FormData) {
  await requirePermission("quotes.delete");
  const id = String(formData.get("quote_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/quotes");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("quote_requests").delete().eq("id", id);
  revalidatePath("/quotes");
}

export async function convertQuoteToShipment(formData: FormData) {
  const id = String(formData.get("quote_id") ?? "");
  const tenant = await requireAnyPermission(["quotes.edit", "shipments.create"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/quotes");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  const trackingNumber = await nextTrackingNumber(supabase, tenant.company.id, tenant.company.name.slice(0, 3));
  const quotedAmount = Number(formData.get("quoted_amount") || 0);
  const customerId = await ensureQuoteCustomer(supabase, tenant.company.id, tenant.user.id, formData);
  const shipmentResult = supabase.from("shipments").insert({
    company_id: tenant.company.id,
    tracking_number: trackingNumber,
    customer_id: customerId,
    origin: String(formData.get("origin") ?? "Origin"),
    destination: normalizeDestination(formData.get("destination")),
    cargo_description: String(formData.get("cargo_description") ?? ""),
    cargo_type: String(formData.get("cargo_type") ?? "Air Freight"),
    customer_name: String(formData.get("customer_name") ?? ""),
    customer_phone: String(formData.get("customer_phone") ?? ""),
    customer_email: String(formData.get("customer_email") ?? ""),
    currency: tenant.company.currency,
    subtotal: quotedAmount,
    total_amount: quotedAmount,
    status: "pending",
    created_by: tenant.user.id,
  }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data } = await shipmentResult.select("id").single();
  if (data?.id && quotedAmount > 0) {
    const invoiceNumber = await nextInvoiceNumber(supabase, tenant.company.id, tenant.user.id);
    await supabase.from("invoices").insert({
      company_id: tenant.company.id,
      invoice_number: invoiceNumber,
      shipment_id: String(data.id),
      quote_id: id,
      issue_date: new Date().toISOString().slice(0, 10),
      currency: tenant.company.currency,
      subtotal: quotedAmount,
      tax_amount: 0,
      discount_amount: 0,
      total_amount: quotedAmount,
      amount: quotedAmount,
      paid_amount: 0,
      balance_due: quotedAmount,
      status: "draft",
      created_by: tenant.user.id,
    });
  }
  await supabase.from("quote_requests").update({ status: "converted", converted_shipment_id: data?.id ?? null }).eq("id", id);
  await auditAndNotify(supabase, tenant.company.id, tenant.user.id, "quote.converted", "quote_requests", id, "Quote converted to shipment");
  revalidatePath("/quotes");
  revalidatePath("/shipments");
}

async function ensureQuoteCustomer(supabase: MutationClient, companyId: string, userId: string, formData: FormData) {
  const name = String(formData.get("customer_name") ?? "").trim();
  const phone = String(formData.get("customer_phone") ?? "").trim();
  const email = String(formData.get("customer_email") ?? "").trim();
  const match = email
    ? await supabase.from("customers").select("id").eq("company_id", companyId).eq("email", email).maybeSingle()
    : phone
      ? await supabase.from("customers").select("id").eq("company_id", companyId).eq("phone", phone).maybeSingle()
      : null;
  const payload = { full_name: name, company_name: name, contact_name: name, phone, email, status: "active" };
  if (match?.data?.id) {
    const id = String(match.data.id);
    const update = await supabase.from("customers").update(payload).eq("id", id);
    if (update.error) throw new Error(update.error.message);
    return id;
  }
  const insert = supabase.from("customers").insert({ company_id: companyId, ...payload, created_by: userId }) as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const result = await insert.select("id").single();
  if (result.error || !result.data?.id) throw new Error(result.error?.message ?? "Could not sync quote customer.");
  return String(result.data.id);
}

async function nextTrackingNumber(supabase: MutationClient, companyId: string, prefix: string) {
  const currentYear = new Date().getFullYear();
  const latest = await supabase
    .from("shipments")
    .select("tracking_number")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestSequence = Number(String(latest.data?.tracking_number ?? "").match(/-(\d+)$/)?.[1] ?? 0);
  return generateTrackingNumber(prefix, latestSequence + 1, new Date(currentYear, 0, 1));
}

async function nextInvoiceNumber(supabase: MutationClient, companyId: string, userId: string) {
  const settings = await supabase
    .from("invoice_settings")
    .select("invoice_prefix,next_invoice_number")
    .eq("company_id", companyId)
    .maybeSingle();
  const prefix = String(settings.data?.invoice_prefix ?? "INV").trim().toUpperCase() || "INV";
  const nextNumber = Math.max(1, Number(settings.data?.next_invoice_number ?? 1));
  await supabase.from("invoice_settings").upsert({
    company_id: companyId,
    invoice_prefix: prefix,
    next_invoice_number: nextNumber + 1,
    created_by: userId,
  }, { onConflict: "company_id" });
  return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
}

async function auditAndNotify(supabase: MutationClient, companyId: string, actorId: string, action: string, table: string, recordId: string, title: string) {
  await supabase.from("audit_logs").insert({ company_id: companyId, actor_id: actorId, action, table_name: table, record_id: recordId, created_by: actorId });
  await supabase.from("notifications").insert({ company_id: companyId, user_id: actorId, title, body: "Activity recorded.", created_by: actorId });
}
