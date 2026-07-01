import { PermissionMatrix } from "@/components/staff/permission-matrix";
import { listRoles } from "@/lib/staff/service";

export default async function PermissionsPage() {
  return <PermissionMatrix roles={await listRoles()} />;
}
