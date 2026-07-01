import { Badge } from "@/components/ui/badge";
import type { AccountStatus, StaffStatus } from "@/lib/staff/types";

export function StaffStatusBadge({ status }: { status: StaffStatus | string }) {
  const variant = status === "active" ? "success" : status === "suspended" ? "danger" : "warning";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

export function AccountStatusBadge({ status }: { status: AccountStatus | string }) {
  const variant = status === "active" ? "success" : status === "suspended" ? "danger" : status === "invited" ? "warning" : "secondary";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
