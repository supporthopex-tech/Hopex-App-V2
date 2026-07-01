import Link from "next/link";
import { FileDown, MailCheck, Plus, Search } from "lucide-react";
import { QuoteActions } from "@/components/operations/quote-actions";
import { StatusBadge } from "@/components/operations/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { countByStatus } from "@/lib/operations/service";
import { quoteStatuses, type ListFilters, type QuoteRequestRecord } from "@/lib/operations/types";

export function QuotesList({ quotes, filters }: { quotes: QuoteRequestRecord[]; filters: ListFilters }) {
  const tabs = countByStatus(quotes, quoteStatuses);
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Quote Requests</h1><p className="text-sm text-muted-foreground">{quotes.length} total quote requests</p></div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/quotes/new"><Plus className="h-4 w-4" />Add Quote</Link></Button>
          <Button asChild variant="outline"><Link href="/quotes?status=new"><MailCheck className="h-4 w-4" />New requests</Link></Button>
          <Button asChild variant="outline"><Link href="/api/quotes/export"><FileDown className="h-4 w-4" />Export</Link></Button>
        </div>
      </div>
      <Card><CardContent className="space-y-4 pt-6">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => <Button key={tab.value} asChild variant={(filters.status ?? "all") === tab.value ? "default" : "outline"} size="sm"><Link href={`/quotes?status=${tab.value}`}>{tab.label} <span className="ml-1 opacity-70">{tab.count}</span></Link></Button>)}
        </div>
        <form className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" name="search" defaultValue={filters.search} placeholder="Search by customer, phone, route, or cargo..." />
        </form>
      </CardContent></Card>
      <Card><CardContent className="pt-6">
        {quotes.length === 0 ? <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No quote requests found.</div> : (
          <>
            <div className="grid gap-3 lg:hidden">{quotes.map((quote) => <div key={quote.id} className="rounded-lg border bg-background p-4"><div className="flex justify-between gap-3"><div><p className="font-semibold">{quote.customerName}</p><p className="text-sm text-muted-foreground">{quote.origin} to {quote.destination}</p></div><StatusBadge status={quote.status} /></div><p className="mt-3 text-sm">{quote.cargoDescription}</p><div className="mt-3 text-sm font-medium">{quote.currency} {quote.quotedAmount.toLocaleString()}</div><div className="mt-4 border-t pt-3"><QuoteActions quote={quote} /></div></div>)}</div>
            <div className="hidden overflow-x-auto lg:block"><Table className="min-w-[1000px]"><TableHeader><TableRow><TableHead>Customer</TableHead><TableHead>Route</TableHead><TableHead>Cargo</TableHead><TableHead>Status</TableHead><TableHead>Requested</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>{quotes.map((quote) => <TableRow key={quote.id}><TableCell><p className="font-medium">{quote.customerName}</p><p className="text-xs text-muted-foreground">{quote.customerPhone} · {quote.customerEmail}</p></TableCell><TableCell>{quote.origin} to {quote.destination}</TableCell><TableCell>{quote.cargoType}<p className="text-xs text-muted-foreground">{quote.cargoDescription}</p></TableCell><TableCell><StatusBadge status={quote.status} /></TableCell><TableCell>{quote.requestedDate || "-"}</TableCell><TableCell>{quote.currency} {quote.quotedAmount.toLocaleString()}</TableCell><TableCell className="text-right"><QuoteActions quote={quote} /></TableCell></TableRow>)}</TableBody></Table></div>
          </>
        )}
      </CardContent></Card>
    </div>
  );
}
