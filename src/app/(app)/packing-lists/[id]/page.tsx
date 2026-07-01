import Link from "next/link";
import { notFound } from "next/navigation";
import { Pencil } from "lucide-react";
import { deletePackingList, updatePackingListStatus } from "@/app/(app)/packing-lists/actions";
import { PackingListForm } from "@/components/packing-lists/packing-list-form";
import { PackingListPdfActions } from "@/components/packing-lists/packing-list-pdf-actions";
import { StatusPill } from "@/components/packing-lists/packing-lists-list";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getPackingList, listPackingShipmentOptions } from "@/lib/packing-lists/service";

export default async function PackingListDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const [packingList, shipments] = await Promise.all([getPackingList(id), listPackingShipmentOptions()]);
  if (!packingList) notFound();

  if (query.mode === "edit") {
    return <PackingListForm shipments={shipments} packingList={packingList} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-semibold tracking-tight">{packingList.packingListNumber}</h1>
            <StatusPill status={packingList.status} />
          </div>
          <p className="text-sm text-muted-foreground">{packingList.dispatchDate} · {packingList.destination} · Prepared by {packingList.preparedByName || "-"}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline"><Link href={`/packing-lists/${packingList.id}?mode=edit`}><Pencil className="h-4 w-4" />Edit</Link></Button>
        </div>
      </div>

      <PackingListPdfActions packingListId={packingList.id} packingListNumber={packingList.packingListNumber} />

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total boxes" value={String(packingList.totalBoxes)} />
        <Metric label="Total customers" value={String(packingList.totalCustomers)} />
        <Metric label="Total items" value={String(packingList.totalItems)} />
        <Metric label="Total weight" value={`${packingList.totalWeight.toLocaleString()} kg`} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Status</CardTitle>
          <CardDescription>Move the packing list from Draft to Ready or Dispatched.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={updatePackingListStatus} className="flex flex-wrap gap-3">
            <input type="hidden" name="packing_list_id" value={packingList.id} />
            <Select name="status" defaultValue={packingList.status} className="w-48">
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="dispatched">Dispatched</option>
            </Select>
            <Button>Update status</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Box grouped contents</CardTitle>
          <CardDescription>Exactly which customer items are inside every dispatch box.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {packingList.boxes.map((box) => (
            <div key={box.id} className="rounded-lg border">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4">
                <div>
                  <p className="font-semibold">{box.boxNumber}</p>
                  <p className="text-xs text-muted-foreground">Barcode / QR value: {box.barcodeValue}</p>
                </div>
                <span className="text-sm text-muted-foreground">{box.items.length} line items</span>
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer Name</TableHead>
                      <TableHead>Tracking / Shipment No</TableHead>
                      <TableHead>Item Description</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Remarks</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {box.items.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>{item.customerName}</TableCell>
                        <TableCell className="font-mono text-xs">{item.trackingNumber}</TableCell>
                        <TableCell>{item.itemDescription}</TableCell>
                        <TableCell>{item.quantityLabel || item.quantity}</TableCell>
                        <TableCell>{item.weight.toLocaleString()} kg</TableCell>
                        <TableCell>{item.remarks}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Danger zone</CardTitle><CardDescription>Delete only if this packing list was created by mistake.</CardDescription></CardHeader>
        <CardContent>
          <form action={deletePackingList}>
            <input type="hidden" name="packing_list_id" value={packingList.id} />
            <Button variant="destructive">Delete packing list</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>;
}
