"use client";

import { useState } from "react";
import { updateShipment } from "@/app/(app)/shipments/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ShipmentItemsFields } from "@/components/shipments/shipment-items-fields";
import { supportedCurrencies } from "@/lib/currencies";
import { supportedDestinations } from "@/lib/destinations";
import { shipmentStatusLabels } from "@/lib/shipments/labels";
import { cargoCategories, cargoTypes, shipmentStatuses, type ShipmentRecord } from "@/lib/shipments/types";
import type { StaffRecord } from "@/lib/staff/types";

export function ShipmentEditForm({ shipment, staff }: { shipment: ShipmentRecord; staff: StaffRecord[] }) {
  const [category, setCategory] = useState(shipment.cargoCategory === "CBM" || shipment.cargoCategory === "PCS" ? shipment.cargoCategory : "KG");
  const basis = category === "KG" ? "weight" : category === "CBM" ? "volume" : "pieces";
  return (
    <Card><CardHeader><CardTitle>Edit shipment</CardTitle></CardHeader><CardContent>
      <form action={updateShipment} className="grid gap-4 md:grid-cols-2">
        <input type="hidden" name="shipment_id" value={shipment.id} /><input type="hidden" name="customer_id" value={shipment.customerId ?? ""} /><input type="hidden" name="charge_basis" value={basis} />
        <Field label="Customer name"><Input name="customer_name" defaultValue={shipment.customerName} required /></Field><Field label="Customer phone"><Input name="customer_phone" defaultValue={shipment.customerPhone} /></Field><Field label="Customer email"><Input name="customer_email" type="email" defaultValue={shipment.customerEmail} /></Field><Field label="Customer address"><Input name="customer_destination" defaultValue={shipment.customerDestination} /></Field>
        <Field label="Supplier"><Input name="supplier_name" defaultValue={shipment.supplierName} /></Field><Field label="Supplier phone"><Input name="supplier_phone" defaultValue={shipment.supplierPhone} /></Field><Field label="Supplier email"><Input name="supplier_email" type="email" defaultValue={shipment.supplierEmail} /></Field><Field label="Supplier location"><Input name="supplier_location" defaultValue={shipment.supplierLocation} /></Field>
        <Field label="Origin"><Input name="origin" defaultValue={shipment.origin} required /></Field><Field label="Destination"><Select name="destination" defaultValue={shipment.destination}>{supportedDestinations.map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Route"><Input name="route" defaultValue={shipment.route} /></Field><Field label="Cargo type"><Select name="cargo_type" defaultValue={shipment.cargoType}>{cargoTypes.map((item) => <option key={item}>{item}</option>)}</Select></Field>
        <Field label="Cargo category"><Select name="cargo_category" value={category} onChange={(event) => setCategory(event.target.value as "KG" | "PCS" | "CBM")}>{cargoCategories.map((item) => <option key={item}>{item}</option>)}</Select></Field><Field label="Currency"><Select name="currency" defaultValue={shipment.currency}>{supportedCurrencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</Select></Field>
        {category === "KG" ? <><NumberField name="weight_kg" label="Weight KG" value={shipment.pricing.weightKg} /><NumberField name="rate_per_kg" label="Rate per KG" value={shipment.pricing.ratePerKg} /></> : null}
        {category === "PCS" ? <><NumberField name="pieces" label="Pieces" value={shipment.pricing.pieces} /><NumberField name="rate_per_piece" label="Rate per PCS" value={shipment.pricing.ratePerPiece} /></> : null}
        {category === "CBM" ? <><NumberField name="volume_cbm" label="Volume CBM" value={shipment.pricing.volumeCbm} /><NumberField name="rate_per_cbm" label="Rate per CBM" value={shipment.pricing.ratePerCbm} /><NumberField name="length" label="Length" value={shipment.pricing.length} /><NumberField name="width" label="Width" value={shipment.pricing.width} /><NumberField name="height" label="Height" value={shipment.pricing.height} /></> : null}
        <NumberField name="handling_fee" label="Handling fee" value={shipment.pricing.handlingFee} /><NumberField name="customs_fee" label="Customs fee" value={shipment.pricing.customsFee} /><NumberField name="insurance_fee" label="Insurance fee" value={shipment.pricing.insuranceFee} /><NumberField name="discount" label="Discount" value={shipment.pricing.discount} /><NumberField name="tax" label="Tax %" value={shipment.pricing.tax} /><NumberField name="cost_amount" label="Cost amount" value={shipment.pricing.costAmount} />
        <Field label="Status"><Select name="status" defaultValue={shipment.status}>{shipmentStatuses.map((item) => <option key={item} value={item}>{shipmentStatusLabels[item]}</option>)}</Select></Field><Field label="Assigned staff"><Select name="assigned_staff_id" defaultValue={shipment.assignedStaffId ?? ""}><option value="">Unassigned</option>{staff.filter((item) => item.status === "active").map((item) => <option key={item.id} value={item.id}>{item.staffId} · {item.fullName}</option>)}</Select></Field>
        <Field label="Estimated delivery"><Input name="estimated_delivery" type="date" defaultValue={shipment.estimatedDelivery} /></Field><Field label="Actual delivery"><Input name="actual_delivery" type="date" defaultValue={shipment.actualDelivery ?? ""} /></Field><Field label="Assigned driver"><Input name="assigned_driver" defaultValue={shipment.assignedDriver} /></Field>
        <Field label="Cargo description" className="md:col-span-2"><Textarea name="cargo_description" defaultValue={shipment.cargoDescription} /></Field><Field label="Delivery notes" className="md:col-span-2"><Textarea name="delivery_notes" defaultValue={shipment.deliveryNotes} /></Field><Field label="Notes" className="md:col-span-2"><Textarea name="notes" defaultValue={shipment.notes} /></Field>
        <div className="grid gap-2 md:col-span-2">
          <Label>Shipment items</Label>
          <ShipmentItemsFields currency={shipment.currency} items={shipment.items} />
        </div>
        <Button className="md:w-fit">Save shipment changes</Button>
      </form>
    </CardContent></Card>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) { return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}</div>; }
function NumberField({ label, name, value }: { label: string; name: string; value: number }) { return <Field label={label}><Input name={name} type="number" inputMode="decimal" min="0" step="0.01" defaultValue={value} /></Field>; }
