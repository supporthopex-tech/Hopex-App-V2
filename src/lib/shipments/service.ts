import { unstable_noStore as noStore } from "next/cache";
import type { ShipmentFilters, ShipmentRecord } from "@/lib/shipments/types";
import { getDeploymentCompanyId } from "@/lib/deployment";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, isSupabaseConfigured } from "@/lib/tenant";

function matchesFilter(shipment: ShipmentRecord, filters: ShipmentFilters) {
  const search = filters.search?.trim().toLowerCase();
  if (search) {
    const haystack = [
      shipment.trackingNumber,
      shipment.supplierName,
      shipment.customerName,
      shipment.supplierPhone,
      shipment.customerPhone,
    ]
      .join(" ")
      .toLowerCase();
    if (!haystack.includes(search)) return false;
  }
  if (filters.status && filters.status !== "all" && shipment.status !== filters.status) return false;
  if (filters.route && !shipment.route.toLowerCase().includes(filters.route.toLowerCase())) return false;
  if (filters.origin && !shipment.origin.toLowerCase().includes(filters.origin.toLowerCase())) return false;
  if (filters.destination && !shipment.destination.toLowerCase().includes(filters.destination.toLowerCase())) return false;
  if (filters.cargoType && shipment.cargoType !== filters.cargoType) return false;
  if (filters.assignedStaff && shipment.assignedStaffId !== filters.assignedStaff) return false;
  if (filters.dateFrom && shipment.estimatedDelivery < filters.dateFrom) return false;
  if (filters.dateTo && shipment.estimatedDelivery > filters.dateTo) return false;
  return true;
}

export function getShipmentCounts(shipments: ShipmentRecord[]) {
  return shipments.reduce<Record<string, number>>(
    (counts, shipment) => {
      counts.all += 1;
      counts[shipment.status] = (counts[shipment.status] ?? 0) + 1;
      return counts;
    },
    { all: 0 },
  );
}

export async function listShipments(filters: ShipmentFilters = {}) {
  noStore();
  const tenant = await getTenantContext();

  if (!isSupabaseConfigured()) {
    return { shipments: [], counts: getShipmentCounts([]), company: tenant.company };
  }

  const supabase = await createClient();
  let query = supabase
    .from("shipments")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.origin) query = query.ilike("origin", `%${filters.origin}%`);
  if (filters.destination) query = query.ilike("destination", `%${filters.destination}%`);
  if (filters.route) query = query.ilike("route", `%${filters.route}%`);
  if (filters.cargoType) query = query.eq("cargo_type", filters.cargoType);
  if (filters.dateFrom) query = query.gte("estimated_delivery", filters.dateFrom);
  if (filters.dateTo) query = query.lte("estimated_delivery", filters.dateTo);

  const { data, error } = await query;
  if (error) throw new Error(error.message);

  const mapped = (data ?? []).map(mapShipmentRow);
  const filtered = filters.search ? mapped.filter((shipment) => matchesFilter(shipment, filters)) : mapped;

  return {
    shipments: filtered,
    counts: getShipmentCounts(mapped),
    company: tenant.company,
  };
}

export async function getShipmentById(id: string) {
  noStore();

  if (!isSupabaseConfigured()) {
    return null;
  }

  const supabase = await createClient();
  const { data, error } = await supabase.from("shipments").select("*, assigned_staff:staff!shipments_assigned_staff_id_fkey(full_name), shipment_status_logs(id,to_status,location,notes,public_note,created_at), shipment_documents(id,document_type,file_name,file_path,is_public,created_at), shipment_items(id,item_name,description,quantity,weight_kg,volume_cbm,declared_value,currency,created_at)").eq("id", id).single();
  if (error) return null;
  return mapShipmentRow(data);
}

export async function getPublicShipmentByTrackingNumber(trackingNumber: string) {
  noStore();

  if (!isSupabaseConfigured()) {
    return null;
  }

  let supabase: Awaited<ReturnType<typeof createClient>>;
  try {
    supabase = getSupabaseAdmin() as unknown as Awaited<ReturnType<typeof createClient>>;
  } catch {
    supabase = await createClient();
  }
  const { data, error } = await supabase
    .from("shipments")
    .select("*, assigned_staff:staff!shipments_assigned_staff_id_fkey(full_name), shipment_status_logs(id,to_status,location,notes,public_note,created_at), shipment_items(id,item_name,description,quantity,weight_kg,volume_cbm,declared_value,currency,created_at)")
    .eq("company_id", getDeploymentCompanyId())
    .eq("tracking_number", decodeURIComponent(trackingNumber))
    .single();
  if (error) return null;
  return mapShipmentRow(data);
}

