"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { normalizeCurrency } from "@/lib/currencies";
import { sendCompanyEmail } from "@/lib/email/send";
import { normalizeDestination } from "@/lib/destinations";
import { calculateShipmentPricing, numberFromForm } from "@/lib/shipments/pricing";
import { generateTrackingNumber } from "@/lib/shipments/tracking";
import type { ShipmentStatus } from "@/lib/shipments/types";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission, requireTenant, isSupabaseConfigured } from "@/lib/tenant";
import { shipmentStatusLabels } from "@/lib/shipments/labels";

type ActionState = {
  ok: boolean;
  message: string;
};

type InsertBuilder = Promise<{ error: { message: string } | null }> & {
  select: (columns?: string) => {
    single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
  };
};

type MutationClient = {
  rpc: (name: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: { message: string } | null }>;
  from: (table: string) => {
    select: (columns?: string) => QueryBuilder;
    insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => InsertBuilder;
    upsert: (payload: Record<string, unknown>, options?: Record<string, unknown>) => Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
    delete: () => {
      eq: (column: string, value: string) => Promise<{ error: { message: string } | null }>;
    };
    eq: (column: string, value: string) => {
      single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
    };
  };
  storage: {
    from: (bucket: string) => {
      upload: (
        path: string,
        file: File,
        options?: { upsert?: boolean; contentType?: string },
      ) => Promise<{ data: unknown; error: { message: string } | null }>;
    };
  };
};

type QueryBuilder = {
  eq: (column: string, value: string) => QueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => QueryBuilder;
  limit: (count: number) => QueryBuilder;
  maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
  single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
};

function checked(formData: FormData, name: string) {
  return formData.get(name) === "on";
}

type ShipmentItemInput = {
  item_name: string;
  description: string | null;
  quantity: number;
  weight_kg: number | null;
  volume_cbm: number | null;
  declared_value: number | null;
  currency: string;
  metadata: Record<string, unknown>;
};

async function mutationClient() {
  return (await createClient()) as unknown as MutationClient;
}

