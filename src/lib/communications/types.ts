export const emailFolders = ["inbox", "sent", "drafts", "spam", "trash"] as const;
export const whatsappMessageTypes = ["Shipment Update", "Shipment Created", "In Transit", "Out For Delivery", "Delivered", "Payment Reminder", "Quote Follow-up", "Custom Message"] as const;

export type EmailRecord = {
  id: string;
  companyId: string;
  folder: string;
  fromEmail: string;
  toEmail: string;
  subject: string;
  body: string;
  status: string;
  isRead: boolean;
  sentAt: string;
  receivedAt: string;
  customerName: string;
  shipmentId: string | null;
  quoteId: string | null;
  invoiceId: string | null;
};

export type EmailAccountRecord = {
  id: string;
  accountName: string;
  emailAddress: string;
  provider: string;
  status: string;
};

export type EmailTemplateRecord = {
  id: string;
  templateName: string;
  subject: string;
  body: string;
  module: string;
};

export type EmailLogRecord = {
  id: string;
  recipient: string;
  subject: string;
  status: "sent" | "failed" | "pending" | string;
  sentBy: string;
  relatedCustomerId: string | null;
  relatedShipmentId: string | null;
  resendMessageId: string | null;
  errorMessage: string | null;
  createdAt: string;
  sentAt: string | null;
};

export type EmailComposeOption = {
  id: string;
  label: string;
  email?: string;
};

export type EmailComposeData = {
  customers: EmailComposeOption[];
  shipments: EmailComposeOption[];
  quotes: EmailComposeOption[];
};

export type WhatsAppMessageRecord = {
  id: string;
  phone: string;
  messageType: string;
  messageBody: string;
  status: string;
  customerName: string;
  trackingNumber: string;
  destination: string;
  sentAt: string;
};

export type WhatsAppTemplateRecord = {
  id: string;
  templateName: string;
  messageType: string;
  body: string;
};

export type SettingsRecord = {
  companyName: string;
  slogan: string;
  logoUrl: string;
  email: string;
  phone: string;
  address: string;
  taxRegistrationNumber: string;
  website: string;
  country: string;
  city: string;
  currency: string;
  timezone: string;
  invoicePrefix: string;
  nextInvoiceNumber: number;
  quotePrefix: string;
  paymentReceiptPrefix: string;
  defaultTaxRate: number;
  paymentTerms: string;
  footerNotes: string;
  bankDetails: string;
  themeMode: string;
  primaryColor: string;
  sidebarStyle: string;
  compactMode: boolean;
  emailNotifications: boolean;
  whatsappNotifications: boolean;
  shipmentNotifications: boolean;
  paymentNotifications: boolean;
  taskNotifications: boolean;
  approvalNotifications: boolean;
  defaultLanguage: string;
  dateFormat: string;
  numberFormat: string;
  currencyFormat: string;
};
