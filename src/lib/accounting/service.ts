import { unstable_noStore as noStore } from "next/cache";
import type { AccountingData, AccountRecord, ExpenseRecord, InvoiceRecord, InvoiceShipmentOption, JournalEntryRecord, PaymentRecord } from "@/lib/accounting/types";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, isSupabaseConfigured } from "@/lib/tenant";

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

type ShipmentOptionsClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      is: (column: string, value: null) => {
        order: (column: string, options?: { ascending?: boolean }) => {
          limit: (count: number) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
        };
      };
    };
  };
};

export async function getAccountingData(): Promise<AccountingData> {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return emptyAccountingData();
  const supabase = (await createClient()) as unknown as QueryClient;
  const [accountsRes, journalsRes, invoicesRes, paymentsRes, expensesRes, linesRes] = await Promise.all([
    supabase.from("chart_of_accounts").select("*").order("account_code", { ascending: true }),
    supabase.from("journal_entries").select("*").order("entry_date", { ascending: false }),
    supabase.from("invoices").select("*, customers(company_name, full_name), shipments(tracking_number, route, cargo_type, origin, destination)").order("created_at", { ascending: false }),
    supabase.from("payments").select("*, customers(company_name, full_name), suppliers(supplier_name)").order("created_at", { ascending: false }),
    supabase.from("expenses").select("*").order("created_at", { ascending: false }),
    supabase.from("journal_entry_lines").select("*, chart_of_accounts(account_code, account_name, account_type)").order("created_at", { ascending: false }),
  ]);
  const lines = linesRes.data ?? [];
  const linesByAccount = groupLines(lines, "account_id");
  const linesByJournal = groupLines(lines, "journal_entry_id");
  const accounts = (accountsRes.data ?? []).map((row) => mapAccount(row, linesByAccount.get(String(row.id)) ?? []));
  const journals = (journalsRes.data ?? []).map((row) => mapJournal(row, linesByJournal.get(String(row.id)) ?? []));
  const invoices = (invoicesRes.data ?? []).map((row) => mapInvoice(row, tenant.company.currency));
  const payments = (paymentsRes.data ?? []).map((row) => mapPayment(row, tenant.company.currency));
  const expenses = (expensesRes.data ?? []).map((row) => mapExpense(row, tenant.company.currency));
  return { summary: summarize(accounts, journals, invoices, expenses), accounts, journals, invoices, payments, expenses };
}

export async function getInvoiceList() {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase
    .from("invoices")
    .select("*, customers(company_name, full_name), shipments(tracking_number, route, cargo_type, origin, destination)")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapInvoice(row, tenant.company.currency));
}

export async function getInvoiceShipmentOptions(): Promise<InvoiceShipmentOption[]> {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as ShipmentOptionsClient;
  const { data, error } = await supabase
    .from("shipments")
    .select("id, tracking_number, customer_name, customer_email, customer_id, currency, subtotal, tax, discount, total_amount")
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: String(row.id),
    trackingNumber: String(row.tracking_number ?? ""),
    customerName: String(row.customer_name ?? ""),
    customerEmail: String(row.customer_email ?? ""),
    customerId: row.customer_id ? String(row.customer_id) : null,
    currency: String(row.currency ?? tenant.company.currency),
    subtotal: Number(row.subtotal ?? row.total_amount ?? 0),
    taxAmount: Number(row.tax ?? 0),
    discountAmount: Number(row.discount ?? 0),
    totalAmount: Number(row.total_amount ?? 0),
  }));
}

export async function getPaymentList() {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from("payments").select("id,payment_number,payment_type,invoice_id,amount,currency,payment_method,payment_date,status,reference,customers(company_name,full_name),suppliers(supplier_name)").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapPayment(row, tenant.company.currency));
}

export async function getExpenseList() {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from("expenses").select("id,expense_number,vendor,category,description,amount,tax_amount,total_amount,currency,status,paid_at").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => mapExpense(row, tenant.company.currency));
}

function summarize(accounts: AccountRecord[], journals: JournalEntryRecord[], invoices: InvoiceRecord[], expenses: ExpenseRecord[]) {
  const byType = (type: string) => accounts.filter((account) => account.type === type).reduce((sum, account) => sum + account.balance, 0);
  return {
    revenue: byType("income"),
    expenses: byType("expense") || expenses.reduce((sum, expense) => sum + expense.totalAmount, 0),
    profit: byType("income") - byType("expense"),
    receivables: accounts.find((account) => account.name === "Accounts Receivable")?.balance ?? invoices.reduce((sum, invoice) => sum + invoice.balanceDue, 0),
    payables: accounts.find((account) => account.name === "Accounts Payable")?.balance ?? 0,
    cash: accounts.filter((account) => ["Cash", "Bank", "Petty Cash"].includes(account.name)).reduce((sum, account) => sum + account.balance, 0),
    vatPayable: accounts.find((account) => account.name === "VAT Payable")?.balance ?? 0,
    unbalancedEntries: journals.filter((journal) => Math.round(journal.debitTotal * 100) !== Math.round(journal.creditTotal * 100)).length,
  };
}

