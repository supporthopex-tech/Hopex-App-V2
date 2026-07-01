"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { requireAnyPermission, requirePermission, isSupabaseConfigured } from "@/lib/tenant";
import type { PackingListStatus } from "@/lib/packing-lists/types";

type ActionState = { ok: boolean; message: string };
const initialOk: ActionState = { ok: true, message: "" };

type QueryResult<T = Record<string, unknown>> = Promise<{ data: T | null; error: { message: string } | null }>;
type LooseMutationClient = {
  from: (table: string) => {
    select: (columns?: string) => LooseQueryBuilder;
    insert: (payload: Record<string, unknown> | Record<string, unknown>[]) => { select: (columns?: string) => { single: () => QueryResult<Record<string, unknown>> } } | Promise<{ error: { message: string } | null }>;
    update: (payload: Record<string, unknown>) => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
    delete: () => { eq: (column: string, value: string) => Promise<{ error: { message: string } | null }> };
  };
};
type LooseQueryBuilder = {
  eq: (column: string, value: string) => LooseQueryBuilder;
  like: (column: string, value: string) => LooseQueryBuilder;
  order: (column: string, options?: { ascending?: boolean }) => LooseQueryBuilder;
  limit: (count: number) => LooseQueryBuilder;
  maybeSingle: () => QueryResult<Record<string, unknown>>;
};

const itemSchema = z.object({
  boxNumber: z.string().trim().min(1).max(50),
  shipmentId: z.string().trim().uuid().optional().or(z.literal("")),
  customerId: z.string().trim().uuid().optional().or(z.literal("")),
  customerName: z.string().trim().min(1).max(200),
  trackingNumber: z.string().trim().min(1).max(120),
  itemDescription: z.string().trim().min(1).max(500),
  quantity: z.coerce.number().min(0).max(1_000_000),
  quantityLabel: z.string().trim().max(80).optional(),
  weight: z.coerce.number().min(0).max(1_000_000),
  remarks: z.string().trim().max(500).optional(),
});

const itemsSchema = z.array(itemSchema).min(1, "Add at least one packed item.");

export async function createPackingList(prevState: ActionState = initialOk, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("packing_lists.create");
  if (!isSupabaseConfigured()) {
    revalidatePath("/packing-lists");
    redirect("/packing-lists");
  }
  const supabase = (await createClient()) as unknown as LooseMutationClient;
  const parsedItems = parseItems(formData);
  if (!parsedItems.ok) return { ok: false, message: parsedItems.message };

  const dispatchDate = String(formData.get("dispatch_date") || new Date().toISOString().slice(0, 10));
  const destination = String(formData.get("destination") ?? "").trim();
  if (!destination) return { ok: false, message: "Destination is required." };
  const status = normalizeStatus(String(formData.get("status") || "draft"));
  const packingListNumber = await nextPackingListNumber(supabase, tenant.company.id, dispatchDate);
  const totals = calculateTotals(parsedItems.items);

  const insert = supabase.from("packing_lists").insert({
    company_id: tenant.company.id,
    packing_list_number: packingListNumber,
    dispatch_date: dispatchDate,
    destination,
    prepared_by: tenant.user.id,
    prepared_by_name: tenant.user.name || tenant.user.email,
    status,
    total_boxes: totals.totalBoxes,
    total_customers: totals.totalCustomers,
    total_items: totals.totalItems,
    total_weight: totals.totalWeight,
    remarks: String(formData.get("remarks") ?? ""),
    created_by: tenant.user.id,
    dispatched_at: status === "dispatched" ? new Date().toISOString() : null,
  }) as unknown as { select: (columns?: string) => { single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }> } };
  const { data, error } = await insert.select("id").single();
  if (error || !data?.id) return { ok: false, message: error?.message ?? "Could not create packing list." };
  const packingListId = String(data.id);
  await replacePackingListContents(supabase, tenant.company.id, tenant.user.id, packingListId, parsedItems.items);
  await audit(supabase, tenant.company.id, tenant.user.id, "packing_list.created", packingListId);
  revalidatePath("/packing-lists");
  redirect(`/packing-lists/${packingListId}`);
}

export async function updatePackingList(prevState: ActionState = initialOk, formData: FormData): Promise<ActionState> {
  void prevState;
  const tenant = await requirePermission("packing_lists.update");
  const packingListId = String(formData.get("packing_list_id") ?? "");
  if (!packingListId) return { ok: false, message: "Packing list is missing." };
  if (!isSupabaseConfigured()) {
    revalidatePath(`/packing-lists/${packingListId}`);
    return { ok: true, message: "Saved." };
  }
  const parsedItems = parseItems(formData);
  if (!parsedItems.ok) return { ok: false, message: parsedItems.message };
  const destination = String(formData.get("destination") ?? "").trim();
  if (!destination) return { ok: false, message: "Destination is required." };
  const status = normalizeStatus(String(formData.get("status") || "draft"));
  const totals = calculateTotals(parsedItems.items);
  const supabase = (await createClient()) as unknown as LooseMutationClient;
  const update = await supabase.from("packing_lists").update({
    dispatch_date: String(formData.get("dispatch_date") || new Date().toISOString().slice(0, 10)),
    destination,
    status,
    total_boxes: totals.totalBoxes,
    total_customers: totals.totalCustomers,
    total_items: totals.totalItems,
    total_weight: totals.totalWeight,
    remarks: String(formData.get("remarks") ?? ""),
    dispatched_at: status === "dispatched" ? new Date().toISOString() : null,
  }).eq("id", packingListId);
  if (update.error) return { ok: false, message: update.error.message };
  await replacePackingListContents(supabase, tenant.company.id, tenant.user.id, packingListId, parsedItems.items);
  await audit(supabase, tenant.company.id, tenant.user.id, "packing_list.updated", packingListId);
  revalidatePath("/packing-lists");
  revalidatePath(`/packing-lists/${packingListId}`);
  return { ok: true, message: "Packing list saved." };
}

