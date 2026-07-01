import { unstable_noStore as noStore } from "next/cache";
import type { EmailComposeData, EmailLogRecord, EmailRecord, SettingsRecord, WhatsAppMessageRecord } from "@/lib/communications/types";
import type { TenantContext } from "@/lib/app-types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, isSupabaseConfigured } from "@/lib/tenant";

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
  };
};

export async function getEmailData(folder = "inbox", search = "") {
  noStore();
  if (!isSupabaseConfigured()) return filterEmailData([], folder, search);
  const supabase = (await createClient()) as unknown as QueryClient;
  const [accountsRes, messagesRes, templatesRes] = await Promise.all([
    supabase.from("email_accounts").select("*").order("created_at", { ascending: false }),
    supabase.from("email_messages").select("*, customers(company_name, full_name)").order("created_at", { ascending: false }),
    supabase.from("email_templates").select("*").order("template_name", { ascending: true }),
  ]);
  const messages = (messagesRes.data ?? []).map(mapEmail);
  return {
    accounts: accountsRes.data?.map((row) => ({ id: String(row.id), accountName: String(row.account_name ?? "Email"), emailAddress: String(row.email_address ?? ""), provider: String(row.provider ?? "smtp"), status: String(row.status ?? "connected") })) ?? [],
    messages: filterEmailData(messages, folder, search).messages,
    templates: templatesRes.data?.map((row) => ({ id: String(row.id), templateName: String(row.template_name ?? ""), subject: String(row.subject ?? ""), body: String(row.body ?? ""), module: String(row.module ?? "") })) ?? [],
    folderCounts: folderCounts(messages),
  };
}

export async function getEmailById(id: string) {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data } = await supabase.from("email_messages").select("*, customers(company_name, full_name)").eq("id", id).single();
  return data ? mapEmail(data) : null;
}

export async function getEmailComposeData(): Promise<EmailComposeData> {
  noStore();
  if (!isSupabaseConfigured()) return { customers: [], shipments: [], quotes: [] };
  const supabase = (await createClient()) as unknown as QueryClient;
  const [customersRes, shipmentsRes, quotesRes] = await Promise.all([
    supabase.from("customers").select("id,company_name,full_name,email").order("created_at", { ascending: false }),
    supabase.from("shipments").select("id,tracking_number,customer_name,customer_email").order("created_at", { ascending: false }),
    supabase.from("quote_requests").select("id,customer_name,customer_email,origin,destination").order("created_at", { ascending: false }),
  ]);
  return {
    customers: (customersRes.data ?? []).map((row) => ({ id: String(row.id), label: String(row.company_name ?? row.full_name ?? "Customer"), email: String(row.email ?? "") })),
    shipments: (shipmentsRes.data ?? []).map((row) => ({ id: String(row.id), label: `${String(row.tracking_number ?? "Shipment")} · ${String(row.customer_name ?? "")}`, email: String(row.customer_email ?? "") })),
    quotes: (quotesRes.data ?? []).map((row) => ({ id: String(row.id), label: `${String(row.customer_name ?? "Quote")} · ${String(row.origin ?? "")} to ${String(row.destination ?? "")}`, email: String(row.customer_email ?? "") })),
  };
}

export async function getEmailLogs(): Promise<EmailLogRecord[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from("email_logs").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapEmailLog);
}

export async function getWhatsAppData() {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return { messages: [], templates: [], tenant };
  const supabase = (await createClient()) as unknown as QueryClient;
  const [messagesRes, templatesRes] = await Promise.all([
    supabase.from("whatsapp_messages").select("*, customers(company_name, full_name), shipments(tracking_number, destination, estimated_delivery)").order("created_at", { ascending: false }),
    supabase.from("whatsapp_templates").select("*").order("template_name", { ascending: true }),
  ]);
  return {
    messages: (messagesRes.data ?? []).map(mapWhatsApp),
    templates: templatesRes.data?.map((row) => ({ id: String(row.id), templateName: String(row.template_name ?? ""), messageType: String(row.message_type ?? ""), body: String(row.body ?? "") })) ?? [],
    tenant,
  };
}

