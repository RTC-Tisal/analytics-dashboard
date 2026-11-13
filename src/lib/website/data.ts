import type { DataSource } from "@/lib/dataSource";
import { DAYS_IN_RANGE, type DateRange } from "@/lib/dateRange";
import { ONE_DAY_MS, SAMPLE_TODAY_MS, stableNoise } from "@/lib/sampleData";
import type {
  ChannelSessions,
  DailyTraffic,
  LandingPage,
  PeriodValue,
  WebsiteData,
} from "./types";

// MADE-UP DATA for Modules 1 and 2. In Module 3 the inside of getWebsiteData()
// will be replaced with real GA4 data. Its name, input and output stay the same,
// so the page that uses it will not need to change.
//
// How the made-up data works:
//   1. Every date has its own made-up sessions and engaged sessions (madeUpDay).
//      They come from the date itself, so a day has the same numbers on every
//      refresh, whichever range you are looking at.
//   2. The KPI totals are the daily numbers added up, for the selected range and
//      for the same number of days just before it (the previous period).
//   3. Channels and landing pages split the Sessions total, so everything agrees.

// Made-up numbers, so the Website page shows a "Sample data" badge.
// Change to "live" in Module 3, when getWebsiteData() returns real GA4 data.
export const websiteDataSource: DataSource = "sample";

// The made-up period always ends on this day. A fixed date (not "today") keeps
// the numbers the same on every refresh. Real dates arrive with GA4 in Module 3.
const MADE_UP_END_DATE = SAMPLE_TODAY_MS; // 10 Nov 2026, shared with the other pages' sample data

// Form submissions are not part of the daily series, so their totals stay typed.
// The 28-day range drops on purpose, so we can check how a decrease looks.
const madeUpFormSubmissions: Record<DateRange, PeriodValue> = {
  "7d": { current: 38, previous: 31 },
  "28d": { current: 151, previous: 160 },
  "90d": { current: 489, previous: 437 },
};

// Relative share of sessions per GA4 channel group. Written in alphabetical order
// on purpose: madeUpTrafficByChannel() sorts them, biggest first. The shares don't
// need to add up to exactly 1, because splitTotal() divides by their sum.
const channelShares: { channel: string; share: number }[] = [
  { channel: "Direct", share: 0.24 },
  { channel: "Email", share: 0.04 },
  { channel: "Organic Search", share: 0.42 },
  { channel: "Organic Social", share: 0.09 },
  { channel: "Paid Search", share: 0.07 },
  { channel: "Referral", share: 0.11 },
];

// Made-up landing pages. There are 12 here; madeUpTopLandingPages() keeps the
// top 10. Their session shares add up to less than 1, because the rest of the
// traffic lands on smaller pages not listed.
const landingPageShares: {
  path: string;
  sessionShare: number; // share of all sessions
  engagementRate: number;
  formShare: number; // share of all form submissions
}[] = [
  { path: "/", sessionShare: 0.31, engagementRate: 0.58, formShare: 0.12 },
  { path: "/services/software-development", sessionShare: 0.12, engagementRate: 0.71, formShare: 0.14 },
  { path: "/case-studies", sessionShare: 0.08, engagementRate: 0.74, formShare: 0.06 },
  { path: "/blog/choosing-a-tech-partner", sessionShare: 0.07, engagementRate: 0.52, formShare: 0.04 },
  { path: "/contact", sessionShare: 0.05, engagementRate: 0.83, formShare: 0.38 },
  { path: "/about", sessionShare: 0.04, engagementRate: 0.66, formShare: 0.02 },
  { path: "/careers", sessionShare: 0.04, engagementRate: 0.61, formShare: 0 },
  { path: "/services/ai-solutions", sessionShare: 0.035, engagementRate: 0.69, formShare: 0.08 },
  { path: "/services/cloud", sessionShare: 0.03, engagementRate: 0.64, formShare: 0.05 },
  { path: "/blog/mvp-in-12-weeks", sessionShare: 0.025, engagementRate: 0.57, formShare: 0.03 },
  { path: "/blog/ai-in-fintech", sessionShare: 0.018, engagementRate: 0.49, formShare: 0.01 },
  { path: "/privacy-policy", sessionShare: 0.012, engagementRate: 0.31, formShare: 0 },
];

// How many landing pages the table shows.
const TOP_LANDING_PAGES = 10;

// ---------------------------------------------------------------------------
// Daily series
// ---------------------------------------------------------------------------

// Made-up traffic for one day, worked out from the date alone.
function madeUpDay(dayMs: number): DailyTraffic {
  const date = new Date(dayMs);
  const dayNumber = Math.round(dayMs / ONE_DAY_MS); // a unique, stable number for each date

  const weekdayFactor = [0.65, 1.15, 1.2, 1.15, 1.1, 0.95, 0.6]; // Sun, Mon, … Sat: B2B weekdays are busier
  const daysBeforeEnd = (MADE_UP_END_DATE - dayMs) / ONE_DAY_MS;
  const trend = 1 - daysBeforeEnd * 0.0012; // slow growth: about 11% lower 90 days ago
  const wobble = 0.88 + 0.24 * stableNoise(dayNumber); // between 0.88 and 1.12

  const sessions = Math.round(470 * weekdayFactor[date.getUTCDay()] * trend * wobble);

  // Engagement rate between 55% and 70%, also stable per day.
  const engagementRate = 0.55 + 0.15 * stableNoise(dayNumber + 1000);
  const engagedSessions = Math.round(sessions * engagementRate);

  return {
    date: date.toISOString().slice(0, 10), // "YYYY-MM-DD"
    sessions,
    engagedSessions,
  };
}

