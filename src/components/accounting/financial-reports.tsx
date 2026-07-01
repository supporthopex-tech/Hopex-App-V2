import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { AccountingData } from "@/lib/accounting/types";

export function FinancialReports({ data, from = "", to = "", currency }: { data: AccountingData; from?: string; to?: string; currency: string }) {
  const reports = [
    ["Profit and Loss", data.summary.revenue - data.summary.expenses],
    ["Balance Sheet", data.summary.cash + data.summary.receivables - data.summary.payables],
    ["Cash Flow Statement", data.summary.cash],
    ["Trial Balance", data.journals.reduce((sum, journal) => sum + journal.debitTotal, 0)],
    ["Accounts Receivable Aging", data.summary.receivables],
    ["Accounts Payable Aging", data.summary.payables],
    ["Revenue by shipment", data.summary.revenue],
    ["Expense report", data.summary.expenses],
  ];
  return (
    <div className="space-y-6">
      <div><h1 className="text-2xl font-semibold tracking-tight">Financial Reports</h1><p className="text-sm text-muted-foreground">Reports calculate from posted journal entries only.</p></div>
      <Card><CardContent className="pt-6"><form className="grid gap-3 md:grid-cols-[220px_220px_auto]"><Input type="date" name="from" defaultValue={from} /><Input type="date" name="to" defaultValue={to} /><Button>Apply date filter</Button></form></CardContent></Card>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{reports.map(([label, value]) => { const slug = encodeURIComponent(String(label).toLowerCase().replaceAll(" ", "-")); const query = new URLSearchParams({ ...(from ? { from } : {}), ...(to ? { to } : {}) }).toString(); return <Card key={label} className="border-primary/10 shadow-sm"><CardHeader><CardTitle className="text-base">{label}</CardTitle><CardDescription>Real posted transactions</CardDescription></CardHeader><CardContent className="space-y-3"><div className="text-2xl font-semibold">{new Intl.NumberFormat("en", { style: "currency", currency, minimumFractionDigits: 2 }).format(Number(value))}</div><Button asChild variant="outline" size="sm"><Link href={`/api/reports/${slug}/pdf${query ? `?${query}` : ""}`} target="_blank">Print / Download PDF</Link></Button></CardContent></Card>; })}</div>
      <Card><CardHeader><CardTitle>Trial Balance Detail</CardTitle><CardDescription>Debit and credit totals must match.</CardDescription></CardHeader><CardContent className="grid gap-2 text-sm">{data.journals.map((journal) => <div key={journal.id} className="flex justify-between gap-3 rounded-md border p-3"><span>{journal.entryNumber} · {journal.description}</span><span>{journal.debitTotal.toLocaleString()} / {journal.creditTotal.toLocaleString()}</span></div>)}</CardContent></Card>
    </div>
  );
}
