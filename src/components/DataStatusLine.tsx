import { CircleAlert, TriangleAlert } from "lucide-react";
import { connection } from "next/server";
import SampleDataBadge from "@/components/SampleDataBadge";
import { describeStatus, type DataStatus } from "@/lib/dataSource";

// The line under each page title that says where the numbers come from:
// "Sample data", "Live, last updated …", or a warning if the data is late or the check failed.
// PageHeader wraps it in <Suspense> with DataStatusLoading as the placeholder.
export default async function DataStatusLine({ status }: { status: Promise<DataStatus> }) {
  let resolved: DataStatus;
  try {
    resolved = await status;
  } catch (error) {
    // Never break the page over the status line: say so, and log the details for us.
    console.error("Data status check failed:", error);
    return (
      <Line>
        <CircleAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-negative" />
        <span className="text-negative">Couldn&apos;t check when this data was last updated.</span>
      </Line>
    );
  }

  if (resolved.source === "sample") {
    return (
      <Line>
        <SampleDataBadge />
        {/* 0, not the default: sample text doesn't depend on time, and reading the
            clock here would happen at build time, which Next.js forbids. */}
        <span className="text-gray-500">{describeStatus(resolved, 0).text}</span>
      </Line>
    );
  }

  // Comparing with "now" has to happen when someone visits, not when the site is built.
  // connection() tells Next.js that (cacheComponents is on).
  await connection();
  const view = describeStatus(resolved); // compares with the current time

  return (
    <Line>
      {view.tone === "fresh" ? (
        <span aria-hidden="true" className="h-2 w-2 shrink-0 rounded-full bg-positive" />
      ) : (
        <TriangleAlert aria-hidden="true" className="h-4 w-4 shrink-0 text-warning" />
      )}
      <span className={view.tone === "fresh" ? "text-gray-600" : "text-warning"}>{view.text}</span>
    </Line>
  );
}

// Placeholder while the status is being checked. Same height, so nothing jumps.
export function DataStatusLoading() {
  return (
    <Line>
      <span aria-hidden="true" className="h-2 w-2 shrink-0 animate-pulse rounded-full bg-gray-300" />
      <span className="text-gray-400">Checking data…</span>
    </Line>
  );
}

function Line({ children }: { children: React.ReactNode }) {
  return <p className="flex min-h-6 flex-wrap items-center gap-2 text-sm">{children}</p>;
}