export async function getSettingsData(): Promise<SettingsRecord> {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return defaultSettings(tenant);
  const supabase = (await createClient()) as unknown as QueryClient;
  const [invoiceRes, brandingRes, notificationsRes] = await Promise.all([
    supabase.from("invoice_settings").select("*").eq("company_id", tenant.company.id).single(),
    supabase.from("branding_settings").select("*").eq("company_id", tenant.company.id).single(),
    supabase.from("notification_settings").select("*").eq("company_id", tenant.company.id).single(),
  ]);
  return {
    ...defaultSettings(tenant),
    companyName: tenant.company.name,
    slogan: tenant.company.slogan ?? "",
    logoUrl: tenant.company.logoUrl ?? "",
    email: tenant.company.email ?? "",
    phone: tenant.company.phone ?? "",
    address: tenant.company.address,
    taxRegistrationNumber: tenant.company.taxRegistrationNumber ?? "",
    website: tenant.company.website ?? "",
    country: tenant.company.country ?? "",
    city: tenant.company.city ?? "",
    currency: tenant.company.currency,
    timezone: tenant.company.timezone,
    invoicePrefix: String(invoiceRes.data?.invoice_prefix ?? "INV"),
    nextInvoiceNumber: Number(invoiceRes.data?.next_invoice_number ?? 1),
    quotePrefix: String(invoiceRes.data?.quote_prefix ?? "QT"),
    paymentReceiptPrefix: String(invoiceRes.data?.payment_receipt_prefix ?? "PAY"),
    defaultTaxRate: Number(invoiceRes.data?.default_tax_rate ?? 5),
    paymentTerms: String(invoiceRes.data?.payment_terms ?? ""),
    footerNotes: String(invoiceRes.data?.footer_notes ?? ""),
    bankDetails: String(invoiceRes.data?.bank_details ?? ""),
    themeMode: String(brandingRes.data?.theme_mode ?? "dark"),
    primaryColor: String(brandingRes.data?.primary_color ?? tenant.company.themeColor),
    sidebarStyle: String(brandingRes.data?.sidebar_style ?? "default"),
    compactMode: Boolean(brandingRes.data?.compact_mode),
    emailNotifications: Boolean(notificationsRes.data?.email_notifications ?? true),
    whatsappNotifications: Boolean(notificationsRes.data?.whatsapp_notifications ?? true),
    shipmentNotifications: Boolean(notificationsRes.data?.shipment_notifications ?? true),
    paymentNotifications: Boolean(notificationsRes.data?.payment_notifications ?? true),
    taskNotifications: Boolean(notificationsRes.data?.task_notifications ?? true),
    approvalNotifications: Boolean(notificationsRes.data?.approval_notifications ?? true),
  };
}

function filterEmailData(messages: EmailRecord[], folder: string, search: string) {
  const query = search.trim().toLowerCase();
  const filtered = messages.filter((message) => message.folder === folder && (!query || [message.fromEmail, message.toEmail, message.subject, message.body, message.customerName].join(" ").toLowerCase().includes(query)));
  return { accounts: [], messages: filtered, templates: [], folderCounts: folderCounts(messages) };
}

function folderCounts(messages: EmailRecord[]) {
  return Object.fromEntries(["inbox", "sent", "drafts", "spam", "trash"].map((folder) => [folder, messages.filter((message) => message.folder === folder && !message.isRead).length]));
}