export async function createShipment(_prevState: ActionState, formData: FormData): Promise<ActionState> {
  const tenant = await requirePermission("shipments.create");
  const chargeBasis = String(formData.get("charge_basis") || "pieces");
  const pricing = calculateShipmentPricing({
    useBalanceWeight: chargeBasis === "weight" || checked(formData, "use_balance_weight"),
    usePieces: chargeBasis === "pieces" || checked(formData, "use_pieces"),
    useVolume: chargeBasis === "volume" || checked(formData, "use_volume"),
    weightKg: numberFromForm(formData.get("weight_kg")),
    pieces: numberFromForm(formData.get("pieces")),
    volumeCbm: numberFromForm(formData.get("volume_cbm")),
    length: numberFromForm(formData.get("length")),
    width: numberFromForm(formData.get("width")),
    height: numberFromForm(formData.get("height")),
    ratePerKg: numberFromForm(formData.get("rate_per_kg")),
    ratePerCbm: numberFromForm(formData.get("rate_per_cbm")),
    ratePerPiece: numberFromForm(formData.get("rate_per_piece")),
    handlingFee: numberFromForm(formData.get("handling_fee")),
    customsFee: numberFromForm(formData.get("customs_fee")),
    insuranceFee: numberFromForm(formData.get("insurance_fee")),
    discount: numberFromForm(formData.get("discount")),
    tax: numberFromForm(formData.get("tax")),
    costAmount: numberFromForm(formData.get("cost_amount")),
  });

  if (!isSupabaseConfigured()) {
    revalidatePath("/shipments");
    redirect("/shipments");
  }

  const supabase = await mutationClient();
  const trackingNumber = await nextTrackingNumber(supabase, tenant.company.id, tenant.company.name.slice(0, 3));
  let customerId: string | null;
  try {
    customerId = await ensureShipmentCustomer(supabase, tenant, formData);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not auto-save customer details.",
    };
  }
  const payload = {
    company_id: tenant.company.id,
    tracking_number: trackingNumber,
    reference_number: String(formData.get("reference_number") ?? ""),
    barcode_value: trackingNumber,
    qr_code_value: `/track/${trackingNumber}`,
    customer_id: customerId,
    supplier_name: String(formData.get("supplier_name") ?? ""),
    supplier_phone: String(formData.get("supplier_phone") ?? ""),
    supplier_email: String(formData.get("supplier_email") ?? ""),
    supplier_location: String(formData.get("supplier_location") ?? ""),
    customer_name: String(formData.get("customer_name") ?? ""),
    customer_phone: String(formData.get("customer_phone") ?? ""),
    customer_email: String(formData.get("customer_email") ?? ""),
    customer_destination: String(formData.get("customer_destination") ?? ""),
    origin: String(formData.get("origin") ?? ""),
    destination: normalizeDestination(formData.get("destination")),
    route: String(formData.get("route") ?? ""),
    cargo_type: String(formData.get("cargo_type") ?? ""),
    cargo_category: String(formData.get("cargo_category") ?? ""),
    cargo_description: String(formData.get("cargo_description") ?? ""),
    currency: normalizeCurrency(formData.get("currency") ?? tenant.company.currency),
    weight_kg: pricing.weightKg,
    pieces: pricing.pieces,
    volume_cbm: pricing.volumeCbm,
    length: pricing.length,
    width: pricing.width,
    height: pricing.height,
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
    cost_amount: pricing.costAmount,
    profit_margin: pricing.profitMargin,
    chargeable_weight: pricing.chargeableWeight,
    volumetric_weight: pricing.volumetricWeight,
    estimated_delivery: String(formData.get("estimated_delivery") || "") || null,
    actual_delivery: String(formData.get("actual_delivery") || "") || null,
    assigned_staff_id: String(formData.get("assigned_staff_id") || "") || null,
    assigned_driver: String(formData.get("assigned_driver") ?? ""),
    receiver_name: String(formData.get("receiver_name") ?? ""),
    delivery_notes: String(formData.get("delivery_notes") ?? ""),
    notes: String(formData.get("notes") ?? ""),
    status: String(formData.get("status") || "pending"),
    created_by: tenant.user.id,
  };

  let shipmentItems: ShipmentItemInput[];
  try {
    shipmentItems = readShipmentItems(formData, payload.currency);
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Could not validate shipment items.",
    };
  }

  const { data, error } = await supabase.from("shipments").insert(payload).select("id").single();
  if (error || !data) return { ok: false, message: error?.message ?? "Could not create shipment." };

  const shipmentId = String(data.id);
  await insertShipmentItems(supabase, tenant, shipmentId, shipmentItems);
  await supabase.from("shipment_pricing").insert({
    company_id: tenant.company.id,
    shipment_id: shipmentId,
    use_balance_weight: pricing.useBalanceWeight,
    use_pieces: pricing.usePieces,
    use_volume: pricing.useVolume,
    weight_kg: pricing.weightKg,
    pieces: pricing.pieces,
    volume_cbm: pricing.volumeCbm,
    length: pricing.length,
    width: pricing.width,
    height: pricing.height,
    volumetric_weight: pricing.volumetricWeight,
    chargeable_weight: pricing.chargeableWeight,
    rate_per_kg: pricing.ratePerKg,
    rate_per_cbm: pricing.ratePerCbm,
    rate_per_piece: pricing.ratePerPiece,
    handling_fee: pricing.handlingFee,
    customs_fee: pricing.customsFee,
    insurance_fee: pricing.insuranceFee,
    discount: pricing.discount,
    tax: pricing.tax,
    subtotal: pricing.subtotal,
    total_amount: pricing.totalAmount,
    cost_amount: pricing.costAmount,
    profit_margin: pricing.profitMargin,
    created_by: tenant.user.id,
  });
  await logShipmentEvent(supabase, tenant, shipmentId, "pending", "Shipment created");
  await createShipmentNotification(supabase, tenant, shipmentId, "Shipment created", `${trackingNumber} was created.`);
  if (pricing.totalAmount > 0) {
    const invoiceNumber = await nextInvoiceNumber(supabase, tenant.company.id, tenant.user.id);
    await supabase.from("invoices").insert({
      company_id: tenant.company.id,
      invoice_number: invoiceNumber,
      shipment_id: shipmentId,
      customer_id: payload.customer_id,
      issue_date: new Date().toISOString().slice(0, 10),
      currency: payload.currency,
      subtotal: pricing.subtotal,
      tax_amount: pricing.tax,
      discount_amount: pricing.discount,
      total_amount: pricing.totalAmount,
      amount: pricing.totalAmount,
      paid_amount: 0,
      balance_due: pricing.totalAmount,
      status: "draft",
      created_by: tenant.user.id,
    }).select("id").single();
  }
  await uploadShipmentFiles(supabase, tenant, shipmentId, formData);

  revalidatePath("/shipments");
  redirect(`/shipments/${shipmentId}`);
}

