import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingSettings() {
  return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-[520px] w-full" /></div>;
}
