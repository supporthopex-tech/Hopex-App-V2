import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingQuotes() {
  return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-24 w-full" /><Skeleton className="h-80 w-full" /></div>;
}
