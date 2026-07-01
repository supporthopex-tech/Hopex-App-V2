import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, isSupabaseConfigured } from "@/lib/tenant";

export type NotificationRecord = {
  id: string;
  title: string;
  body: string;
  isRead: boolean;
  createdAt: string;
};

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => QueryBuilder;
  };
};

type QueryBuilder = {
  eq: (column: string, value: string) => QueryBuilder;
  or: (filters: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
};

export async function listNotifications(search = "", status = "all") {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return { notifications: [], unread: 0, total: 0 };

  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase
    .from("notifications")
    .select("*")
    .eq("company_id", tenant.company.id)
    .or(`user_id.eq.${tenant.user.id},user_id.is.null`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);

  const query = search.trim().toLowerCase();
  const mapped = (data ?? []).map(mapNotification);
  const filtered = mapped.filter((notification) => {
    if (status === "unread" && notification.isRead) return false;
    if (status === "read" && !notification.isRead) return false;
    if (!query) return true;
    return [notification.title, notification.body].join(" ").toLowerCase().includes(query);
  });

  return {
    notifications: filtered,
    unread: mapped.filter((notification) => !notification.isRead).length,
    total: mapped.length,
  };
}

function mapNotification(row: Record<string, unknown>): NotificationRecord {
  return {
    id: String(row.id),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    isRead: Boolean(row.read_at),
    createdAt: String(row.created_at ?? ""),
  };
}
