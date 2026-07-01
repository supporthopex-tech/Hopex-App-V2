import { unstable_noStore as noStore } from "next/cache";
import type { CustomerRecord, ListFilters, QuoteRequestRecord, TaskRecord } from "@/lib/operations/types";
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

function includesSearch(values: string[], search?: string) {
  if (!search?.trim()) return true;
  return values.join(" ").toLowerCase().includes(search.trim().toLowerCase());
}

export async function listQuoteRequests(filters: ListFilters = {}) {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from("quote_requests").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return filterQuotes((data ?? []).map((row) => mapQuote(row, tenant.company.currency)), filters);
}

export async function getQuoteRequest(id: string) {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return null;
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data } = await supabase.from("quote_requests").select("*").eq("id", id).single();
  return data ? mapQuote(data, tenant.company.currency) : null;
}

export async function listCustomers(filters: ListFilters = {}) {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from("customers").select("*").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return filterCustomers((data ?? []).map((row) => mapCustomer(row, tenant.company.currency)), filters);
}

export async function getCustomer(id: string) {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return null;
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data } = await supabase.from("customers").select("*").eq("id", id).single();
  return data ? mapCustomer(data, tenant.company.currency) : null;
}

export async function listTasks(filters: ListFilters = {}) {
  noStore();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase.from("tasks").select("*, staff(full_name)").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return filterTasks((data ?? []).map(mapTask), filters);
}

export async function getTask(id: string) {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data } = await supabase.from("tasks").select("*, staff(full_name)").eq("id", id).single();
  return data ? mapTask(data) : null;
}

export function countByStatus<T extends { status: string }>(items: T[], statuses: readonly string[]) {
  return [{ label: "All", value: "all", count: items.length }, ...statuses.map((status) => ({
    label: status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    value: status,
    count: items.filter((item) => item.status === status).length,
  }))];
}

function filterQuotes(quotes: QuoteRequestRecord[], filters: ListFilters) {
  return quotes.filter((quote) =>
    (filters.status && filters.status !== "all" ? quote.status === filters.status : true) &&
    includesSearch([quote.customerName, quote.customerPhone, quote.customerEmail, quote.origin, quote.destination, quote.cargoDescription], filters.search)
  );
}

function filterCustomers(customers: CustomerRecord[], filters: ListFilters) {
  return customers.filter((customer) =>
    (filters.status && filters.status !== "all" ? customer.status === filters.status : true) &&
    includesSearch([customer.fullName, customer.companyName, customer.phone, customer.email, customer.city, customer.country], filters.search)
  );
}

function filterTasks(tasks: TaskRecord[], filters: ListFilters) {
  return tasks.filter((task) =>
    (filters.status && filters.status !== "all" ? task.status === filters.status : true) &&
    (filters.priority && filters.priority !== "all" ? task.priority === filters.priority : true) &&
    includesSearch([task.title, task.description, task.assigneeName, task.createdByName], filters.search)
  );
}

function mapQuote(row: Record<string, unknown>, currency: string): QuoteRequestRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    customerName: String(row.customer_name ?? ""),
    customerPhone: String(row.customer_phone ?? ""),
    customerEmail: String(row.customer_email ?? ""),
    origin: String(row.origin ?? ""),
    destination: String(row.destination ?? ""),
    cargoDescription: String(row.cargo_description ?? ""),
    cargoType: String(row.cargo_type ?? ""),
    estimatedWeight: Number(row.estimated_weight ?? 0),
    estimatedPieces: Number(row.estimated_pieces ?? 0),
    estimatedVolume: Number(row.estimated_volume ?? 0),
    requestedDate: String(row.requested_date ?? ""),
    quotedAmount: Number(row.quoted_amount ?? 0),
    currency: String(row.currency ?? currency),
    status: String(row.status ?? "new") as QuoteRequestRecord["status"],
    notes: String(row.notes ?? ""),
    createdAt: String(row.created_at ?? ""),
  };
}

function mapCustomer(row: Record<string, unknown>, currency: string): CustomerRecord {
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    fullName: String(row.full_name ?? row.contact_name ?? ""),
    companyName: String(row.company_name ?? ""),
    phone: String(row.phone ?? ""),
    email: String(row.email ?? ""),
    address: String(row.address ?? ""),
    city: String(row.city ?? ""),
    country: String(row.country ?? ""),
    customerType: String(row.customer_type ?? "standard"),
    status: String(row.status ?? "active") as CustomerRecord["status"],
    isVip: Boolean(row.is_vip),
    notes: String(row.notes ?? ""),
    shipmentsCount: 0,
    quotesCount: 0,
    invoicesCount: 0,
    paymentsCount: 0,
    revenue: Number(row.balance ?? 0),
    currency,
    createdAt: String(row.created_at ?? ""),
  };
}

function mapTask(row: Record<string, unknown>): TaskRecord {
  const staff = row.staff as { full_name?: string } | { full_name?: string }[] | null | undefined;
  const assigneeName = Array.isArray(staff) ? staff[0]?.full_name : staff?.full_name;
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    title: String(row.title ?? ""),
    description: String(row.description ?? ""),
    assigneeId: row.assignee_id ? String(row.assignee_id) : null,
    assigneeName: assigneeName ?? "Unassigned",
    priority: String(row.priority ?? "medium") as TaskRecord["priority"],
    status: String(row.status ?? "pending") as TaskRecord["status"],
    dueDate: String(row.due_date ?? ""),
    completedAt: String(row.completed_at ?? ""),
    createdByName: "Team member",
    notes: String(row.notes ?? ""),
    commentsCount: Array.isArray(row.comments) ? row.comments.length : 0,
    attachmentsCount: Array.isArray(row.attachments) ? row.attachments.length : 0,
    createdAt: String(row.created_at ?? ""),
  };
}