function mapAccount(row: Record<string, unknown>, accountLines: Record<string, unknown>[]): AccountRecord {
  const id = String(row.id);
  const debit = accountLines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0);
  const credit = accountLines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0);
  const normal = String(row.normal_balance ?? "debit") as "debit" | "credit";
  return { id, code: String(row.account_code ?? ""), name: String(row.account_name ?? ""), type: String(row.account_type ?? ""), normalBalance: normal, balance: normal === "debit" ? debit - credit : credit - debit };
}

function mapJournal(row: Record<string, unknown>, journalLines: Record<string, unknown>[]): JournalEntryRecord {
  const id = String(row.id);
  return {
    id,
    entryNumber: String(row.entry_number ?? ""),
    entryDate: String(row.entry_date ?? ""),
    description: String(row.description ?? ""),
    status: String(row.status ?? "draft"),
    referenceModule: String(row.reference_module ?? ""),
    referenceId: String(row.reference_id ?? ""),
    debitTotal: journalLines.reduce((sum, line) => sum + Number(line.debit ?? 0), 0),
    creditTotal: journalLines.reduce((sum, line) => sum + Number(line.credit ?? 0), 0),
  };
}

function groupLines(lines: Record<string, unknown>[], key: "account_id" | "journal_entry_id") {
  const groups = new Map<string, Record<string, unknown>[]>();
  for (const line of lines) {
    const id = String(line[key] ?? "");
    const group = groups.get(id);
    if (group) group.push(line);
    else groups.set(id, [line]);
  }
  return groups;
}

function mapInvoice(row: Record<string, unknown>, currency: string): InvoiceRecord {
  const customer = row.customers as { company_name?: string; full_name?: string } | { company_name?: string; full_name?: string }[] | null | undefined;
  const customerRow = Array.isArray(customer) ? customer[0] : customer;
  const shipment = row.shipments as { tracking_number?: string; route?: string; cargo_type?: string; origin?: string; destination?: string } | { tracking_number?: string; route?: string; cargo_type?: string; origin?: string; destination?: string }[] | null | undefined;
  const shipmentRow = Array.isArray(shipment) ? shipment[0] : shipment;
  return {
    id: String(row.id),
    invoiceNumber: String(row.invoice_number ?? ""),
    customerName: customerRow?.company_name ?? customerRow?.full_name ?? "Customer",
    shipmentId: row.shipment_id ? String(row.shipment_id) : null,
    quoteId: row.quote_id ? String(row.quote_id) : null,
    issueDate: String(row.issue_date ?? ""),
    dueDate: String(row.due_date ?? ""),
    currency: String(row.currency ?? currency),
    subtotal: Number(row.subtotal ?? row.amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    discountAmount: Number(row.discount_amount ?? 0),
    totalAmount: Number(row.total_amount ?? row.amount ?? 0),
    paidAmount: Number(row.paid_amount ?? 0),
    balanceDue: Number(row.balance_due ?? 0),
    status: String(row.status ?? "draft") as InvoiceRecord["status"],
    shipmentNumber: shipmentRow?.tracking_number ?? "",
    shipmentRoute: shipmentRow?.route ?? [shipmentRow?.origin, shipmentRow?.destination].filter(Boolean).join(" → "),
    cargoType: shipmentRow?.cargo_type ?? "",
  };
}

function mapPayment(row: Record<string, unknown>, currency: string): PaymentRecord {
  const customer = row.customers as { company_name?: string; full_name?: string } | { company_name?: string; full_name?: string }[] | null | undefined;
  const supplier = row.suppliers as { supplier_name?: string } | { supplier_name?: string }[] | null | undefined;
  const customerRow = Array.isArray(customer) ? customer[0] : customer;
  const supplierRow = Array.isArray(supplier) ? supplier[0] : supplier;
  return {
    id: String(row.id),
    paymentNumber: String(row.payment_number ?? ""),
    paymentType: String(row.payment_type ?? "customer"),
    customerName: customerRow?.company_name ?? customerRow?.full_name ?? "",
    supplierName: supplierRow?.supplier_name ?? "",
    invoiceId: row.invoice_id ? String(row.invoice_id) : null,
    amount: Number(row.amount ?? 0),
    currency: String(row.currency ?? currency),
    paymentMethod: String(row.payment_method ?? row.method ?? ""),
    paymentDate: String(row.payment_date ?? row.paid_at ?? ""),
    status: String(row.status ?? "pending"),
    reference: String(row.reference ?? ""),
  };
}

function mapExpense(row: Record<string, unknown>, currency: string): ExpenseRecord {
  return {
    id: String(row.id),
    expenseNumber: String(row.expense_number ?? ""),
    vendor: String(row.vendor ?? ""),
    category: String(row.category ?? ""),
    description: String(row.description ?? ""),
    amount: Number(row.amount ?? 0),
    taxAmount: Number(row.tax_amount ?? 0),
    totalAmount: Number(row.total_amount ?? row.amount ?? 0),
    currency: String(row.currency ?? currency),
    status: String(row.status ?? "draft") as ExpenseRecord["status"],
    paidAt: String(row.paid_at ?? ""),
  };
}

function emptyAccountingData(): AccountingData {
  return {
    summary: { revenue: 0, expenses: 0, profit: 0, receivables: 0, payables: 0, cash: 0, vatPayable: 0, unbalancedEntries: 0 },
    accounts: [],
    journals: [],
    invoices: [],
    payments: [],
    expenses: [],
  };
}
