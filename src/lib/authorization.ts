import { navigation, quickActions } from "@/lib/navigation";
import type { TenantContext } from "@/lib/app-types";

type NavItem = (typeof navigation)[number];
type QuickAction = (typeof quickActions)[number];

function hasAnyPermission(tenant: TenantContext, item: NavItem | QuickAction) {
  const permissions = tenant.user.permissions ?? [];
  if (permissions.includes("*")) return true;
  return (
    permissions.includes(item.permission) ||
    permissions.includes(`${item.module}.read`) ||
    permissions.includes(`${item.module}.view`) ||
    tenant.user.modules?.includes(item.module)
  );
}

export function visibleNavigation(tenant: TenantContext) {
  return navigation.filter((item) => hasAnyPermission(tenant, item));
}

export function visibleQuickActions(tenant: TenantContext) {
  return quickActions.filter((item) => hasAnyPermission(tenant, item));
}

export function canAccessPath(tenant: TenantContext, pathname: string) {
  if (tenant.user.permissions?.includes("*")) return true;
  const protectedItem = navigation
    .filter((item) => pathname === item.href || pathname.startsWith(`${item.href}/`))
    .sort((a, b) => b.href.length - a.href.length)[0];
  if (!protectedItem) return true;
  return hasAnyPermission(tenant, protectedItem);
}
