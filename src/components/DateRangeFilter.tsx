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
}

// Three links that look like buttons. Each one points to the same page with a
// different ?range= in the URL, e.g. /website?range=7d. Clicking one simply
// visits that URL, so the address bar always holds a shareable link.
export default function DateRangeFilter({ pathname, selected }: DateRangeFilterProps) {
  return (
    <nav aria-label="Date range" className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
      {DATE_RANGES.map((range) => {
        const isSelected = range === selected;
        return (
          <Link
            key={range}
            href={`${pathname}?range=${range}`}
            aria-current={isSelected ? "true" : undefined}
            className={
              isSelected
                ? "rounded-md bg-gray-900 px-3 py-1.5 text-sm font-medium text-white"
                : "rounded-md px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100"
            }
          >
            {labels[range]}
          </Link>
        );
      })}
    </nav>
  );
}
