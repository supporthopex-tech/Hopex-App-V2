import { ExpenseList } from "@/components/accounting/expense-list";
import { getExpenseList } from "@/lib/accounting/service";
import { getTenantContext } from "@/lib/tenant";

export default async function ExpensesPage() {
  const tenant = await getTenantContext();
  return <ExpenseList expenses={await getExpenseList()} currency={tenant.company.currency} />;
}
