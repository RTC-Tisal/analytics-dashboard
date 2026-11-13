"use client";

// Sessions over time on the Website page: the shared TimeSeriesChart with daily sessions.

import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import type { DailyTraffic } from "@/lib/website/types";

interface SessionsOverTimeChartProps {
  data: DailyTraffic[]; // one entry per day, oldest first (from getWebsiteData)
}

export default function SessionsOverTimeChart({ data }: SessionsOverTimeChartProps) {
  return (
    <TimeSeriesChart
      points={data.map((day) => ({ date: day.date, value: day.sessions }))}
      unit="sessions"
      caption="Sessions per day"
      valueHeader="Sessions"
    />
  );
}
