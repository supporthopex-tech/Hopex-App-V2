export const shipmentStatuses = [
  "pending",
  "received",
  "in_warehouse",
  "in_transit",
  "arrived",
  "out_for_delivery",
  "delivered",
  "cancelled",
] as const;

export type ShipmentStatus = (typeof shipmentStatuses)[number];

export const cargoTypes = [
  "Air Freight",
  "Sea Freight",
  "Road Freight",
  "Courier",
  "Container",
] as const;

export type CargoType = (typeof cargoTypes)[number];

export const cargoCategories = ["KG", "PCS", "CBM"] as const;
export type CargoCategory = (typeof cargoCategories)[number];

export type ShipmentPricingInput = {
  useBalanceWeight: boolean;
  usePieces: boolean;
  useVolume: boolean;
  weightKg: number;
  pieces: number;
  volumeCbm: number;
  length: number;
  width: number;
  height: number;
  ratePerKg: number;
  ratePerCbm: number;
  ratePerPiece: number;
  handlingFee: number;
  customsFee: number;
  insuranceFee: number;
  discount: number;
  tax: number;
  costAmount: number;
};

export type ShipmentPricingResult = ShipmentPricingInput & {
  volumetricWeight: number;
  chargeableWeight: number;
  subtotal: number;
  totalAmount: number;
  profitMargin: number;
};

export type ShipmentDocument = {
  id: string;
  documentType: string;
  fileName: string;
  filePath: string;
  isPublic: boolean;
  createdAt: string;
};

export type ShipmentTimelineEvent = {
  id: string;
  status: ShipmentStatus | string;
  title: string;
  location?: string;
  notes?: string;
  publicNote?: string;
  createdAt: string;
};

export type ShipmentItem = {
  id: string;
  itemName: string;
  description: string;
  quantity: number;
  weightKg: number;
  volumeCbm: number;
  declaredValue: number;
  currency: string;
  createdAt: string;
};

export type ShipmentRecord = {
  id: string;
  companyId: string;
  trackingNumber: string;
  referenceNumber: string;
  barcodeValue: string;
  qrCodeValue: string;
  customerId: string | null;
  supplierName: string;
  supplierPhone: string;
  supplierEmail: string;
  supplierLocation: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  customerDestination: string;
  origin: string;
  destination: string;
  route: string;
  cargoType: CargoType | string;
  cargoCategory: string;
  cargoDescription: string;
  currency: string;
  status: ShipmentStatus;
  estimatedDelivery: string;
  actualDelivery: string | null;
  assignedStaffId: string | null;
  assignedStaffName: string;
  assignedDriver: string;
  receiverName: string;
  receiverSignatureUrl: string | null;
  deliveryNotes: string;
  notes: string;
  pricing: ShipmentPricingResult;
  documents: ShipmentDocument[];
  items: ShipmentItem[];
  timeline: ShipmentTimelineEvent[];
  auditLogs: {
    id: string;
    action: string;
    actor: string;
    createdAt: string;
  }[];
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ShipmentFilters = {
  search?: string;
  status?: string;
  route?: string;
  origin?: string;
  destination?: string;
  cargoType?: string;
  assignedStaff?: string;
  dateFrom?: string;
  dateTo?: string;
};
