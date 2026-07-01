export type StaffApprovalRecord = {
  id: string;
  companyId: string;
  staffId: string;
  staffName: string;
  staffEmail: string;
  roleName: string;
  department: string;
  status: string;
  requestedAt: string;
  decidedAt: string | null;
  reason: string;
  history: { id: string; action: string; reason: string; createdAt: string }[];
};
