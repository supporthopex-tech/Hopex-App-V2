import { StaffList } from "@/components/staff/staff-list";
import { listStaff } from "@/lib/staff/service";
import type { StaffFilters } from "@/lib/staff/types";

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const filters: StaffFilters = {
    search: stringParam(params.search),
    role: stringParam(params.role),
    status: stringParam(params.status),
    department: stringParam(params.department),
    location: stringParam(params.location),
  };
  const result = await listStaff(filters);
  return <StaffList staff={result.staff} roles={result.roles} kpis={result.kpis} filters={filters} />;
}

function stringParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
