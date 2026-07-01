import { NextResponse } from "next/server";
import { getQuoteRequest } from "@/lib/operations/service";
import { authorizeApi } from "@/lib/api-authorization";
import { getAuthenticatedTenantContext } from "@/lib/tenant";

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApi("quotes.view");
  if (!authorization.ok) return authorization.response;
  if (!(await getAuthenticatedTenantContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const quote = await getQuoteRequest(id);
  if (!quote) return new NextResponse("Quote not found", { status: 404 });
  const lines = [
    "QUOTE REQUEST",
    `Customer: ${quote.customerName}`,
    `Phone: ${quote.customerPhone}`,
    `Route: ${quote.origin} to ${quote.destination}`,
    `Cargo: ${quote.cargoDescription}`,
    `Amount: ${quote.currency} ${quote.quotedAmount}`,
    `Status: ${quote.status}`,
  ];
  const stream = `BT /F1 16 Tf 72 760 Td ${lines.map((line, index) => `${index ? "0 -24 Td " : ""}(${escapePdf(line)}) Tj`).join(" ")} ET`;
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>",
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets.slice(1).map((offset) => `${String(offset).padStart(10, "0")} 00000 n `).join("\n")}\n`;
  pdf += `trailer << /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new NextResponse(pdf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename=quote-${quote.id}.pdf`,
    },
  });
}

function escapePdf(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("(", "\\(").replaceAll(")", "\\)");
}
