import { NextResponse } from "next/server";
import { listStaff } from "@/lib/staff/service";
import { authorizeApi } from "@/lib/api-authorization";
import { getAuthenticatedTenantContext } from "@/lib/tenant";

export async function GET() {
  const authorization = await authorizeApi("staff.view");
  if (!authorization.ok) return authorization.response;
  if (!(await getAuthenticatedTenantContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { staff } = await listStaff();
  const headers = ["Staff ID", "Full Name", "Email", "Phone", "Role", "Status", "Account", "Department", "Location"];
  const rows = staff.map((member) => [
    member.staffId,
    member.fullName,
    member.email,
    member.phone,
    member.roleName,
    member.status,
    member.accountStatus,
    member.department,
    member.location,
  ]);
  const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(",")).join("\n");
  return new NextResponse(csv, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="staff.csv"`,
    },
  });
}
