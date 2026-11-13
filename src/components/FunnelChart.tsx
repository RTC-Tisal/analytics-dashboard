import { ChevronDown, ChevronRight } from "lucide-react";
import { formatValue } from "@/lib/format";
import { ratio } from "@/lib/rates";

// One step of a funnel. The same simple shape the old Prospecting data used.
export interface FunnelStep {
  label: string; // e.g. "Clicks"
  count: number;
  // How the rate from the step before is described, e.g. "of impressions (CTR)".
  // Leave it out to show no rate, e.g. for a step that isn't the same people as the one before.
  rateLabel?: string;
  note?: string; // small print instead of (or as well as) the rate, e.g. "Won this period"
}

interface FunnelChartProps {
  steps: FunnelStep[]; // in order, widest first
}

// A funnel as a row of steps with the conversion rate between neighbours.
//
// Why not bars sized by the numbers? The steps span a huge range (~175,000
// impressions down to a handful of won deals); bars to scale would make every step
// after the first invisible. Counts plus step-to-step rates stay readable.
//
// A server component: nothing to hover, so it sends no JavaScript. Screen readers
// hear an ordered list: step 1 of 5, step 2 of 5…
export default function FunnelChart({ steps }: FunnelChartProps) {
  return (
    <ol className="flex flex-col gap-6 lg:flex-row lg:gap-8">
      {steps.map((step, i) => {
        const previous = steps[i - 1];
        const rate = previous && step.rateLabel ? ratio(step.count, previous.count) : null;
        return (
          <li key={step.label} className="relative flex-1 rounded-md bg-icon-soft px-4 py-3">
            {/* Arrow from the step before: down while the steps are stacked, right once they sit in a row (1024px+). */}
            {i > 0 && (
              <>
                <ChevronDown aria-hidden="true" className="absolute -top-5 left-1/2 h-4 w-4 -translate-x-1/2 text-gray-400 lg:hidden" />
                <ChevronRight aria-hidden="true" className="absolute top-1/2 -left-6 hidden h-4 w-4 -translate-y-1/2 text-gray-400 lg:block" />
              </>
            )}
            <p className="text-sm font-medium text-gray-600">{step.label}</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight tabular-nums text-gray-900">
              {formatValue(step.count, "number")}
            </p>
            {step.rateLabel && previous && (
              <p className="mt-1 text-xs text-gray-600">
                <span className="font-semibold tabular-nums text-primary">{formatValue(rate, "percent")}</span>{" "}
                {step.rateLabel}
              </p>
            )}
            {step.note && <p className="mt-1 text-xs text-gray-500">{step.note}</p>}
          </li>
        );
      })}
    </ol>
  );
}
