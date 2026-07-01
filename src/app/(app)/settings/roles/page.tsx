import { RoleManagement } from "@/components/staff/role-management";
import { listRoles } from "@/lib/staff/service";

export default async function RolesPage() {
  return <RoleManagement roles={await listRoles()} />;
}
