import { unstable_noStore as noStore } from "next/cache";
import type { StaffApprovalRecord } from "@/lib/approvals/types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/tenant";

type QueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      eq: (column: string, value: string) => {
        order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      };
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
  };
};

export async function listStaffApprovals() {
  noStore();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as QueryClient;
  const { data, error } = await supabase
    .from("approvals")
    .select("*, staff:reference_id(id, full_name, email, department, roles(name)), approval_history(id, action, reason, created_at)")
    .eq("approval_type", "staff_account")
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(mapApproval);
}

function mapApproval(row: Record<string, unknown>): StaffApprovalRecord {
  const staff = row.staff as { id?: string; full_name?: string; email?: string; department?: string; roles?: { name?: string } | { name?: string }[] } | null | undefined;
  const role = Array.isArray(staff?.roles) ? staff?.roles[0]?.name : staff?.roles?.name;
  const history = row.approval_history as Record<string, unknown>[] | null | undefined;
  return {
    id: String(row.id),
    companyId: String(row.company_id),
    staffId: String(row.reference_id ?? staff?.id ?? ""),
    staffName: staff?.full_name ?? "Staff member",
    staffEmail: staff?.email ?? "",
    roleName: role ?? "Unassigned",
    department: staff?.department ?? "",
    status: String(row.status ?? "pending"),
    requestedAt: String(row.created_at ?? ""),
    decidedAt: row.decided_at ? String(row.decided_at) : null,
    reason: "",
    history: (history ?? []).map((item) => ({
      id: String(item.id),
      action: String(item.action),
      reason: String(item.reason ?? ""),
      createdAt: String(item.created_at ?? ""),
    })),
  };
}
