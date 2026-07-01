export function generateStaffId(sequence = 1, date = new Date()) {
  return `STF-${date.getFullYear()}-${String(sequence).padStart(3, "0")}`;
}
