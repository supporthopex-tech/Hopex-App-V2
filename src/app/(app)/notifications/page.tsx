import { NotificationsList } from "@/components/notifications/notifications-list";
import { listNotifications } from "@/lib/notifications/service";

export default async function NotificationsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const params = await searchParams;
  const search = params.search ?? "";
  const status = params.status ?? "all";
  const data = await listNotifications(search, status);
  return <NotificationsList {...data} search={search} status={status} />;
}
