import { PaymentList } from "@/components/accounting/payment-list";
import { getPaymentList } from "@/lib/accounting/service";
import { getTenantContext } from "@/lib/tenant";

export default async function PaymentsPage() {
  const tenant = await getTenantContext();
  return <PaymentList payments={await getPaymentList()} currency={tenant.company.currency} />;
}
