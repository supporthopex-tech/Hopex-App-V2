import { NextResponse, type NextRequest } from "next/server";
import { authorizeApi } from "@/lib/api-authorization";
import { calculateShipmentPricing } from "@/lib/shipments/pricing";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/tenant";

type InsertClient = {
  from: (table: "shipments") => {
    insert: (payload: Record<string, unknown>[]) => Promise<{ error: { message: string } | null }>;
  };
};

export async function POST(request: NextRequest) {
  const authorization = await authorizeApi("shipments.create");
  if (!authorization.ok) return authorization.response;
  const formData = await request.formData();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, message: "CSV file is required." }, { status: 400 });
  }

  const content = await file.text();
  const [headerLine, ...lines] = content.split(/\r?\n/).filter(Boolean);
  const headers = headerLine.split(",").map((header) => normalize(header));
  const rows = lines.map((line) => {
    const values = line.split(",").map((value) => value.trim().replace(/^"|"$/g, ""));
    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: false, message: "Database connection is unavailable." }, { status: 503 });
  }

  const tenant = authorization.tenant;
  const payload = rows.map((row, index) => {
    const pricing = calculateShipmentPricing({
      useBalanceWeight: true,
      usePieces: Boolean(Number(row.pieces)),
      useVolume: Boolean(Number(row.volume_cbm)),
      weightKg: Number(row.weight_kg ?? 0),
      pieces: Number(row.pieces ?? 0),
      volumeCbm: Number(row.volume_cbm ?? 0),
      length: Number(row.length ?? 0),
      width: Number(row.width ?? 0),
      height: Number(row.height ?? 0),
      ratePerKg: Number(row.rate_per_kg ?? 0),
      ratePerCbm: Number(row.rate_per_cbm ?? 0),
      ratePerPiece: Number(row.rate_per_piece ?? 0),
      handlingFee: Number(row.handling_fee ?? 0),
      customsFee: Number(row.customs_fee ?? 0),
      insuranceFee: Number(row.insurance_fee ?? 0),
      discount: Number(row.discount ?? 0),
      tax: Number(row.tax ?? 0),
      costAmount: Number(row.cost_amount ?? 0),
    });
    const trackingNumber = row.tracking_number || `${tenant.company.name.slice(0, 3).toUpperCase()}-IMPORT-${Date.now()}-${index}`;
    return {
      company_id: tenant.company.id,
      tracking_number: trackingNumber,
      reference_number: row.reference_number ?? "",
      barcode_value: trackingNumber,
      qr_code_value: `/track/${trackingNumber}`,
      supplier_name: row.supplier_name ?? "",
      supplier_phone: row.supplier_phone ?? "",
      supplier_email: row.supplier_email ?? "",
      supplier_location: row.supplier_location ?? "",
      customer_name: row.customer_name ?? "",
      customer_phone: row.customer_phone ?? "",
      customer_email: row.customer_email ?? "",
      origin: row.origin ?? "",
      destination: row.destination ?? "",
      route: row.route || `${row.origin ?? ""} -> ${row.destination ?? ""}`,
      cargo_type: row.cargo_type ?? "",
      cargo_category: row.cargo_category || (pricing.usePieces ? "PCS" : pricing.useVolume ? "CBM" : "KG"),
      cargo_description: row.cargo_description ?? "",
      currency: row.currency || tenant.company.currency,
      weight_kg: pricing.weightKg,
      pieces: pricing.pieces,
      volume_cbm: pricing.volumeCbm,
      rate_per_kg: pricing.ratePerKg,
      rate_per_cbm: pricing.ratePerCbm,
      rate_per_piece: pricing.ratePerPiece,
      handling_fee: pricing.handlingFee,
      customs_fee: pricing.customsFee,
      insurance_fee: pricing.insuranceFee,
      subtotal: pricing.subtotal,
      tax: pricing.tax,
      discount: pricing.discount,
      total_amount: pricing.totalAmount,
      status: row.status || "pending",
      estimated_delivery: row.estimated_delivery || null,
      created_by: tenant.user.id,
    };
  });

  const supabase = (await createClient()) as unknown as InsertClient;
  const { error } = await supabase.from("shipments").insert(payload);
  if (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 400 });
  }

  return NextResponse.json({
    ok: true,
    importedRows: rows.length,
    message: "Shipments imported.",
  });
}

function normalize(value: string) {
  return value.trim().replace(/^"|"$/g, "").toLowerCase().replaceAll(" ", "_");
}
