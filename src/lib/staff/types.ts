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

export const crudPermissionActions = ["create", "read", "update", "delete", "approve", "export"] as const;
export const portalPermissionResources = [
  "dashboard",
  "shipments",
  "packing_lists",
  "quotes",
  "staff",
  "customers",
  "tasks",
  "accounting",
  "reports",
  "settings",
  "email",
  "whatsapp",
  "approvals",
] as const;

export const rolePermissionCatalog = [
  ...portalPermissionResources.flatMap((resource) => crudPermissionActions.map((action) => `${resource}.${action}`)),
  "staff.view",
  "staff.edit",
  "staff.suspend",
  "staff.activate",
  "staff.invite",
  "staff.reset_password",
  "packing_lists.view",
  "packing_lists.create",
  "packing_lists.update",
  "packing_lists.delete",
  "packing_lists.export",
  "roles.view",
  "roles.edit",
  "roles.assign_permissions",
] as const;

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
