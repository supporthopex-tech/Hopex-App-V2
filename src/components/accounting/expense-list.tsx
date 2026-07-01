"use client";

import { useActionState } from "react";
import { approveExpense, createExpense, payExpense } from "@/app/(app)/accounting/actions";
import { AccountingStatusBadge } from "@/components/accounting/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { ExpenseRecord } from "@/lib/accounting/types";
import { supportedCurrencies } from "@/lib/currencies";

export function ExpenseList({ expenses, currency }: { expenses: ExpenseRecord[]; currency: string }) {
  const [state, action, pending] = useActionState(createExpense, { ok: true, message: "" });
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Expenses</h1><p className="text-sm text-muted-foreground">Record, approve, pay, categorize, and attach expense receipts.</p></div>
      <Card><CardHeader><CardTitle>Create expense</CardTitle><CardDescription>Paid expenses post Debit Expense and Credit Bank.</CardDescription></CardHeader><CardContent><form action={action} className="grid gap-3 md:grid-cols-6"><Field label="Expense #" name="expense_number" /><Field label="Vendor" name="vendor" /><Field label="Category" name="category" /><Field label="Amount" name="amount" type="number" /><Field label="Tax" name="tax_amount" type="number" /><CurrencyField value={currency} /><Field label="Description" name="description" />{!state.ok ? <p className="text-sm text-destructive md:col-span-6">{state.message}</p> : null}<Button disabled={pending} className="md:w-fit">{pending ? "Creating..." : "Create expense"}</Button></form></CardContent></Card>
      <Card><CardHeader><CardTitle>Expense list</CardTitle><CardDescription>{expenses.length} records.</CardDescription></CardHeader><CardContent><div className="overflow-x-auto"><Table className="min-w-[900px]"><TableHeader><TableRow><TableHead>Expense</TableHead><TableHead>Vendor</TableHead><TableHead>Category</TableHead><TableHead>Status</TableHead><TableHead>Amount</TableHead><TableHead>Tax</TableHead><TableHead>Total</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{expenses.map((expense) => <TableRow key={expense.id}><TableCell className="font-mono text-xs">{expense.expenseNumber}</TableCell><TableCell>{expense.vendor}</TableCell><TableCell>{expense.category}</TableCell><TableCell><AccountingStatusBadge status={expense.status} /></TableCell><TableCell>{expense.amount.toLocaleString()}</TableCell><TableCell>{expense.taxAmount.toLocaleString()}</TableCell><TableCell>{expense.currency} {expense.totalAmount.toLocaleString()}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1"><form action={approveExpense}><input type="hidden" name="expense_id" value={expense.id} /><Button variant="ghost" size="sm">Approve</Button></form><form action={payExpense}><input type="hidden" name="expense_id" value={expense.id} /><Button variant="ghost" size="sm">Pay</Button></form></div></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
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
