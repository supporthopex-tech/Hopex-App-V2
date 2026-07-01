import { InvoiceList } from "@/components/accounting/invoice-list";
import { getInvoiceList, getInvoiceShipmentOptions } from "@/lib/accounting/service";
import { getTenantContext } from "@/lib/tenant";

export default async function InvoicesPage() {
  const tenant = await getTenantContext();
  const [invoices, shipmentOptions] = await Promise.all([
    getInvoiceList(),
    getInvoiceShipmentOptions(),
  ]);
  return <InvoiceList invoices={invoices} currency={tenant.company.currency} shipmentOptions={shipmentOptions} />;
}
