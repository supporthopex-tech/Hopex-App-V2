export const invoiceStatuses = ["draft", "sent", "partially_paid", "paid", "overdue", "void"] as const;
export const paymentTypes = ["customer", "supplier", "expense", "refund"] as const;
export const expenseStatuses = ["draft", "submitted", "approved", "rejected", "paid", "cancelled"] as const;
export const accountTypes = ["asset", "liability", "equity", "income", "expense"] as const;

export type InvoiceStatus = (typeof invoiceStatuses)[number];
export type ExpenseStatus = (typeof expenseStatuses)[number];

export type AccountRecord = {
  id: string;
  code: string;
  name: string;
  type: string;
  normalBalance: "debit" | "credit";
  balance: number;
};

export type JournalEntryRecord = {
  id: string;
  entryNumber: string;
  entryDate: string;
  description: string;
  status: string;
  referenceModule: string;
  referenceId: string;
  debitTotal: number;
  creditTotal: number;
};

export type InvoiceRecord = {
  id: string;
  invoiceNumber: string;
  customerName: string;
  shipmentId: string | null;
  quoteId: string | null;
  issueDate: string;
  dueDate: string;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceDue: number;
  status: InvoiceStatus;
  shipmentNumber: string;
  shipmentRoute: string;
  cargoType: string;
};

export type InvoiceShipmentOption = {
  id: string;
  trackingNumber: string;
  customerName: string;
  customerEmail: string;
  customerId: string | null;
  currency: string;
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
};

export type PaymentRecord = {
  id: string;
  paymentNumber: string;
  paymentType: string;
  customerName: string;
  supplierName: string;
  invoiceId: string | null;
  amount: number;
  currency: string;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  reference: string;
};

export type ExpenseRecord = {
  id: string;
  expenseNumber: string;
  vendor: string;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  totalAmount: number;
  currency: string;
  status: ExpenseStatus;
  paidAt: string;
};

export type AccountingSummary = {
  revenue: number;
  expenses: number;
  profit: number;
  receivables: number;
  payables: number;
  cash: number;
  vatPayable: number;
  unbalancedEntries: number;
};

export type AccountingData = {
  summary: AccountingSummary;
  accounts: AccountRecord[];
  journals: JournalEntryRecord[];
  invoices: InvoiceRecord[];
  payments: PaymentRecord[];
  expenses: ExpenseRecord[];
};
