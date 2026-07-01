export const packingListStatuses = ["draft", "ready", "dispatched"] as const;
export type PackingListStatus = (typeof packingListStatuses)[number];

export type PackingShipmentOption = {
  id: string;
  trackingNumber: string;
  customerId: string | null;
  customerName: string;
  itemDescription: string;
  quantity: number;
  quantityLabel: string;
  weight: number;
  destination: string;
};

export type PackingListItemRecord = {
  id: string;
  boxId: string;
  shipmentId: string | null;
  customerId: string | null;
  customerName: string;
  trackingNumber: string;
  itemDescription: string;
  quantity: number;
  quantityLabel: string;
  weight: number;
  remarks: string;
  sortOrder: number;
};

export type PackingListBoxRecord = {
  id: string;
  boxNumber: string;
  barcodeValue: string;
  remarks: string;
  sortOrder: number;
  items: PackingListItemRecord[];
};

export type PackingListRecord = {
  id: string;
  companyId: string;
  packingListNumber: string;
  dispatchDate: string;
  destination: string;
  preparedBy: string | null;
  preparedByName: string;
  status: PackingListStatus;
  totalBoxes: number;
  totalCustomers: number;
  totalItems: number;
  totalWeight: number;
  remarks: string;
  dispatchedAt: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
  boxes: PackingListBoxRecord[];
};

export type PackingListFilters = {
  search?: string;
  status?: string;
  dateFrom?: string;
  dateTo?: string;
};
