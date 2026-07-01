import { Badge } from "@/components/ui/badge";
import { shipmentStatusLabels } from "@/lib/shipments/labels";
import type { ShipmentStatus } from "@/lib/shipments/types";

const variantByStatus: Partial<Record<ShipmentStatus, "success" | "warning" | "danger" | "secondary">> = {
  pending: "warning",
  received: "secondary",
  in_warehouse: "secondary",
  in_transit: "secondary",
  arrived: "warning",
  out_for_delivery: "warning",
  delivered: "success",
  cancelled: "danger",
};

export function ShipmentStatusBadge({ status }: { status: ShipmentStatus | string }) {
  const normalized = status as ShipmentStatus;
  return (
    <Badge variant={variantByStatus[normalized] ?? "secondary"}>
      {shipmentStatusLabels[normalized] ?? status}
    </Badge>
  );
}
