import { DashboardView } from "@/components/dashboard-view";
import { getDashboardData } from "@/lib/dashboard/service";
import { requireTenantContext } from "@/lib/tenant";

export default async function DashboardPage() {
  const tenant = await requireTenantContext();
  const dashboard = await getDashboardData(tenant);
  return <DashboardView tenant={tenant} dashboard={dashboard} />;
}
