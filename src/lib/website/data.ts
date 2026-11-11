import type { DateRange } from "@/lib/dateRange";
import type { WebsiteData } from "./types";

// MADE-UP DATA for Module 1. In Module 3 the inside of getWebsiteData() will be
// replaced with real GA4 data. Its name, input and output stay the same, so the
// page that uses it will not need to change.

// Raw made-up counts for each range. Fixed numbers (not random) so the page
// shows the same thing on every reload. Form submissions drop in the 28-day
// range on purpose, so we can check how a decrease looks.
const madeUpCounts: Record<
  DateRange,
  {
    sessions: { current: number; previous: number };
    engagedSessions: { current: number; previous: number };
    formSubmissions: { current: number; previous: number };
  }
> = {
  "7d": {
    sessions: { current: 3420, previous: 3150 },
    engagedSessions: { current: 2190, previous: 1950 },
    formSubmissions: { current: 38, previous: 31 },
  },
  "28d": {
    sessions: { current: 13870, previous: 12990 },
    engagedSessions: { current: 8780, previous: 8050 },
    formSubmissions: { current: 151, previous: 160 },
  },
  "90d": {
    sessions: { current: 43750, previous: 39880 },
    engagedSessions: { current: 27300, previous: 24170 },
    formSubmissions: { current: 489, previous: 437 },
  },
};

// Engagement rate is worked out from the other two numbers, so they always agree.
// Returns 0 instead of dividing by zero when there were no sessions.
function rate(engaged: number, sessions: number): number {
  return sessions === 0 ? 0 : engaged / sessions;
}

export async function getWebsiteData(range: DateRange): Promise<WebsiteData> {
  const counts = madeUpCounts[range];

  return {
    range,
    kpis: {
      sessions: counts.sessions,
      engagedSessions: counts.engagedSessions,
      engagementRate: {
        current: rate(counts.engagedSessions.current, counts.sessions.current),
        previous: rate(counts.engagedSessions.previous, counts.sessions.previous),
      },
      formSubmissions: counts.formSubmissions,
    },
  };
}
