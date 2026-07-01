import { PackingListForm } from "@/components/packing-lists/packing-list-form";
import { listPackingShipmentOptions } from "@/lib/packing-lists/service";

export default async function NewPackingListPage() {
  const shipments = await listPackingShipmentOptions();
  return <PackingListForm shipments={shipments} />;
}
