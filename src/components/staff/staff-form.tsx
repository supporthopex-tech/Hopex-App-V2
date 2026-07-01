"use client";

import { useActionState } from "react";
import { Save } from "lucide-react";
import { createStaff } from "@/app/(app)/staff/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { portalPermissionLabels, type RoleRecord } from "@/lib/staff/types";
import { generateStaffId } from "@/lib/staff/staff-id";

const initialState = { ok: true, message: "" };

export function StaffForm({ roles }: { roles: RoleRecord[] }) {
  const [state, action, pending] = useActionState(createStaff, initialState);
  return (
    <form action={action} className="space-y-6">
      {!state.ok ? <div className="rounded-md border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">{state.message}</div> : null}
      <Card>
        <CardHeader><CardTitle>Personal information</CardTitle><CardDescription>Identity, contact, and role details.</CardDescription></CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Field label="Staff ID auto generation"><Input name="staff_id" defaultValue={generateStaffId(4)} /></Field>
          <Field label="Full name"><Input name="full_name" required /></Field>
          <Field label="Email"><Input name="email" type="email" required /></Field>
          <Field label="Phone"><Input name="phone" /></Field>
          <Field label="Role"><Select name="role_id">{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</Select></Field>
          <Field label="Department"><Input name="department" /></Field>
          <Field label="Position"><Input name="position" /></Field>
          <Field label="Location"><Input name="location" /></Field>
          <Field label="Join date"><Input name="join_date" type="date" /></Field>
          <Field label="Status"><Select name="status" defaultValue="active"><option value="active">Active</option><option value="suspended">Suspended</option><option value="inactive">Inactive</option><option value="on_leave">On leave</option></Select></Field>
          <Field label="Notes" className="md:col-span-2"><Textarea name="notes" /></Field>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Portal access permissions</CardTitle><CardDescription>Select areas this staff member can access.</CardDescription></CardHeader>
        <CardContent className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {portalPermissionLabels.map((label) => (
            <label key={label} className="flex items-center gap-2 rounded-md border p-3 text-sm">
              <input type="checkbox" name="portal_permissions" value={label} defaultChecked={["Dashboard", "Shipments"].includes(label)} />
              {label}
            </label>
          ))}
          <label className="flex items-center gap-2 rounded-md border p-3 text-sm font-medium sm:col-span-2 lg:col-span-3">
            <input type="checkbox" name="create_login_account" />
            Create login account
          </label>
        </CardContent>
      </Card>

      <div className="sticky bottom-0 flex justify-end gap-2 border-t bg-background/95 py-4 backdrop-blur">
        <Button type="button" variant="outline">Save draft</Button>
        <Button disabled={pending}><Save className="h-4 w-4" />{pending ? "Creating..." : "Create Staff"}</Button>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) {
  return <div className={`grid gap-2 ${className}`}><Label>{label}</Label>{children}</div>;
}
