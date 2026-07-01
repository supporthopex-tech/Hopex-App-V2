import { StaffForm } from "@/components/staff/staff-form";
import { listRoles } from "@/lib/staff/service";

export default async function NewStaffPage() {
  const roles = await listRoles();
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Create staff</h1>
        <p className="text-sm text-muted-foreground">Add a team member, assign role-based access, and optionally invite them to the portal.</p>
      </div>
      <StaffForm roles={roles} />
    </div>
  );
}
