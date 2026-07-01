export const staffStatuses = ["active", "pending_approval", "suspended", "inactive", "on_leave", "rejected"] as const;
export type StaffStatus = (typeof staffStatuses)[number];

export const accountStatuses = ["not_invited", "pending_approval", "invited", "active", "suspended", "rejected"] as const;
export type AccountStatus = (typeof accountStatuses)[number];

export const defaultRoles = [
  "Super Admin",
  "Owner",
  "Admin",
  "Manager",
  "Logistics Officer",
  "Accountant",
  "Customer Support",
  "Viewer",
] as const;

export const portalPermissionLabels = [
  "Dashboard",
  "Shipments",
  "Packing Lists",
  "Quotes",
  "Staff Members",
  "Customers",
  "Tasks",
  "Accounting",
  "Reports",
  "Settings",
  "Email",
  "WhatsApp",
  "Approvals",
] as const;

export const rolePermissionCatalog = [
  "dashboard.read",
  "shipments.view",
  "shipments.create",
  "shipments.edit",
  "shipments.delete",
  "shipments.update_status",
  "shipments.manage_documents",
  "packing_lists.view",
  "packing_lists.create",
  "packing_lists.update",
  "packing_lists.delete",
  "packing_lists.export",
  "quotes.view",
  "quotes.create",
  "quotes.edit",
  "quotes.delete",
  "quotes.convert",
  "customers.view",
  "customers.create",
  "customers.edit",
  "customers.delete",
  "tasks.view",
  "tasks.create",
  "tasks.edit",
  "tasks.delete",
  "accounting.view",
  "accounting.manage",
  "chart_of_accounts.manage",
  "journal_entries.view",
  "journal_entries.create",
  "journal_entries.post",
  "invoices.view",
  "invoices.create",
  "invoices.edit",
  "invoices.post",
  "payments.view",
  "payments.create",
  "payments.reverse",
  "expenses.view",
  "expenses.create",
  "expenses.approve",
  "reports.view",
  "staff.view",
  "staff.create",
  "staff.edit",
  "staff.delete",
  "staff.suspend",
  "staff.activate",
  "staff.invite",
  "staff.reset_password",
  "settings.view",
  "settings.manage_company",
  "settings.manage_branding",
  "settings.manage_users",
  "email.view",
  "email.send",
  "email.manage",
  "whatsapp.view",
  "whatsapp.send",
  "whatsapp.manage_templates",
  "approvals.view",
  "approvals.manage",
  "roles.view",
  "roles.edit",
  "roles.assign_permissions",
] as const;

export const crudPermissionActions = ["create", "view", "edit", "delete", "approve", "export"] as const;

export type RoleRecord = {
  id: string;
  companyId: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: string[];
};

export type StaffRecord = {
  id: string;
  companyId: string;
  staffId: string;
  fullName: string;
  email: string;
  phone: string;
  roleId: string | null;
  roleName: string;
  department: string;
  position: string;
  location: string;
  joinDate: string;
  status: StaffStatus;
  accountStatus: AccountStatus;
  portalAccess: string[];
  userId: string | null;
  notes: string;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  activityTimeline: { id: string; label: string; createdAt: string }[];
  createdShipments: number;
  createdQuotes: number;
  completedTasks: number;
  loginHistory: { id: string; label: string; createdAt: string }[];
};

export type StaffFilters = {
  search?: string;
  role?: string;
  status?: string;
  department?: string;
  location?: string;
};
