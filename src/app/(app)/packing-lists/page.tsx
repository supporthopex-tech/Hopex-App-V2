import { PackingListsList } from "@/components/packing-lists/packing-lists-list";
import { listPackingLists } from "@/lib/packing-lists/service";
import type { PackingListFilters } from "@/lib/packing-lists/types";

export default async function PackingListsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters: PackingListFilters = {
    search: stringParam(params.search),
    status: stringParam(params.status) ?? "all",
    dateFrom: stringParam(params.dateFrom),
    dateTo: stringParam(params.dateTo),
  };
  const { lists } = await listPackingLists(filters);
  return <PackingListsList lists={lists} filters={filters} />;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
