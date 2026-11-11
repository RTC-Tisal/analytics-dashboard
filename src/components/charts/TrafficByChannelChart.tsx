"use client";

// Runs in the browser as well as on the server, because the chart reacts to the
// mouse (tooltip) and to the card's width (resizing).

import {
  Bar,
  BarChart,
  LabelList,
  Tooltip,
  XAxis,
  YAxis,
  type TooltipContentProps,
} from "recharts";
import { chartColors } from "@/lib/chartColors";
import { formatValue } from "@/lib/format";
import type { ChannelSessions } from "@/lib/website/types";

interface TrafficByChannelChartProps {
  data: ChannelSessions[]; // already sorted biggest first by getWebsiteData
}

export default function TrafficByChannelChart({ data }: TrafficByChannelChartProps) {
  // Total sessions across all channels, used for "46% of sessions" in the tooltip.
  // .reduce() adds them up, starting from 0.
  const total = data.reduce((sum, row) => sum + row.sessions, 0);

  return (
    <>
      {/* The chart fills this box. `responsive` makes it redraw when the box changes width. */}
      <div className="h-64" aria-hidden="true">
        <BarChart
          responsive
          accessibilityLayer={false} // screen readers use the table below instead
          layout="vertical" // bars run left to right; channels are listed down the side
          data={data} // drawn top to bottom in the order given: biggest first
          style={{ width: "100%", height: "100%" }}
          margin={{ top: 0, right: 56, bottom: 0, left: 0 }} // room on the right for the value labels
        >
          {/* The number axis is hidden: each bar has its value printed at its end instead. */}
          <XAxis type="number" hide />

          {/* Channel names down the left side. */}
          <YAxis
            type="category"
            dataKey="channel"
            width={112}
            tickLine={false}
            axisLine={false}
            tick={{ fill: chartColors.axisText, fontSize: 12 }}
          />

          {/* Hover: a light grey band behind the row, plus our tooltip box. */}
          <Tooltip
            cursor={{ fill: chartColors.hoverBand }}
            content={(props) => <ChannelTooltip {...props} total={total} />}
          />

          <Bar
            dataKey="sessions"
            fill={chartColors.series}
            activeBar={{ fill: chartColors.seriesHover }}
            barSize={20}
            radius={[0, 4, 4, 0]} // rounded at the value end, square at the start
          >
            {/* The value printed just past the end of each bar, e.g. "5,825". */}
            <LabelList
              dataKey="sessions"
              position="right"
              fill={chartColors.valueText}
              fontSize={12}
              formatter={(value) =>
                typeof value === "number" ? formatValue(value, "number") : value
              }
            />
          </Bar>
        </BarChart>
      </div>

      {/* The same numbers as a table, for screen readers (they can't hover a chart).
          sr-only goes on a wrapping div: a <table> can't shrink below its rows'
          height, so it would leave invisible empty space at the bottom of the page. */}
      <div className="sr-only">
        <table>
          <caption>Sessions by channel, most to least</caption>
          <thead>
            <tr>
              <th scope="col">Channel</th>
              <th scope="col">Sessions</th>
              <th scope="col">Share of sessions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row) => (
              <tr key={row.channel}>
                <td>{row.channel}</td>
                <td>{formatValue(row.sessions, "number")}</td>
                <td>{formatValue(total === 0 ? 0 : row.sessions / total, "percent")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The box shown on hover: the value first (bold), then the channel and its share.
function ChannelTooltip({
  active,
  payload,
  total,
}: TooltipContentProps & { total: number }) {
  if (!active || !payload || payload.length === 0) return null;

  const row = payload[0].payload as ChannelSessions; // the hovered channel's data
  const share = total === 0 ? 0 : row.sessions / total;

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors.series }} />
        <span className="font-semibold text-gray-900">{formatValue(row.sessions, "number")}</span>
        <span className="text-gray-500">sessions</span>
      </p>
      <p className="mt-0.5 text-gray-500">
        {row.channel} · {formatValue(share, "percent")} of sessions
      </p>
    </div>
  );
}
