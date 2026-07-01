"use client";

import Link from "next/link";
import { CheckCircle2, Edit, Eye, FileText, Mail, MessageCircle, PackagePlus, Send, Trash2, XCircle } from "lucide-react";
import { convertQuoteToShipment, deleteQuoteRequest, updateQuoteStatus } from "@/app/(app)/quotes/actions";
import { Button } from "@/components/ui/button";
import type { QuoteRequestRecord } from "@/lib/operations/types";

export function QuoteActions({ quote }: { quote: QuoteRequestRecord }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild variant="ghost" size="sm"><Link href={`/quotes/${quote.id}`}><Eye className="h-4 w-4" />View</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/quotes/${quote.id}?mode=edit`}><Edit className="h-4 w-4" />Edit</Link></Button>
      <form action={updateQuoteStatus}><input type="hidden" name="quote_id" value={quote.id} /><input type="hidden" name="status" value="quoted" /><Button variant="ghost" size="sm"><Send className="h-4 w-4" />Quoted</Button></form>
      <form action={updateQuoteStatus}><input type="hidden" name="quote_id" value={quote.id} /><input type="hidden" name="status" value="approved" /><Button variant="ghost" size="sm"><CheckCircle2 className="h-4 w-4" />Approve</Button></form>
      <form action={updateQuoteStatus}><input type="hidden" name="quote_id" value={quote.id} /><input type="hidden" name="status" value="rejected" /><Button variant="ghost" size="sm"><XCircle className="h-4 w-4" />Reject</Button></form>
      <form action={convertQuoteToShipment}>
        <input type="hidden" name="quote_id" value={quote.id} /><input type="hidden" name="origin" value={quote.origin} /><input type="hidden" name="destination" value={quote.destination} />
        <input type="hidden" name="cargo_description" value={quote.cargoDescription} /><input type="hidden" name="cargo_type" value={quote.cargoType} />
        <input type="hidden" name="customer_name" value={quote.customerName} /><input type="hidden" name="customer_phone" value={quote.customerPhone} /><input type="hidden" name="customer_email" value={quote.customerEmail} />
        <input type="hidden" name="quoted_amount" value={quote.quotedAmount} />
        <Button variant="ghost" size="sm"><PackagePlus className="h-4 w-4" />Convert</Button>
      </form>
      <Button asChild variant="ghost" size="sm"><Link href={`/api/quotes/${quote.id}/pdf`}><FileText className="h-4 w-4" />PDF</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/email/compose?template=quote&quoteId=${quote.id}&to=${encodeURIComponent(quote.customerEmail)}`}><Mail className="h-4 w-4" />Email</Link></Button>
      <Button asChild variant="ghost" size="sm"><a href={`https://wa.me/${quote.customerPhone.replace(/\D/g, "")}?text=${encodeURIComponent(`Quote update: ${quote.currency} ${quote.quotedAmount}`)}`} target="_blank"><MessageCircle className="h-4 w-4" />WA</a></Button>
      <form action={deleteQuoteRequest} onSubmit={(event) => { if (!confirm("Delete this quote request?")) event.preventDefault(); }}>
        <input type="hidden" name="quote_id" value={quote.id} />
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" />Delete</Button>
      </form>
    </div>
  );
}
