"use client";

import { useActionState, useState } from "react";
import { Save, Upload } from "lucide-react";
import { createShipment } from "@/app/(app)/shipments/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { PricingPreview } from "@/components/shipments/pricing-preview";
import { supportedCurrencies } from "@/lib/currencies";
import { supportedDestinations } from "@/lib/destinations";
import type { CustomerRecord } from "@/lib/operations/types";
import type { StaffRecord } from "@/lib/staff/types";
import { cargoCategories, cargoTypes, shipmentStatuses } from "@/lib/shipments/types";
import { shipmentStatusLabels } from "@/lib/shipments/labels";

const initialState = { ok: true, message: "" };
type ChargeBasis = "pieces" | "weight" | "volume";

export function ShipmentForm({
  currency,
  trackingPrefix,
  customers,
  staff,
}: {
  currency: string;
  trackingPrefix: string;
  customers: CustomerRecord[];
  staff: StaffRecord[];
}) {
  const [state, action, pending] = useActionState(createShipment, initialState);
  const [pricing, setPricing] = useState({
    useBalanceWeight: false,
    usePieces: true,
    useVolume: false,
    weightKg: 0,
    pieces: 0,
    volumeCbm: 0,
    length: 0,
    width: 0,
    height: 0,
    ratePerKg: 0,
    ratePerCbm: 0,
    ratePerPiece: 0,
    handlingFee: 0,
    customsFee: 0,
    insuranceFee: 0,
    discount: 0,
    tax: 0,
    costAmount: 0,
  });
  const [chargeBasis, setChargeBasis] = useState<ChargeBasis>("pieces");

  function updateChargeBasis(value: ChargeBasis) {
    setChargeBasis(value);
    setPricing((current) => ({
      ...current,
      useBalanceWeight: value === "weight",
      usePieces: value === "pieces",
      useVolume: value === "volume",
    }));
  }

  function numeric(name: keyof typeof pricing) {
    return {
      value: pricing[name] as number,
      onChange: (event: React.ChangeEvent<HTMLInputElement>) =>
        setPricing((current) => ({ ...current, [name]: Number(event.target.value) })),
      inputMode: "decimal" as const,
    };
  }

  return (
    <form action={action} className="space-y-6">
      {!state.ok ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.message}</div> : null}

      <Card>
        <CardHeader>
          <CardTitle>Tracking information</CardTitle>
          <CardDescription>Tracking number, reference, barcode, and QR code.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Tracking number">
            <Input value={`Auto-generated as ${trackingPrefix.toUpperCase()}-YYYY-#####`} readOnly />
          </Field>
          <Field label="Reference number"><Input name="reference_number" placeholder="Optional reference" /></Field>
          <Field label="Barcode"><Input value="Auto-generated from tracking number" readOnly /></Field>
          <Field label="QR code"><Input value="/track/{tracking-number}" readOnly /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Cargo parties</CardTitle>
          <CardDescription>Supplier, customer, and destination details.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Existing customer selector">
            <Select name="customer_id">
              <option value="">Auto-save from details below</option>
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.companyName || customer.fullName} {customer.phone ? `(${customer.phone})` : ""}
                </option>
              ))}
            </Select>
          </Field>
          <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
            New customer details are saved automatically into Customers after shipment creation.
          </div>
          <Field label="Received from / Supplier"><Input name="supplier_name" required /></Field>
          <Field label="Supplier phone"><Input name="supplier_phone" /></Field>
          <Field label="Supplier email"><Input name="supplier_email" type="email" /></Field>
          <Field label="Supplier location"><Input name="supplier_location" /></Field>
          <Field label="Going to / Customer"><Input name="customer_name" required /></Field>
          <Field label="Customer phone"><Input name="customer_phone" /></Field>
          <Field label="Customer email"><Input name="customer_email" type="email" /></Field>
          <Field label="Customer destination"><Input name="customer_destination" /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Shipment details</CardTitle>
          <CardDescription>Route, cargo type, category, and currency.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Origin"><Input name="origin" required /></Field>
          <Field label="Destination">
            <Select name="destination" required>
              {supportedDestinations.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
            </Select>
          </Field>
          <Field label="Route"><Input name="route" placeholder="Dubai -> Dar es Salaam" /></Field>
          <Field label="Cargo type">
            <Select name="cargo_type">{cargoTypes.map((type) => <option key={type}>{type}</option>)}</Select>
          </Field>
          <Field label="Cargo category">
            <Select name="cargo_category" value={categoryFromBasis(chargeBasis)} onChange={(event) => updateChargeBasis(basisFromCategory(event.target.value))} required>
              {cargoCategories.map((category) => <option key={category} value={category}>{category}</option>)}
            </Select>
          </Field>
          <Field label="Currency">
            <Select name="currency" defaultValue={currency}>
              {supportedCurrencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
            </Select>
          </Field>
          <Field label="Cargo description" className="md:col-span-2"><Textarea name="cargo_description" /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pricing configuration</CardTitle>
          <CardDescription>Calculates volumetric weight, chargeable weight, subtotal, tax, total, and margin.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
          <div className="grid gap-4 md:grid-cols-3">
            <input type="hidden" name="charge_basis" value={chargeBasis} />
            {pricing.useBalanceWeight ? <input type="hidden" name="use_balance_weight" value="on" /> : null}
            {pricing.usePieces ? <input type="hidden" name="use_pieces" value="on" /> : null}
            {pricing.useVolume ? <input type="hidden" name="use_volume" value="on" /> : null}
            {chargeBasis === "weight" ? <>
              <Field label="Weight KG"><Input name="weight_kg" type="number" min="0" step="0.01" required {...numeric("weightKg")} /></Field>
              <Field label="Rate per KG"><Input name="rate_per_kg" type="number" min="0" step="0.01" required {...numeric("ratePerKg")} /></Field>
            </> : null}
            {chargeBasis === "pieces" ? <>
              <Field label="Pieces"><Input name="pieces" type="number" min="1" required {...numeric("pieces")} /></Field>
              <Field label="Rate per PCS"><Input name="rate_per_piece" type="number" min="0" step="0.01" required {...numeric("ratePerPiece")} /></Field>
            </> : null}
            {chargeBasis === "volume" ? <>
              <Field label="Volume CBM"><Input name="volume_cbm" type="number" min="0" step="0.001" required {...numeric("volumeCbm")} /></Field>
              <Field label="Rate per CBM"><Input name="rate_per_cbm" type="number" min="0" step="0.01" required {...numeric("ratePerCbm")} /></Field>
              <Field label="Length (cm)"><Input name="length" type="number" min="0" step="0.01" {...numeric("length")} /></Field>
              <Field label="Width (cm)"><Input name="width" type="number" min="0" step="0.01" {...numeric("width")} /></Field>
              <Field label="Height (cm)"><Input name="height" type="number" min="0" step="0.01" {...numeric("height")} /></Field>
            </> : null}
            <Field label="Handling fee"><Input name="handling_fee" type="number" min="0" step="0.01" {...numeric("handlingFee")} /></Field>
            <Field label="Customs fee"><Input name="customs_fee" type="number" min="0" step="0.01" {...numeric("customsFee")} /></Field>
            <Field label="Insurance fee"><Input name="insurance_fee" type="number" min="0" step="0.01" {...numeric("insuranceFee")} /></Field>
            <Field label="Discount"><Input name="discount" type="number" min="0" step="0.01" {...numeric("discount")} /></Field>
            <Field label="Tax %"><Input name="tax" type="number" min="0" step="0.01" {...numeric("tax")} /></Field>
            <Field label="Cost amount"><Input name="cost_amount" type="number" min="0" step="0.01" {...numeric("costAmount")} /></Field>
          </div>
          <PricingPreview input={pricing} currency={currency} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Delivery information</CardTitle>
          <CardDescription>Status, dates, staff, driver, receiver, and delivery notes.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Shipment status"><Select name="status">{shipmentStatuses.map((status) => <option key={status} value={status}>{shipmentStatusLabels[status]}</option>)}</Select></Field>
          <Field label="Estimated delivery date"><Input name="estimated_delivery" type="date" /></Field>
          <Field label="Actual delivery date"><Input name="actual_delivery" type="date" /></Field>
          <Field label="Assigned staff"><Select name="assigned_staff_id"><option value="">Unassigned</option>{staff.filter((member) => member.status === "active").map((member) => <option key={member.id} value={member.id}>{member.staffId} · {member.fullName}</option>)}</Select></Field>
          <Field label="Assigned driver"><Input name="assigned_driver" /></Field>
          <Field label="Receiver name"><Input name="receiver_name" /></Field>
          <Field label="Receiver signature"><Input name="receiver_signature" type="file" /></Field>
          <Field label="Delivery notes" className="md:col-span-2"><Textarea name="delivery_notes" /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Notes and attachments</CardTitle>
          <CardDescription>Files are stored in Supabase Storage when connected.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Notes" className="md:col-span-2"><Textarea name="notes" /></Field>
          <FileField name="cargo_images" label="Cargo images" />
          <FileField name="invoice_documents" label="Invoice documents" />
          <FileField name="packing_list" label="Packing list" />
          <FileField name="bill_of_lading" label="Bill of lading" />
          <FileField name="customs_documents" label="Customs documents" />
          <FileField name="other_files" label="Other files" />
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline">Save draft</Button>
        <Button disabled={pending}><Save className="h-4 w-4" />{pending ? "Creating..." : "Create Shipment"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}</div>;
}

function FileField({ name, label }: { name: string; label: string }) {
  return (
    <Field label={label}>
      <label className="flex min-h-20 cursor-pointer items-center justify-center gap-2 rounded-md border border-dashed text-sm text-muted-foreground">
        <Upload className="h-4 w-4" />
        <span>Upload {label.toLowerCase()}</span>
        <Input name={name} type="file" className="sr-only" multiple />
      </label>
    </Field>
  );
}

function categoryFromBasis(value: ChargeBasis) {
  return value === "weight" ? "KG" : value === "volume" ? "CBM" : "PCS";
}

function basisFromCategory(value: string): ChargeBasis {
  return value === "KG" ? "weight" : value === "CBM" ? "volume" : "pieces";
}
