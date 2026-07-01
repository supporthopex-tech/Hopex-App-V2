"use client";

import { useMemo } from "react";
import { calculateShipmentPricing } from "@/lib/shipments/pricing";
import type { ShipmentPricingInput } from "@/lib/shipments/types";
import { formatCurrency } from "@/lib/utils";

export function PricingPreview({
  input,
  currency,
}: {
  input: ShipmentPricingInput;
  currency: string;
}) {
  const pricing = useMemo(() => calculateShipmentPricing(input), [input]);

  return (
    <div className="grid gap-2 rounded-md border bg-muted/30 p-4 text-sm">
      <div className="flex justify-between"><span>Volumetric weight</span><strong>{pricing.volumetricWeight} kg</strong></div>
      <div className="flex justify-between"><span>Chargeable weight</span><strong>{pricing.chargeableWeight} kg</strong></div>
      <div className="flex justify-between"><span>Subtotal</span><strong>{formatCurrency(pricing.subtotal, currency)}</strong></div>
      <div className="flex justify-between"><span>Total amount</span><strong>{formatCurrency(pricing.totalAmount, currency)}</strong></div>
      <div className="flex justify-between"><span>Profit margin</span><strong>{pricing.profitMargin}%</strong></div>
    </div>
  );
}
