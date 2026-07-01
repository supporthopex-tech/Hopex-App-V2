import { Badge } from "@/components/ui/badge";

export function AccountingStatusBadge({ status }: { status: string }) {
  const value = status.toLowerCase();
  const variant =
    ["posted", "paid", "approved", "sent"].includes(value) ? "success" :
    ["draft", "submitted", "partially_paid", "pending"].includes(value) ? "warning" :
    ["void", "rejected", "cancelled", "overdue", "reversed"].includes(value) ? "danger" :
    "secondary";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}
