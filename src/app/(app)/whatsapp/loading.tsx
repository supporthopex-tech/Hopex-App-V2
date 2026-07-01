import { Skeleton } from "@/components/ui/skeleton";

export default function LoadingWhatsApp() {
  return <div className="space-y-4"><Skeleton className="h-10 w-64" /><Skeleton className="h-[460px] w-full" /></div>;
}
