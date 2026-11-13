// Number formatting shared by every dashboard page.
// Intl.NumberFormat is built into JavaScript, so no extra package is needed.

// How a value should be displayed.
//   "number"   → a count, e.g. 14860 → "14,860"
//   "percent"  → a fraction, e.g. 0.633 → "63.3%"
//   "currency" → money, e.g. 8142.36 → "$8,142"; 193.874 → "$193.87"
export type ValueFormat = "number" | "percent" | "currency";

// The dashboard's currency. USD for now (an open decision, see CLAUDE.md):
// change it here and every amount on every page follows.
export const CURRENCY = "USD";

const countFormatter = new Intl.NumberFormat("en-US");

// $1,000 and more: whole units ("$8,142"). Smaller amounts keep cents ("$193.87"),
// because for costs per click or per lead the cents matter.
const wholeCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  maximumFractionDigits: 0,
});
const centsCurrencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: CURRENCY,
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

// Shown when a value can't be calculated, e.g. cost per lead with no leads.
export const NO_VALUE = "—";

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Percentages under 1% get two decimals: LinkedIn click-through rates are all
// below 1%, and "0.6%" for every campaign would hide the differences ("0.57%" vs "0.66%").
const smallPercentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const oneDecimal = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

// Dates arrive as "YYYY-MM-DD" text. JavaScript reads that as midnight UTC, so we
// also format in UTC. Otherwise, in a time zone behind UTC, "2026-11-03" could
// show as Nov 2.
const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const longDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "short",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const tableDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

// "2026-11-09" → "Nov 9, 2026" (dates in tables). US style for now: the date style
// is an open decision (see CLAUDE.md), and changing it here changes every table.
export function formatTableDate(isoDate: string): string {
  return tableDateFormatter.format(new Date(isoDate));
}

// "2026-11-03" → "Nov 3" (chart axes)
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(isoDate));
}

// "2026-11-03" → "Tue, Nov 3" (tooltips)
export function formatLongDate(isoDate: string): string {
  return longDateFormatter.format(new Date(isoDate));
}

// Format a KPI value for display. null (a rate that can't be calculated) → "—".
export function formatValue(value: number | null, format: ValueFormat): string {
  if (value === null) return NO_VALUE;
  if (format === "percent") {
    return value !== 0 && Math.abs(value) < 0.01 ? smallPercentFormatter.format(value) : percentFormatter.format(value);
  }
  if (format === "currency") {
    return Math.abs(value) >= 1000
      ? wholeCurrencyFormatter.format(value)
      : centsCurrencyFormatter.format(value);
  }
  return countFormatter.format(value);
}

// Format the size of a change (always positive: the arrow shows the direction).
//   counts and money → relative change:   14860 vs 13920 → "6.8%"
//   rates            → difference in points: 0.633 vs 0.620 → "1.3 pp"
export function formatChange(
  current: number,
  previous: number,
  format: ValueFormat,
): string {
  if (format === "percent") {
    const points = Math.abs(current - previous) * 100;
    return `${oneDecimal.format(points)} pp`;
  }
  const relative = Math.abs(current - previous) / previous;
  return percentFormatter.format(relative);
}
