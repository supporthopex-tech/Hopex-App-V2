"use client";

import { useActionState, useMemo, useState } from "react";
import { Plus, Save, Trash2 } from "lucide-react";
import { createPackingList, updatePackingList } from "@/app/(app)/packing-lists/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import type { PackingListRecord, PackingShipmentOption } from "@/lib/packing-lists/types";

type DraftItem = {
  id: string;
  boxNumber: string;
  shipmentId: string;
  customerId: string;
  customerName: string;
  trackingNumber: string;
  itemDescription: string;
  quantity: number;
  quantityLabel: string;
  weight: number;
  remarks: string;
};

const initialState = { ok: true, message: "" };

export function PackingListForm({
  shipments,
  packingList,
}: {
  shipments: PackingShipmentOption[];
  packingList?: PackingListRecord;
}) {
  const action = packingList ? updatePackingList : createPackingList;
  const [state, formAction, pending] = useActionState(action, initialState);
  const [items, setItems] = useState<DraftItem[]>(() => initialItems(packingList));
  const shipmentById = useMemo(() => new Map(shipments.map((shipment) => [shipment.id, shipment])), [shipments]);
  const boxes = [...new Set(items.map((item) => item.boxNumber).filter(Boolean))];
  const totalCustomers = new Set(items.map((item) => item.customerId || item.customerName).filter(Boolean)).size;
  const totalItems = items.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
  const totalWeight = items.reduce((sum, item) => sum + Number(item.weight || 0), 0);

  function addItem(boxNumber = `Box ${boxes.length + 1}`) {
    setItems((current) => [...current, emptyItem(boxNumber)]);
  }

  function removeItem(id: string) {
    setItems((current) => current.length > 1 ? current.filter((item) => item.id !== id) : current);
  }

  function updateItem(id: string, patch: Partial<DraftItem>) {
    setItems((current) => current.map((item) => item.id === id ? { ...item, ...patch } : item));
  }

  function selectShipment(id: string, shipmentId: string) {
    const shipment = shipmentById.get(shipmentId);
    if (!shipment) {
      updateItem(id, { shipmentId });
      return;
    }
    updateItem(id, {
      shipmentId,
      customerId: shipment.customerId ?? "",
      customerName: shipment.customerName,
      trackingNumber: shipment.trackingNumber,
      itemDescription: shipment.itemDescription,
      quantity: shipment.quantity,
      quantityLabel: shipment.quantityLabel,
      weight: shipment.weight,
    });
  }

  return (
    <form action={formAction} className="space-y-6">
      {packingList ? <input type="hidden" name="packing_list_id" value={packingList.id} /> : null}
      <input type="hidden" name="items_json" value={JSON.stringify(items.map((item) => ({
        boxNumber: item.boxNumber,
        shipmentId: item.shipmentId,
        customerId: item.customerId,
        customerName: item.customerName,
        trackingNumber: item.trackingNumber,
        itemDescription: item.itemDescription,
        quantity: item.quantity,
        quantityLabel: item.quantityLabel,
        weight: item.weight,
        remarks: item.remarks,
      })))} />
      {!state.ok ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.message}</div> : null}
      {state.ok && state.message ? <div className="rounded-md border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-700 dark:text-emerald-300">{state.message}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>{packingList ? "Edit packing list" : "Create daily packing list"}</CardTitle>
          <CardDescription>Group today&apos;s dispatch cargo by Box Number before dispatch.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Dispatch date"><Input name="dispatch_date" type="date" defaultValue={packingList?.dispatchDate || new Date().toISOString().slice(0, 10)} required /></Field>
          <Field label="Destination"><Input name="destination" defaultValue={packingList?.destination ?? ""} placeholder="Dar es Salaam" required /></Field>
          <Field label="Status">
            <Select name="status" defaultValue={packingList?.status ?? "draft"}>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="dispatched">Dispatched</option>
            </Select>
          </Field>
          <Field label="Remarks"><Input name="remarks" defaultValue={packingList?.remarks ?? ""} /></Field>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-4">
        <Metric label="Total boxes" value={String(boxes.length)} />
        <Metric label="Total customers" value={String(totalCustomers)} />
        <Metric label="Total items" value={String(totalItems)} />
        <Metric label="Total weight" value={`${totalWeight.toLocaleString()} kg`} />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Box contents</CardTitle>
            <CardDescription>Select existing shipments to auto-fill customer, tracking, item, quantity, and weight. You can edit any field before saving.</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={() => addItem(items.at(-1)?.boxNumber || "Box 1")}><Plus className="h-4 w-4" />Add item</Button>
            <Button type="button" variant="outline" onClick={() => addItem()}><Plus className="h-4 w-4" />New box</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="rounded-lg border p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <p className="text-sm font-semibold">Line {index + 1}</p>
                <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(item.id)}><Trash2 className="h-4 w-4" />Remove</Button>
              </div>
              <div className="grid gap-3 md:grid-cols-6">
                <Field label="Box No"><Input value={item.boxNumber} onChange={(event) => updateItem(item.id, { boxNumber: event.target.value })} required /></Field>
                <Field label="Shipment" className="md:col-span-2">
                  <Select value={item.shipmentId} onChange={(event) => selectShipment(item.id, event.target.value)}>
                    <option value="">Manual entry</option>
                    {shipments.map((shipment) => (
                      <option key={shipment.id} value={shipment.id}>{shipment.trackingNumber} · {shipment.customerName}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Customer" className="md:col-span-2"><Input value={item.customerName} onChange={(event) => updateItem(item.id, { customerName: event.target.value })} required /></Field>
                <Field label="Tracking No"><Input value={item.trackingNumber} onChange={(event) => updateItem(item.id, { trackingNumber: event.target.value })} required /></Field>
                <Field label="Item description" className="md:col-span-2"><Input value={item.itemDescription} onChange={(event) => updateItem(item.id, { itemDescription: event.target.value })} required /></Field>
                <Field label="Qty"><Input type="number" inputMode="decimal" min="0" step="0.01" value={item.quantity} onChange={(event) => updateItem(item.id, { quantity: Number(event.target.value) })} required /></Field>
                <Field label="Qty label"><Input value={item.quantityLabel} onChange={(event) => updateItem(item.id, { quantityLabel: event.target.value })} placeholder="2 pcs" /></Field>
                <Field label="Weight kg"><Input type="number" inputMode="decimal" min="0" step="0.01" value={item.weight} onChange={(event) => updateItem(item.id, { weight: Number(event.target.value) })} required /></Field>
                <Field label="Remarks"><Input value={item.remarks} onChange={(event) => updateItem(item.id, { remarks: event.target.value })} placeholder="Fragile" /></Field>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4 backdrop-blur">
        <Button disabled={pending}><Save className="h-4 w-4" />{pending ? "Saving..." : packingList ? "Save packing list" : "Create packing list"}</Button>
      </div>
    </form>
  );
}

function initialItems(packingList?: PackingListRecord): DraftItem[] {
  const existing = packingList?.boxes.flatMap((box) => box.items.map((item) => ({
    id: item.id,
    boxNumber: box.boxNumber,
    shipmentId: item.shipmentId ?? "",
    customerId: item.customerId ?? "",
    customerName: item.customerName,
    trackingNumber: item.trackingNumber,
    itemDescription: item.itemDescription,
    quantity: item.quantity,
    quantityLabel: item.quantityLabel,
    weight: item.weight,
    remarks: item.remarks,
  })));
  return existing?.length ? existing : [emptyItem("Box 1")];
}

function emptyItem(boxNumber: string): DraftItem {
  return {
    id: crypto.randomUUID(),
    boxNumber,
    shipmentId: "",
    customerId: "",
    customerName: "",
    trackingNumber: "",
    itemDescription: "",
    quantity: 1,
    quantityLabel: "1",
    weight: 0,
    remarks: "",
  };
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}</div>;
}

function Metric({ label, value }: { label: string; value: string }) {
  return <Card><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>;
}
