import { ShipmentsList } from "@/components/shipments/shipments-list";
import { listShipments } from "@/lib/shipments/service";
import type { ShipmentFilters } from "@/lib/shipments/types";

export default async function ShipmentsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: ShipmentFilters = {
    search: stringParam(params.search),
    status: stringParam(params.status) ?? "all",
    route: stringParam(params.route),
    origin: stringParam(params.origin),
    destination: stringParam(params.destination),
    cargoType: stringParam(params.cargoType),
    assignedStaff: stringParam(params.assignedStaff),
    dateFrom: stringParam(params.dateFrom),
    dateTo: stringParam(params.dateTo),
  };
  const result = await listShipments(filters);
  return <ShipmentsList shipments={result.shipments} counts={result.counts} filters={filters} currency={result.company.currency} />;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
