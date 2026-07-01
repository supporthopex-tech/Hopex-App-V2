import type { ShipmentPricingInput, ShipmentPricingResult } from "@/lib/shipments/types";

function roundMoney(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

export function calculateShipmentPricing(input: ShipmentPricingInput): ShipmentPricingResult {
  const dimensionalVolume =
    input.length > 0 && input.width > 0 && input.height > 0
      ? (input.length * input.width * input.height) / 1_000_000
      : 0;
  const volumeCbm = input.volumeCbm || dimensionalVolume;
  const volumetricWeight = volumeCbm * 167;
  const chargeableWeight = Math.max(input.weightKg, input.useVolume ? volumetricWeight : 0);
  const weightCharge = input.useBalanceWeight ? chargeableWeight * input.ratePerKg : 0;
  const volumeCharge = input.useVolume ? volumeCbm * input.ratePerCbm : 0;
  const pieceCharge = input.usePieces ? input.pieces * input.ratePerPiece : 0;
  const subtotal = weightCharge + volumeCharge + pieceCharge + input.handlingFee + input.customsFee + input.insuranceFee;
  const taxable = Math.max(0, subtotal - input.discount);
  const taxAmount = taxable * (input.tax / 100);
  const totalAmount = taxable + taxAmount;
  const profitMargin = totalAmount > 0 ? ((totalAmount - input.costAmount) / totalAmount) * 100 : 0;

  return {
    ...input,
    volumeCbm: roundMoney(volumeCbm),
    volumetricWeight: roundMoney(volumetricWeight),
    chargeableWeight: roundMoney(chargeableWeight),
    subtotal: roundMoney(subtotal),
    totalAmount: roundMoney(totalAmount),
    profitMargin: roundMoney(profitMargin),
  };
}

export function numberFromForm(value: FormDataEntryValue | null) {
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
}
