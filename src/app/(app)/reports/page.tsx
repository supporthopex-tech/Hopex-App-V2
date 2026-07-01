import { FinancialReports } from "@/components/accounting/financial-reports";
import { getAccountingData } from "@/lib/accounting/service";
import { getTenantContext } from "@/lib/tenant";

export default async function ReportsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const [data, tenant] = await Promise.all([getAccountingData(), getTenantContext()]);
  return <FinancialReports data={data} currency={tenant.company.currency} from={valueOf(params.from)} to={valueOf(params.to)} />;
}

function valueOf(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] ?? "" : value ?? ""; }
