export const quoteStatuses = ["new", "contacted", "quoted", "approved", "converted", "closed", "rejected"] as const;
export const customerStatuses = ["active", "inactive", "blocked"] as const;
export const taskStatuses = ["pending", "in_progress", "completed", "cancelled"] as const;
export const taskPriorities = ["low", "medium", "high", "urgent"] as const;

export type QuoteStatus = (typeof quoteStatuses)[number];
export type CustomerStatus = (typeof customerStatuses)[number];
export type TaskStatus = (typeof taskStatuses)[number];
export type TaskPriority = (typeof taskPriorities)[number];

export type QuoteRequestRecord = {
  id: string;
  companyId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  origin: string;
  destination: string;
  cargoDescription: string;
  cargoType: string;
  estimatedWeight: number;
  estimatedPieces: number;
  estimatedVolume: number;
  requestedDate: string;
  quotedAmount: number;
  currency: string;
  status: QuoteStatus;
  notes: string;
  createdAt: string;
};

export type CustomerRecord = {
  id: string;
  companyId: string;
  fullName: string;
  companyName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  country: string;
  customerType: string;
  status: CustomerStatus;
  isVip: boolean;
  notes: string;
  shipmentsCount: number;
  quotesCount: number;
  invoicesCount: number;
  paymentsCount: number;
  revenue: number;
  currency: string;
  createdAt: string;
};

export type TaskRecord = {
  id: string;
  companyId: string;
  title: string;
  description: string;
  assigneeId: string | null;
  assigneeName: string;
  priority: TaskPriority;
  status: TaskStatus;
  dueDate: string;
  completedAt: string;
  createdByName: string;
  notes: string;
  commentsCount: number;
  attachmentsCount: number;
  createdAt: string;
};

export type ListFilters = {
  search?: string;
  status?: string;
  priority?: string;
};
