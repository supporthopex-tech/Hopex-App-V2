import { CheckCircle2, XCircle } from "lucide-react";
import { decideStaffApproval } from "@/app/(app)/approvals/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import type { StaffApprovalRecord } from "@/lib/approvals/types";

export function StaffApprovals({ approvals }: { approvals: StaffApprovalRecord[] }) {
  const pending = approvals.filter((approval) => approval.status === "pending").length;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted-foreground">Review and approve newly created staff accounts.</p>
      </div>
      <div className="grid gap-3 md:grid-cols-3">
        <Metric label="Pending" value={pending} />
        <Metric label="Approved" value={approvals.filter((approval) => approval.status === "approved").length} />
        <Metric label="Rejected" value={approvals.filter((approval) => approval.status === "rejected").length} />
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Staff account approvals</CardTitle>
          <CardDescription>Only approved accounts become active for portal login.</CardDescription>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <Table className="min-w-[860px]">
            <TableHeader>
              <TableRow>
                <TableHead>Staff</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Requested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {approvals.map((approval) => (
                <TableRow key={approval.id}>
                  <TableCell><div className="font-medium">{approval.staffName}</div><div className="text-xs text-muted-foreground">{approval.staffEmail}</div></TableCell>
                  <TableCell>{approval.roleName}</TableCell>
                  <TableCell>{approval.department || "-"}</TableCell>
                  <TableCell><Badge variant={approval.status === "approved" ? "success" : approval.status === "rejected" ? "danger" : "warning"}>{approval.status}</Badge></TableCell>
                  <TableCell>{approval.requestedAt ? new Date(approval.requestedAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>
                    {approval.status === "pending" ? (
                      <div className="flex flex-wrap justify-end gap-2">
                        <DecisionForm approval={approval} decision="approved" />
                        <DecisionForm approval={approval} decision="rejected" />
                      </div>
                    ) : (
                      <div className="text-right text-sm text-muted-foreground">{approval.decidedAt ? new Date(approval.decidedAt).toLocaleDateString() : "Recorded"}</div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {approvals.length === 0 ? <div className="rounded-md border border-dashed p-8 text-center text-sm text-muted-foreground">No staff approvals are waiting.</div> : null}
        </CardContent>
      </Card>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <Card><CardHeader className="pb-2"><CardDescription>{label}</CardDescription><CardTitle>{value}</CardTitle></CardHeader></Card>;
}

function DecisionForm({ approval, decision }: { approval: StaffApprovalRecord; decision: "approved" | "rejected" }) {
  return (
    <form action={decideStaffApproval} className="flex items-center gap-2">
      <input type="hidden" name="approval_id" value={approval.id} />
      <input type="hidden" name="staff_id" value={approval.staffId} />
      <input type="hidden" name="decision" value={decision} />
      {decision === "rejected" ? <Input name="reason" placeholder="Reason" className="h-8 w-36" /> : null}
      <Button type="submit" variant={decision === "approved" ? "secondary" : "outline"} size="sm">
        {decision === "approved" ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        {decision === "approved" ? "Approve" : "Reject"}
      </Button>
    </form>
  );
}
