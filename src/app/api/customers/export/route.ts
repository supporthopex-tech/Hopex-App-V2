import { NextResponse } from "next/server";
import { listCustomers } from "@/lib/operations/service";
import { authorizeApi } from "@/lib/api-authorization";
import { getAuthenticatedTenantContext } from "@/lib/tenant";

export async function GET() {
  const authorization = await authorizeApi("customers.view");
  if (!authorization.ok) return authorization.response;
  if (!(await getAuthenticatedTenantContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const customers = await listCustomers();
  const rows = [["Name", "Company", "Phone", "Email", "Status", "VIP", "Revenue"], ...customers.map((customer) => [
    customer.fullName,
    customer.companyName,
    customer.phone,
    customer.email,
    customer.status,
    customer.isVip ? "yes" : "no",
    String(customer.revenue),
  ])];
  return new NextResponse(rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=customers.csv" },
  });
}
