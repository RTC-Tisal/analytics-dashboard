import Link from "next/link";
import { DATE_RANGES, type DateRange } from "@/lib/dateRange";

// Button text for each range.
const labels: Record<DateRange, string> = {
  "7d": "Last 7 days",
  "28d": "Last 28 days",
  "90d": "Last 90 days",
};

interface DateRangeFilterProps {
  pathname: string; // the page the links point to, e.g. "/website"
  selected: DateRange; // the range currently shown, so it can be highlighted
  keep?: Record<string, string>; // other filters to keep in the URL, e.g. { group: "…" }
}

// Three links that look like buttons. Each one points to the same page with a
// different ?range= in the URL, e.g. /website?range=7d. Clicking one simply
// visits that URL, so the address bar always holds a shareable link.
// Other filters (`keep`) stay in the URL, so changing the date doesn't reset them.
export default function DateRangeFilter({ pathname, selected, keep = {} }: DateRangeFilterProps) {
  return (
    <nav aria-label="Date range" className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {DATE_RANGES.map((range) => {
        const isSelected = range === selected;
        const query = new URLSearchParams({ ...keep, range });
        return (
          <Link
            key={range}
            href={`${pathname}?${query}`}
            aria-current={isSelected ? "true" : undefined}
            // min-h-11 = 44px: big enough to tap comfortably on a phone.
            className={
              isSelected
                ? "flex min-h-11 items-center whitespace-nowrap rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground shadow-sm transition-colors duration-200"
                : "flex min-h-11 items-center whitespace-nowrap rounded-md px-3 text-sm font-medium text-gray-700 transition-colors duration-200 hover:bg-gray-100"
            }
          >
            {labels[range]}
          </Link>
        );
      })}
    </nav>
  );
}
