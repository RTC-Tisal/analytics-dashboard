"use client";

// Runs in the browser as well as on the server, because the chart reacts to the
// mouse (tooltip) and to the card's width (resizing). See Module 2 notes.

import {
  CartesianGrid,
  Line,
  LineChart,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { chartColors } from "@/lib/chartColors";
import { formatLongDate, formatShortDate, formatValue } from "@/lib/format";
import type { DailyTraffic } from "@/lib/website/types";

interface SessionsOverTimeChartProps {
  data: DailyTraffic[]; // one entry per day, oldest first (from getWebsiteData)
}

export default function SessionsOverTimeChart({ data }: SessionsOverTimeChartProps) {
  return (
    <>
      {/* The chart fills this box. `responsive` makes it redraw when the box changes width. */}
      <div className="h-64" aria-hidden="true">
        <LineChart
          responsive
          accessibilityLayer={false} // screen readers use the table below instead
          data={data}
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
            tickFormatter={(value: number) => formatValue(value, "number")}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartColors.axisText, fontSize: 12 }}
            width={44}
          />

          {/* Hover: a thin vertical line snaps to the nearest day, with our tooltip box. */}
          <Tooltip
            cursor={{ stroke: chartColors.crosshair, strokeWidth: 1 }}
            content={(props) => <SessionsTooltip {...props} />}
          />

          <Line
            type="monotone"
            dataKey="sessions"
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
          <caption>Sessions per day</caption>
          <thead>
            <tr>
              <th scope="col">Date</th>
              <th scope="col">Sessions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((day) => (
              <tr key={day.date}>
                <td>{formatLongDate(day.date)}</td>
                <td>{formatValue(day.sessions, "number")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The box shown on hover: the value first (bold), then the date.
function SessionsTooltip({ active, payload }: TooltipContentProps) {
  if (!active || !payload || payload.length === 0) return null;

  const day = payload[0].payload as DailyTraffic; // the hovered day's data

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="flex items-center gap-2">
        <span className="inline-block h-0.5 w-3 rounded-full" style={{ backgroundColor: chartColors.series }} />
        <span className="font-semibold text-gray-900">
          {formatValue(day.sessions, "number")}
        </span>
        <span className="text-gray-500">sessions</span>
      </p>
      <p className="mt-0.5 text-gray-500">{formatLongDate(day.date)}</p>
    </div>
  );
}
