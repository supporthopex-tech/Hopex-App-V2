"use client";

import { Trash2 } from "lucide-react";
import { createRole, deleteRole, updateRolePermissions } from "@/app/(app)/settings/roles/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { crudPermissionActions, rolePermissionCatalog } from "@/lib/staff/types";
import type { RoleRecord } from "@/lib/staff/types";

export function RoleManagement({ roles }: { roles: RoleRecord[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Roles</h1>
        <p className="text-sm text-muted-foreground">Create role, edit role, delete role, assign permissions, and review permission matrix.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Create role</CardTitle><CardDescription>Add a custom company role.</CardDescription></CardHeader>
        <CardContent>
          <form action={createRole} className="grid gap-3 md:grid-cols-[1fr_2fr_auto]">
            <div className="grid gap-2"><Label>Name</Label><Input name="name" required /></div>
            <div className="grid gap-2"><Label>Description</Label><Input name="description" /></div>
            <Button className="self-end">Create role</Button>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        {roles.map((role) => (
          <Card key={role.id}>
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div><CardTitle>{role.name}</CardTitle><CardDescription>{role.description}</CardDescription></div>
                <form action={deleteRole} onSubmit={(event) => { if (!confirm("Delete this role?")) event.preventDefault(); }}>
                  <input type="hidden" name="role_id" value={role.id} />
                  <Button type="submit" variant="ghost" size="icon" disabled={role.isSystem}><Trash2 className="h-4 w-4" /></Button>
                </form>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea defaultValue={role.permissions.join("\n")} aria-label={`${role.name} permissions`} readOnly />
              <form action={updateRolePermissions} className="space-y-3">
                <input type="hidden" name="role_id" value={role.id} />
                <div className="grid max-h-56 gap-2 overflow-y-auto rounded-md border p-3 text-xs sm:grid-cols-2">
                  {rolePermissionCatalog.map((permission) => (
                    <label key={permission} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="permissions"
                        value={permission}
                        defaultChecked={role.permissions.includes(permission) || role.name === "Super Admin"}
                        className="h-4 w-4 rounded border-border"
                      />
                      <span className="font-mono">{permission}</span>
                    </label>
                  ))}
                </div>
                <Button type="submit" variant="secondary" size="sm">Save permissions</Button>
              </form>
              <div className="grid grid-cols-3 gap-2 text-xs sm:grid-cols-6">
                {crudPermissionActions.map((action) => <span key={action} className="rounded-md border px-2 py-1 text-center">{action}</span>)}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
