import { notFound } from "next/navigation";
import { ShipmentStatusBadge } from "@/components/shipments/status-badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getPublicShipmentByTrackingNumber } from "@/lib/shipments/service";
import { shipmentStatusLabels } from "@/lib/shipments/labels";
import { formatDate } from "@/lib/utils";

export default async function PublicTrackingPage({
  params,
}: {
  params: Promise<{ trackingNumber: string }>;
}) {
  const { trackingNumber } = await params;
  const shipment = await getPublicShipmentByTrackingNumber(trackingNumber);
  if (!shipment) notFound();

  return (
    <main className="min-h-screen bg-muted/40 p-4">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="rounded-lg border bg-background p-6">
          <p className="text-sm text-muted-foreground">Public shipment tracking</p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{shipment.trackingNumber}</h1>
            <ShipmentStatusBadge status={shipment.status} />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">{shipment.route}</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Current status</CardTitle>
            <CardDescription>{shipmentStatusLabels[shipment.status]}</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <PublicInfo label="Route" value={shipment.route} />
            <PublicInfo label="Estimated delivery" value={shipment.estimatedDelivery || "-"} />
            <PublicInfo label="Actual delivery" value={shipment.actualDelivery ?? "-"} />
            <PublicInfo label="Delivery confirmation" value={shipment.receiverName || shipment.deliveryNotes || "Not delivered yet"} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Shipment items</CardTitle>
            <CardDescription>Cargo lines registered for this shipment.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipment.items.length ? shipment.items.map((item) => (
              <div key={item.id} className="rounded-md border p-3">
                <div className="flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                  <p className="font-medium">{item.itemName}</p>
                  <p className="text-sm text-muted-foreground">Qty {item.quantity}</p>
                </div>
                {item.description ? <p className="mt-1 text-sm text-muted-foreground">{item.description}</p> : null}
              </div>
            )) : <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">No shipment items available.</div>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Timeline</CardTitle>
            <CardDescription>Customer-visible shipment milestones.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {shipment.timeline.map((event) => (
              <div key={event.id} className="rounded-md border p-3">
                <p className="font-medium">{event.publicNote || event.title}</p>
                <p className="text-sm text-muted-foreground">{event.location} · {formatDate(event.createdAt)}</p>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function PublicInfo({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}
