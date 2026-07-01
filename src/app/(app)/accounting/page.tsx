import { AccountingOverview } from "@/components/accounting/accounting-overview";
import { getAccountingData } from "@/lib/accounting/service";
import { getTenantContext } from "@/lib/tenant";

export default async function AccountingPage() {
  const [data, tenant] = await Promise.all([getAccountingData(), getTenantContext()]);
  return <AccountingOverview data={data} currency={tenant.company.currency} />;
}
