import Link from "next/link";
import { CreditCard, Edit, Eye, FileText, Mail, Printer, RefreshCw, Share2, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateShipmentInvoice, generateShipmentQuote } from "@/app/(app)/shipments/actions";
import { DeleteShipmentButton } from "@/components/shipments/delete-shipment-button";
import type { ShipmentRecord } from "@/lib/shipments/types";

export function ShipmentActions({ shipment }: { shipment: ShipmentRecord }) {
  const trackingHref = `/track/${encodeURIComponent(shipment.trackingNumber)}`;

  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild variant="ghost" size="sm"><Link href={`/shipments/${shipment.id}`}><Eye className="h-4 w-4" />View</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/shipments/${shipment.id}?mode=edit`}><Edit className="h-4 w-4" />Edit</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/shipments/${shipment.id}#status`}><RefreshCw className="h-4 w-4" />Status</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/email/compose?template=shipment-status&shipmentId=${shipment.id}&to=${encodeURIComponent(shipment.customerEmail)}`}><Mail className="h-4 w-4" />Email</Link></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/api/shipments/${shipment.id}/label`} target="_blank"><Printer className="h-4 w-4" />Label</Link></Button>
      <form action={generateShipmentInvoice}><input type="hidden" name="shipment_id" value={shipment.id} /><Button type="submit" variant="ghost" size="sm"><CreditCard className="h-4 w-4" />Invoice</Button></form>
      <form action={generateShipmentQuote}><input type="hidden" name="shipment_id" value={shipment.id} /><Button type="submit" variant="ghost" size="sm"><FileText className="h-4 w-4" />Quote</Button></form>
      <Button asChild variant="ghost" size="sm"><Link href={trackingHref}><Truck className="h-4 w-4" />Track</Link></Button>
      <Button asChild variant="ghost" size="sm"><a href={trackingHref} target="_blank"><Share2 className="h-4 w-4" />Share</a></Button>
      <DeleteShipmentButton shipmentId={shipment.id} />
    </div>
  );
}
