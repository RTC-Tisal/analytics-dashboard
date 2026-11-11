import { formatChange, formatValue, type ValueFormat } from "@/lib/format";

interface KpiTileProps {
  label: string; // e.g. "Sessions"
  current: number; // value for the selected period
  previous: number; // value for the period before it
  format: ValueFormat; // "number" for counts, "percent" for rates
}

// One KPI card: label, big value, and the change vs the previous period.
export default function KpiTile({ label, current, previous, format }: KpiTileProps) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold tracking-tight text-gray-900">
        {formatValue(current, format)}
      </p>
      <Change current={current} previous={previous} format={format} />
    </div>
  );
}

// The line under the value: ▲ green for up, ▼ red for down, grey for no change.
function Change({
  current,
  previous,
  format,
}: Omit<KpiTileProps, "label">) {
  // A count can't have a % change from zero, so say so instead of showing "∞%".
  if (format === "number" && previous === 0) {
    return <p className="mt-2 text-sm text-gray-500">No previous data</p>;
  }

  if (current === previous) {
    return (
      <p className="mt-2 text-sm text-gray-500">No change vs previous period</p>
    );
  }

  const isUp = current > previous;

  return (
    <p className="mt-2 text-sm">
      <span className={isUp ? "font-medium text-green-600" : "font-medium text-red-600"}>
        {/* The arrow is decorative; screen readers hear "Up" / "Down" instead. */}
        <span aria-hidden="true">{isUp ? "▲" : "▼"}</span>
        <span className="sr-only">{isUp ? "Up" : "Down"}</span>{" "}
        {formatChange(current, previous, format)}
      </span>{" "}
      <span className="text-gray-500">vs previous period</span>
    </p>
  );
}
