import Link from "next/link";
import { Download, Plus, RefreshCw, Search } from "lucide-react";
import { CustomerActions } from "@/components/operations/customer-actions";
import { StatusBadge } from "@/components/operations/badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { CustomerRecord, ListFilters } from "@/lib/operations/types";

export function CustomersList({ customers, filters }: { customers: CustomerRecord[]; filters: ListFilters }) {
  const kpis = {
    total: customers.length,
    active: customers.filter((customer) => customer.status === "active").length,
    vip: customers.filter((customer) => customer.isVip).length,
    withEmail: customers.filter((customer) => customer.email).length,
  };
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div><h1 className="text-2xl font-semibold tracking-tight">Customer Database</h1><p className="text-sm text-muted-foreground">{customers.length} total clients and marketing communications</p></div>
        <div className="flex flex-wrap gap-2"><Button asChild variant="outline"><Link href="/customers"><RefreshCw className="h-4 w-4" />Refresh</Link></Button><Button asChild variant="outline"><Link href="/api/customers/export"><Download className="h-4 w-4" />Export CSV</Link></Button><Button asChild><Link href="/customers/new"><Plus className="h-4 w-4" />Add Customer</Link></Button></div>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{[["Total Customers", kpis.total], ["Active", kpis.active], ["VIP Clients", kpis.vip], ["With Email", kpis.withEmail]].map(([label, value]) => <Card key={label}><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>)}</div>
      <Card><CardContent className="pt-6"><form className="grid gap-3 md:grid-cols-[1fr_220px_auto]"><div className="relative"><Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" /><Input className="pl-9" name="search" defaultValue={filters.search} placeholder="Search customers..." /></div><Select name="status" defaultValue={filters.status ?? "all"}><option value="all">All status</option><option value="active">Active</option><option value="inactive">Inactive</option><option value="blocked">Blocked</option></Select><Button>Apply filters</Button></form></CardContent></Card>
      {customers.length === 0 ? <Card><CardContent className="pt-6"><div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No customers found.</div></CardContent></Card> : (
        <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-3">
          {customers.map((customer) => (
            <Card key={customer.id}>
              <CardContent className="space-y-4 pt-6">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3"><div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 font-semibold text-primary">{initials(customer.companyName || customer.fullName)}</div><div><p className="font-semibold">{customer.companyName || customer.fullName}</p><p className="text-sm text-muted-foreground">{customer.fullName}</p></div></div>
                  <StatusBadge status={customer.isVip ? "VIP" : customer.status} />
                </div>
                <div className="grid gap-2 text-sm"><Row label="Shipments" value={String(customer.shipmentsCount)} /><Row label="Revenue" value={`${customer.currency} ${customer.revenue.toLocaleString()}`} /><Row label="Email" value={customer.email || "-"} /><Row label="Phone" value={customer.phone || "-"} /></div>
                <div className="border-t pt-3"><CustomerActions customer={customer} /></div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function initials(name: string) {
  return name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase() || "CU";
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
