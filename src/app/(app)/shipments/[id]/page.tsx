import Link from "next/link";
import { notFound } from "next/navigation";
import { generateShipmentInvoice, updateShipmentStatus } from "@/app/(app)/shipments/actions";
import { ShipmentStatusBadge } from "@/components/shipments/status-badge";
import { ShipmentEditForm } from "@/components/shipments/shipment-edit-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getShipmentById } from "@/lib/shipments/service";
import { shipmentStatusLabels } from "@/lib/shipments/labels";
import { shipmentStatuses } from "@/lib/shipments/types";
import { formatCurrency, formatDate } from "@/lib/utils";
import { listStaff } from "@/lib/staff/service";

export default async function ShipmentDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [shipment, staffResult] = await Promise.all([getShipmentById(id), listStaff()]);
  if (!shipment) notFound();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{shipment.trackingNumber}</h1>
            <ShipmentStatusBadge status={shipment.status} />
          </div>
          <p className="text-sm text-muted-foreground">{shipment.route}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/track/${encodeURIComponent(shipment.trackingNumber)}`}>Public tracking</Link></Button>
          <Button asChild variant="outline"><Link href={`/api/shipments/${shipment.id}/label`} target="_blank">Print label</Link></Button>
          <form action={generateShipmentInvoice}><input type="hidden" name="shipment_id" value={shipment.id} /><Button>Generate invoice</Button></form>
        </div>
      </div>

      {query.mode === "edit" ? <ShipmentEditForm shipment={shipment} staff={staffResult.staff} /> : null}

      <div className="grid gap-4 xl:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Shipment overview</CardTitle>
            <CardDescription>Supplier, customer, route, cargo, delivery, and assignment.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            <Info label="Tracking number" value={shipment.trackingNumber} />
            <Info label="Current status" value={shipmentStatusLabels[shipment.status]} />
            <Info label="Supplier" value={`${shipment.supplierName || "-"} ${shipment.supplierPhone ? `(${shipment.supplierPhone})` : ""}`} />
            <Info label="Customer" value={`${shipment.customerName || "-"} ${shipment.customerPhone ? `(${shipment.customerPhone})` : ""}`} />
            <Info label="Route" value={shipment.route} />
            <Info label="Cargo type" value={shipment.cargoType} />
            <Info label="Weight" value={`${shipment.pricing.weightKg} kg`} />
            <Info label="Pieces" value={String(shipment.pricing.pieces)} />
            <Info label="Volume" value={`${shipment.pricing.volumeCbm} cbm`} />
            <Info label="Total cost" value={formatCurrency(shipment.pricing.totalAmount, shipment.currency)} />
            <Info label="Estimated delivery" value={shipment.estimatedDelivery || "-"} />
            <Info label="Actual delivery" value={shipment.actualDelivery ?? "-"} />
            <Info label="Assigned staff" value={shipment.assignedStaffName || "-"} />
            <Info label="Assigned driver" value={shipment.assignedDriver || "-"} />
          </CardContent>
        </Card>

        <Card id="status">
          <CardHeader>
            <CardTitle>Update status</CardTitle>
            <CardDescription>Creates status history, audit log, and notification records.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={updateShipmentStatus} className="grid gap-3">
              <input type="hidden" name="shipment_id" value={shipment.id} />
              <Select name="status" defaultValue={shipment.status}>
                {shipmentStatuses.map((status) => <option key={status} value={status}>{shipmentStatusLabels[status]}</option>)}
              </Select>
              <Textarea name="notes" placeholder="Status note for timeline..." />
              <label className="flex items-center gap-2 rounded-md border p-3 text-sm">
                <input type="checkbox" name="notify_customer" defaultChecked={Boolean(shipment.customerEmail)} disabled={!shipment.customerEmail} />
                Email customer status update {shipment.customerEmail ? `(${shipment.customerEmail})` : "(add customer email first)"}
              </label>
              <Button>Update status</Button>
            </form>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Shipment items</CardTitle><CardDescription>Itemized cargo captured for this shipment.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {shipment.items.length ? shipment.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3 text-sm">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-muted-foreground">Qty {item.quantity}</p>
                </div>
                <p className="mt-1 text-muted-foreground">{item.description || "No description"}</p>
                <div className="mt-2 grid gap-2 text-xs text-muted-foreground md:grid-cols-3">
                  <span>{item.weightKg ? `${item.weightKg} kg` : "Weight -"}</span>
                  <span>{item.volumeCbm ? `${item.volumeCbm} cbm` : "Volume -"}</span>
                  <span>{item.declaredValue ? formatCurrency(item.declaredValue, item.currency || shipment.currency) : "Value -"}</span>
                </div>
              </div>
            )) : <Empty text="No shipment items captured yet." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Timeline</CardTitle><CardDescription>Customer-visible tracking milestones.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {shipment.timeline.map((event) => (
              <div key={event.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{event.title}</p>
                <p className="text-muted-foreground">{event.location} · {formatDate(event.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Documents</CardTitle><CardDescription>Supabase Storage shipment documents.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {shipment.documents.length ? shipment.documents.map((document) => (
              <div key={document.id} className="rounded-md border p-3 text-sm">
                <p className="font-medium">{document.fileName}</p>
                <p className="text-muted-foreground">{document.documentType}</p>
              </div>
            )) : <Empty text="No documents uploaded yet." />}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Financial summary</CardTitle><CardDescription>Internal financial details.</CardDescription></CardHeader>
          <CardContent className="space-y-2 text-sm">
            <Summary label="Subtotal" value={formatCurrency(shipment.pricing.subtotal, shipment.currency)} />
            <Summary label="Discount" value={formatCurrency(shipment.pricing.discount, shipment.currency)} />
            <Summary label="Tax" value={`${shipment.pricing.tax}%`} />
            <Summary label="Total" value={formatCurrency(shipment.pricing.totalAmount, shipment.currency)} />
            <Summary label="Profit margin" value={`${shipment.pricing.profitMargin}%`} />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>Audit logs</CardTitle><CardDescription>Internal audit trail for this shipment.</CardDescription></CardHeader>
        <CardContent className="grid gap-2">
          {shipment.auditLogs.length ? shipment.auditLogs.map((log) => (
            <div key={log.id} className="flex flex-col gap-1 rounded-md border p-3 text-sm md:flex-row md:items-center md:justify-between">
              <span>{log.action}</span>
              <span className="text-muted-foreground">{log.actor} · {formatDate(log.createdAt)}</span>
            </div>
          )) : <Empty text="No audit logs yet." />}
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function Summary({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-3"><span className="text-muted-foreground">{label}</span><strong>{value}</strong></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">{text}</div>;
}
