import { formatUpdatedAt } from "@/lib/format";

// Where a page's numbers come from.
//   "sample" → made up for layout
//   "live"   → real data (GA4, HubSpot…)
//
// Each data module declares its own source right next to its data function,
// e.g. `export const websiteDataSource: DataSource = "sample";`, and has a
// get…Status() function that the page's status line reads.
export type DataSource = "sample" | "live";

// What the status line under each page title shows.
export type DataStatus =
  | { source: "sample" }
  // lastUpdated: when the data was last synced (ISO time, e.g. the newest synced_at
  // in BigQuery), or null if that isn't known.
  | { source: "live"; lastUpdated: string | null };

// The syncs run once a day. Older than this (a day plus some slack) = probably a failed sync.
export const STALE_AFTER_HOURS = 30;

export interface StatusView {
  tone: "sample" | "fresh" | "stale" | "unknown";
  text: string;
}

// The words and colour for a status. All the status line wording lives here.
// `nowMs` defaults to the current time; tests pass a fixed time instead.
// Only call it with the default after connection() (see DataStatusLine), never at build time.
export function describeStatus(status: DataStatus, nowMs: number = Date.now()): StatusView {
  if (status.source === "sample") {
    return { tone: "sample", text: "Made-up numbers for layout; real data isn't connected yet." };
  }
  if (status.lastUpdated === null) {
    return { tone: "unknown", text: "Live, but the last update time is unknown." };
  }
  const updated = `Live, last updated ${formatUpdatedAt(status.lastUpdated)}`;
  const ageHours = (nowMs - new Date(status.lastUpdated).getTime()) / 3_600_000;
  if (ageHours > STALE_AFTER_HOURS) {
    return { tone: "stale", text: `${updated}. That's over ${STALE_AFTER_HOURS} hours ago, so the numbers may be out of date.` };
  }
  return { tone: "fresh", text: updated };
}