export async function updatePackingListStatus(formData: FormData) {
  const tenant = await requireAnyPermission(["packing_lists.update", "packing_lists.create"]);
  const id = String(formData.get("packing_list_id") ?? "");
  const status = normalizeStatus(String(formData.get("status") || "draft"));
  if (!isSupabaseConfigured()) {
    revalidatePath(`/packing-lists/${id}`);
    return;
  }
  const supabase = (await createClient()) as unknown as LooseMutationClient;
  await supabase.from("packing_lists").update({
    status,
    dispatched_at: status === "dispatched" ? new Date().toISOString() : null,
  }).eq("id", id);
  await audit(supabase, tenant.company.id, tenant.user.id, `packing_list.${status}`, id);
  revalidatePath("/packing-lists");
  revalidatePath(`/packing-lists/${id}`);
}

export async function deletePackingList(formData: FormData) {
  await requirePermission("packing_lists.delete");
  const id = String(formData.get("packing_list_id") ?? "");
  if (!isSupabaseConfigured()) {
    revalidatePath("/packing-lists");
    return;
  }
  const supabase = (await createClient()) as unknown as LooseMutationClient;
  await supabase.from("packing_lists").delete().eq("id", id);
  revalidatePath("/packing-lists");
  redirect("/packing-lists");
}

function parseItems(formData: FormData) {
  const raw = String(formData.get("items_json") ?? "[]");
  let decoded: unknown;
  try {
    decoded = JSON.parse(raw);
  } catch {
    return { ok: false as const, message: "Packing list items could not be read." };
  }
  const parsed = itemsSchema.safeParse(decoded);
  if (!parsed.success) {
    return { ok: false as const, message: parsed.error.issues[0]?.message ?? "Packing list items are invalid." };
  }
  return { ok: true as const, items: parsed.data };
}

function normalizeStatus(value: string): PackingListStatus {
  return value === "ready" || value === "dispatched" ? value : "draft";
}

async function nextPackingListNumber(supabase: LooseMutationClient, companyId: string, dispatchDate: string) {
  const compactDate = dispatchDate.replaceAll("-", "");
  const prefix = `PL-${compactDate}`;
  const latest = await supabase
    .from("packing_lists")
    .select("packing_list_number")
    .eq("company_id", companyId)
    .like("packing_list_number", `${prefix}-%`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sequence = Number(String(latest.data?.packing_list_number ?? "").match(/-(\d+)$/)?.[1] ?? 0) + 1;
  return `${prefix}-${String(sequence).padStart(3, "0")}`;
}

async function replacePackingListContents(
  supabase: LooseMutationClient,
  companyId: string,
  userId: string,
  packingListId: string,
  items: z.infer<typeof itemsSchema>,
) {
  await supabase.from("packing_list_boxes").delete().eq("packing_list_id", packingListId);
  const boxNumbers = [...new Set(items.map((item) => item.boxNumber))];
  const boxRows = boxNumbers.map((boxNumber, index) => ({
    company_id: companyId,
    packing_list_id: packingListId,
    box_number: boxNumber,
    barcode_value: `${packingListId}:${boxNumber}`,
    sort_order: index,
    created_by: userId,
  }));
  const boxInsert = supabase.from("packing_list_boxes").insert(boxRows) as unknown as { select: (columns?: string) => Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }> };
  const { data: boxes, error } = await boxInsert.select("id,box_number");
  if (error || !boxes) throw new Error(error?.message ?? "Could not save boxes.");
  const boxIdByNumber = new Map(boxes.map((box) => [String(box.box_number), String(box.id)]));
  await supabase.from("packing_list_items").insert(items.map((item, index) => ({
    company_id: companyId,
    packing_list_id: packingListId,
    box_id: boxIdByNumber.get(item.boxNumber),
    shipment_id: item.shipmentId || null,
    customer_id: item.customerId || null,
    customer_name: item.customerName,
    tracking_number: item.trackingNumber,
    item_description: item.itemDescription,
    quantity: item.quantity,
    quantity_label: item.quantityLabel || String(item.quantity),
    weight: item.weight,
    remarks: item.remarks || "",
    sort_order: index,
    created_by: userId,
  })));
}

function calculateTotals(items: z.infer<typeof itemsSchema>) {
  return {
    totalBoxes: new Set(items.map((item) => item.boxNumber)).size,
    totalCustomers: new Set(items.map((item) => `${item.customerId || item.customerName}`)).size,
    totalItems: items.reduce((sum, item) => sum + item.quantity, 0),
    totalWeight: items.reduce((sum, item) => sum + item.weight, 0),
  };
}

async function audit(supabase: LooseMutationClient, companyId: string, actorId: string, action: string, recordId: string) {
  await supabase.from("audit_logs").insert({
    company_id: companyId,
    actor_id: actorId,
    action,
    table_name: "packing_lists",
    record_id: recordId,
    created_by: actorId,
  });
  await supabase.from("notifications").insert({
    company_id: companyId,
    user_id: actorId,
    title: action.replaceAll(".", " "),
    body: "Packing list activity recorded.",
    created_by: actorId,
  });
}
