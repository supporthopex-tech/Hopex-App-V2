import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { TenantContext } from "@/lib/app-types";
import { isSupabaseConfigured } from "@/lib/tenant";

export type DashboardMetric = {
  label: string;
  value: number;
  delta: string;
  format?: "currency" | "percent" | "number";
};

export type DashboardSeriesPoint = {
  label: string;
  revenue: number;
  shipments: number;
};

export type DashboardStatusPoint = {
  label: string;
  value: number;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  revenueSeries: DashboardSeriesPoint[];
  shipmentStatus: DashboardStatusPoint[];
  recentActivities: string[];
};

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string, options?: { count?: "exact"; head?: boolean }) => {
      eq: (column: string, value: string) => QueryBuilder;
    };
  };
};

type QueryBuilder = Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null; count?: number | null }> & {
  eq: (column: string, value: string) => QueryBuilder;
  neq: (column: string, value: string) => QueryBuilder;
  is: (column: string, value: null) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
};

const monthFormatter = new Intl.DateTimeFormat("en", { month: "short" });

export async function getDashboardData(tenant: TenantContext): Promise<DashboardData> {
  noStore();

  if (!isSupabaseConfigured() || tenant.company.id.startsWith("00000000-")) {
    return emptyDashboardData();
  }

  const supabase = (await createClient()) as unknown as QueryClient;
  const companyId = tenant.company.id;

  const [
    shipmentsResult,
    paymentsResult,
    invoicesResult,
    expensesResult,
    staffResult,
    customersCount,
    tasksResult,
    quotesCount,
    quoteRequestsCount,
    activitiesResult,
  ] = await Promise.all([
    supabase.from("shipments").select("id,status,created_at,total_amount,deleted_at").eq("company_id", companyId).is("deleted_at", null),
    supabase.from("payments").select("amount,payment_date,paid_at,created_at,status").eq("company_id", companyId),
    supabase.from("invoices").select("id,total_amount,amount,status,created_at").eq("company_id", companyId),
    supabase.from("expenses").select("total_amount,amount,status,created_at").eq("company_id", companyId),
    supabase.from("staff").select("id,status").eq("company_id", companyId),
    countRows(supabase, "customers", companyId),
    supabase.from("tasks").select("id,status").eq("company_id", companyId),
    countRows(supabase, "quotes", companyId),
    countRows(supabase, "quote_requests", companyId),
    supabase.from("audit_logs").select("action,table_name,created_at").eq("company_id", companyId).order("created_at", { ascending: false }).limit(5),
  ]);

  const shipments = shipmentsResult.data ?? [];
  const payments = paymentsResult.data ?? [];
  const invoices = invoicesResult.data ?? [];
  const expenses = expensesResult.data ?? [];
  const staff = staffResult.data ?? [];
  const tasks = tasksResult.data ?? [];
  const activities = activitiesResult.data ?? [];

  const totalShipments = shipments.length;
  const deliveredShipments = shipments.filter((shipment) => String(shipment.status ?? "").toLowerCase() === "delivered").length;
  const activeShipments = shipments.filter((shipment) => {
    const status = String(shipment.status ?? "").toLowerCase();
    return !["delivered", "cancelled", "canceled"].includes(status);
  }).length;
  const activeStaff = staff.filter((member) => String(member.status ?? "").toLowerCase() === "active").length;
  const postedPayments = payments.filter((payment) => ["posted", "completed", "paid"].includes(String(payment.status ?? "").toLowerCase()));
  const totalRevenue = sumAmounts(postedPayments, ["amount"]);
  const invoiceTotal = sumAmounts(invoices, ["total_amount", "amount"]);
  const expenseTotal = sumAmounts(expenses, ["total_amount", "amount"]);
  const pendingShipments = shipments.filter((shipment) => String(shipment.status ?? "").toLowerCase() === "pending").length;
  const openTasks = tasks.filter((task) => !["completed", "cancelled"].includes(String(task.status ?? "").toLowerCase())).length;
  const totalQuotes = quotesCount + quoteRequestsCount;
  const deliveryRate = totalShipments ? Math.round((deliveredShipments / totalShipments) * 100) : 0;

  return {
    metrics: [
      { label: "Total Shipments", value: totalShipments, delta: `${deliveredShipments} delivered`, format: "number" },
      { label: "Active Shipments", value: activeShipments, delta: `${totalShipments} total`, format: "number" },
      { label: "Pending Shipments", value: pendingShipments, delta: "awaiting progress", format: "number" },
      { label: "Customers", value: customersCount, delta: "saved profiles", format: "number" },
      { label: "Revenue", value: totalRevenue, delta: `${postedPayments.length} posted payments`, format: "currency" },
      { label: "Expenses", value: expenseTotal, delta: "recorded expenses", format: "currency" },
      { label: "Profit / Loss", value: totalRevenue - expenseTotal, delta: "revenue less expenses", format: "currency" },
      { label: "Quotes", value: totalQuotes, delta: "website and internal", format: "number" },
      { label: "Open Tasks", value: openTasks, delta: `${tasks.length} total`, format: "number" },
      { label: "Active Staff", value: activeStaff, delta: `${staff.length} total`, format: "number" },
      { label: "Delivery Rate", value: deliveryRate, delta: `${deliveredShipments} delivered`, format: "percent" },
      { label: "Invoice Total", value: invoiceTotal, delta: `${invoices.length} invoices`, format: "currency" },
    ],
    revenueSeries: buildMonthlySeries(payments, shipments),
    shipmentStatus: buildStatusSummary(shipments),
    recentActivities: activities.map(formatActivity),
  };
}