function mapShipmentRow(row: Record<string, unknown>): ShipmentRecord {
  const number = (key: string) => Number(row[key] ?? 0);
  const text = (key: string) => String(row[key] ?? "");
  const status = text("status") as ShipmentRecord["status"];
  const assigned = row.assigned_staff as { full_name?: string } | { full_name?: string }[] | null | undefined;
  const assignedRow = Array.isArray(assigned) ? assigned[0] : assigned;
  const statusLogs = (row.shipment_status_logs as Record<string, unknown>[] | null | undefined) ?? [];
  const documents = (row.shipment_documents as Record<string, unknown>[] | null | undefined) ?? [];
  const items = (row.shipment_items as Record<string, unknown>[] | null | undefined) ?? [];
  return {
    id: text("id"),
    companyId: text("company_id"),
    trackingNumber: text("tracking_number"),
    referenceNumber: text("reference_number"),
    barcodeValue: text("barcode_value") || text("tracking_number"),
    qrCodeValue: text("qr_code_value") || `/track/${text("tracking_number")}`,
    customerId: row.customer_id ? text("customer_id") : null,
    supplierName: text("supplier_name"),
    supplierPhone: text("supplier_phone"),
    supplierEmail: text("supplier_email"),
    supplierLocation: text("supplier_location"),
    customerName: text("customer_name"),
    customerPhone: text("customer_phone"),
    customerEmail: text("customer_email"),
    customerDestination: text("customer_destination"),
    origin: text("origin"),
    destination: text("destination"),
    route: text("route") || `${text("origin")} -> ${text("destination")}`,
    cargoType: text("cargo_type"),
    cargoCategory: text("cargo_category"),
    cargoDescription: text("cargo_description") || text("cargo_details"),
    currency: text("currency") || "USD",
    status,
    estimatedDelivery: text("estimated_delivery"),
    actualDelivery: row.actual_delivery ? text("actual_delivery") : null,
    assignedStaffId: row.assigned_staff_id ? text("assigned_staff_id") : null,
    assignedStaffName: assignedRow?.full_name ?? "",
    assignedDriver: text("assigned_driver"),
    receiverName: text("receiver_name"),
    receiverSignatureUrl: row.receiver_signature_url ? text("receiver_signature_url") : null,
    deliveryNotes: text("delivery_notes"),
    notes: text("notes"),
    pricing: {
      useBalanceWeight: true,
      usePieces: Boolean(row.pieces),
      useVolume: Boolean(row.volume_cbm),
      weightKg: number("weight_kg"),
      pieces: number("pieces"),
      volumeCbm: number("volume_cbm"),
      length: number("length"),
      width: number("width"),
      height: number("height"),
      ratePerKg: number("rate_per_kg"),
      ratePerCbm: number("rate_per_cbm"),
      ratePerPiece: number("rate_per_piece"),
      handlingFee: number("handling_fee"),
      customsFee: number("customs_fee"),
      insuranceFee: number("insurance_fee"),
      discount: number("discount"),
      tax: number("tax"),
      subtotal: number("subtotal"),
      totalAmount: number("total_amount"),
      costAmount: number("cost_amount"),
      profitMargin: number("profit_margin"),
      volumetricWeight: number("volumetric_weight"),
      chargeableWeight: number("chargeable_weight"),
    },
    documents: documents.map((document) => ({ id: String(document.id), documentType: String(document.document_type ?? ""), fileName: String(document.file_name ?? ""), filePath: String(document.file_path ?? ""), isPublic: Boolean(document.is_public), createdAt: String(document.created_at ?? "") })),
    items: items.map((item) => ({
      id: String(item.id),
      itemName: String(item.item_name ?? ""),
      description: String(item.description ?? ""),
      quantity: Number(item.quantity ?? 0),
      weightKg: Number(item.weight_kg ?? 0),
      volumeCbm: Number(item.volume_cbm ?? 0),
      declaredValue: Number(item.declared_value ?? 0),
      currency: String(item.currency ?? text("currency") ?? "USD"),
      createdAt: String(item.created_at ?? ""),
    })),
    timeline: statusLogs.toSorted((left, right) => String(left.created_at).localeCompare(String(right.created_at))).map((event) => ({ id: String(event.id), status: String(event.to_status ?? ""), title: String(event.to_status ?? "").replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()), location: String(event.location ?? ""), notes: String(event.notes ?? ""), publicNote: String(event.public_note ?? ""), createdAt: String(event.created_at ?? "") })),
    auditLogs: [],
    createdBy: row.created_by ? text("created_by") : null,
    createdAt: text("created_at"),
    updatedAt: text("updated_at"),
  };
}
