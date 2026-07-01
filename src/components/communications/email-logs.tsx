import { AlertCircle, CheckCircle2, Clock3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { EmailLogRecord } from "@/lib/communications/types";

export function EmailLogs({ logs }: { logs: EmailLogRecord[] }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email Logs</h1>
        <p className="text-sm text-muted-foreground">History of sent, pending, and failed emails from Resend.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Delivery history</CardTitle>
          <CardDescription>Use this to troubleshoot failed messages and confirm Resend message IDs.</CardDescription>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No email logs yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <Table className="min-w-[900px]">
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead>Recipient</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Resend ID</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell><LogStatus status={log.status} /></TableCell>
                      <TableCell className="font-medium">{log.recipient || "-"}</TableCell>
                      <TableCell>{log.subject || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{log.resendMessageId || "-"}</TableCell>
                      <TableCell>{formatDate(log.createdAt)}</TableCell>
                      <TableCell className="max-w-xs truncate text-destructive">{log.errorMessage || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function LogStatus({ status }: { status: string }) {
  const normalized = status.toLowerCase();
  if (normalized === "sent") return <Badge variant="success"><CheckCircle2 className="h-3.5 w-3.5" />Sent</Badge>;
  if (normalized === "failed") return <Badge variant="danger"><AlertCircle className="h-3.5 w-3.5" />Failed</Badge>;
  return <Badge variant="secondary"><Clock3 className="h-3.5 w-3.5" />Pending</Badge>;
}

function formatDate(value: string) {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
}