async function countRows(supabase: QueryClient, table: string, companyId: string) {
  const result = await supabase.from(table).select("id", { count: "exact", head: true }).eq("company_id", companyId);
  return result.count ?? 0;
}

function emptyDashboardData(): DashboardData {
  return {
    metrics: [
      { label: "Total Shipments", value: 0, delta: "0 delivered", format: "number" },
      { label: "Active Shipments", value: 0, delta: "0 total", format: "number" },
      { label: "Pending Shipments", value: 0, delta: "awaiting progress", format: "number" },
      { label: "Customers", value: 0, delta: "saved profiles", format: "number" },
      { label: "Revenue", value: 0, delta: "0 posted payments", format: "currency" },
      { label: "Expenses", value: 0, delta: "recorded expenses", format: "currency" },
      { label: "Profit / Loss", value: 0, delta: "revenue less expenses", format: "currency" },
      { label: "Quotes", value: 0, delta: "website and internal", format: "number" },
      { label: "Open Tasks", value: 0, delta: "0 total", format: "number" },
      { label: "Active Staff", value: 0, delta: "0 total", format: "number" },
      { label: "Delivery Rate", value: 0, delta: "0 delivered", format: "percent" },
      { label: "Invoice Total", value: 0, delta: "0 invoices", format: "currency" },
    ],
    revenueSeries: lastSixMonths().map((date) => ({ label: monthFormatter.format(date), revenue: 0, shipments: 0 })),
    shipmentStatus: [],
    recentActivities: [],
  };
}

function buildMonthlySeries(payments: Record<string, unknown>[], shipments: Record<string, unknown>[]) {
  const months = lastSixMonths();
  return months.map((date) => {
    const key = monthKey(date);
    return {
      label: monthFormatter.format(date),
      revenue: sumAmounts(payments.filter((payment) => monthKeyFromRow(payment, ["payment_date", "paid_at", "created_at"]) === key), ["amount"]),
      shipments: shipments.filter((shipment) => monthKeyFromRow(shipment, ["created_at"]) === key).length,
    };
  });
}

function buildStatusSummary(shipments: Record<string, unknown>[]) {
  const counts = new Map<string, number>();
  for (const shipment of shipments) {
    const status = titleCase(String(shipment.status ?? "unknown").replaceAll("_", " "));
    counts.set(status, (counts.get(status) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

function lastSixMonths() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, index) => new Date(now.getFullYear(), now.getMonth() - (5 - index), 1));
}

function monthKey(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function monthKeyFromRow(row: Record<string, unknown>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value) return monthKey(new Date(String(value)));
  }
  return "";
}

function sumAmounts(rows: Record<string, unknown>[], keys: string[]) {
  return rows.reduce((sum, row) => {
    const value = keys.map((key) => Number(row[key] ?? 0)).find((amount) => Number.isFinite(amount) && amount > 0) ?? 0;
    return sum + value;
  }, 0);
}

function formatActivity(row: Record<string, unknown>) {
  const action = titleCase(String(row.action ?? "activity").replaceAll(".", " "));
  const table = String(row.table_name ?? "system").replaceAll("_", " ");
  return `${action} in ${table}`;
}

function titleCase(value: string) {
  return value.replace(/\w\S*/g, (part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase());
}
