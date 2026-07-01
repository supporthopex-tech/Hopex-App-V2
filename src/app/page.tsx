import { redirect } from "next/navigation";
import { getAuthenticatedTenantContext } from "@/lib/tenant";

export default async function HomePage() {
  const tenant = await getAuthenticatedTenantContext();
  redirect(tenant ? "/dashboard" : "/login");
}