function mapEmail(row: Record<string, unknown>): EmailRecord {
  const customer = row.customers as { company_name?: string; full_name?: string } | { company_name?: string; full_name?: string }[] | null | undefined;
  const customerRow = Array.isArray(customer) ? customer[0] : customer;
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    folder: String(row.folder ?? "inbox"),
    fromEmail: String(row.from_email ?? ""),
    toEmail: String(row.to_email ?? row.recipient ?? ""),
    subject: String(row.subject ?? ""),
    body: String(row.body ?? ""),
    status: String(row.status ?? "received"),
    isRead: Boolean(row.is_read),
    sentAt: String(row.sent_at ?? ""),
    receivedAt: String(row.received_at ?? ""),
    customerName: customerRow?.company_name ?? customerRow?.full_name ?? "",
    shipmentId: row.related_shipment_id ? String(row.related_shipment_id) : null,
    quoteId: row.related_quote_id ? String(row.related_quote_id) : null,
    invoiceId: row.related_invoice_id ? String(row.related_invoice_id) : null,
  };
}

function mapEmailLog(row: Record<string, unknown>): EmailLogRecord {
  const metadata = (row.metadata && typeof row.metadata === "object" ? row.metadata : {}) as Record<string, unknown>;
  return {
    id: String(row.id),
    recipient: String(row.recipient ?? metadata.recipient ?? ""),
    subject: String(row.subject ?? metadata.subject ?? ""),
    status: String(row.status ?? "pending"),
    sentBy: String(row.sent_by ?? row.created_by ?? ""),
    relatedCustomerId: row.related_customer_id ? String(row.related_customer_id) : null,
    relatedShipmentId: row.related_shipment_id ? String(row.related_shipment_id) : null,
    resendMessageId: row.resend_message_id ? String(row.resend_message_id) : null,
    errorMessage: row.error_message ? String(row.error_message) : null,
    createdAt: String(row.created_at ?? ""),
    sentAt: row.sent_at ? String(row.sent_at) : null,
  };
}

function mapWhatsApp(row: Record<string, unknown>): WhatsAppMessageRecord {
  const customer = row.customers as { company_name?: string; full_name?: string } | { company_name?: string; full_name?: string }[] | null | undefined;
  const shipment = row.shipments as { tracking_number?: string; destination?: string } | { tracking_number?: string; destination?: string }[] | null | undefined;
  const customerRow = Array.isArray(customer) ? customer[0] : customer;
  const shipmentRow = Array.isArray(shipment) ? shipment[0] : shipment;
  return {
    id: String(row.id),
    phone: String(row.phone ?? ""),
    messageType: String(row.message_type ?? row.template_name ?? "Custom Message"),
    messageBody: String(row.message_body ?? row.message ?? ""),
    status: String(row.status ?? "draft"),
    customerName: customerRow?.company_name ?? customerRow?.full_name ?? "",
    trackingNumber: shipmentRow?.tracking_number ?? "",
    destination: shipmentRow?.destination ?? "",
    sentAt: String(row.sent_at ?? ""),
  };
}

function defaultSettings(tenant: TenantContext): SettingsRecord {
  return {
    companyName: tenant.company.name, slogan: tenant.company.slogan ?? "", logoUrl: tenant.company.logoUrl ?? "", email: tenant.company.email ?? "", phone: tenant.company.phone ?? "", address: tenant.company.address, taxRegistrationNumber: tenant.company.taxRegistrationNumber ?? "", website: tenant.company.website ?? "", country: tenant.company.country ?? "", city: tenant.company.city ?? "", currency: tenant.company.currency, timezone: tenant.company.timezone,
    invoicePrefix: "INV", nextInvoiceNumber: 1, quotePrefix: "QT", paymentReceiptPrefix: "PAY", defaultTaxRate: 0, paymentTerms: "", footerNotes: "", bankDetails: "", themeMode: "dark", primaryColor: tenant.company.themeColor, sidebarStyle: "default", compactMode: false,
    emailNotifications: true, whatsappNotifications: true, shipmentNotifications: true, paymentNotifications: true, taskNotifications: true, approvalNotifications: true, defaultLanguage: "English", dateFormat: "dd/MM/yyyy", numberFormat: "1,234.56", currencyFormat: "symbol",
  };
}
