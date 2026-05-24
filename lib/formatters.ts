import { decimalToNumber } from "@/lib/utils";

export function formatMetricValue(value: unknown, unit?: string | null, userCurrency = "currency") {
  const numeric = decimalToNumber(value);
  if (numeric == null) {
    if (typeof value === "string" && value.trim()) return value;
    return "No value";
  }

  const formattedNumber = new Intl.NumberFormat("en", {
    maximumFractionDigits: Number.isInteger(numeric) ? 0 : 2,
  }).format(numeric);

  if (!unit) return formattedNumber;
  if (unit === "currency") {
    const currency = userCurrency?.trim() === "currency" ? "" : userCurrency?.trim();
    if (!currency) return formattedNumber;
    if (currency === "€" || currency === "$" || currency === "£") return `${currency}${formattedNumber}`;
    return `${currency} ${formattedNumber}`;
  }
  return `${formattedNumber} ${unit}`;
}
