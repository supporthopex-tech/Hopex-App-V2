import { NextResponse } from "next/server";
import { getShipmentById } from "@/lib/shipments/service";
import { authorizeApi } from "@/lib/api-authorization";
import { getAuthenticatedTenantContext, getTenantContext } from "@/lib/tenant";
import QRCode from "qrcode";

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const authorization = await authorizeApi("shipments.view");
  if (!authorization.ok) return authorization.response;
  if (!(await getAuthenticatedTenantContext())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await params;
  const [shipment, tenant] = await Promise.all([getShipmentById(id), getTenantContext()]);
  if (!shipment) return NextResponse.json({ error: "Shipment not found" }, { status: 404 });
  const trackingUrl = new URL(`/track/${encodeURIComponent(shipment.trackingNumber)}`, request.url).toString();
  const qrCode = await QRCode.toDataURL(trackingUrl, { width: 220, margin: 1, errorCorrectionLevel: "M" });
  const metric = shipment.cargoCategory === "PCS"
    ? `${shipment.pricing.pieces} PCS`
    : shipment.cargoCategory === "CBM"
      ? `${shipment.pricing.volumeCbm} CBM`
      : `${shipment.pricing.weightKg} KG`;
  const html = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${shipment.trackingNumber} label</title>
  <style>
    body{font-family:Arial,sans-serif;margin:0;padding:24px;color:#111}
    .label{width:620px;max-width:100%;border:2px solid #111;padding:18px;margin-top:16px}.actions{display:flex;gap:8px}
    .brand{display:flex;align-items:center;gap:10px;border-bottom:1px solid #999;padding-bottom:12px;margin-bottom:16px}
    .logo{width:56px;height:56px;border-radius:8px;background:${tenant.company.themeColor};color:white;display:grid;place-items:center;font-weight:700;overflow:hidden}.logo img{width:100%;height:100%;object-fit:contain}
    h1{font-size:20px;margin:0}.muted{color:#555;font-size:12px}.track{font-size:22px;font-weight:700;letter-spacing:1px;margin:14px 0}
    .grid{display:grid;grid-template-columns:1fr 1fr;gap:10px}.box{border:1px solid #bbb;padding:10px;min-height:46px}.title{font-size:11px;text-transform:uppercase;color:#555}.qr{display:flex;align-items:center;justify-content:space-between;gap:20px;margin-top:14px}.qr img{width:150px;height:150px}.status{font-size:18px;font-weight:700;text-transform:uppercase}.url{word-break:break-all}
    @media print{.actions{display:none}.label{page-break-inside:avoid;width:auto}@page{size:A5 landscape;margin:10mm}}
  </style>
</head>
<body>
  <div class="actions"><button onclick="window.print()">Print / Save as PDF</button></div>
  <div class="label">
    <div class="brand"><div class="logo">${tenant.company.logoUrl ? `<img src="${escapeHtml(tenant.company.logoUrl)}" alt="">` : escapeHtml(tenant.company.name.slice(0, 2).toUpperCase())}</div><div><h1>${escapeHtml(tenant.company.name)}</h1><div class="muted">Shipment label</div></div></div>
    <div class="title">Shipment / Tracking number</div><div class="track">${escapeHtml(shipment.trackingNumber)}</div>
    <div class="grid">
      <div class="box"><div class="title">Customer</div>${escapeHtml(shipment.customerName || "-")}<br>${escapeHtml(shipment.customerPhone || "-")}</div>
      <div class="box"><div class="title">Route</div>${escapeHtml(shipment.origin)} → ${escapeHtml(shipment.destination)}</div>
      <div class="box"><div class="title">Cargo</div>${escapeHtml(shipment.cargoType || "-")}<br>${escapeHtml(shipment.cargoCategory || "KG")} · ${escapeHtml(metric)}</div>
      <div class="box"><div class="title">Created</div>${escapeHtml(new Date(shipment.createdAt).toLocaleDateString("en-GB"))}</div>
    </div>
    <div class="qr"><div><div class="title">Current status</div><div class="status">${escapeHtml(shipment.status.replaceAll("_", " "))}</div><p class="muted url">${escapeHtml(trackingUrl)}</p></div><img src="${qrCode}" alt="Tracking QR code"></div>
  </div>
</body>
</html>`;
  return new NextResponse(html, { headers: { "content-type": "text/html; charset=utf-8" } });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] ?? character);
}