// `count` days of made-up traffic, oldest first, ending on `lastDayMs`.
function madeUpDays(count: number, lastDayMs: number): DailyTraffic[] {
  // Array.from({ length: count }, (_, i) => i) makes the list [0, 1, 2, …, count - 1].
  const positions = Array.from({ length: count }, (_, i) => i);

  // .map() turns each item of a list into something new, giving a new list of
  // the same length. Here, each position becomes one day's traffic:
  //   [0, 1, 2, …]  →  [{ date: "2026-10-14", … }, { date: "2026-10-15", … }, …]
  return positions.map((i) => madeUpDay(lastDayMs - (count - 1 - i) * ONE_DAY_MS));
}

// Add up a list of days into one total for sessions and engaged sessions.
function sumDays(days: DailyTraffic[]): { sessions: number; engagedSessions: number } {
  // .reduce() walks through a list and builds up ONE result as it goes.
  //   - `total` is the result so far. It starts as the second argument below:
  //     { sessions: 0, engagedSessions: 0 }.
  //   - For each `day`, the arrow function returns the new total, which is
  //     passed in as `total` for the next day.
  //   - After the last day, .reduce() returns the final total.
  return days.reduce(
    (total, day) => ({
      sessions: total.sessions + day.sessions,
      engagedSessions: total.engagedSessions + day.engagedSessions,
    }),
    { sessions: 0, engagedSessions: 0 },
  );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

// Engagement rate is worked out from the other two numbers, so they always agree.
// Returns 0 instead of dividing by zero when there were no sessions.
function rate(engaged: number, sessions: number): number {
  return sessions === 0 ? 0 : engaged / sessions;
}

// Split a whole-number total into whole-number parts in proportion to `weights`,
// so that the parts add up to exactly `total`. Rounding each part on its own can
// leave the sum off by one or two, so any leftover goes to the biggest part.
function splitTotal(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  const parts = weights.map((w) => Math.round((total * w) / weightSum));
  const leftover = total - parts.reduce((sum, p) => sum + p, 0);
  const biggest = weights.indexOf(Math.max(...weights));
  parts[biggest] += leftover;
  return parts;
}

// Sessions per channel that add up to `total`, biggest first.
function madeUpTrafficByChannel(total: number): ChannelSessions[] {
  const sessions = splitTotal(
    total,
    channelShares.map((c) => c.share),
  );

  const channels = channelShares.map((c, i) => ({ channel: c.channel, sessions: sessions[i] }));

  // .sort() puts the list in order by comparing two items at a time, `a` and `b`.
  // The compare function returns a number:
  //   negative → a goes first,  positive → b goes first,  0 → keep them as they are.
  // `b.sessions - a.sessions` is negative when a has MORE sessions, so bigger goes
  // first (most to least). If two channels tie (the result is 0), `||` moves on to
  // the tie-breaker: alphabetical by name, so the order never flips between refreshes.
  return channels.sort(
    (a, b) => b.sessions - a.sessions || a.channel.localeCompare(b.channel),
  );
}

// The top 10 landing pages, most sessions first.
function madeUpTopLandingPages(totalSessions: number, totalForms: number): LandingPage[] {
  return (
    landingPageShares
      .map((p) => ({
        path: p.path,
        sessions: Math.round(totalSessions * p.sessionShare),
        engagementRate: p.engagementRate,
        formSubmissions: Math.round(totalForms * p.formShare),
      }))
      // Most sessions first; equal sessions → alphabetical by path (same idea as channels).
      .sort((a, b) => b.sessions - a.sessions || a.path.localeCompare(b.path))
      // .slice(0, 10) keeps items 0 to 9, the first 10, and drops the rest.
      .slice(0, TOP_LANDING_PAGES)
  );
}

// ---------------------------------------------------------------------------
// The function the page uses
// ---------------------------------------------------------------------------

export async function getWebsiteData(range: DateRange): Promise<WebsiteData> {
  const days = DAYS_IN_RANGE[range];

  // The selected range, e.g. the 28 days ending 10 Nov…
  const currentDays = madeUpDays(days, MADE_UP_END_DATE);
  // …and the same number of days just before it, for the "vs previous period" change.
  const previousDays = madeUpDays(days, MADE_UP_END_DATE - days * ONE_DAY_MS);

  const current = sumDays(currentDays);
  const previous = sumDays(previousDays);
  const forms = madeUpFormSubmissions[range];

  return {
    range,
    kpis: {
      sessions: { current: current.sessions, previous: previous.sessions },
      engagedSessions: {
        current: current.engagedSessions,
        previous: previous.engagedSessions,
      },
      engagementRate: {
        current: rate(current.engagedSessions, current.sessions),
        previous: rate(previous.engagedSessions, previous.sessions),
      },
      formSubmissions: forms,
    },
    daily: currentDays,
    trafficByChannel: madeUpTrafficByChannel(current.sessions),
    topLandingPages: madeUpTopLandingPages(current.sessions, forms.current),
  };
}
