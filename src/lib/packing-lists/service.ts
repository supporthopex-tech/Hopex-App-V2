import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { getTenantContext, isSupabaseConfigured } from "@/lib/tenant";
import type { PackingListFilters, PackingListRecord, PackingShipmentOption } from "@/lib/packing-lists/types";

type LooseQuery = {
  select: (columns?: string) => LooseQuery;
  eq: (column: string, value: string) => LooseQuery;
  is: (column: string, value: null) => LooseQuery;
  gte: (column: string, value: string) => LooseQuery;
  lte: (column: string, value: string) => LooseQuery;
  order: (column: string, options?: { ascending?: boolean }) => LooseQuery;
  limit: (count: number) => LooseQuery;
  single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>;
};
type LooseClient = {
  from: (table: string) => LooseQuery;
};
type ListResult = Promise<{ data: Record<string, unknown>[] | null; error: { message: string } | null }>;

export async function listPackingLists(filters: PackingListFilters = {}) {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return { lists: [] as PackingListRecord[], company: tenant.company };

  const supabase = (await createClient()) as unknown as LooseClient;
  let query = supabase
    .from("packing_lists")
    .select("*, packing_list_boxes(id,box_number,barcode_value,remarks,sort_order, packing_list_items(id,box_id,shipment_id,customer_id,customer_name,tracking_number,item_description,quantity,quantity_label,weight,remarks,sort_order))")
    .eq("company_id", tenant.company.id)
    .order("dispatch_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (filters.status && filters.status !== "all") query = query.eq("status", filters.status);
  if (filters.dateFrom) query = query.gte("dispatch_date", filters.dateFrom);
  if (filters.dateTo) query = query.lte("dispatch_date", filters.dateTo);

  const { data, error } = await (query as unknown as ListResult);
  if (error) throw new Error(error.message);
  const mapped = ((data ?? []) as Record<string, unknown>[]).map(mapPackingList);
  const search = filters.search?.trim().toLowerCase();
  return {
    lists: search ? mapped.filter((list) => matchesSearch(list, search)) : mapped,
    company: tenant.company,
  };
}

export async function getPackingList(id: string) {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return null;
  const supabase = (await createClient()) as unknown as LooseClient;
  const { data, error } = await supabase
    .from("packing_lists")
    .select("*, packing_list_boxes(id,box_number,barcode_value,remarks,sort_order, packing_list_items(id,box_id,shipment_id,customer_id,customer_name,tracking_number,item_description,quantity,quantity_label,weight,remarks,sort_order))")
    .eq("company_id", tenant.company.id)
    .eq("id", id)
    .single();
  if (error || !data) return null;
  return mapPackingList(data as Record<string, unknown>);
}

export async function listPackingShipmentOptions(): Promise<PackingShipmentOption[]> {
  noStore();
  const tenant = await getTenantContext();
  if (!isSupabaseConfigured()) return [];
  const supabase = (await createClient()) as unknown as LooseClient;
  const query = supabase
    .from("shipments")
    .select("id,tracking_number,customer_id,customer_name,cargo_description,cargo_type,pieces,weight_kg,chargeable_weight,destination")
    .eq("company_id", tenant.company.id)
    .is("deleted_at", null)
    .order("created_at", { ascending: false })
    .limit(300);
  const { data, error } = await (query as unknown as ListResult);
  if (error) throw new Error(error.message);
  return ((data ?? []) as Record<string, unknown>[]).map((row) => {
    const pieces = Number(row.pieces ?? 0);
    const weight = Number(row.weight_kg ?? row.chargeable_weight ?? 0);
    return {
      id: String(row.id ?? ""),
      trackingNumber: String(row.tracking_number ?? ""),
      customerId: row.customer_id ? String(row.customer_id) : null,
      customerName: String(row.customer_name ?? ""),
      itemDescription: String(row.cargo_description ?? row.cargo_type ?? ""),
      quantity: pieces || 1,
      quantityLabel: pieces ? `${pieces} pcs` : "1",
      weight,
      destination: String(row.destination ?? ""),
    };
  });
}

function mapPackingList(row: Record<string, unknown>): PackingListRecord {
  const boxesRaw = ((row.packing_list_boxes as Record<string, unknown>[] | null | undefined) ?? []).toSorted((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0));
  const boxes = boxesRaw.map((box) => {
    const itemsRaw = ((box.packing_list_items as Record<string, unknown>[] | null | undefined) ?? []).toSorted((left, right) => Number(left.sort_order ?? 0) - Number(right.sort_order ?? 0));
    return {
      id: String(box.id ?? ""),
      boxNumber: String(box.box_number ?? ""),
      barcodeValue: String(box.barcode_value ?? ""),
      remarks: String(box.remarks ?? ""),
      sortOrder: Number(box.sort_order ?? 0),
      items: itemsRaw.map((item) => ({
        id: String(item.id ?? ""),
        boxId: String(item.box_id ?? box.id ?? ""),
        shipmentId: item.shipment_id ? String(item.shipment_id) : null,
        customerId: item.customer_id ? String(item.customer_id) : null,
        customerName: String(item.customer_name ?? ""),
        trackingNumber: String(item.tracking_number ?? ""),
        itemDescription: String(item.item_description ?? ""),
        quantity: Number(item.quantity ?? 0),
        quantityLabel: String(item.quantity_label ?? ""),
        weight: Number(item.weight ?? 0),
        remarks: String(item.remarks ?? ""),
        sortOrder: Number(item.sort_order ?? 0),
      })),
    };
  });
  return {
    id: String(row.id ?? ""),
    companyId: String(row.company_id ?? ""),
    packingListNumber: String(row.packing_list_number ?? ""),
    dispatchDate: String(row.dispatch_date ?? ""),
    destination: String(row.destination ?? ""),
    preparedBy: row.prepared_by ? String(row.prepared_by) : null,
    preparedByName: String(row.prepared_by_name ?? ""),
    status: String(row.status ?? "draft") as PackingListRecord["status"],
    totalBoxes: Number(row.total_boxes ?? 0),
    totalCustomers: Number(row.total_customers ?? 0),
    totalItems: Number(row.total_items ?? 0),
    totalWeight: Number(row.total_weight ?? 0),
    remarks: String(row.remarks ?? ""),
    dispatchedAt: row.dispatched_at ? String(row.dispatched_at) : null,
    createdBy: row.created_by ? String(row.created_by) : null,
    createdAt: String(row.created_at ?? ""),
    updatedAt: String(row.updated_at ?? ""),
    boxes,
  };
}

function matchesSearch(list: PackingListRecord, search: string) {
  const haystack = [
    list.packingListNumber,
    list.dispatchDate,
    list.destination,
    list.status,
    ...list.boxes.flatMap((box) => [
      box.boxNumber,
      ...box.items.flatMap((item) => [item.customerName, item.trackingNumber, item.itemDescription]),
    ]),
  ].join(" ").toLowerCase();
  return haystack.includes(search);
}
