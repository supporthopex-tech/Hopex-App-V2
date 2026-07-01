export const supportedCurrencies = [
  { code: "TZS", label: "Tanzanian Shilling (TZS)" },
  { code: "AED", label: "UAE Dirham (AED)" },
  { code: "USD", label: "US Dollar (USD)" },
] as const;

export type SupportedCurrency = (typeof supportedCurrencies)[number]["code"];

export function normalizeCurrency(value: FormDataEntryValue | string | null | undefined) {
  const code = String(value ?? "").trim().toUpperCase();
  return supportedCurrencies.some((currency) => currency.code === code)
    ? code
    : "USD";
}
