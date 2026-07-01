"use client";

import Link from "next/link";
import { Edit, Eye, MessageCircle, Star, Trash2 } from "lucide-react";
import { deleteCustomer, updateCustomerFlag } from "@/app/(app)/customers/actions";
import { Button } from "@/components/ui/button";
import type { CustomerRecord } from "@/lib/operations/types";

export function CustomerActions({ customer }: { customer: CustomerRecord }) {
  return (
    <div className="flex flex-wrap justify-end gap-1">
      <Button asChild variant="ghost" size="sm"><Link href={`/customers/${customer.id}`}><Eye className="h-4 w-4" />View</Link></Button>
      <Button asChild variant="ghost" size="sm"><a href={`https://wa.me/${customer.phone.replace(/\D/g, "")}`} target="_blank"><MessageCircle className="h-4 w-4" />WA</a></Button>
      <Button asChild variant="ghost" size="sm"><Link href={`/customers/${customer.id}?mode=edit`}><Edit className="h-4 w-4" />Edit</Link></Button>
      <form action={updateCustomerFlag}>
        <input type="hidden" name="customer_id" value={customer.id} />
        <input type="hidden" name="is_vip" value={String(!customer.isVip)} />
        <Button variant="ghost" size="sm"><Star className="h-4 w-4" />{customer.isVip ? "Unvip" : "VIP"}</Button>
      </form>
      <form action={deleteCustomer} onSubmit={(event) => { if (!confirm("Delete this customer?")) event.preventDefault(); }}>
        <input type="hidden" name="customer_id" value={customer.id} />
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" />Delete</Button>
      </form>
    </div>
  );
}
