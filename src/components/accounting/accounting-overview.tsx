import Link from "next/link";
import { AlertTriangle, Bot, Landmark, Plus, ReceiptText } from "lucide-react";
import { createChartAccount, createManualJournalEntry, postJournalEntry } from "@/app/(app)/accounting/actions";
import { AccountingStatusBadge } from "@/components/accounting/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { accountTypes, type AccountingData } from "@/lib/accounting/types";
import { supportedCurrencies } from "@/lib/currencies";
import { formatCurrency } from "@/lib/utils";

export function AccountingOverview({ data, currency }: { data: AccountingData; currency: string }) {
  const kpis = [
    ["Revenue", data.summary.revenue],
    ["Expenses", data.summary.expenses],
    ["Profit", data.summary.profit],
    ["Receivables", data.summary.receivables],
    ["Payables", data.summary.payables],
    ["Cash & Bank", data.summary.cash],
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">ERP Accounting</h1>
          <p className="text-sm text-muted-foreground">Double-entry bookkeeping, ledgers, invoices, payments, expenses, and reports.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/invoices"><Plus className="h-4 w-4" />Create Invoice</Link></Button>
          <Button asChild variant="outline"><Link href="/payments"><Landmark className="h-4 w-4" />Receive Payment</Link></Button>
          <Button asChild variant="outline"><Link href="/expenses"><ReceiptText className="h-4 w-4" />Record Expense</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-6">
        {kpis.map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2">
              <CardDescription>{label}</CardDescription>
              <CardTitle className="text-xl">{formatCurrency(Number(value), currency)}</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {[
          ["Invoices", "/invoices"], ["Payments", "/payments"], ["Expenses", "/expenses"], ["Revenue", "/api/reports/revenue-by-shipment/pdf"], ["Profit & Loss", "/api/reports/profit-and-loss/pdf"],
          ["Balance Sheet", "/api/reports/balance-sheet/pdf"], ["Cash Flow", "/api/reports/cash-flow-statement/pdf"], ["Trial Balance", "/api/reports/trial-balance/pdf"], ["A/R Aging", "/api/reports/accounts-receivable-aging/pdf"], ["Reports", "/reports"],
        ].map(([label, href]) => <Button key={label} asChild variant="outline" className="h-auto justify-start py-3"><Link href={href}>{label}</Link></Button>)}
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-3">
        <Card className="min-w-0 xl:col-span-2">
          <CardHeader>
            <CardTitle>General Ledger</CardTitle>
            <CardDescription>Draft entries can be posted only when total debit equals total credit.</CardDescription>
          </CardHeader>
          <CardContent className="min-w-0">
            <div className="max-w-full overflow-x-auto">
              <Table className="min-w-[940px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Entry</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Debit</TableHead>
                    <TableHead>Credit</TableHead>
                    <TableHead>Reference</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.journals.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell>{journal.entryDate}</TableCell>
                      <TableCell className="font-mono text-xs">{journal.entryNumber}</TableCell>
                      <TableCell>{journal.description}</TableCell>
                      <TableCell><AccountingStatusBadge status={journal.status} /></TableCell>
                      <TableCell>{journal.debitTotal.toLocaleString()}</TableCell>
                      <TableCell>{journal.creditTotal.toLocaleString()}</TableCell>
                      <TableCell>{journal.referenceModule}</TableCell>
                      <TableCell className="text-right">
                        {journal.status === "draft" ? (
                          <form action={postJournalEntry}>
                            <input type="hidden" name="journal_id" value={journal.id} />
                            <Button size="sm" variant="outline">Post</Button>
                          </form>
                        ) : "Posted"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Bot className="h-4 w-4" />Accounting checks</CardTitle>
            <CardDescription>Double-entry health checks and alerts.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <Check label="Unbalanced posted entries" value={String(data.summary.unbalancedEntries)} danger={data.summary.unbalancedEntries > 0} />
            <Check label="Overdue invoice alerts" value={String(data.invoices.filter((invoice) => invoice.status === "overdue").length)} />
            <Check label="VAT payable" value={data.summary.vatPayable.toLocaleString()} />
            <Check label="Cash flow suggestion" value={data.summary.cash < data.summary.payables ? "Review payables timing" : "Healthy"} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1.35fr]">
        <Card>
          <CardHeader>
            <CardTitle>Open chart account</CardTitle>
            <CardDescription>User can open new chart accounts for daily accounting.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createChartAccount} className="grid gap-3 sm:grid-cols-2">
              <Field label="Account code" name="account_code" required />
              <Field label="Account name" name="account_name" required />
              <div className="grid gap-2">
                <Label>Account type</Label>
                <Select name="account_type">
                  {accountTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                </Select>
              </div>
              <Button className="sm:self-end">Create account</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Manual journal entry</CardTitle>
            <CardDescription>Every journal must have at least one debit and one credit with equal totals.</CardDescription>
          </CardHeader>
          <CardContent>
            <form action={createManualJournalEntry} className="grid gap-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Entry date" name="entry_date" type="date" />
                <CurrencyField />
                <Field label="Description" name="description" required />
              </div>
              <div className="overflow-x-auto">
                <Table className="min-w-[780px]">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Account</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Debit</TableHead>
                      <TableHead>Credit</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {[1, 2, 3, 4].map((index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <Select name={`account_id_${index}`}>
                            <option value="">Select account</option>
                            {data.accounts.map((account) => <option key={account.id} value={account.id}>{account.code} · {account.name}</option>)}
                          </Select>
                        </TableCell>
                        <TableCell><Input name={`line_description_${index}`} /></TableCell>
                        <TableCell><Input name={`debit_${index}`} type="number" inputMode="decimal" step="0.01" min="0" /></TableCell>
                        <TableCell><Input name={`credit_${index}`} type="number" inputMode="decimal" step="0.01" min="0" /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button name="intent" value="draft" variant="outline">Save draft</Button>
                <Button name="intent" value="post">Save & post</Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Chart of Accounts</CardTitle>
          <CardDescription>Balances are calculated from journal entry lines by normal debit/credit balance.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {data.accounts.map((account) => (
              <div key={account.id} className="rounded-md border p-3">
                <div className="flex justify-between gap-3">
                  <p className="font-medium">{account.code} · {account.name}</p>
                  <span className="text-xs text-muted-foreground">{account.type}</span>
                </div>
                <p className="mt-2 text-lg font-semibold">{account.balance.toLocaleString()}</p>
                <p className="text-xs text-muted-foreground">Normal {account.normalBalance}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function Check({ label, value, danger }: { label: string; value: string; danger?: boolean }) {
  return <div className="flex items-center justify-between gap-3 rounded-md border p-3"><span className="flex items-center gap-2">{danger ? <AlertTriangle className="h-4 w-4 text-destructive" /> : null}{label}</span><span className="font-medium">{value}</span></div>;
}

function Field({ label, name, type = "text", required }: { label: string; name: string; type?: string; required?: boolean }) {
  const numberProps = type === "number" ? { inputMode: "decimal" as const, min: "0", step: "0.01" } : {};
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} type={type} required={required} {...numberProps} /></div>;
}

function CurrencyField() {
  return (
    <div className="grid gap-2">
      <Label>Currency</Label>
      <Select name="currency" defaultValue="TZS">
        {supportedCurrencies.map((item) => <option key={item.code} value={item.code}>{item.label}</option>)}
      </Select>
    </div>
  );
}
