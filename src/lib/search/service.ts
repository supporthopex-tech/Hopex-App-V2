import { unstable_noStore as noStore } from "next/cache";
import { hasPermission, isSupabaseConfigured, requireTenantContext } from "@/lib/tenant";
import { createClient } from "@/lib/supabase/server";

export type SearchResult = {
  id: string;
  module: string;
  title: string;
  description: string;
  href: string;
  meta: string;
};

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      order: (column: string, options?: { ascending?: boolean }) => {
        limit: (count: number) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      };
    };
  };
};

export async function globalSearch(query: string) {
  noStore();
  const tenant = await requireTenantContext();
  const search = query.trim().toLowerCase();
  if (!search || !isSupabaseConfigured()) return [];

  const supabase = (await createClient()) as unknown as QueryClient;
  const tasks = [
    hasPermission(tenant, "shipments.view") ? fetchRows(supabase, "shipments", "*", mapShipment) : Promise.resolve([]),
    hasPermission(tenant, "customers.view") ? fetchRows(supabase, "customers", "*", mapCustomer) : Promise.resolve([]),
    hasPermission(tenant, "quotes.view") ? fetchRows(supabase, "quote_requests", "*", mapQuote) : Promise.resolve([]),
    hasPermission(tenant, "staff.view") ? fetchRows(supabase, "staff", "*", mapStaff) : Promise.resolve([]),
    hasPermission(tenant, "email.view") ? fetchRows(supabase, "email_messages", "*", mapEmail) : Promise.resolve([]),
    hasPermission(tenant, "shipments.view") ? fetchRows(supabase, "shipment_documents", "*", mapDocument) : Promise.resolve([]),
  ];
  const results = (await Promise.all(tasks)).flat();
  return results
    .filter((result) => [result.title, result.description, result.meta, result.module].join(" ").toLowerCase().includes(search))
    .slice(0, 40);
}

async function fetchRows(
  supabase: QueryClient,
  table: string,
  columns: string,
  mapper: (row: Record<string, unknown>) => SearchResult,
) {
  const { data, error } = await supabase.from(table).select(columns).order("created_at", { ascending: false }).limit(50);
  if (error) return [];
  return (data ?? []).map(mapper);
}

function mapShipment(row: Record<string, unknown>): SearchResult {
  return {
    id: String(row.id),
    module: "Shipments",
    title: String(row.tracking_number ?? "Shipment"),
    description: [row.customer_name, row.supplier_name, row.origin, row.destination].map(String).join(" -> "),
    href: `/shipments/${String(row.id)}`,
    meta: String(row.status ?? ""),
  };
}

function mapCustomer(row: Record<string, unknown>): SearchResult {
  return {
    id: String(row.id),
    module: "Customers",
    title: String(row.company_name ?? row.full_name ?? "Customer"),
    description: [row.full_name, row.phone, row.email].map(String).join(" "),
    href: `/customers/${String(row.id)}`,
    meta: String(row.status ?? ""),
  };
}

function mapQuote(row: Record<string, unknown>): SearchResult {
  return {
    id: String(row.id),
    module: "Quotes",
    title: String(row.customer_name ?? "Quote"),
    description: [row.origin, row.destination, row.cargo_description].map(String).join(" "),
    href: `/quotes/${String(row.id)}`,
    meta: String(row.status ?? ""),
  };
}

function mapStaff(row: Record<string, unknown>): SearchResult {
  return {
    id: String(row.id),
    module: "Staff",
    title: String(row.full_name ?? "Staff member"),
    description: [row.staff_id, row.email, row.phone, row.department].map(String).join(" "),
    href: `/staff/${String(row.id)}`,
    meta: String(row.status ?? ""),
  };
}

function mapEmail(row: Record<string, unknown>): SearchResult {
  return {
    id: String(row.id),
    module: "Email",
    title: String(row.subject ?? "(no subject)"),
    description: [row.from_email, row.to_email, row.body].map(String).join(" "),
    href: `/email/${String(row.id)}`,
    meta: String(row.folder ?? ""),
  };
}

function mapDocument(row: Record<string, unknown>): SearchResult {
  return {
    id: String(row.id),
    module: "Documents",
    title: String(row.file_name ?? "Document"),
    description: [row.document_type, row.mime_type, row.file_path].map(String).join(" "),
    href: `/documents?search=${encodeURIComponent(String(row.file_name ?? ""))}`,
    meta: "shipment document",
  };
}
