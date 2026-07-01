import Link from "next/link";
import { Archive, Clock, Forward, History, Inbox, MailPlus, Reply, Search, Send, Star, Tag, Trash2 } from "lucide-react";
import { EmailActions } from "@/components/communications/email-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { EmailAccountRecord, EmailRecord, EmailTemplateRecord } from "@/lib/communications/types";

const folders = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "sent", label: "Sent", icon: Send },
  { key: "drafts", label: "Drafts", icon: Clock },
  { key: "spam", label: "Spam", icon: Archive },
  { key: "trash", label: "Trash", icon: Trash2 },
  { key: "logs", label: "Email Logs", icon: History },
];

export function EmailModule({
  accounts,
  messages,
  templates,
  folder,
  selectedEmail,
  folderCounts,
  search,
}: {
  accounts: EmailAccountRecord[];
  messages: EmailRecord[];
  templates: EmailTemplateRecord[];
  folder: string;
  selectedEmail?: EmailRecord | null;
  folderCounts: Record<string, number>;
  search?: string;
}) {
  const activeEmail = selectedEmail ?? messages[0] ?? null;
  const account = accounts[0];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email</h1>
          <p className="text-sm text-muted-foreground">{account?.emailAddress ?? "Company mailbox"} · Gmail-style workspace</p>
        </div>
        <form className="relative w-full max-w-xl">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input className="rounded-full bg-muted/60 pl-9" name="search" defaultValue={search} placeholder="Search mail" />
        </form>
      </div>

      <div className="grid min-h-[72vh] min-w-0 overflow-hidden rounded-xl border bg-card lg:grid-cols-[240px_minmax(320px,430px)_minmax(0,1fr)]">
        <aside className="border-b p-3 lg:border-b-0 lg:border-r">
          <Button asChild className="mb-4 h-12 w-full rounded-2xl justify-start px-5 shadow-sm">
            <Link href="/email/compose"><MailPlus className="h-4 w-4" />Compose</Link>
          </Button>
          <nav className="space-y-1">
            {folders.map((item) => {
              const Icon = item.icon;
              const active = folder === item.key;
              return (
                <Link
                  key={item.key}
                  href={item.key === "logs" ? "/email/logs" : `/email/${item.key}`}
                  className={`flex items-center justify-between rounded-r-full px-3 py-2 text-sm transition-colors ${active ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted"}`}
                >
                  <span className="flex items-center gap-3"><Icon className="h-4 w-4" />{item.label}</span>
                  {folderCounts[item.key] ? <span className="text-xs font-semibold">{folderCounts[item.key]}</span> : null}
                </Link>
              );
            })}
          </nav>
          <div className="mt-5 rounded-lg border bg-muted/30 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground">{account?.accountName ?? "Company Email"}</p>
            <p className="mt-1 truncate">{account?.emailAddress ?? "Not connected"}</p>
            <Badge className="mt-2" variant="success">{account?.status ?? "ready"}</Badge>
          </div>
        </aside>

        <section className="min-w-0 border-b lg:border-b-0 lg:border-r">
          <div className="flex h-14 items-center justify-between border-b px-4">
            <div className="flex items-center gap-2 text-sm font-medium capitalize">{folder}</div>
            <Badge variant="secondary">{messages.length}</Badge>
          </div>
          <div className="max-h-[calc(72vh-3.5rem)] overflow-y-auto">
            {messages.length === 0 ? (
              <div className="m-4 rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No emails found.</div>
            ) : messages.map((message) => (
              <Link
                key={message.id}
                href={`/email/${message.id}`}
                className={`grid gap-1 border-b px-4 py-3 transition-colors hover:bg-muted/50 ${activeEmail?.id === message.id ? "bg-muted/60" : ""}`}
              >
                <div className="flex items-center justify-between gap-2">
                  <p className={`truncate text-sm ${message.isRead ? "font-medium" : "font-bold"}`}>{message.fromEmail || message.toEmail || "Unknown sender"}</p>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{formatMailDate(message.receivedAt || message.sentAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {!message.isRead ? <span className="h-2 w-2 rounded-full bg-primary" /> : <Star className="h-3.5 w-3.5 text-muted-foreground" />}
                  <p className="truncate text-sm font-medium">{message.subject || "(no subject)"}</p>
                </div>
                <p className="line-clamp-2 text-xs text-muted-foreground">{message.body}</p>
              </Link>
            ))}
          </div>
        </section>

        <Card className="min-w-0 rounded-none border-0 shadow-none">
          <CardContent className="space-y-5 p-5">
            {activeEmail ? (
              <>
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <h2 className="truncate text-2xl font-semibold">{activeEmail.subject || "(no subject)"}</h2>
                    <p className="mt-1 text-sm text-muted-foreground">{activeEmail.fromEmail} to {activeEmail.toEmail}</p>
                  </div>
                  <EmailActions emailId={activeEmail.id} isRead={activeEmail.isRead} />
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" size="sm"><Reply className="h-4 w-4" />Reply</Button>
                  <Button variant="outline" size="sm"><Forward className="h-4 w-4" />Forward</Button>
                  <Button variant="outline" size="sm"><Tag className="h-4 w-4" />Label</Button>
                </div>
                <article className="min-h-64 rounded-lg border bg-background p-5 text-sm leading-7 shadow-sm whitespace-pre-wrap">{activeEmail.body}</article>
                <div className="grid gap-2 text-sm md:grid-cols-3">
                  <Info label="Customer" value={activeEmail.customerName || "-"} />
                  <Info label="Shipment" value={activeEmail.shipmentId ?? "-"} />
                  <Info label="Invoice" value={activeEmail.invoiceId ?? "-"} />
                </div>
                {templates.length ? (
                  <div className="flex flex-wrap gap-2">
                    {templates.map((template) => <Badge key={template.id} variant="secondary">{template.templateName}</Badge>)}
                  </div>
                ) : null}
              </>
            ) : <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">Select an email to read.</div>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return <div className="rounded-md border p-3"><p className="text-xs text-muted-foreground">{label}</p><p className="mt-1 truncate font-medium">{value}</p></div>;
}

function formatMailDate(value: string) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
