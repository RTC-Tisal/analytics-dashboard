"use client";

// A tiny trend line for a KPI tile: no axes, no tooltip, just the shape of the
// period. Runs in the browser too because it resizes with the tile.

import { Area, AreaChart, YAxis } from "recharts";
import { chartColors } from "@/lib/chartColors";

interface SparklineProps {
  values: number[]; // one number per day, oldest first
}

export default function Sparkline({ values }: SparklineProps) {
  // Recharts wants a list of objects, so each number becomes { day, value }.
  const data = values.map((value, day) => ({ day, value }));

  return (
    // Decorative: the change pill above already says what happened, in words.
    <div className="h-10" aria-hidden="true">
      <AreaChart
        responsive
        accessibilityLayer={false}
        data={data}
        style={{ width: "100%", height: "100%" }}
        margin={{ top: 2, right: 0, bottom: 2, left: 0 }}
      >
        {/* Scale from the lowest to the highest day (not from 0), so the shape is visible. */}
        <YAxis hide domain={["dataMin", "dataMax"]} />
        <Area
          type="monotone"
          dataKey="value"
          stroke={chartColors.series}
          strokeWidth={2}
          fill={chartColors.series}
          fillOpacity={0.1} // a soft wash under the line, never a solid block
          dot={false}
          activeDot={false}
          isAnimationActive={false}
        />
      </AreaChart>
    </div>
  );
}
