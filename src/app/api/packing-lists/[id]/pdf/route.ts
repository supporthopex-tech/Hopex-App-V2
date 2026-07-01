import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { authorizeApi } from "@/lib/api-authorization";
import { getPackingList } from "@/lib/packing-lists/service";

export const runtime = "nodejs";

const PAGE = {
  left: 36,
  right: 559,
  bottom: 790,
  width: 523,
};

type HeaderInput = {
  companyName: string;
  companyDetails: string;
  slogan: string;
  logoBuffer: Buffer | null;
  themeColor: string;
  dispatchDate: string;
  packingListNumber: string;
  destination: string;
  preparedBy: string;
};

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApi("packing_lists.export");
  if (!authorization.ok) return authorization.response;

  try {
    const { id } = await params;
    console.info("Packing list PDF request started", { id });
    const packingList = await getPackingList(id);
    if (!packingList) return Response.json({ error: "Packing list not found" }, { status: 404 });

    const doc = new PDFDocument({ size: "A4", margin: PAGE.left, bufferPages: true });
    const chunks: Buffer[] = [];
    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    const done = new Promise<Buffer>((resolve, reject) => {
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);
    });

    const tenant = authorization.tenant;
    const companyDetails = [
      tenant.company.address,
      tenant.company.city,
      tenant.company.country,
      tenant.company.phone,
      tenant.company.email,
      tenant.company.website,
    ].filter(Boolean).join(" • ");
    const logoBuffer = await loadLogoBuffer(tenant.company.logoUrl ?? "");
    const themeColor = tenant.company.themeColor || "#111827";

    drawHeader(doc, {
      companyName: tenant.company.name,
      companyDetails,
      slogan: tenant.company.slogan ?? "",
      logoBuffer,
      themeColor,
      dispatchDate: packingList.dispatchDate,
      packingListNumber: packingList.packingListNumber,
      destination: packingList.destination,
      preparedBy: packingList.preparedByName || tenant.user.name,
    });

    doc.moveDown(0.5);
    drawSummary(doc, [
      ["Status", packingList.status.toUpperCase()],
      ["Total boxes", String(packingList.totalBoxes)],
      ["Total customers", String(packingList.totalCustomers)],
      ["Total items", String(packingList.totalItems)],
      ["Total weight", `${packingList.totalWeight.toLocaleString()} kg`],
    ], themeColor);

    for (const box of packingList.boxes) {
      ensureSpace(doc, 150);
      doc.moveDown(0.8);
      const qrBuffer = await qrPngBuffer(box.barcodeValue);
      const boxHeaderY = doc.y;
      doc.roundedRect(PAGE.left, boxHeaderY, PAGE.width, 58, 8).stroke("#d1d5db");
      doc.fontSize(13).fillColor("#111827").font("Helvetica-Bold").text(`Box No: ${box.boxNumber}`, 50, boxHeaderY + 12);
      doc.fontSize(8).font("Helvetica").fillColor("#6b7280").text(`QR / Barcode value: ${box.barcodeValue}`, 50, boxHeaderY + 31, { width: 380 });
      doc.image(qrBuffer, 504, boxHeaderY + 8, { width: 42, height: 42 });
      doc.y = boxHeaderY + 72;
      drawTableHeader(doc, themeColor);
      for (const item of box.items) {
        const values = [
          item.customerName,
          item.trackingNumber,
          item.itemDescription,
          item.quantityLabel || String(item.quantity),
          `${item.weight.toLocaleString()} kg`,
          item.remarks,
        ];
        const rowHeight = measureRowHeight(doc, values);
        if (needsPageBreak(doc, rowHeight)) {
          doc.addPage();
          drawTableHeader(doc, themeColor);
        }
        drawItemRow(doc, values, rowHeight);
      }
    }

    ensureSpace(doc, 130);
    doc.moveDown(1);
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#111827").text("Signature section");
    doc.moveDown(1.2);
    doc.font("Helvetica").fontSize(10).text("Prepared by: ________________________________", PAGE.left);
    doc.moveDown(0.8);
    doc.text("Checked by: _________________________________");
    doc.moveDown(0.8);
    doc.text("Driver / Dispatch signature: _________________");

    const pageCount = doc.bufferedPageRange().count;
    for (let index = 0; index < pageCount; index += 1) {
      doc.switchToPage(index);
      doc.fontSize(8).fillColor("#6b7280").text(`Page ${index + 1} of ${pageCount}`, 500, 812, { align: "right" });
    }
    doc.end();
    const pdf = await done;
    console.info("Packing list PDF generated", { id, bytes: pdf.length });
    const disposition = new URL(request.url).searchParams.get("download") === "1" ? "attachment" : "inline";
    return new Response(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${disposition}; filename="${sanitizeFilename(packingList.packingListNumber)}.pdf"`,
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    console.error("Packing list PDF generation failed", error);
    return Response.json({ error: "Could not generate packing list PDF. Please try again." }, { status: 500 });
  }
}

function drawHeader(doc: PDFKit.PDFDocument, input: HeaderInput) {
  drawLogo(doc, input);
  doc.font("Helvetica-Bold").fontSize(17).fillColor("#111827").text(input.companyName, 92, 38, { width: 250 });
  doc.font("Helvetica").fontSize(8).fillColor("#6b7280").text(input.slogan || "Daily dispatch packing list", 92, 60, { width: 260 });
  if (input.companyDetails) {
    doc.fontSize(7).fillColor("#6b7280").text(input.companyDetails, 92, 73, { width: 260, lineGap: 1 });
  }
  doc.font("Helvetica-Bold").fontSize(16).fillColor("#111827").text("PACKING LIST", 380, 38, { width: 179, align: "right" });
  doc.font("Helvetica").fontSize(9).fillColor("#374151");
  doc.text(`Packing list no: ${input.packingListNumber}`, 360, 67, { width: 199, align: "right" });
  doc.text(`Dispatch date: ${input.dispatchDate}`, 360, 82, { width: 199, align: "right" });
  doc.text(`Destination: ${input.destination}`, 360, 97, { width: 199, align: "right" });
  doc.text(`Prepared by: ${input.preparedBy}`, 360, 112, { width: 199, align: "right" });
  doc.moveTo(PAGE.left, 136).lineTo(PAGE.right, 136).stroke("#d1d5db");
  doc.y = 148;
}

function drawLogo(doc: PDFKit.PDFDocument, input: HeaderInput) {
  const x = PAGE.left;
  const y = 36;
  if (input.logoBuffer) {
    try {
      doc.image(input.logoBuffer, x, y, { fit: [42, 42] });
      return;
    } catch {
      // Unsupported logo formats should never break PDF generation.
    }
  }
  doc.roundedRect(x, y, 42, 42, 8).fillAndStroke(input.themeColor, input.themeColor);
  doc.font("Helvetica-Bold").fontSize(14).fillColor("#ffffff").text(initials(input.companyName), x, y + 13, { width: 42, align: "center" });
}

function drawSummary(doc: PDFKit.PDFDocument, rows: Array<[string, string]>, themeColor: string) {
  const x = PAGE.left;
  const y = doc.y;
  const width = PAGE.width / rows.length;
  rows.forEach(([label, value], index) => {
    doc.roundedRect(x + index * width, y, width - 5, 44, 6).stroke("#d1d5db");
    doc.font("Helvetica").fontSize(7).fillColor("#6b7280").text(label, x + index * width + 8, y + 8, { width: width - 16 });
    doc.font("Helvetica-Bold").fontSize(10).fillColor(themeColor).text(value, x + index * width + 8, y + 23, { width: width - 16 });
  });
  doc.y = y + 48;
}

function drawTableHeader(doc: PDFKit.PDFDocument, themeColor: string) {
  const y = doc.y;
  doc.rect(PAGE.left, y, PAGE.width, 22).fill(themeColor);
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff");
  ["Customer Name", "Tracking / Shipment No", "Item Description", "Qty", "Weight", "Remarks"].forEach((header, index) => {
    doc.text(header, columnX(index), y + 7, { width: columnWidth(index) });
  });
  doc.y = y + 22;
}

function drawItemRow(doc: PDFKit.PDFDocument, values: string[], height: number) {
  const y = doc.y;
  doc.rect(PAGE.left, y, PAGE.width, height).stroke("#e5e7eb");
  doc.font("Helvetica").fontSize(7).fillColor("#374151");
  values.forEach((value, index) => {
    doc.text(value || "-", columnX(index), y + 7, { width: columnWidth(index) });
  });
  doc.y = y + height;
}

function measureRowHeight(doc: PDFKit.PDFDocument, values: string[]) {
  doc.font("Helvetica").fontSize(7);
  return Math.max(26, ...values.map((value, index) => doc.heightOfString(value || "-", { width: columnWidth(index) }))) + 12;
}

function columnX(index: number) {
  return [42, 132, 226, 360, 410, 464][index] ?? 42;
}

function columnWidth(index: number) {
  return [84, 88, 128, 42, 48, 86][index] ?? 80;
}

function ensureSpace(doc: PDFKit.PDFDocument, needed: number) {
  if (needsPageBreak(doc, needed)) doc.addPage();
}

function needsPageBreak(doc: PDFKit.PDFDocument, needed: number) {
  return doc.y + needed > PAGE.bottom;
}

async function qrPngBuffer(value: string) {
  const dataUrl = await QRCode.toDataURL(value, { margin: 1, width: 96 });
  return Buffer.from(dataUrl.split(",")[1] ?? "", "base64");
}

async function loadLogoBuffer(logoUrl: string) {
  if (!logoUrl || logoUrl.toLowerCase().endsWith(".svg")) return null;
  try {
    const response = await fetch(logoUrl, { cache: "no-store" });
    if (!response.ok) return null;
    const contentType = response.headers.get("content-type") ?? "";
    if (!contentType.startsWith("image/")) return null;
    return Buffer.from(await response.arrayBuffer());
  } catch {
    return null;
  }
}

function initials(name: string) {
  const text = name.trim() || "PL";
  return text.split(/\s+/).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("");
}

function sanitizeFilename(value: string) {
  return value.replace(/[^\w.-]+/g, "-").replace(/-+/g, "-");
}
