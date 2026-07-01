import { ShipmentForm } from "@/components/shipments/shipment-form";
import { listCustomers } from "@/lib/operations/service";
import { getTenantContext } from "@/lib/tenant";
import { listStaff } from "@/lib/staff/service";

export default async function NewShipmentPage() {
  const tenant = await getTenantContext();
  const [customers, staffResult] = await Promise.all([listCustomers(), listStaff()]);
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create shipment</h1>
        <p className="text-sm text-muted-foreground">Create a company-scoped cargo shipment with pricing, delivery, documents, and notifications.</p>
      </div>
      <ShipmentForm currency={tenant.company.currency} trackingPrefix={tenant.company.name.slice(0, 3)} customers={customers} staff={staffResult.staff} />
    </div>
  );
}
