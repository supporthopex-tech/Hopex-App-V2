import { CustomersList } from "@/components/operations/customers-list";
import { listCustomers } from "@/lib/operations/service";

export default async function CustomersPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const customers = await listCustomers({ search: params.search, status: params.status });
  return <CustomersList customers={customers} filters={{ search: params.search, status: params.status }} />;
}
