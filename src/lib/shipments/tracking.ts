export function generateTrackingNumber(prefix: string, sequence = 1, date = new Date()) {
  const safePrefix = prefix
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "")
    .slice(0, 6) || "CGO";
  return `${safePrefix}-${date.getFullYear()}-${String(sequence).padStart(5, "0")}`;
}

export function createTrackingUrl(origin: string, trackingNumber: string) {
  return `${origin.replace(/\/$/, "")}/track/${encodeURIComponent(trackingNumber)}`;
}
