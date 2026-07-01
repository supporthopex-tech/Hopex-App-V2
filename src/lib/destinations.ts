export const supportedDestinations = ["Zanzibar", "Dar es Salaam"] as const;

export function normalizeDestination(value: FormDataEntryValue | string | null | undefined) {
  const destination = String(value ?? "").trim();
  return supportedDestinations.find((item) => item.toLowerCase() === destination.toLowerCase()) ?? "Dar es Salaam";
}
