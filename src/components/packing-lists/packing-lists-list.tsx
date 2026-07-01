import Link from "next/link";
import { Download, PackagePlus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PackingListFilters, PackingListRecord } from "@/lib/packing-lists/types";

export function PackingListsList({ lists, filters }: { lists: PackingListRecord[]; filters: PackingListFilters }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Packing Lists</h1>
          <p className="text-sm text-muted-foreground">Daily dispatch box contents grouped by box number.</p>
        </div>
        <Button asChild><Link href="/packing-lists/new"><PackagePlus className="h-4 w-4" />Create packing list</Link></Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_160px_160px_160px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="search" defaultValue={filters.search} placeholder="Date, box, customer, shipment number..." />
            </div>
            <Select name="status" defaultValue={filters.status ?? "all"}>
              <option value="all">All status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="dispatched">Dispatched</option>
            </Select>
            <Input name="dateFrom" type="date" defaultValue={filters.dateFrom} />
            <Input name="dateTo" type="date" defaultValue={filters.dateTo} />
            <Button>Search</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Daily dispatch lists</CardTitle>
          <CardDescription>{lists.length} packing lists found.</CardDescription>
        </CardHeader>
        <CardContent>
          {lists.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No packing lists found.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[980px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>List No</TableHead>
                    <TableHead>Dispatch Date</TableHead>
                    <TableHead>Destination</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Boxes</TableHead>
                    <TableHead>Customers</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lists.map((list) => (
                    <TableRow key={list.id}>
                      <TableCell className="font-mono text-xs font-semibold text-primary">{list.packingListNumber}</TableCell>
                      <TableCell>{list.dispatchDate}</TableCell>
                      <TableCell>{list.destination}</TableCell>
                      <TableCell><StatusPill status={list.status} /></TableCell>
                      <TableCell>{list.totalBoxes}</TableCell>
                      <TableCell>{list.totalCustomers}</TableCell>
                      <TableCell>{list.totalItems}</TableCell>
                      <TableCell>{list.totalWeight.toLocaleString()} kg</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button asChild variant="ghost" size="sm"><Link href={`/packing-lists/${list.id}`}>View</Link></Button>
                          <Button asChild variant="ghost" size="sm"><Link href={`/api/packing-lists/${list.id}/pdf`} target="_blank"><Download className="h-4 w-4" />PDF</Link></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function StatusPill({ status }: { status: string }) {
  const className = status === "dispatched" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300" : status === "ready" ? "bg-blue-500/10 text-blue-700 dark:text-blue-300" : "bg-muted text-muted-foreground";
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium capitalize ${className}`}>{status}</span>;
}
