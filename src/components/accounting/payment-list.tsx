"use client";

import { useActionState } from "react";
import { createPayment } from "@/app/(app)/accounting/actions";
import { AccountingStatusBadge } from "@/components/accounting/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { PaymentRecord } from "@/lib/accounting/types";
import { supportedCurrencies } from "@/lib/currencies";

export function PaymentList({ payments, currency }: { payments: PaymentRecord[]; currency: string }) {
  const [state, action, pending] = useActionState(createPayment, { ok: true, message: "" });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Payments</h1><p className="text-sm text-muted-foreground">Receive customer payments, supplier payments, allocations, reversals, and receipts.</p></div>
      <Card><CardHeader><CardTitle>Record payment</CardTitle><CardDescription>Customer payment posts Debit Bank and Credit Accounts Receivable.</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-3 md:grid-cols-6"><Field label="Payment #" name="payment_number" /><div className="grid gap-2"><Label>Type</Label><Select name="payment_type"><option value="customer">customer</option><option value="supplier">supplier</option><option value="expense">expense</option><option value="refund">refund</option></Select></div><Field label="Invoice ID" name="invoice_id" /><Field label="Amount" name="amount" type="number" /><CurrencyField value={currency} /><Field label="Date" name="payment_date" type="date" /><Field label="Reference" name="reference" />{!state.ok ? <p className="text-sm text-destructive md:col-span-6">{state.message}</p> : null}<Button disabled={pending} className="md:w-fit">{pending ? "Posting..." : "Record payment"}</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Payment list</CardTitle><CardDescription>{payments.length} records.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table className="min-w-[900px]"><TableHeader><TableRow><TableHead>Payment</TableHead><TableHead>Type</TableHead><TableHead>Party</TableHead><TableHead>Method</TableHead><TableHead>Date</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Reference</TableHead></TableRow></TableHeader><TableBody>{payments.map((payment) => <TableRow key={payment.id}><TableCell className="font-mono text-xs">{payment.paymentNumber}</TableCell><TableCell>{payment.paymentType}</TableCell><TableCell>{payment.customerName || payment.supplierName || "-"}</TableCell><TableCell>{payment.paymentMethod}</TableCell><TableCell>{payment.paymentDate}</TableCell><TableCell><AccountingStatusBadge status={payment.status} /></TableCell><TableCell>{payment.currency} {payment.amount.toLocaleString()}</TableCell><TableCell>{payment.reference}</TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
    </div>
  );
}

function Field({ label, name, type = "text" }: { label: string; name: string; type?: string }) {
  const numberProps = type === "number" ? { inputMode: "decimal" as const, min: "0", step: "0.01" } : {};
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} type={type} {...numberProps} /></div>;
}

function CurrencyField({ value }: { value: string }) {
  return (
    <div className="grid gap-2">
      <Label>Currency</Label>
      <Select name="currency" defaultValue={value}>
        {supportedCurrencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </Select>
    </div>
  );
}
