"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { requirePermission, isSupabaseConfigured } from "@/lib/tenant";

type MutationClient = {
  from: (table: string) => {
    select: (columns?: string) => {
      in: (column: string, values: string[]) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;
    };
    insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};

export async function createRole(formData: FormData) {
  if (!isSupabaseConfigured()) {
    revalidatePath("/settings/roles");
    return;
  }
  const tenant = await requirePermission("settings.manage_users");
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("roles").insert({
    company_id: tenant.company.id,
    name: String(formData.get("name") ?? ""),
    description: String(formData.get("description") ?? ""),
    is_system: false,
    created_by: tenant.user.id,
  });
  revalidatePath("/settings/roles");
}

export async function deleteRole(formData: FormData) {
  await requirePermission("settings.manage_users");
  if (!isSupabaseConfigured()) {
    revalidatePath("/settings/roles");
    return;
  }
  const supabase = (await createClient()) as unknown as MutationClient;
  await supabase.from("roles").delete().eq("id", String(formData.get("role_id") ?? ""));
  revalidatePath("/settings/roles");
}

export async function updateRolePermissions(formData: FormData) {
  if (!isSupabaseConfigured()) {
    revalidatePath("/settings/roles");
    revalidatePath("/settings/permissions");
    return;
  }
  const tenant = await requirePermission("settings.manage_users");
  const roleId = String(formData.get("role_id") ?? "");
  const permissionKeys = formData.getAll("permissions").map(String);
  const supabase = (await createClient()) as unknown as MutationClient;
  const { data: permissions, error } = await supabase.from("permissions").select("id,key").in("key", permissionKeys);
  if (error) return;

  await supabase.from("role_permissions").delete().eq("role_id", roleId);
  if (permissions?.length) {
    await (supabase.from("role_permissions").insert(
      permissions.map((permission) => ({
        company_id: tenant.company.id,
        role_id: roleId,
        permission_id: String(permission.id),
        created_by: tenant.user.id,
      })),
    ) as unknown as Promise<{ error: { message: string } | null }>);
  }

  revalidatePath("/settings/roles");
  revalidatePath("/settings/permissions");
}
