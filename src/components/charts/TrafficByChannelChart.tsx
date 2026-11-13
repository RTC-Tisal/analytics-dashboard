"use client";

// Traffic by channel on the Website page: the shared HorizontalBarChart, with
// each channel's share of all sessions in the tooltip and the screen-reader table.

import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import { formatValue } from "@/lib/format";
import { ratio } from "@/lib/rates";
import type { ChannelSessions } from "@/lib/website/types";

interface TrafficByChannelChartProps {
  data: ChannelSessions[]; // already sorted biggest first by getWebsiteData
}

export default function TrafficByChannelChart({ data }: TrafficByChannelChartProps) {
  // Total sessions across all channels, for "43.3% of sessions".
  const total = data.reduce((sum, row) => sum + row.sessions, 0);

  const rows = data.map((row) => {
    const share = formatValue(ratio(row.sessions, total) ?? 0, "percent");
    return { label: row.channel, value: row.sessions, detail: `${share} of sessions`, tableCells: [share] };
  });

  return (
    <HorizontalBarChart
      rows={rows}
      unit="sessions"
      caption="Sessions by channel, most to least"
      labelHeader="Channel"
      valueHeader="Sessions"
      tableExtraHeaders={["Share of sessions"]}
      height={256} // the same size as before this chart became reusable
    />
  );
}
