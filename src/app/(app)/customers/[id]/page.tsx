import { notFound } from "next/navigation";
import { updateCustomer } from "@/app/(app)/customers/actions";
import { CustomerActions } from "@/components/operations/customer-actions";
import { StatusBadge } from "@/components/operations/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getCustomer } from "@/lib/operations/service";

export default async function CustomerDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | undefined>> }) {
  const { id } = await params;
  const query = await searchParams;
  const customer = await getCustomer(id);
  if (!customer) notFound();
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between"><div><h1 className="text-2xl font-semibold tracking-tight">{customer.companyName || customer.fullName}</h1><p className="text-sm text-muted-foreground">{customer.fullName} · {customer.city} {customer.country}</p></div><CustomerActions customer={customer} /></div>
      <div className="grid gap-4 lg:grid-cols-4">
        <Card><CardHeader><CardTitle>Status</CardTitle></CardHeader><CardContent><StatusBadge status={customer.isVip ? "VIP" : customer.status} /></CardContent></Card>
        <Card><CardHeader><CardTitle>Shipments</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{customer.shipmentsCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Quotes</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{customer.quotesCount}</CardContent></Card>
        <Card><CardHeader><CardTitle>Revenue</CardTitle></CardHeader><CardContent className="text-2xl font-semibold">{customer.currency} {customer.revenue.toLocaleString()}</CardContent></Card>
      </div>
      <Card><CardHeader><CardTitle>Customer profile</CardTitle></CardHeader><CardContent className="grid gap-3 text-sm md:grid-cols-2"><Info label="Phone" value={customer.phone} /><Info label="Email" value={customer.email} /><Info label="Address" value={customer.address} /><Info label="Type" value={customer.customerType} /><Info label="Invoices / payments" value={`${customer.invoicesCount} invoices · ${customer.paymentsCount} payments`} /><Info label="Notes" value={customer.notes || "-"} /></CardContent></Card>
      {query.mode === "edit" ? (
        <Card><CardHeader><CardTitle>Edit customer</CardTitle></CardHeader><CardContent><form action={updateCustomer} className="grid gap-4 md:grid-cols-2"><input type="hidden" name="customer_id" value={customer.id} /><Field label="Full name" name="full_name" value={customer.fullName} /><Field label="Company name" name="company_name" value={customer.companyName} /><Field label="Phone" name="phone" value={customer.phone} /><Field label="Email" name="email" value={customer.email} /><Field label="Address" name="address" value={customer.address} /><Field label="City" name="city" value={customer.city} /><Field label="Country" name="country" value={customer.country} /><Field label="Customer type" name="customer_type" value={customer.customerType} /><div className="grid gap-2 md:col-span-2"><Label>Notes</Label><Textarea name="notes" defaultValue={customer.notes} /></div><Button className="md:w-fit">Save changes</Button></form></CardContent></Card>
      ) : null}
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div><p className="text-xs text-muted-foreground">{label}</p><p className="font-medium">{value || "-"}</p></div>;
}

function Field({ label, name, value }: { label: string; name: string; value: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} defaultValue={value} /></div>;
}
