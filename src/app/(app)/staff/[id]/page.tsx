import { notFound } from "next/navigation";
import { updateStaff } from "@/app/(app)/staff/actions";
import { AccountStatusBadge, StaffStatusBadge } from "@/components/staff/staff-status-badge";
import { StaffActions } from "@/components/staff/staff-actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { getStaffById, listRoles } from "@/lib/staff/service";
import { portalPermissionLabels, staffStatuses } from "@/lib/staff/types";
import { formatDate } from "@/lib/utils";

export default async function StaffProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const staff = await getStaffById(id);
  if (!staff) notFound();
  const roles = await listRoles();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold tracking-tight">{staff.fullName}</h1>
            <StaffStatusBadge status={staff.status} />
            <AccountStatusBadge status={staff.accountStatus} />
          </div>
          <p className="text-sm text-muted-foreground">{staff.staffId} · {staff.roleName}</p>
        </div>
        <StaffActions staff={staff} />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>Personal information</CardTitle><CardDescription>Name, email, phone, and account.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Info label="Full name" value={staff.fullName} />
            <Info label="Email" value={staff.email} />
            <Info label="Phone" value={staff.phone} />
            <Info label="Account status" value={staff.accountStatus.replaceAll("_", " ")} />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Employment details</CardTitle><CardDescription>Role, department, position, and location.</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Info label="Role" value={staff.roleName} />
            <Info label="Department" value={staff.department} />
            <Info label="Position" value={staff.position} />
            <Info label="Location" value={staff.location} />
            <Info label="Join date" value={staff.joinDate || "-"} />
            <Info label="Notes" value={staff.notes || "-"} />
          </CardContent>
        </Card>
      </div>

      {query.mode === "edit" ? (
        <Card>
          <CardHeader><CardTitle>Edit staff member</CardTitle><CardDescription>Updates profile, employment details, status, role, and portal permissions.</CardDescription></CardHeader>
          <CardContent>
            <form action={updateStaff} className="grid gap-4 md:grid-cols-2">
              <input type="hidden" name="staff_id" value={staff.id} />
              <Field label="Staff ID" name="staff_id_value" value={staff.staffId} />
              <Field label="Full name" name="full_name" value={staff.fullName} />
              <Field label="Email" name="email" value={staff.email} type="email" />
              <Field label="Phone" name="phone" value={staff.phone} />
              <div className="grid gap-2">
                <Label>Role</Label>
                <Select name="role_id" defaultValue={staff.roleId ?? ""}>
                  <option value="">Unassigned</option>
                  {roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Status</Label>
                <Select name="status" defaultValue={staff.status}>
                  {staffStatuses.map((status) => <option key={status} value={status}>{status.replaceAll("_", " ")}</option>)}
                </Select>
              </div>
              <Field label="Department" name="department" value={staff.department} />
              <Field label="Position" name="position" value={staff.position} />
              <Field label="Location" name="location" value={staff.location} />
              <Field label="Join date" name="join_date" value={staff.joinDate} type="date" />
              <div className="grid gap-2 md:col-span-2">
                <Label>Notes</Label>
                <Textarea name="notes" defaultValue={staff.notes} />
              </div>
              <div className="grid gap-3 md:col-span-2 sm:grid-cols-2 lg:grid-cols-3">
                {portalPermissionLabels.map((label) => (
                  <label key={label} className="flex items-center gap-2 rounded-md border p-3 text-sm">
                    <input type="checkbox" name="portal_permissions" value={label} defaultChecked={staff.portalAccess.includes(label)} />
                    {label}
                  </label>
                ))}
              </div>
              <Button className="md:w-fit">Save staff changes</Button>
            </form>
          </CardContent>
        </Card>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-4">
        <Metric title="Created shipments" value={staff.createdShipments} />
        <Metric title="Created quotes" value={staff.createdQuotes} />
        <Metric title="Completed tasks" value={staff.completedTasks} />
        <Metric title="Portal permissions" value={staff.portalAccess.length} />
      </div>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card>
          <CardHeader><CardTitle>Portal permissions</CardTitle><CardDescription>Accessible ERP areas.</CardDescription></CardHeader>
          <CardContent className="flex flex-wrap gap-2">{staff.portalAccess.map((item) => <span key={item} className="rounded-md border px-2 py-1 text-xs">{item}</span>)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Activity timeline</CardTitle><CardDescription>Recent staff actions.</CardDescription></CardHeader>
          <CardContent className="space-y-2">{staff.activityTimeline.map((item) => <Timeline key={item.id} label={item.label} date={item.createdAt} />)}</CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Login history</CardTitle><CardDescription>Portal login activity.</CardDescription></CardHeader>
          <CardContent className="space-y-2">{staff.loginHistory.length ? staff.loginHistory.map((item) => <Timeline key={item.id} label={item.label} date={item.createdAt} />) : <p className="text-sm text-muted-foreground">No login activity.</p>}</CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 font-medium">{value}</p></div>;
}

function Field({ label, name, value, type = "text" }: { label: string; name: string; value: string; type?: string }) {
  return <div className="grid gap-2"><Label>{label}</Label><Input name={name} defaultValue={value} type={type} /></div>;
}

function Metric({ title, value }: { title: string; value: number }) {
  return <Card><CardHeader className="pb-2"><CardDescription>{title}</CardDescription><CardTitle className="text-2xl">{value}</CardTitle></CardHeader></Card>;
}

function Timeline({ label, date }: { label: string; date: string }) {
  return <div className="rounded-md border p-3 text-sm"><p className="font-medium">{label}</p><p className="text-muted-foreground">{formatDate(date)}</p></div>;
}
