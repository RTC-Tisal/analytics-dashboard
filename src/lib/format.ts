// Number formatting shared by every dashboard page.
// Intl.NumberFormat is built into JavaScript, so no extra package is needed.

// How a value should be displayed.
//   "number"  → a count, e.g. 14860 → "14,860"
//   "percent" → a fraction, e.g. 0.633 → "63.3%"
export type ValueFormat = "number" | "percent";

const countFormatter = new Intl.NumberFormat("en-US");

const percentFormatter = new Intl.NumberFormat("en-US", {
  style: "percent",
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
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

// "2026-11-03" → "Nov 3" (chart axes)
export function formatShortDate(isoDate: string): string {
  return shortDateFormatter.format(new Date(isoDate));
}

// "2026-11-03" → "Tue, Nov 3" (tooltips)
export function formatLongDate(isoDate: string): string {
  return longDateFormatter.format(new Date(isoDate));
}

// Format a KPI value for display.
export function formatValue(value: number, format: ValueFormat): string {
  return format === "percent"
    ? percentFormatter.format(value)
    : countFormatter.format(value);
}

// Format the size of a change (always positive: the arrow shows the direction).
//   counts → relative change:          14860 vs 13920 → "6.8%"
//   rates  → difference in points:     0.633 vs 0.620 → "1.3 pp"
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
