"use client";

import { useActionState } from "react";
import { createCustomer } from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export function CustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomer, { ok: true, message: "" });
  return (
    <form action={formAction} className="mx-auto max-w-4xl space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Create customer</h1><p className="text-sm text-muted-foreground">Add customer profile and communication details.</p></div>
      <Card><CardHeader><CardTitle>Customer details</CardTitle><CardDescription>Profile, location, type, and status.</CardDescription></CardHeader><CardContent className="grid gap-4 md:grid-cols-2">
        <Field label="Full name" name="full_name" required /><Field label="Company name" name="company_name" required /><Field label="Phone" name="phone" /><Field label="Email" name="email" type="email" />
        <Field label="Address" name="address" /><Field label="City" name="city" /><Field label="Country" name="country" />
        <div className="grid gap-2"><Label>Customer type</Label><Select name="customer_type"><option value="standard">standard</option><option value="corporate">corporate</option><option value="agent">agent</option></Select></div>
        <div className="grid gap-2"><Label>Status</Label><Select name="status"><option value="active">active</option><option value="inactive">inactive</option><option value="blocked">blocked</option></Select></div>
        <label className="flex items-center gap-2 rounded-md border p-3 text-sm"><input type="checkbox" name="is_vip" className="h-4 w-4" /> Mark as VIP</label>
        <div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" /></div>
        {!state.ok ? <p className="text-sm text-destructive md:col-span-2">{state.message}</p> : null}
      </CardContent></Card>
      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4"><Button type="submit" disabled={pending}>{pending ? "Creating..." : "Create customer"}</Button></div>
    </form>
  );
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} type={type} required={required} /></div>;
}
