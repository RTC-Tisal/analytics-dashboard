// Date ranges shared by every dashboard page.

// The date ranges a page can show: the last 7, 28 or 90 days.
export type DateRange = "7d" | "28d" | "90d";

// All ranges, in the order the filter shows them.
export const DATE_RANGES: DateRange[] = ["7d", "28d", "90d"];

// How many days each range covers.
export const DAYS_IN_RANGE: Record<DateRange, number> = {
  "7d": 7,
  "28d": 28,
  "90d": 90,
};

// Used when the URL has no ?range=, or an invalid one. 28 days is GA4's default.
export const DEFAULT_DATE_RANGE: DateRange = "28d";

// Turn the raw ?range= value from the URL into a valid DateRange.
// The URL can contain anything (?range=banana, ?range=7d&range=90d, or nothing),
// so anything unexpected falls back to the default instead of breaking the page.
export function parseDateRange(value: string | string[] | undefined): DateRange {
  const match = DATE_RANGES.find((range) => range === value);
  return match ?? DEFAULT_DATE_RANGE;
}
