import type { ShipmentStatus } from "@/lib/shipments/types";

export const shipmentStatusLabels: Record<ShipmentStatus, string> = {
  pending: "Pending",
  received: "Received",
  in_warehouse: "In Warehouse",
  in_transit: "In Transit",
  arrived: "Arrived",
  out_for_delivery: "Out For Delivery",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export const shipmentStatusTabs = [{ value: "all", label: "All" }, ...Object.entries(shipmentStatusLabels).map(([value, label]) => ({ value, label }))];
