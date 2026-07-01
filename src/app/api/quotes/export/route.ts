import { NextResponse } from "next/server";
import { listQuoteRequests } from "@/lib/operations/service";
import { authorizeApi } from "@/lib/api-authorization";
import { getAuthenticatedTenantContext } from "@/lib/tenant";

export async function GET() {
  const authorization = await authorizeApi("quotes.view");
  if (!authorization.ok) return authorization.response;
  if (!(await getAuthenticatedTenantContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const quotes = await listQuoteRequests();
  const rows = [["Customer", "Phone", "Origin", "Destination", "Cargo", "Status", "Amount"], ...quotes.map((quote) => [
    quote.customerName,
    quote.customerPhone,
    quote.origin,
    quote.destination,
    quote.cargoDescription,
    quote.status,
    `${quote.currency} ${quote.quotedAmount}`,
  ])];
  return new NextResponse(rows.map((row) => row.map((cell) => `"${String(cell).replaceAll("\"", "\"\"")}"`).join(",")).join("\n"), {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": "attachment; filename=quote-requests.csv" },
  });
}
