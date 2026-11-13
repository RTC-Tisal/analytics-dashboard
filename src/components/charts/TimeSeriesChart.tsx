"use client";

// A reusable line chart over time: one number per day, with dates along the bottom
// and a tooltip that snaps to the nearest day. Runs in the browser too, because it
// reacts to the mouse (tooltip) and to the card's width (resizing).

import { CartesianGrid, Line, LineChart, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { chartColors } from "@/lib/chartColors";
import { formatLongDate, formatShortDate, formatValue, type ValueFormat } from "@/lib/format";

export interface TimePoint {
  date: string; // "YYYY-MM-DD"
  value: number;
}

interface TimeSeriesChartProps {
  points: TimePoint[]; // one per day, oldest first
  unit: string; // what the value counts, e.g. "sessions" or "followers"
  format?: ValueFormat; // "number" by default
  caption: string; // the screen-reader table's caption, e.g. "Sessions per day"
  valueHeader: string; // the table's value column heading, e.g. "Sessions"
  // true (default): the y-axis starts at 0. false: it starts near the lowest value,
  // for slow-moving totals like followers, where a 0 start would flatten the line.
  zeroBaseline?: boolean;
  yAxisWidth?: number; // room for the y-axis numbers, in pixels
}

export default function TimeSeriesChart({
  points,
  unit,
  format = "number",
  caption,
  valueHeader,
  zeroBaseline = true,
  yAxisWidth = 44,
}: TimeSeriesChartProps) {
  return (
    <>
      {/* The chart fills this box. `responsive` makes it redraw when the box changes width. */}
      <div className="h-64" aria-hidden="true">
        <LineChart
          responsive
          accessibilityLayer={false} // screen readers use the table below instead
          data={points}
          style={{ width: "100%", height: "100%" }}
          margin={{ top: 8, right: 12, bottom: 0, left: 0 }}
        >
          {/* Faint horizontal lines only, solid not dashed. */}
          <CartesianGrid vertical={false} stroke={chartColors.grid} />

          <XAxis
            dataKey="date"
            tickFormatter={formatShortDate} // "2026-11-03" → "Nov 3"
            minTickGap={24} // skip labels that would overlap (needed for 90 days)
            tickLine={false}
            axisLine={{ stroke: chartColors.grid }}
            tick={{ fill: chartColors.axisText, fontSize: 12 }}
            tickMargin={8}
          />

          <YAxis
            domain={zeroBaseline ? [0, "auto"] : ["auto", "auto"]}
            tickFormatter={(value: number) => formatValue(value, format)}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartColors.axisText, fontSize: 12 }}
            width={yAxisWidth}
          />

          {/* Hover: a thin vertical line snaps to the nearest day, with our tooltip box. */}
          <Tooltip
            cursor={{ stroke: chartColors.crosshair, strokeWidth: 1 }}
            content={(props) => <PointTooltip {...props} unit={unit} format={format} />}
          />

          <Line
            type="monotone"
            dataKey="value"
            stroke={chartColors.series}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            dot={false} // no dot on every day…
            activeDot={{ r: 4, fill: chartColors.series, stroke: chartColors.surface, strokeWidth: 2 }} // …only on the hovered day
          />
        </LineChart>
      </div>

      {/* The same numbers as a table, for screen readers (they can't hover a chart).
          sr-only goes on a wrapping div: a <table> can't shrink below its rows'
          height, so it would leave invisible empty space at the bottom of the page. */}
      <div className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">{valueHeader}</th>
            </tr>
          </thead>
          <tbody>
            {points.map((point) => (
              <tr key={point.date}>
                <td>{formatLongDate(point.date)}</td>
                <td>{formatValue(point.value, format)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The box shown on hover: the value first (bold), then the date.
function PointTooltip({
  active,
  payload,
  unit,
  format,
}: TooltipContentProps & { unit: string; format: ValueFormat }) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0].payload as TimePoint; // the hovered day

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: chartColors.series }} />
        <span className="font-semibold text-gray-900">{formatValue(point.value, format)}</span>
        <span className="text-gray-500">{unit}</span>
      </p>
      <p className="mt-0.5 text-gray-500">{formatLongDate(point.date)}</p>
    </div>
  );
}
