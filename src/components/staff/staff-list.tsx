import Link from "next/link";
import { Download, Plus, RefreshCw, Search, UsersRound } from "lucide-react";
import { AccountStatusBadge, StaffStatusBadge } from "@/components/staff/staff-status-badge";
import { StaffActions } from "@/components/staff/staff-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { RoleRecord, StaffFilters, StaffRecord } from "@/lib/staff/types";

export function StaffList({
  staff,
  roles,
  kpis,
  filters,
}: {
  staff: StaffRecord[];
  roles: RoleRecord[];
  kpis: { total: number; active: number; suspended: number; admins: number };
  filters: StaffFilters;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Staff Management</h1>
          <p className="text-sm text-muted-foreground">team members and role-based access control</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild><Link href="/staff/new"><Plus className="h-4 w-4" />Add Staff</Link></Button>
          <Button asChild variant="outline"><Link href="/settings/roles"><RefreshCw className="h-4 w-4" />Sync Roles</Link></Button>
          <Button asChild variant="outline"><Link href="/api/staff/export"><Download className="h-4 w-4" />Export</Link></Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Total Staff", kpis.total],
          ["Active Staff", kpis.active],
          ["Suspended Staff", kpis.suspended],
          ["Admins", kpis.admins],
        ].map(([label, value]) => (
          <Card key={label}>
            <CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><UsersRound className="h-4 w-4" />Search and filters</CardTitle>
          <CardDescription>Search by name, email, phone, or staff ID.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="relative md:col-span-2">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="search" defaultValue={filters.search} placeholder="Name, email, phone, staff ID..." />
            </div>
            <Select name="role" defaultValue={filters.role ?? ""}><option value="">All roles</option>{roles.map((role) => <option key={role.id} value={role.name}>{role.name}</option>)}</Select>
            <Select name="status" defaultValue={filters.status ?? "all"}><option value="all">All status</option><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option><option value="on_leave">On leave</option></Select>
            <Input name="department" defaultValue={filters.department} placeholder="Department" />
            <Input name="location" defaultValue={filters.location} placeholder="Location" />
            <Button className="md:w-fit">Apply filters</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Staff table</CardTitle><CardDescription>{staff.length} records found.</CardDescription></CardHeader>
        <CardContent>
          {staff.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No staff found.</div>
          ) : (
            <>
              <div className="grid gap-3 lg:hidden">
                {staff.map((member) => (
                  <div key={member.id} className="rounded-lg border bg-background p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div><p className="font-semibold">{member.fullName}</p><p className="font-mono text-xs text-primary">{member.staffId}</p><p className="text-sm text-muted-foreground">{member.email}</p></div>
                      <StaffStatusBadge status={member.status} />
                    </div>
                    <div className="mt-4 grid gap-2 text-sm">
                      <Row label="Role" value={member.roleName} />
                      <Row label="Portal Access" value={`${member.portalAccess.length} areas`} />
                      <Row label="Account" value={member.accountStatus.replaceAll("_", " ")} />
                      <Row label="Location" value={member.location || "-"} />
                    </div>
                    <div className="mt-4 border-t pt-3"><StaffActions staff={member} /></div>
                  </div>
                ))}
              </div>
              <div className="hidden overflow-x-auto lg:block">
                <Table className="min-w-[1000px]">
                  <TableHeader><TableRow><TableHead>Staff</TableHead><TableHead>Role</TableHead><TableHead>Status</TableHead><TableHead>Portal Access</TableHead><TableHead>Account</TableHead><TableHead>Location</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {staff.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell><p className="font-medium">{member.fullName}</p><p className="font-mono text-xs text-primary">{member.staffId}</p><p className="text-xs text-muted-foreground">{member.email} · {member.phone}</p></TableCell>
                        <TableCell>{member.roleName}</TableCell>
                        <TableCell><StaffStatusBadge status={member.status} /></TableCell>
                        <TableCell>{member.portalAccess.length} areas</TableCell>
                        <TableCell><AccountStatusBadge status={member.accountStatus} /></TableCell>
                        <TableCell>{member.location}</TableCell>
                        <TableCell className="max-w-[420px] text-right"><StaffActions staff={member} /></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return <div className="flex justify-between gap-4"><span className="text-muted-foreground">{label}</span><span className="font-medium">{value}</span></div>;
}
