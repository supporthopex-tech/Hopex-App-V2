import { Badge } from "@/components/ui/badge";

export function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  const variant =
    ["active", "quoted", "converted", "completed"].includes(normalized) ? "success" :
    ["new", "contacted", "pending", "in_progress"].includes(normalized) ? "warning" :
    ["blocked", "cancelled", "rejected", "closed", "urgent"].includes(normalized) ? "danger" :
    "secondary";
  return <Badge variant={variant}>{status.replaceAll("_", " ")}</Badge>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const variant = priority === "urgent" || priority === "high" ? "danger" : priority === "medium" ? "warning" : "secondary";
  return <Badge variant={variant}>{priority}</Badge>;
}
