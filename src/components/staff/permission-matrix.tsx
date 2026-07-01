import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { rolePermissionCatalog } from "@/lib/staff/types";
import type { RoleRecord } from "@/lib/staff/types";

export function PermissionMatrix({ roles }: { roles: RoleRecord[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Permissions</h1>
        <p className="text-sm text-muted-foreground">Permission matrix for create, read, update, delete, approve, and export.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>Permission matrix</CardTitle><CardDescription>Role access by ERP resource.</CardDescription></CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-[900px] text-sm">
              <thead>
                <tr className="border-b">
                  <th className="p-2 text-left">Resource</th>
                  {roles.map((role) => <th key={role.id} className="p-2 text-left">{role.name}</th>)}
                </tr>
              </thead>
              <tbody>
                {rolePermissionCatalog.map((permission) => (
                  <tr key={permission} className="border-b">
                    <td className="p-2 font-mono text-xs">{permission}</td>
                    {roles.map((role) => {
                      const allowed = role.permissions.includes(permission) || role.permissions.includes(`${permission.split(".")[0]}.read`) || role.name === "Super Admin";
                      return <td key={role.id} className="p-2">{allowed ? "Allowed" : "-"}</td>;
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
