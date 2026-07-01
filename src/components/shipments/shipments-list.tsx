import Link from "next/link";
import { Download, Plus, Search, SlidersHorizontal, TimerReset } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ShipmentActions } from "@/components/shipments/shipment-actions";
import { ImportShipmentsButton } from "@/components/shipments/import-shipments-button";
import { ShipmentStatusBadge } from "@/components/shipments/status-badge";
import { shipmentStatusTabs } from "@/lib/shipments/labels";
import type { ShipmentFilters, ShipmentRecord } from "@/lib/shipments/types";
import { cargoTypes } from "@/lib/shipments/types";
import { formatCurrency } from "@/lib/utils";

export function ShipmentsList({
  shipments,
  counts,
  filters,
  currency,
}: {
  shipments: ShipmentRecord[];
  counts: Record<string, number>;
  filters: ShipmentFilters;
  currency: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Shipments</h1>
          <p className="text-sm text-muted-foreground">Manage all cargo shipments</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/shipments/new"><Plus className="h-4 w-4" />Add Shipment</Link></Button>
          <Button asChild variant="outline"><Link href="/shipments?status=in_transit"><TimerReset className="h-4 w-4" />In transit</Link></Button>
          <Button asChild variant="outline"><Link href="/api/shipments/export"><Download className="h-4 w-4" />Export</Link></Button>
          <ImportShipmentsButton />
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {shipmentStatusTabs.map((tab) => {
          const active = (filters.status ?? "all") === tab.value;
          const href = tab.value === "all" ? "/shipments" : `/shipments?status=${tab.value}`;
          return (
            <Button key={tab.value} asChild variant={active ? "default" : "outline"} size="sm" className="shrink-0">
              <Link href={href}>
                {tab.label}
                <span className="ml-1 rounded bg-background/20 px-1.5 text-xs">{counts[tab.value] ?? 0}</span>
              </Link>
            </Button>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><SlidersHorizontal className="h-4 w-4" />Search and filters</CardTitle>
          <CardDescription>Search by tracking number, supplier, customer, or phone.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="search" defaultValue={filters.search} placeholder="Tracking, supplier, customer, phone..." />
            </div>
            <Select name="status" defaultValue={filters.status ?? "all"}>
              {shipmentStatusTabs.map((tab) => <option key={tab.value} value={tab.value}>{tab.label}</option>)}
            </Select>
            <Select name="cargoType" defaultValue={filters.cargoType ?? ""}>
              <option value="">All cargo types</option>
              {cargoTypes.map((type) => <option key={type} value={type}>{type}</option>)}
            </Select>
            <Input name="route" defaultValue={filters.route} placeholder="Route" />
            <Input name="origin" defaultValue={filters.origin} placeholder="Origin" />
            <Input name="destination" defaultValue={filters.destination} placeholder="Destination" />
            <Input name="assignedStaff" defaultValue={filters.assignedStaff} placeholder="Assigned staff id" />
            <Input name="dateFrom" type="date" defaultValue={filters.dateFrom} />
            <Input name="dateTo" type="date" defaultValue={filters.dateTo} />
            <Button className="md:w-fit">Apply filters</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipment table</CardTitle>
          <CardDescription>{shipments.length} records found.</CardDescription>
        </CardHeader>
        <CardContent>
          {shipments.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">
              No shipments found. Create a shipment or change the filters.
            </div>
          ) : (
            <>
              <div className="grid gap-3 lg:hidden">
                {shipments.map((shipment) => (
                  <div key={shipment.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs font-semibold text-primary">{shipment.trackingNumber}</p>
                        <p className="mt-1 font-semibold">{shipment.customerName}</p>
                        <p className="text-sm text-muted-foreground">{shipment.route}</p>
                      </div>
                      <ShipmentStatusBadge status={shipment.status} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm">
                      <div className="flex justify-between gap-3"><span className="text-muted-foreground">Supplier</span><span>{shipment.supplierName || "-"}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-muted-foreground">Delivery</span><span>{shipment.estimatedDelivery || "-"}</span></div>
                      <div className="flex justify-between gap-3"><span className="text-muted-foreground">Total</span><span>{formatCurrency(shipment.pricing.totalAmount, shipment.currency || currency)}</span></div>
                    </div>
                    <div className="mt-4 border-t pt-3">
                      <ShipmentActions shipment={shipment} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="hidden overflow-x-auto lg:block">
                <Table className="min-w-[1100px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Tracking Number</TableHead>
                      <TableHead>Supplier / From</TableHead>
                      <TableHead>Customer / To</TableHead>
                      <TableHead>Route</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Estimated Delivery</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {shipments.map((shipment) => (
                      <TableRow key={shipment.id}>
                        <TableCell className="font-mono text-xs font-semibold text-primary">{shipment.trackingNumber}</TableCell>
                        <TableCell>
                          <p className="font-medium">{shipment.supplierName || "-"}</p>
                          <p className="text-xs text-muted-foreground">{shipment.supplierLocation}</p>
                        </TableCell>
                        <TableCell>
                          <p className="font-medium">{shipment.customerName || "-"}</p>
                          <p className="text-xs text-muted-foreground">{shipment.customerPhone}</p>
                        </TableCell>
                        <TableCell>{shipment.route}</TableCell>
                        <TableCell><ShipmentStatusBadge status={shipment.status} /></TableCell>
                        <TableCell>{shipment.estimatedDelivery || "-"}</TableCell>
                        <TableCell className="max-w-[380px] text-right"><ShipmentActions shipment={shipment} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
