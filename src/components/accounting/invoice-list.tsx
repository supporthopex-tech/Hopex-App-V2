"use client";

import type { ReactNode } from "react";
import { useActionState } from "react";
import { postInvoice, createInvoice, updateInvoice } from "@/app/(app)/accounting/actions";
import { AccountingStatusBadge } from "@/components/accounting/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { invoiceStatuses, type InvoiceRecord, type InvoiceShipmentOption } from "@/lib/accounting/types";
import { supportedCurrencies } from "@/lib/currencies";

export function InvoiceList({
  invoices,
  currency,
  shipmentOptions,
}: {
  invoices: InvoiceRecord[];
  currency: string;
  shipmentOptions: InvoiceShipmentOption[];
}) {
  const [state, action, pending] = useActionState(createInvoice, { ok: true, message: "" });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Invoices</h1><p className="text-sm text-muted-foreground">Create, post, send, mark paid, and track customer balances.</p></div>
      <Card>
        <CardHeader>
          <CardTitle>Create invoice</CardTitle>
          <CardDescription>Select a shipment number to auto-fill shipment/customer links, or enter amounts manually.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={action} className="grid gap-3 md:grid-cols-6">
            <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">Invoice # auto-generated.</div>
            <SelectField label="Shipment no" name="shipment_id" className="md:col-span-2">
              <option value="">Manual invoice</option>
              {shipmentOptions.map((shipment) => (
                <option key={shipment.id} value={shipment.id}>
                  {shipment.trackingNumber} · {shipment.customerName || "Customer"} · {shipment.currency} {shipment.totalAmount.toLocaleString()}
                </option>
              ))}
            </SelectField>
            <Field label="Issue date" name="issue_date" type="date" />
            <Field label="Due date" name="due_date" type="date" />
            <CurrencyField value={currency} />
            <Field label="Description" name="description" className="md:col-span-2" />
            <Field label="Qty" name="quantity" type="number" defaultValue="1" />
            <Field label="Rate" name="rate" type="number" />
            <Field label="Subtotal" name="subtotal" type="number" />
            <Field label="Tax" name="tax_amount" type="number" />
            <Field label="Discount" name="discount_amount" type="number" />
            {shipmentOptions.length === 0 ? <p className="text-sm text-muted-foreground md:col-span-6">No shipments found yet. Create a shipment first, or create a manual invoice.</p> : null}
            {!state.ok ? <p className="text-sm text-destructive md:col-span-6">{state.message}</p> : null}
            <Button disabled={pending} className="md:w-fit">{pending ? "Creating..." : "Create invoice"}</Button>
          </form>
        </CardContent>
      </Card>
      <Card><CardHeader><CardTitle>Invoice list</CardTitle><CardDescription>{invoices.length} records.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table className="min-w-[1050px]"><TableHeader><TableRow><TableHead>Invoice</TableHead><TableHead>Customer</TableHead><TableHead>Dates</TableHead><TableHead>Status</TableHead><TableHead>Total</TableHead><TableHead>Paid</TableHead><TableHead>Balance</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{invoices.map((invoice) => <InvoiceRow key={invoice.id} invoice={invoice} />)}</TableBody></Table></div></CardContent></Card>
    </div>
  );
}

function InvoiceRow({ invoice }: { invoice: InvoiceRecord }) {
  return (
    <>
      <TableRow>
        <TableCell className="font-mono text-xs">{invoice.invoiceNumber}</TableCell>
        <TableCell>{invoice.customerName}</TableCell>
        <TableCell>{invoice.issueDate}<p className="text-xs text-muted-foreground">Due {invoice.dueDate || "-"}</p></TableCell>
        <TableCell><AccountingStatusBadge status={invoice.status} /></TableCell>
        <TableCell>{invoice.currency} {invoice.totalAmount.toLocaleString()}</TableCell>
        <TableCell>{invoice.paidAmount.toLocaleString()}</TableCell>
        <TableCell>{invoice.balanceDue.toLocaleString()}</TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end gap-2">
            <details className="text-left">
              <summary className="cursor-pointer rounded-md px-2 py-1 text-xs font-medium hover:bg-muted">Edit</summary>
              <div className="absolute right-6 z-20 mt-2 w-[min(760px,calc(100vw-3rem))] rounded-lg border bg-card p-4 shadow-xl">
                <EditInvoiceForm invoice={invoice} />
              </div>
            </details>
            <form action={postInvoice}>
              <input type="hidden" name="invoice_id" value={invoice.id} />
              <Button variant="ghost" size="sm">Post</Button>
            </form>
          </div>
        </TableCell>
      </TableRow>
    </>
  );
}

function EditInvoiceForm({ invoice }: { invoice: InvoiceRecord }) {
  return (
    <form action={updateInvoice} className="grid gap-3 md:grid-cols-4">
      <input type="hidden" name="invoice_id" value={invoice.id} />
      <p className="font-semibold md:col-span-4">Edit {invoice.invoiceNumber}</p>
      <Field label="Issue date" name="issue_date" type="date" defaultValue={invoice.issueDate} />
      <Field label="Due date" name="due_date" type="date" defaultValue={invoice.dueDate} />
      <CurrencyField value={invoice.currency} />
      <SelectField label="Status" name="status" defaultValue={invoice.status}>
        {invoiceStatuses.map((status) => <option key={status} value={status}>{status}</option>)}
      </SelectField>
      <Field label="Subtotal" name="subtotal" type="number" defaultValue={String(invoice.subtotal)} />
      <Field label="Tax" name="tax_amount" type="number" defaultValue={String(invoice.taxAmount)} />
      <Field label="Discount" name="discount_amount" type="number" defaultValue={String(invoice.discountAmount)} />
      <Field label="Paid" name="paid_amount" type="number" defaultValue={String(invoice.paidAmount)} />
      <Button className="md:w-fit">Save invoice</Button>
    </form>
  );
}

function Field({ label, name, type = "text", defaultValue = "", className = "" }: { label: string; name: string; type?: string; defaultValue?: string; className?: string }) {
  const numberProps = type === "number" ? { inputMode: "decimal" as const, min: "0", step: "0.01" } : {};
  return <div className={`grid gap-2 ${className}`}><Label>{label}</Label><Input name={name} type={type} defaultValue={defaultValue} {...numberProps} /></div>;
}

function SelectField({ label, name, children, className = "", defaultValue }: { label: string; name: string; children: ReactNode; className?: string; defaultValue?: string }) {
  return <div className={`grid gap-2 ${className}`}><Label>{label}</Label><Select name={name} defaultValue={defaultValue}>{children}</Select></div>;
}

function CurrencyField({ value }: { value: string }) {
  return (
    <SelectField label="Currency" name="currency" defaultValue={value}>
      {supportedCurrencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
    </SelectField>
  );
}
