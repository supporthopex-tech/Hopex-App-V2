import { StaffApprovals } from "@/components/approvals/staff-approvals";
import { listStaffApprovals } from "@/lib/approvals/service";

export default async function ApprovalsPage() {
  return <StaffApprovals approvals={await listStaffApprovals()} />;
}
