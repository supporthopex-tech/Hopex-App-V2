import Link from "next/link";
import { Bell, Check, Search, Trash2, Undo2 } from "lucide-react";
import { deleteNotification, markNotificationRead, markNotificationUnread } from "@/app/(app)/notifications/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { NotificationRecord } from "@/lib/notifications/service";

export function NotificationsList({
  notifications,
  unread,
  total,
  search,
  status,
}: {
  notifications: NotificationRecord[];
  unread: number;
  total: number;
  search: string;
  status: string;
}) {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
          <p className="text-sm text-muted-foreground">Operational notifications, read status, and cleanup.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">{total} total</Badge>
          <Badge variant={unread ? "warning" : "success"}>{unread} unread</Badge>
        </div>
      </div>

      <Card>
        <CardContent className="pt-6">
          <form className="grid gap-3 md:grid-cols-[1fr_180px_auto]">
            <div className="relative">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" name="search" defaultValue={search} placeholder="Search notifications..." />
            </div>
            <Select name="status" defaultValue={status}>
              <option value="all">All</option>
              <option value="unread">Unread</option>
              <option value="read">Read</option>
            </Select>
            <Button>Apply</Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Inbox</CardTitle>
          <CardDescription>Notifications are scoped to your company and user.</CardDescription>
        </CardHeader>
        <CardContent>
          {notifications.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No notifications found.</div>
          ) : (
            <div className="grid gap-3">
              {notifications.map((notification) => (
                <div key={notification.id} className="rounded-lg border bg-background p-4">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <Bell className="h-4 w-4 text-primary" />
                        <p className="font-semibold">{notification.title}</p>
                        <Badge variant={notification.isRead ? "secondary" : "warning"}>{notification.isRead ? "Read" : "Unread"}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-muted-foreground">{notification.body || "No details provided."}</p>
                      <p className="mt-2 text-xs text-muted-foreground">{formatDate(notification.createdAt)}</p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {notification.isRead ? (
                        <form action={markNotificationUnread}>
                          <input type="hidden" name="notification_id" value={notification.id} />
                          <Button variant="outline" size="sm"><Undo2 className="h-4 w-4" />Unread</Button>
                        </form>
                      ) : (
                        <form action={markNotificationRead}>
                          <input type="hidden" name="notification_id" value={notification.id} />
                          <Button variant="outline" size="sm"><Check className="h-4 w-4" />Read</Button>
                        </form>
                      )}
                      <form action={deleteNotification}>
                        <input type="hidden" name="notification_id" value={notification.id} />
                        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" />Delete</Button>
                      </form>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4">
            <Button asChild variant="outline" size="sm"><Link href="/settings/notifications">Notification settings</Link></Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
