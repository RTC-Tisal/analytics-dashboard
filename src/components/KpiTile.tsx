import { ArrowDownRight, ArrowUpRight, Minus, type LucideIcon } from "lucide-react";
import Card from "@/components/Card";
import Sparkline from "@/components/charts/Sparkline";
import { formatChange, formatValue, type ValueFormat } from "@/lib/format";

interface KpiTileProps {
  label: string; // e.g. "Sessions"
  icon: LucideIcon; // e.g. MousePointerClick, shown next to the label
  current: number | null; // value for the selected period; null = can't be calculated (shows "—")
  previous: number | null; // value for the period before it
  format: ValueFormat; // "number", "percent" or "currency"
  // Which direction is good news, for the pill's colour:
  //   "up" (default) → a rise is green, e.g. leads
  //   "down"         → a drop is green, e.g. cost per lead
  //   "neither"      → always grey, e.g. ad spend (more or less isn't good or bad by itself)
  better?: "up" | "down" | "neither";
  trend?: number[]; // optional daily values for the sparkline, oldest first
  note?: string; // optional small print under the change, e.g. which filters don't apply
}

// One KPI card: icon + label, big value, the change as a pill, a sparkline, and a note.
export default function KpiTile({
  label,
  icon,
  current,
  previous,
  format,
  better = "up",
  trend,
  note,
}: KpiTileProps) {
  // A sparkline needs at least two days, and a line of all zeros looks like a broken chart.
  const showTrend = trend !== undefined && trend.length > 1 && trend.some((value) => value !== 0);

  return (
    <Card title={label} icon={icon}>
      <p className="text-3xl font-semibold tracking-tight tabular-nums text-gray-900">
        {formatValue(current, format)}
      </p>
      <Change current={current} previous={previous} format={format} better={better} />
      {/* No daily numbers (e.g. form submissions for now) → no sparkline, rather than a made-up one. */}
      {showTrend && trend && <Sparkline values={trend} />}
      {note && <p className="text-xs text-gray-500">{note}</p>}
    </Card>
  );
}

// The change vs the previous period, as a pill. The ARROW always shows the real
// direction (↗ up, ↘ down). The COLOUR shows whether that's good news (see `better`).
// Screen readers hear both, e.g. "Down, better", so the meaning never depends on colour alone.
function Change({
  current,
  previous,
  format,
  better,
}: Pick<KpiTileProps, "current" | "previous" | "format"> & { better: "up" | "down" | "neither" }) {
  // Nothing to compare: a value that can't be calculated, or (for amounts) a zero to compare against.
  if (current === null || previous === null || (format !== "percent" && previous === 0)) {
    return <p className="text-sm text-gray-500">No previous data</p>;
  }

  const direction = current > previous ? "up" : current < previous ? "down" : "same";
  // true = good news, false = bad news, null = no change, or neither direction is good or bad.
  const isBetter = direction === "same" || better === "neither" ? null : direction === better;

  const Icon = direction === "up" ? ArrowUpRight : direction === "down" ? ArrowDownRight : Minus;
  const colours =
    isBetter === null
      ? "bg-gray-100 text-gray-600"
      : isBetter
        ? "bg-positive-soft text-positive"
        : "bg-negative-soft text-negative";
  const spoken =
    direction === "same"
      ? "No change"
      : `${direction === "up" ? "Up" : "Down"}${isBetter === null ? "" : isBetter ? ", better" : ", worse"}`;

  return (
    <p className="flex flex-wrap items-center gap-2 text-sm">
      <span
        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium tabular-nums ${colours}`}
      >
        <Icon aria-hidden="true" className="h-3.5 w-3.5" strokeWidth={2.5} />
        <span className="sr-only">{spoken}</span>
        {direction === "same" ? "0" : formatChange(current, previous, format)}
      </span>
      <span className="text-gray-500">vs previous period</span>
    </p>
  );
}
