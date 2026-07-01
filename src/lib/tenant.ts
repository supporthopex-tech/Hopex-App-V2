import "server-only";

import { cache } from "react";
import { redirect } from "next/navigation";
import type { TenantContext } from "@/lib/app-types";
import { getDeploymentCompanyId } from "@/lib/deployment";
import { isSupabasePublicConfigAvailable } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

type PermissionRelation = { key?: string } | { key?: string }[] | null;
type PermissionRow = { enabled?: boolean; permissions?: PermissionRelation };

export function isSupabaseConfigured() {
  return isSupabasePublicConfigAvailable();
}

const loadTenantContext = cache(async (): Promise<TenantContext | null> => {
  if (!isSupabaseConfigured()) return null;

  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError?.message?.toLowerCase().includes("auth session missing")) return null;
  if (userError) throw new Error(`Authentication check failed: ${userError.message}`);
  const user = userData.user;
  if (!user) return null;
  const deploymentCompanyId = getDeploymentCompanyId();

  const { data: membershipData, error: membershipError } = await supabase
    .from("company_users")
    .select("company_id,role_id")
    .eq("user_id", user.id)
    .eq("company_id", deploymentCompanyId)
    .eq("status", "active")
    .maybeSingle();
  if (membershipError) throw new Error(`Membership lookup failed: ${membershipError.message}`);
  const membership = membershipData;
  if (!membership?.company_id) return null;

  const [companyResult, rolePermissionsResult, staffResult] = await Promise.all([
    supabase.from("companies").select("id,name,logo_url,theme_color,primary_color,currency,timezone,address,email,phone,website,country,city,tax_registration_number,slogan").eq("id", membership.company_id).maybeSingle(),
    membership.role_id
      ? supabase.from("role_permissions").select("permissions(key)").eq("company_id", membership.company_id).eq("role_id", membership.role_id)
      : Promise.resolve({ data: [], error: null }),
    supabase.from("staff").select("id,full_name,profile_photo_url,staff_permissions(permissions(key),enabled)").eq("company_id", membership.company_id).eq("user_id", user.id).eq("status", "active").maybeSingle(),
  ]);

  const firstError = companyResult.error ?? rolePermissionsResult.error ?? staffResult.error;
  if (firstError) throw new Error(`Tenant context lookup failed: ${firstError.message}`);

  const company = companyResult.data;
  if (!company) return null;
  const rolePermissions = rolePermissionsResult.data ?? [];
  const staff = staffResult.data;

  const permissions = new Set<string>();
  addPermissions(permissions, rolePermissions);
  addPermissions(permissions, staff?.staff_permissions ?? []);
  const permissionList = Array.from(permissions);

  return {
    company: {
      id: company.id,
      name: company.name,
      logoUrl: company.logo_url,
      themeColor: company.primary_color ?? company.theme_color,
      currency: company.currency,
      timezone: company.timezone,
      address: company.address ?? "",
      email: company.email ?? null,
      phone: company.phone ?? null,
      website: company.website ?? null,
      country: company.country ?? null,
      city: company.city ?? null,
      taxRegistrationNumber: company.tax_registration_number ?? null,
      slogan: company.slogan ?? null,
    },
    user: {
      id: user.id,
      name: staff?.full_name ?? user.user_metadata?.full_name ?? user.email ?? "User",
      email: user.email ?? "",
      role: "Member",
      avatarUrl: staff?.profile_photo_url ?? user.user_metadata?.avatar_url ?? null,
      permissions: permissionList,
      modules: Array.from(new Set(permissionList.map((permission) => permission.split(".")[0]).filter(Boolean))),
    },
  };
});

export async function getAuthenticatedTenantContext() {
  return loadTenantContext();
}

export async function requireTenantContext(): Promise<TenantContext> {
  const tenant = await loadTenantContext();
  if (!tenant) redirect("/login");
  return tenant;
}

export const requireTenant = requireTenantContext;

export async function getTenantContext(): Promise<TenantContext> {
  return requireTenantContext();
}

export async function requirePermission(permission: string): Promise<TenantContext> {
  const tenant = await requireTenantContext();
  if (!hasPermission(tenant, permission)) {
    throw new Error("Forbidden: you do not have permission to perform this action.");
  }
  return tenant;
}

export async function requireAnyPermission(permissions: string[]): Promise<TenantContext> {
  const tenant = await requireTenantContext();
  if (!permissions.some((permission) => hasPermission(tenant, permission))) {
    throw new Error("Forbidden: you do not have permission to perform this action.");
  }
  return tenant;
}

export function hasPermission(tenant: TenantContext, permission: string) {
  return tenant.user.permissions?.includes("*") || tenant.user.permissions?.includes(permission);
}

function addPermissions(target: Set<string>, rows: PermissionRow[]) {
  for (const row of rows) {
    if (row.enabled === false) continue;
    const permission = Array.isArray(row.permissions) ? row.permissions[0]?.key : row.permissions?.key;
    if (permission) target.add(permission);
  }
}
