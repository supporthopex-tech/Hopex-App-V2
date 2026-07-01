"use client";

import { useActionState } from "react";
import { createQuoteRequest } from "@/app/(app)/quotes/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supportedCurrencies } from "@/lib/currencies";
import { supportedDestinations } from "@/lib/destinations";

export function QuoteForm({ currency }: { currency: string }) {
  const [state, formAction, pending] = useActionState(createQuoteRequest, { ok: true, message: "" });
  return (
    <form action={formAction} className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Create quote request</h1><p className="text-sm text-muted-foreground">Capture customer cargo requirements and pricing details.</p></div>
      <Card><CardHeader><CardTitle>Quote details</CardTitle><CardDescription>Customer, route, cargo, and amount.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Customer name" name="customer_name" required /><Field label="Customer phone" name="customer_phone" /><Field label="Customer email" name="customer_email" type="email" />
        <Field label="Origin" name="origin" /><DestinationField /><Field label="Cargo type" name="cargo_type" />
        <Field label="Estimated weight" name="estimated_weight" type="number" /><Field label="Estimated pieces" name="estimated_pieces" type="number" /><Field label="Estimated volume" name="estimated_volume" type="number" />
        <Field label="Requested date" name="requested_date" type="date" /><Field label="Quoted amount" name="quoted_amount" type="number" />
        <div className="grid gap-2"><Label>Currency</Label><Select name="currency" defaultValue={currency}>{supportedCurrencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}</Select></div>
        <div className="grid gap-2"><Label>Status</Label><Select name="status" defaultValue="new"><option value="new">new</option><option value="contacted">contacted</option><option value="quoted">quoted</option></Select></div>
        <div className="grid gap-2 md:col-span-2"><Label>Cargo description</Label><Textarea name="cargo_description" /></div>
        <div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" /></div>
        {!state.ok ? <p className="text-sm text-destructive md:col-span-2">{state.message}</p> : null}
      </CardContent></Card>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4"><Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create quote"}</Button></div>
    </form>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  const numberProps = type === "number" ? { inputMode: "decimal" as const, min: "0", step: "0.01" } : {};
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} type={type} required={required} {...numberProps} /></div>;
}

function DestinationField() {
  return (
    <div className="grid gap-2">
      <Label>Destination</Label>
      <Select name="destination">
        {supportedDestinations.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
      </Select>
    </div>
  );
}
