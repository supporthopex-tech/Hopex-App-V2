import "server-only";

import { NextResponse } from "next/server";
import { getAuthenticatedTenantContext, hasPermission } from "@/lib/tenant";

export async function authorizeApi(permission: string) {
  const tenant = await getAuthenticatedTenantContext();
  if (!tenant) {
    return { ok: false as const, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  if (!hasPermission(tenant, permission)) {
    return { ok: false as const, response: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }
  return { ok: true as const, tenant };
}
