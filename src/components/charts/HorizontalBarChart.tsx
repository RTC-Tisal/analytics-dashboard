"use client";

// A reusable horizontal bar chart: one bar per row, biggest first, with the value
// printed at the end of each bar and a tooltip on hover. Runs in the browser too,
// because it reacts to the mouse (tooltip) and to the card's width (resizing).
//
// Everything it shows comes in as plain data (text and numbers), prepared on the
// server, so any page can use it: channels, companies, industries, stages…

import { Bar, BarChart, LabelList, Tooltip, XAxis, YAxis, type TooltipContentProps } from "recharts";
import { chartColors } from "@/lib/chartColors";
import { formatValue, type ValueFormat } from "@/lib/format";

export interface BarRow {
  label: string; // e.g. "Organic Search" or "Imaginary Bank"
  value: number; // the bar's length, e.g. sessions or clicks
  detail?: string; // tooltip's second line after the label, e.g. "43.3% of sessions"
  tableCells?: string[]; // extra columns in the screen-reader table, e.g. ["43.3%"]
}

interface HorizontalBarChartProps {
  rows: BarRow[]; // drawn top to bottom in the order given (sort them before passing)
  unit: string; // what the value counts, e.g. "sessions" or "clicks"
  format?: ValueFormat; // how to show values; "number" by default
  caption: string; // the screen-reader table's caption, e.g. "Sessions by channel, most to least"
  labelHeader: string; // the table's first column heading, e.g. "Channel"
  valueHeader: string; // the table's value column heading, e.g. "Sessions"
  tableExtraHeaders?: string[]; // headings for each row's tableCells
  height?: number; // in pixels; by default it grows with the number of bars
  labelWidth?: number; // space for the names on the left, in pixels
  maxLabelChars?: number; // longer names are cut with "…" (the full name is in the tooltip)
}

// "Hospitals and Health Care" → "Hospitals and Health…" (no stray space before the "…").
const shorten = (text: string, max?: number) =>
  max !== undefined && text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;

export default function HorizontalBarChart({
  rows,
  unit,
  format = "number",
  caption,
  labelHeader,
  valueHeader,
  tableExtraHeaders = [],
  height,
  labelWidth = 112,
  maxLabelChars,
}: HorizontalBarChartProps) {
  // About 36px per bar, so 4 bars aren't stretched to the height of 10.
  const chartHeight = height ?? Math.max(rows.length, 1) * 36 + 8;

  return (
    <>
      <div style={{ height: chartHeight }} aria-hidden="true">
        <BarChart
          responsive
          accessibilityLayer={false} // screen readers use the table below instead
          layout="vertical" // bars run left to right; names are listed down the side
          data={rows}
          style={{ width: "100%", height: "100%" }}
          margin={{ top: 0, right: 56, bottom: 0, left: 0 }} // room on the right for the value labels
        >
          {/* The number axis is hidden: each bar has its value printed at its end instead. */}
          <XAxis type="number" hide />

          {/* Names down the left side, always on ONE line (long ones shortened with "…").
              We draw the label ourselves because Recharts' own labels wrap onto two
              cramped lines whenever it guesses the text is too wide. */}
          <YAxis
            type="category"
            dataKey="label"
            width={labelWidth}
            tickLine={false}
            axisLine={false}
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy="0.355em" textAnchor="end" fill={chartColors.axisText} fontSize={12}>
                {shorten(String(payload.value), maxLabelChars)}
              </text>
            )}
          />

          {/* Hover: a light grey band behind the row, plus our tooltip box. */}
          <Tooltip
            cursor={{ fill: chartColors.hoverBand }}
            content={(props) => <BarTooltip {...props} unit={unit} format={format} />}
          />

          <Bar
            dataKey="value"
            fill={chartColors.series}
            activeBar={{ fill: chartColors.seriesHover }}
            barSize={20}
            radius={[0, 4, 4, 0]} // rounded at the value end, square at the start
          >
            <LabelList
              dataKey="value"
              position="right"
              fill={chartColors.valueText}
              fontSize={12}
              formatter={(value) => (typeof value === "number" ? formatValue(value, format) : value)}
            />
          </Bar>
        </BarChart>
      </div>

      {/* The same numbers as a table, for screen readers (they can't hover a chart).
          sr-only goes on a wrapping div: a <table> can't shrink below its rows'
          height, so it would leave invisible empty space at the bottom of the page. */}
      <div className="sr-only">
        <table>
          <caption>{caption}</caption>
          <thead>
            <tr>
              <th scope="col">{labelHeader}</th>
              <th scope="col">{valueHeader}</th>
              {tableExtraHeaders.map((h) => (
                <th key={h} scope="col">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label}>
                <td>{row.label}</td>
                <td>{formatValue(row.value, format)}</td>
                {row.tableCells?.map((cell, i) => (
                  <td key={i}>{cell}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

// The box shown on hover: the value first (bold), then the full name and any detail.
function BarTooltip({
  active,
  payload,
  unit,
  format,
}: TooltipContentProps & { unit: string; format: ValueFormat }) {
  if (!active || !payload || payload.length === 0) return null;
  const row = payload[0].payload as BarRow; // the hovered row's data

  return (
    <div className="rounded-md border border-gray-200 bg-white px-3 py-2 text-sm shadow-md">
      <p className="flex items-center gap-2">
        <span className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: chartColors.series }} />
        <span className="font-semibold text-gray-900">{formatValue(row.value, format)}</span>
        <span className="text-gray-500">{unit}</span>
      </p>
      <p className="mt-0.5 text-gray-500">{row.detail ? `${row.label} · ${row.detail}` : row.label}</p>
    </div>
  );
}
