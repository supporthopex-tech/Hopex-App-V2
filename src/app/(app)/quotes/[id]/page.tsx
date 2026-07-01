import { notFound } from "next/navigation";
import { updateQuoteRequest } from "@/app/(app)/quotes/actions";
import { QuoteActions } from "@/components/operations/quote-actions";
import { StatusBadge } from "@/components/operations/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supportedDestinations } from "@/lib/destinations";
import { getQuoteRequest } from "@/lib/operations/service";

export default async function QuoteDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const quote = await getQuoteRequest(id);
  if (!quote) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">{quote.customerName}</h1><p className="text-sm text-muted-foreground">{quote.origin} to {quote.destination}</p></div><QuoteActions quote={quote} /></div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><StatusBadge status={quote.status} /><p className="mt-3 text-2xl font-semibold">{quote.currency} {quote.quotedAmount.toLocaleString()}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Customer</CardTitle></CardHeader><CardContent className="text-sm"><p>{quote.customerPhone}</p><p className="text-muted-foreground">{quote.customerEmail}</p></CardContent></Card>
        <Card><CardHeader><CardTitle>Cargo</CardTitle></CardHeader><CardContent className="text-sm"><p>{quote.cargoType}</p><p className="text-muted-foreground">{quote.estimatedWeight} kg · {quote.estimatedPieces} pcs · {quote.estimatedVolume} cbm</p></CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Quote request</CardTitle></CardHeader><CardContent className="space-y-3 text-sm"><p>{quote.cargoDescription}</p><p className="text-muted-foreground">{quote.notes || "No notes."}</p></CardContent></Card>
      {query.mode === "edit" ? (
        <Card><CardHeader><CardTitle>Edit quote request</CardTitle></CardHeader><CardContent><form action={updateQuoteRequest} className="grid gap-4 md:grid-cols-2"><input type="hidden" name="quote_id" value={quote.id} /><Field label="Customer" name="customer_name" value={quote.customerName} /><Field label="Phone" name="customer_phone" value={quote.customerPhone} /><Field label="Email" name="customer_email" value={quote.customerEmail} /><Field label="Origin" name="origin" value={quote.origin} /><DestinationField value={quote.destination} /><Field label="Cargo type" name="cargo_type" value={quote.cargoType} /><Field label="Amount" name="quoted_amount" value={String(quote.quotedAmount)} type="number" /><div className="grid gap-2 md:col-span-2"><Label>Cargo description</Label><Textarea name="cargo_description" defaultValue={quote.cargoDescription} /></div><div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" defaultValue={quote.notes} /></div><Button className="md:w-fit">Save changes</Button></form></CardContent></Card>
      ) : null}
    </div>
  );
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value: string; type?: string }) {
  const numberProps = type === "number" ? { inputMode: "decimal" as const, min: "0", step: "0.01" } : {};
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} defaultValue={value} type={type} {...numberProps} /></div>;
}

function DestinationField({ value }: { value: string }) {
  return (
    <div className="grid gap-2">
      <Label>Destination</Label>
      <Select name="destination" defaultValue={value}>
        {supportedDestinations.map((destination) => <option key={destination} value={destination}>{destination}</option>)}
      </Select>
    </div>
  );
}
