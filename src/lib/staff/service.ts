import { unstable_noStore as noStore } from "next/cache";
import { portalPermissionLabels } from "@/lib/staff/types";
import type { RoleRecord, StaffFilters, StaffRecord } from "@/lib/staff/types";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/tenant";

type StaffQueryClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
      eq: (column: string, value: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> };
    };
  };
};

function matchesFilter(staff: StaffRecord, filters: StaffFilters) {
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = [staff.fullName, staff.email, staff.phone, staff.staffId].join(" ").toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.role && staff.roleName !== filters.role && staff.roleId !== filters.role) return false;
  if (filters.status && filters.status !== "all" && staff.status !== filters.status) return false;
  if (filters.department && !staff.department.toLowerCase().includes(filters.department.toLowerCase())) return false;
  if (filters.location && !staff.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
  return true;
}

export async function listStaff(filters: StaffFilters = {}) {
  noStore();
  if (!isSupabaseConfigured()) {
    return { staff: [], kpis: staffKpis([]), roles: [] };
  }

  const supabase = (await createClient()) as unknown as StaffQueryClient;
  const { data, error } = await supabase.from("staff").select("*, roles(name), staff_permissions(enabled, permissions(key))").order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  const mapped = (data ?? []).map(mapStaffRow);
  return { staff: mapped.filter((staff) => matchesFilter(staff, filters)), kpis: staffKpis(mapped), roles: await listRoles() };
}

export async function getStaffById(id: string) {
  noStore();
  if (!isSupabaseConfigured()) return null;
  const supabase = (await createClient()) as unknown as StaffQueryClient;
  const { data, error } = await supabase.from("staff").select("*, roles(name), staff_permissions(enabled, permissions(key))").eq("id", id).single();
  if (error || !data) return null;
  return mapStaffRow(data);
}

export async function listRoles(): Promise<RoleRecord[]> {
  noStore();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as StaffQueryClient;
  const { data, error } = await supabase.from("roles").select("*").order("name");
  if (error) throw new Error(error.message);
  const rolePermissionResult = await (supabase
    .from("role_permissions")
    .select("role_id, permissions(key)") as unknown as Promise<{
    data: { role_id?: string; permissions?: { key?: string } | { key?: string }[] | null }[] | null;
    error: { message: string } | null;
  }>);
  const permissionsByRole = new Map<string, string[]>();
  for (const row of rolePermissionResult.data ?? []) {
    const roleId = String(row.role_id ?? "");
    const permission = Array.isArray(row.permissions) ? row.permissions[0]?.key : row.permissions?.key;
    if (!roleId || !permission) continue;
    permissionsByRole.set(roleId, [...(permissionsByRole.get(roleId) ?? []), permission]);
  }
  return (data ?? []).map((role) => ({
    id: String(role.id),
    companyId: String(role.company_id),
    name: String(role.name),
    description: String(role.description ?? ""),
    isSystem: Boolean(role.is_system),
    permissions: permissionsByRole.get(String(role.id)) ?? [],
  }));
}

function mapStaffRow(row: Record<string, unknown>): StaffRecord {
  const role = row.roles as { name?: string } | { name?: string }[] | null | undefined;
  const roleName = Array.isArray(role) ? role[0]?.name : role?.name;
  const permissions = row.staff_permissions as { enabled?: boolean; permissions?: { key?: string } | { key?: string }[] | null }[] | null | undefined;
  const permissionKeys = new Set(
    (permissions ?? [])
      .filter((item) => item.enabled !== false)
      .map((item) => Array.isArray(item.permissions) ? item.permissions[0]?.key : item.permissions?.key)
      .filter((key): key is string => Boolean(key)),
  );
  const text = (key: string) => String(row[key] ?? "");
  return {
    id: text("id"),
    companyId: text("company_id"),
    staffId: text("staff_id"),
    fullName: text("full_name"),
    email: text("email"),
    phone: text("phone"),
    roleId: row.role_id ? text("role_id") : null,
    roleName: roleName ?? "Unassigned",
    department: text("department"),
    position: text("position"),
    location: text("location"),
    joinDate: text("join_date"),
    status: (text("status") || "active") as StaffRecord["status"],
    accountStatus: (text("account_status") || "not_invited") as StaffRecord["accountStatus"],
    portalAccess: portalPermissionLabels.filter((label) => {
      const prefix = label === "Staff Members" ? "staff" : label.toLowerCase().replaceAll(" ", "_");
      return Array.from(permissionKeys).some((key) => key.startsWith(`${prefix}.`));
    }),
    userId: row.user_id ? text("user_id") : null,
    notes: text("notes"),
    createdBy: row.created_by ? text("created_by") : null,
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
    activityTimeline: [],
    createdShipments: 0,
    createdQuotes: 0,
    completedTasks: 0,
    loginHistory: [],
  };
}

function staffKpis(staff: StaffRecord[]) {
  return {
    total: staff.length,
    active: staff.filter((member) => member.status === "active").length,
    suspended: staff.filter((member) => member.status === "suspended").length,
    admins: staff.filter((member) => ["Super Admin", "Owner", "Admin"].includes(member.roleName)).length,
  };
}
