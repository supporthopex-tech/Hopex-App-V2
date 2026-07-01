"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { validateBalancedJournal, type JournalLineInput } from "@/lib/accounting/posting";
import { normalizeCurrency } from "@/lib/currencies";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, isSupabaseConfigured } from "@/lib/tenant";

type ActionState = { ok: boolean; message: string };
type MutationClient = Awaited<ReturnType<typeof createClient>>;

export async function createChartAccount(formData: FormData) {
  const tenant = await requireAnyPermission(["chart_of_accounts.manage", "accounting.manage"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/accounting");
    return;
  }
  const supabase = await createClient();
  const accountType = String(formData.get("account_type") || "asset");
  const normalBalance = ["asset", "expense"].includes(accountType) ? "debit" : "credit";
  const result = supabase.from("chart_of_accounts").insert({
    company_id: tenant.company.id,
    account_code: String(formData.get("account_code") ?? "").trim(),
    account_name: String(formData.get("account_name") ?? "").trim(),
    account_type: accountType,
    normal_balance: normalBalance,
    is_system: false,
    is_active: true,
    created_by: tenant.user.id,
  });
  const { data, error } = await result.select("id").single();
  if (error || !data) throw new Error(error?.message ?? "Could not create chart account.");
  await audit(supabase, tenant.company.id, tenant.user.id, "chart_account.created", "chart_of_accounts", String(data.id));
  revalidateAccounting();
}

export async function createManualJournalEntry(formData: FormData) {
  const tenant = await requireAnyPermission(["journal_entries.create", "accounting.manage"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/accounting");
    return;
  }
  const supabase = await createClient();
  const currency = normalizeCurrency(formData.get("currency"));
  const lines = [1, 2, 3, 4]
    .map((index) => ({
      accountId: String(formData.get(`account_id_${index}`) || ""),
      description: String(formData.get(`line_description_${index}`) || ""),
      debit: Number(formData.get(`debit_${index}`) || 0),
      credit: Number(formData.get(`credit_${index}`) || 0),
    }))
    .filter((line) => line.accountId && (line.debit > 0 || line.credit > 0));
  const validation = validateBalancedJournal(lines);
  if (!validation.ok) throw new Error(validation.message);
  const journalId = await createJournal(
    supabase,
    tenant.company.id,
    tenant.user.id,
    `[${currency}] ${String(formData.get("description") || "Manual journal entry")}`,
    "manual",
    "",
    lines,
    String(formData.get("entry_date") || new Date().toISOString().slice(0, 10)),
  );
  if (formData.get("intent") === "post") {
    await supabase.rpc("post_journal_entry", { target_entry_id: journalId });
  }
  await audit(supabase, tenant.company.id, tenant.user.id, "journal.manual_created", "journal_entries", journalId);
  revalidateAccounting();
}

export async function postJournalEntry(formData: FormData) {
  const tenant = await requireAnyPermission(["journal_entries.post", "accounting.manage"]);
  const journalId = String(formData.get("journal_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/accounting");
    return;
  }
  const supabase = await createClient();
  const result = await supabase.rpc("post_journal_entry", { target_entry_id: journalId });
  if (result.error) throw new Error(result.error.message);
  await audit(supabase, tenant.company.id, tenant.user.id, "journal.posted", "journal_entries", journalId);
  revalidateAccounting();
}

export async function createInvoice(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requireAnyPermission(["invoices.create", "accounting.manage"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/invoices");
    redirect("/invoices");
  }
  const supabase = await createClient();
  const shipmentId = String(formData.get("shipment_id") || "");
  const shipment = shipmentId ? await getShipmentForInvoice(supabase, shipmentId) : null;
  const lineAmount = Number(formData.get("quantity") || 0) * Number(formData.get("rate") || 0);
  const subtotal = Number(formData.get("subtotal") || shipment?.total_amount || shipment?.subtotal || lineAmount || 0);
  const taxAmount = Number(formData.get("tax_amount") || shipment?.tax || 0);
  const discountAmount = Number(formData.get("discount_amount") || shipment?.discount || 0);
  const totalAmount = subtotal + taxAmount - discountAmount;
  const invoiceNumber = await nextInvoiceNumber(supabase, tenant.company.id, tenant.user.id);
  const result = supabase.from("invoices").insert({
    company_id: tenant.company.id,
    invoice_number: invoiceNumber,
    shipment_id: shipmentId || null,
    customer_id: shipment?.customer_id ?? null,
    issue_date: String(formData.get("issue_date") || new Date().toISOString().slice(0, 10)),
    due_date: String(formData.get("due_date") || "") || null,
    currency: normalizeCurrency(formData.get("currency") || String(shipment?.currency ?? tenant.company.currency)),
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    amount: totalAmount,
    balance_due: totalAmount,
    status: "draft",
    created_by: tenant.user.id,
  });
  const { data, error } = await result.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create invoice." };
  await audit(supabase, tenant.company.id, tenant.user.id, "invoice.created", "invoices", String(data.id));
  revalidatePath("/invoices");
  redirect(`/invoices?id=${data.id}`);
}

export async function updateInvoice(formData: FormData) {
  const tenant = await requireAnyPermission(["invoices.edit", "accounting.manage"]);
  const invoiceId = String(formData.get("invoice_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/invoices");
    return;
  }
  const supabase = await createClient();
  const subtotal = Number(formData.get("subtotal") || 0);
  const taxAmount = Number(formData.get("tax_amount") || 0);
  const discountAmount = Number(formData.get("discount_amount") || 0);
  const paidAmount = Number(formData.get("paid_amount") || 0);
  const totalAmount = Math.max(0, subtotal + taxAmount - discountAmount);
  await supabase.from("invoices").update({
    issue_date: String(formData.get("issue_date") || new Date().toISOString().slice(0, 10)),
    due_date: String(formData.get("due_date") || "") || null,
    currency: normalizeCurrency(formData.get("currency") || tenant.company.currency),
    subtotal,
    tax_amount: taxAmount,
    discount_amount: discountAmount,
    total_amount: totalAmount,
    amount: totalAmount,
    paid_amount: paidAmount,
    balance_due: Math.max(0, totalAmount - paidAmount),
    status: String(formData.get("status") || "draft"),
  }).eq("id", invoiceId);
  await audit(supabase, tenant.company.id, tenant.user.id, "invoice.updated", "invoices", invoiceId);
  revalidateAccounting();
}

async function nextInvoiceNumber(supabase: MutationClient, companyId: string, userId: string) {
  const settings = await supabase
    .from("invoice_settings")
    .select("invoice_prefix,next_invoice_number")
    .eq("company_id", companyId)
    .single();
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

async function getShipmentForInvoice(supabase: MutationClient, shipmentId: string) {
  const { data } = await supabase
    .from("shipments")
    .select("id, customer_id, currency, subtotal, tax, discount, total_amount")
    .eq("id", shipmentId)
    .single();
  return data;
}

export async function postInvoice(formData: FormData) {
  await requireAnyPermission(["invoices.post", "accounting.manage"]);
  const invoiceId = String(formData.get("invoice_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/invoices");
    return;
  }
  const supabase = await createClient();
  const result = await supabase.rpc("post_invoice_transaction", { target_invoice_id: invoiceId });
  if (result.error) throw new Error(result.error.message);
  revalidateAccounting();
}

export async function createPayment(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requireAnyPermission(["payments.create", "accounting.manage"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/payments");
    redirect("/payments");
  }
  const supabase = await createClient();
  const amount = Number(formData.get("amount") || 0);
  const type = String(formData.get("payment_type") || "customer");
  const currency = normalizeCurrency(formData.get("currency") || tenant.company.currency);
  const invoiceId = String(formData.get("invoice_id") || "");
  const paymentResult = await supabase.rpc("post_payment_transaction", {
    target_company_id: tenant.company.id,
    target_payment_number: String(formData.get("payment_number") || `PAY-${crypto.randomUUID().slice(0, 8).toUpperCase()}`),
    target_payment_type: type,
    target_invoice_id: invoiceId,
    target_amount: amount,
    target_currency: currency,
    target_payment_method: String(formData.get("payment_method") || "Bank Transfer"),
    target_payment_date: String(formData.get("payment_date") || new Date().toISOString().slice(0, 10)),
    target_reference: String(formData.get("reference") ?? ""),
  });
  if (paymentResult.error) return { ok: false, message: paymentResult.error.message };
  revalidateAccounting();
  redirect("/payments");
}

export async function createExpense(prevState: ActionState = { ok: true, message: "" }, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requireAnyPermission(["expenses.create", "accounting.manage"]);
  if (!isSupabaseConfigured()) {
    revalidatePath("/expenses");
    redirect("/expenses");
  }
  const supabase = await createClient();
  const amount = Number(formData.get("amount") || 0);
  const taxAmount = Number(formData.get("tax_amount") || 0);
  const currency = normalizeCurrency(formData.get("currency") || tenant.company.currency);
  const result = supabase.from("expenses").insert({
    company_id: tenant.company.id,
    expense_number: String(formData.get("expense_number") || `EXP-${Date.now().toString().slice(-6)}`),
    vendor: String(formData.get("vendor") ?? ""),
    category: String(formData.get("category") || "General Expense"),
    description: String(formData.get("description") ?? ""),
    amount,
    tax_amount: taxAmount,
    total_amount: amount + taxAmount,
    currency,
    status: "submitted",
    created_by: tenant.user.id,
  });
  const { data, error } = await result.select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create expense." };
  await audit(supabase, tenant.company.id, tenant.user.id, "expense.created", "expenses", String(data.id));
  revalidatePath("/expenses");
  redirect("/expenses");
}

export async function approveExpense(formData: FormData) {
  const id = String(formData.get("expense_id") ?? "");
  if (!isSupabaseConfigured()) return revalidatePath("/expenses");
  const tenant = await requireAnyPermission(["expenses.approve", "accounting.manage"]);
  const supabase = await createClient();
  await supabase.from("expenses").update({ status: "approved", approved_at: new Date().toISOString() }).eq("id", id);
  await audit(supabase, tenant.company.id, tenant.user.id, "expense.approved", "expenses", id);
  revalidateAccounting();
}

export async function payExpense(formData: FormData) {
  const id = String(formData.get("expense_id") ?? "");
  if (!isSupabaseConfigured()) return revalidatePath("/expenses");
  await requireAnyPermission(["expenses.approve", "accounting.manage"]);
  const supabase = await createClient();
  const result = await supabase.rpc("post_expense_transaction", { target_expense_id: id });
  if (result.error) throw new Error(result.error.message);
  revalidateAccounting();
}

async function createJournal(
  supabase: MutationClient,
  companyId: string,
  userId: string,
  description: string,
  module: string,
  referenceId: string,
  lines: JournalLineInput[],
  entryDate = new Date().toISOString().slice(0, 10),
) {
  const result = supabase.from("journal_entries").insert({
    company_id: companyId,
    entry_number: `JE-${Date.now().toString().slice(-8)}`,
    entry_date: entryDate,
    description,
    reference_module: module,
    reference_id: referenceId || null,
    status: "draft",
    created_by: userId,
  });
  const { data } = await result.select("id").single();
  const journalId = String(data?.id ?? "");
  await supabase.from("journal_entry_lines").insert(lines.map((line) => ({
    company_id: companyId,
    journal_entry_id: journalId,
    account_id: line.accountId,
    description: line.description ?? description,
    debit: line.debit ?? 0,
    credit: line.credit ?? 0,
    created_by: userId,
  })));
  return journalId;
}

async function audit(supabase: MutationClient, companyId: string, actorId: string, action: string, table: string, recordId: string) {
  await supabase.from("audit_logs").insert({ company_id: companyId, actor_id: actorId, action, table_name: table, record_id: recordId, created_by: actorId });
  await supabase.from("notifications").insert({ company_id: companyId, user_id: actorId, title: action.replaceAll(".", " "), body: "Accounting activity recorded.", created_by: actorId });
}

function revalidateAccounting() {
  ["/accounting", "/invoices", "/payments", "/expenses", "/reports"].forEach((path) => revalidatePath(path));
}
