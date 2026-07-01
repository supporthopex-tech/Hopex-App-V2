import { NextResponse } from "next/server";
import { listShipments } from "@/lib/shipments/service";
import { authorizeApi } from "@/lib/api-authorization";
import { getAuthenticatedTenantContext } from "@/lib/tenant";

export async function GET() {
  const authorization = await authorizeApi("shipments.view");
  if (!authorization.ok) return authorization.response;
  if (!(await getAuthenticatedTenantContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { shipments } = await listShipments();
  const headers = [
    "Tracking Number",
    "Supplier",
    "Supplier Phone",
    "Customer",
    "Customer Phone",
    "Origin",
    "Destination",
    "Route",
    "Cargo Type",
    "Status",
    "Estimated Delivery",
    "Total Amount",
  ];
  const rows = shipments.map((shipment) => [
    shipment.trackingNumber,
    shipment.supplierName,
    shipment.supplierPhone,
    shipment.customerName,
    shipment.customerPhone,
    shipment.origin,
    shipment.destination,
    shipment.route,
    shipment.cargoType,
    shipment.status,
    shipment.estimatedDelivery,
    shipment.pricing.totalAmount,
  ]);
  const csv = [headers, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");

  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="shipments.csv"`,
    },
  });
}
