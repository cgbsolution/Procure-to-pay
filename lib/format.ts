/**
 * Formatting primitives for ProcureFlow.
 * Money uses the Indian numbering system (lakh/crore grouping).
 */

/**
 * Format a number as Indian Rupees with lakh/crore grouping.
 *
 * Examples:
 *   formatINR(1309140)  -> "₹13,09,140"
 *   formatINR(100000)   -> "₹1,00,000"
 *   formatINR(1234.5)   -> "₹1,234.50"
 *   formatINR(-5000)    -> "-₹5,000"
 *
 * @param amount      value in rupees (not paise)
 * @param withDecimals  force two decimal places (default: only when fractional)
 */
export function formatINR(amount: number, withDecimals?: boolean): string {
  if (!Number.isFinite(amount)) return "₹0";

  const negative = amount < 0;
  const abs = Math.abs(amount);

  const hasFraction = withDecimals ?? abs % 1 !== 0;
  const minimumFractionDigits = hasFraction ? 2 : 0;
  const maximumFractionDigits = hasFraction ? 2 : 0;

  // en-IN locale applies the 2,3,3... (lakh/crore) grouping.
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(abs);

  return `${negative ? "-" : ""}₹${formatted}`;
}

/**
 * Format a date as DD/MM/YYYY.
 *
 * Examples:
 *   formatDate("2026-06-18")              -> "18/06/2026"
 *   formatDate(new Date(2026, 0, 5))      -> "05/01/2026"
 */
export function formatDate(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "";
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Format a date-time as DD/MM/YYYY, HH:mm (24h).
 *
 * Examples:
 *   formatDateTime("2026-06-18T09:05:00") -> "18/06/2026, 09:05"
 */
export function formatDateTime(input: string | number | Date): string {
  const d = toDate(input);
  if (!d) return "";
  const hours = String(d.getHours()).padStart(2, "0");
  const minutes = String(d.getMinutes()).padStart(2, "0");
  return `${formatDate(d)}, ${hours}:${minutes}`;
}

function toDate(input: string | number | Date): Date | null {
  const d = input instanceof Date ? input : new Date(input);
  return Number.isNaN(d.getTime()) ? null : d;
}