export async function updateShipmentStatus(formData: FormData) {
  const tenant = await requirePermission("shipments.edit");
  const shipmentId = String(formData.get("shipment_id") ?? "");
  const status = String(formData.get("status") ?? "pending") as ShipmentStatus;
  const notes = String(formData.get("notes") ?? "");
  const notifyCustomer = formData.get("notify_customer") === "on";

  if (!isSupabaseConfigured()) {
    revalidatePath(`/shipments/${shipmentId}`);
    return;
  }

  const supabase = await mutationClient();
  if (!shipmentStatusesInclude(status)) throw new Error("Invalid shipment status.");
  const update = await supabase.rpc("update_shipment_status_transaction", { target_shipment_id: shipmentId, target_status: status, target_notes: notes });
  if (update.error) throw new Error(update.error.message);
  if (notifyCustomer) {
    await sendShipmentStatusEmail(supabase, tenant, shipmentId, status, notes);
  }
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipmentId}`);
}

export async function deleteShipment(formData: FormData) {
  const shipmentId = String(formData.get("shipment_id") ?? "");
  const tenant = await requirePermission("shipments.delete");
  if (!isSupabaseConfigured()) {
    revalidatePath("/shipments");
    return;
  }
  const supabase = await mutationClient();
  await supabase.from("shipments").update({ deleted_at: new Date().toISOString(), deleted_by: tenant.user.id, status: "cancelled" }).eq("id", shipmentId);
  await logShipmentEvent(supabase, tenant, shipmentId, "cancelled", "Shipment soft deleted.");
  revalidatePath("/shipments");
}

export async function generateShipmentInvoice(formData: FormData) {
  const tenant = await requireAnyPermission(["invoices.create", "shipments.edit"]);
  const shipmentId = String(formData.get("shipment_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/invoices");
    return;
  }
  const supabase = await mutationClient();
  const shipment = await supabase.from("shipments").select("*").eq("id", shipmentId).single();
  const row = shipment.data;
  if (!row) return;
  const invoiceNumber = await nextInvoiceNumber(supabase, tenant.company.id, tenant.user.id);
  await supabase.from("invoices").insert({
    company_id: tenant.company.id,
    shipment_id: shipmentId,
    customer_id: row.customer_id ?? null,
    invoice_number: invoiceNumber,
    issue_date: new Date().toISOString().slice(0, 10),
    currency: row.currency ?? tenant.company.currency,
    subtotal: row.subtotal ?? row.total_amount ?? 0,
    tax_amount: row.tax ?? 0,
    discount_amount: row.discount ?? 0,
    total_amount: row.total_amount ?? row.price ?? 0,
    amount: row.total_amount ?? row.price ?? 0,
    paid_amount: 0,
    balance_due: row.total_amount ?? row.price ?? 0,
    status: "draft",
    created_by: tenant.user.id,
  });
  await logShipmentEvent(supabase, tenant, shipmentId, String(row.status ?? "pending"), "Invoice generated from shipment.");
  revalidatePath("/invoices");
  revalidatePath(`/shipments/${shipmentId}`);
}

async function nextTrackingNumber(supabase: MutationClient, companyId: string, prefix: string) {
  const currentYear = new Date().getFullYear();
  const latest = await supabase
    .from("shipments")
    .select("tracking_number")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const latestSequence = Number(String(latest.data?.tracking_number ?? "").match(/-(\d+)$/)?.[1] ?? 0);
  return generateTrackingNumber(prefix, latestSequence + 1, new Date(currentYear, 0, 1));
}

async function nextInvoiceNumber(supabase: MutationClient, companyId: string, userId: string) {
  const settings = await supabase
    .from("invoice_settings")
    .select("invoice_prefix,next_invoice_number")
    .eq("company_id", companyId)
    .maybeSingle();
  const prefix = String(settings.data?.invoice_prefix ?? "INV").trim().toUpperCase() || "INV";
  const nextNumber = Math.max(1, Number(settings.data?.next_invoice_number ?? 1));
  await supabase.from("invoice_settings").upsert({
    company_id: companyId,
    invoice_prefix: prefix,
    next_invoice_number: nextNumber + 1,
    created_by: userId,
  }, { onConflict: "company_id" });
  return `${prefix}-${String(nextNumber).padStart(5, "0")}`;
}

async function ensureShipmentCustomer(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  formData: FormData,
) {
  const selectedCustomerId = String(formData.get("customer_id") || "");
  const customerName = String(formData.get("customer_name") ?? "").trim();
  const customerPhone = String(formData.get("customer_phone") ?? "").trim();
  const customerEmail = String(formData.get("customer_email") ?? "").trim();
  if (!customerName && !customerPhone && !customerEmail) return null;

  const customerPayload = {
    full_name: customerName,
    company_name: customerName,
    contact_name: customerName,
    phone: customerPhone,
    email: customerEmail,
    address: String(formData.get("customer_destination") ?? ""),
    city: normalizeDestination(formData.get("destination")),
    status: "active",
  };
  if (selectedCustomerId) {
    const update = await supabase.from("customers").update(customerPayload).eq("id", selectedCustomerId);
    if (update.error) throw new Error(update.error.message);
    return selectedCustomerId;
  }

  const existingByEmail = customerEmail
    ? await supabase
      .from("customers")
      .select("id")
      .eq("company_id", tenant.company.id)
      .eq("email", customerEmail)
      .maybeSingle()
    : null;
  if (existingByEmail?.data?.id) {
    const id = String(existingByEmail.data.id);
    const update = await supabase.from("customers").update(customerPayload).eq("id", id);
    if (update.error) throw new Error(update.error.message);
    return id;
  }

  const existingByPhone = customerPhone
    ? await supabase
      .from("customers")
      .select("id")
      .eq("company_id", tenant.company.id)
      .eq("phone", customerPhone)
      .maybeSingle()
    : null;
  if (existingByPhone?.data?.id) {
    const id = String(existingByPhone.data.id);
    const update = await supabase.from("customers").update(customerPayload).eq("id", id);
    if (update.error) throw new Error(update.error.message);
    return id;
  }

  const result = supabase.from("customers").insert({
    company_id: tenant.company.id,
    ...customerPayload,
    country: "",
    customer_type: "standard",
    status: "active",
    notes: "Auto-created from shipment.",
    created_by: tenant.user.id,
  });
  const { data, error } = await result.select("id").single();
  if (error || !data?.id) throw new Error(error?.message ?? "Could not auto-save customer details.");
  return String(data.id);
}

export async function updateShipment(formData: FormData) {
  const tenant = await requirePermission("shipments.edit");
  const shipmentId = String(formData.get("shipment_id") ?? "");
  const chargeBasis = String(formData.get("charge_basis") || "pieces");
  const status = String(formData.get("status") || "pending");
  if (!shipmentId || !shipmentStatusesInclude(status)) throw new Error("Invalid shipment update.");
  if (!isSupabaseConfigured()) return;

  const pricing = calculateShipmentPricing({
    useBalanceWeight: chargeBasis === "weight",
    usePieces: chargeBasis === "pieces",
    useVolume: chargeBasis === "volume",
    weightKg: numberFromForm(formData.get("weight_kg")),
    pieces: numberFromForm(formData.get("pieces")),
    volumeCbm: numberFromForm(formData.get("volume_cbm")),
    length: numberFromForm(formData.get("length")),
    width: numberFromForm(formData.get("width")),
    height: numberFromForm(formData.get("height")),
    ratePerKg: numberFromForm(formData.get("rate_per_kg")),
    ratePerCbm: numberFromForm(formData.get("rate_per_cbm")),
    ratePerPiece: numberFromForm(formData.get("rate_per_piece")),
    handlingFee: numberFromForm(formData.get("handling_fee")),
    customsFee: numberFromForm(formData.get("customs_fee")),
    insuranceFee: numberFromForm(formData.get("insurance_fee")),
    discount: numberFromForm(formData.get("discount")),
    tax: numberFromForm(formData.get("tax")),
    costAmount: numberFromForm(formData.get("cost_amount")),
  });
  const supabase = await mutationClient();
  const customerId = await ensureShipmentCustomer(supabase, tenant, formData);
  const shipmentItems = readShipmentItems(formData, normalizeCurrency(formData.get("currency") ?? tenant.company.currency));
  const payload = {
    customer_id: customerId,
    customer_name: String(formData.get("customer_name") ?? ""), customer_phone: String(formData.get("customer_phone") ?? ""), customer_email: String(formData.get("customer_email") ?? ""), customer_destination: String(formData.get("customer_destination") ?? ""),
    supplier_name: String(formData.get("supplier_name") ?? ""), supplier_phone: String(formData.get("supplier_phone") ?? ""), supplier_email: String(formData.get("supplier_email") ?? ""), supplier_location: String(formData.get("supplier_location") ?? ""),
    origin: String(formData.get("origin") ?? ""), destination: normalizeDestination(formData.get("destination")), route: String(formData.get("route") ?? ""), cargo_type: String(formData.get("cargo_type") ?? ""), cargo_category: String(formData.get("cargo_category") ?? ""), cargo_description: String(formData.get("cargo_description") ?? ""),
    currency: normalizeCurrency(formData.get("currency") ?? tenant.company.currency), status, estimated_delivery: String(formData.get("estimated_delivery") || "") || null, actual_delivery: String(formData.get("actual_delivery") || "") || null, assigned_staff_id: String(formData.get("assigned_staff_id") || "") || null, assigned_driver: String(formData.get("assigned_driver") ?? ""), delivery_notes: String(formData.get("delivery_notes") ?? ""), notes: String(formData.get("notes") ?? ""),
    weight_kg: pricing.weightKg, pieces: pricing.pieces, volume_cbm: pricing.volumeCbm, length: pricing.length, width: pricing.width, height: pricing.height, rate_per_kg: pricing.ratePerKg, rate_per_cbm: pricing.ratePerCbm, rate_per_piece: pricing.ratePerPiece, handling_fee: pricing.handlingFee, customs_fee: pricing.customsFee, insurance_fee: pricing.insuranceFee, subtotal: pricing.subtotal, tax: pricing.tax, discount: pricing.discount, total_amount: pricing.totalAmount, cost_amount: pricing.costAmount, profit_margin: pricing.profitMargin, chargeable_weight: pricing.chargeableWeight, volumetric_weight: pricing.volumetricWeight, updated_at: new Date().toISOString(),
  };
  const update = await supabase.from("shipments").update(payload).eq("id", shipmentId);
  if (update.error) throw new Error(update.error.message);
  await supabase.from("shipment_pricing").upsert({ company_id: tenant.company.id, shipment_id: shipmentId, use_balance_weight: pricing.useBalanceWeight, use_pieces: pricing.usePieces, use_volume: pricing.useVolume, weight_kg: pricing.weightKg, pieces: pricing.pieces, volume_cbm: pricing.volumeCbm, length: pricing.length, width: pricing.width, height: pricing.height, volumetric_weight: pricing.volumetricWeight, chargeable_weight: pricing.chargeableWeight, rate_per_kg: pricing.ratePerKg, rate_per_cbm: pricing.ratePerCbm, rate_per_piece: pricing.ratePerPiece, handling_fee: pricing.handlingFee, customs_fee: pricing.customsFee, insurance_fee: pricing.insuranceFee, discount: pricing.discount, tax: pricing.tax, subtotal: pricing.subtotal, total_amount: pricing.totalAmount, cost_amount: pricing.costAmount, profit_margin: pricing.profitMargin, created_by: tenant.user.id }, { onConflict: "shipment_id" });
  await replaceShipmentItems(supabase, tenant, shipmentId, shipmentItems);
  await logShipmentEvent(supabase, tenant, shipmentId, status, "Shipment details updated.");
  revalidatePath("/shipments");
  revalidatePath(`/shipments/${shipmentId}`);
  redirect(`/shipments/${shipmentId}`);
}

function shipmentStatusesInclude(status: string): status is ShipmentStatus {
  return ["pending", "received", "in_warehouse", "in_transit", "arrived", "out_for_delivery", "delivered", "cancelled"].includes(status);
}

function readShipmentItems(formData: FormData, currency: string): ShipmentItemInput[] {
  const count = Math.min(50, Math.max(0, Number(formData.get("shipment_item_count") ?? 0)));
  const items: ShipmentItemInput[] = [];
  for (let index = 0; index < count; index += 1) {
    const itemName = String(formData.get(`shipment_item_name_${index}`) ?? "").trim();
    const description = String(formData.get(`shipment_item_description_${index}`) ?? "").trim();
    const quantity = Math.max(1, Math.trunc(numberFromForm(formData.get(`shipment_item_quantity_${index}`)) || 1));
    const weightKg = numberFromForm(formData.get(`shipment_item_weight_kg_${index}`));
    const volumeCbm = numberFromForm(formData.get(`shipment_item_volume_cbm_${index}`));
    const declaredValue = numberFromForm(formData.get(`shipment_item_declared_value_${index}`));
    const hasItemData = Boolean(itemName || description || weightKg || volumeCbm || declaredValue || quantity > 1);
    if (!hasItemData) continue;
    if (!itemName) throw new Error("Each shipment item needs an item name.");
    items.push({
      item_name: itemName,
      description: description || null,
      quantity,
      weight_kg: weightKg || null,
      volume_cbm: volumeCbm || null,
      declared_value: declaredValue || null,
      currency,
      metadata: { lineNumber: index + 1 },
    });
  }
  if (!items.length) throw new Error("Add at least one shipment item.");
  return items;
}

async function insertShipmentItems(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  shipmentId: string,
  items: ShipmentItemInput[],
) {
  const payload = items.map((item) => ({
    company_id: tenant.company.id,
    shipment_id: shipmentId,
    ...item,
    created_by: tenant.user.id,
  }));
  const result = await supabase.from("shipment_items").insert(payload);
  if (result.error) throw new Error(result.error.message);
}

async function replaceShipmentItems(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  shipmentId: string,
  items: ShipmentItemInput[],
) {
  const removeExisting = await supabase.from("shipment_items").delete().eq("shipment_id", shipmentId);
  if (removeExisting.error) throw new Error(removeExisting.error.message);
  await insertShipmentItems(supabase, tenant, shipmentId, items);
}

export async function generateShipmentQuote(formData: FormData) {
  const tenant = await requireAnyPermission(["quotes.create", "shipments.edit"]);
  const shipmentId = String(formData.get("shipment_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/quotes");
    return;
  }
  const supabase = await mutationClient();
  const shipment = await supabase.from("shipments").select("*").eq("id", shipmentId).single();
  const row = shipment.data;
  if (!row) return;
  await supabase.from("quotes").insert({
    company_id: tenant.company.id,
    customer_id: row.customer_id ?? null,
    origin: row.origin ?? "",
    destination: normalizeDestination(row.destination as string | null | undefined),
    amount: row.total_amount ?? row.price ?? 0,
    currency: row.currency ?? tenant.company.currency,
    status: "draft",
    notes: `Generated from shipment ${row.tracking_number ?? ""}`,
    created_by: tenant.user.id,
  });
  await logShipmentEvent(supabase, tenant, shipmentId, String(row.status ?? "pending"), "Quote generated from shipment.");
  revalidatePath("/quotes");
  revalidatePath(`/shipments/${shipmentId}`);
}

async function logShipmentEvent(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  shipmentId: string,
  status: string,
  notes: string,
) {
  await supabase.from("shipment_events").insert({
    company_id: tenant.company.id,
    shipment_id: shipmentId,
    event_type: "status",
    status,
    notes,
    created_by: tenant.user.id,
  });
  await supabase.from("shipment_status_logs").insert({
    company_id: tenant.company.id,
    shipment_id: shipmentId,
    to_status: status,
    notes,
    public_note: notes,
    created_by: tenant.user.id,
  });
  await supabase.from("audit_logs").insert({
    company_id: tenant.company.id,
    actor_id: tenant.user.id,
    action: "shipment.status_updated",
    table_name: "shipments",
    record_id: shipmentId,
    after: { status, notes },
    created_by: tenant.user.id,
  });
}

async function createShipmentNotification(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  shipmentId: string,
  title: string,
  body: string,
) {
  await supabase.from("notifications").insert({
    company_id: tenant.company.id,
    user_id: tenant.user.id,
    title,
    body,
    created_by: tenant.user.id,
  });
  await supabase.from("audit_logs").insert({
    company_id: tenant.company.id,
    actor_id: tenant.user.id,
    action: "notification.shipment",
    table_name: "shipments",
    record_id: shipmentId,
    after: { title, body, channels: ["in_app", "email", "whatsapp_ready"] },
    created_by: tenant.user.id,
  });
}

async function sendShipmentStatusEmail(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  shipmentId: string,
  status: ShipmentStatus,
  notes: string,
) {
  const { data: shipment } = await supabase
    .from("shipments")
    .select("id,tracking_number,status,origin,destination,estimated_delivery,qr_code_value,customer_name,customer_email,customer_id")
    .eq("id", shipmentId)
    .single();
  if (!shipment?.customer_email) return;

  const trackingNumber = String(shipment.tracking_number ?? "");
  const customerEmail = String(shipment.customer_email ?? "");
  const subject = `Shipment ${trackingNumber} is ${shipmentStatusLabels[status]}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "";
  const trackingLink = appUrl && trackingNumber ? `${appUrl}/track/${encodeURIComponent(trackingNumber)}` : "";
  const body = notes || `Your shipment status has been updated to ${shipmentStatusLabels[status]}.`;

  await insertStatusEmailLog(supabase, tenant, {
    eventType: "shipment_status_send_pending",
    status: "pending",
    recipient: customerEmail,
    subject,
    relatedCustomerId: shipment.customer_id ? String(shipment.customer_id) : null,
    relatedShipmentId: shipmentId,
  });

  try {
    const result = await sendCompanyEmail({
      tenant,
      to: customerEmail,
      subject,
      body,
      templateKey: "shipment-status",
      context: {
        customerName: String(shipment.customer_name ?? ""),
        message: body,
        shipment: {
          trackingNumber,
          status: shipmentStatusLabels[status],
          origin: String(shipment.origin ?? ""),
          destination: String(shipment.destination ?? ""),
          estimatedDelivery: String(shipment.estimated_delivery ?? ""),
          trackingLink,
          qrCodeUrl: String(shipment.qr_code_value ?? "").startsWith("http") ? String(shipment.qr_code_value) : "",
        },
      },
      attachments: [],
    });
    await insertStatusEmailLog(supabase, tenant, {
      eventType: "shipment_status_resend_sent",
      status: "sent",
      recipient: customerEmail,
      subject: result.subject,
      relatedCustomerId: shipment.customer_id ? String(shipment.customer_id) : null,
      relatedShipmentId: shipmentId,
      resendMessageId: result.resendMessageId,
      sentAt: new Date().toISOString(),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not send shipment status email.";
    await insertStatusEmailLog(supabase, tenant, {
      eventType: "shipment_status_resend_failed",
      status: "failed",
      recipient: customerEmail,
      subject,
      relatedCustomerId: shipment.customer_id ? String(shipment.customer_id) : null,
      relatedShipmentId: shipmentId,
      errorMessage: message,
    });
    await supabase.from("notifications").insert({
      company_id: tenant.company.id,
      user_id: tenant.user.id,
      title: "Shipment email failed",
      body: message,
      created_by: tenant.user.id,
    });
  }
}

async function insertStatusEmailLog(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  input: {
    eventType: string;
    status: "sent" | "failed" | "pending";
    recipient: string;
    subject: string;
    relatedCustomerId?: string | null;
    relatedShipmentId?: string | null;
    resendMessageId?: string | null;
    errorMessage?: string | null;
    sentAt?: string | null;
  },
) {
  await supabase.from("email_logs").insert({
    company_id: tenant.company.id,
    event_type: input.eventType,
    status: input.status,
    recipient: input.recipient,
    subject: input.subject,
    sent_by: tenant.user.id,
    related_customer_id: input.relatedCustomerId ?? null,
    related_shipment_id: input.relatedShipmentId ?? null,
    resend_message_id: input.resendMessageId ?? null,
    error_message: input.errorMessage ?? null,
    sent_at: input.sentAt ?? null,
    metadata: {
      recipient: input.recipient,
      subject: input.subject,
      resend_message_id: input.resendMessageId ?? null,
      error_message: input.errorMessage ?? null,
    },
    created_by: tenant.user.id,
  });
}

async function uploadShipmentFiles(
  supabase: MutationClient,
  tenant: Awaited<ReturnType<typeof requireTenant>>,
  shipmentId: string,
  formData: FormData,
) {
  const fileFields = [
    ["cargo_images", "cargo_image"],
    ["invoice_documents", "invoice_document"],
    ["packing_list", "packing_list"],
    ["bill_of_lading", "bill_of_lading"],
    ["customs_documents", "customs_document"],
    ["other_files", "other"],
  ];

  for (const [fieldName, documentType] of fileFields) {
    const files = formData.getAll(fieldName).filter((value): value is File => value instanceof File && value.size > 0);
    for (const file of files) {
      const path = `${tenant.company.id}/${shipmentId}/${documentType}/${Date.now()}-${file.name}`;
      const upload = await supabase.storage.from("shipment-documents").upload(path, file, {
        upsert: false,
        contentType: file.type,
      });
      if (!upload.error) {
        await supabase.from("shipment_documents").insert({
          company_id: tenant.company.id,
          shipment_id: shipmentId,
          document_type: documentType,
          file_name: file.name,
          file_path: path,
          mime_type: file.type,
          size_bytes: file.size,
          created_by: tenant.user.id,
        });
      }
    }
  }
}
