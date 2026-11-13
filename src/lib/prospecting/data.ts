import type { DataSource } from "@/lib/dataSource";
import { DAYS_IN_RANGE, type DateRange } from "@/lib/dateRange";
import { SAMPLE_REPS, type SalesRep } from "@/lib/salesReps";
import { ONE_DAY_MS, SAMPLE_TODAY_MS } from "@/lib/sampleData";
import { SAMPLE_ACTIVITY, SAMPLE_OUTCOMES, SAMPLE_SSI } from "./sampleActivity";
import type {
  LinkedInOutcomeRow,
  ProspectingData,
  RepActivityRow,
  SalesNavActivityRow,
  SsiSnapshot,
  WeeklyOutreach,
} from "./types";

// Sample activity, so the Prospecting page shows a "Sample data" badge.
// Change to "live" when the fetch functions below return real data.
export const prospectingDataSource: DataSource = "sample";

// "Today" for the sample data. Real data will use the actual date.
const TODAY_MS = SAMPLE_TODAY_MS;

// ---------------------------------------------------------------------------
// Getting the rows — THE ONLY PART THAT CHANGES WHEN REAL DATA ARRIVES
// ---------------------------------------------------------------------------

async function fetchActivity(): Promise<SalesNavActivityRow[]> {
  return SAMPLE_ACTIVITY; // later: synced Sales Navigator usage reports
}

async function fetchSsi(): Promise<SsiSnapshot[]> {
  return SAMPLE_SSI; // later: synced SSI scores
}

async function fetchOutcomes(): Promise<LinkedInOutcomeRow[]> {
  return SAMPLE_OUTCOMES; // later: HubSpot meetings and deals with a LinkedIn source
}

async function fetchReps(): Promise<SalesRep[]> {
  return SAMPLE_REPS; // later: HubSpot's owners list
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

// Rows whose date is in the `days` days ending on `endMs` (inclusive).
// Dates are "YYYY-MM-DD" text, which sorts and compares correctly as text.
function inDays<T extends { date: string }>(rows: T[], days: number, endMs: number): T[] {
  const first = isoDate(endMs - (days - 1) * ONE_DAY_MS);
  const last = isoDate(endMs);
  return rows.filter((r) => r.date >= first && r.date <= last);
}

// Add up one numeric field across rows.
function total<T>(rows: T[], field: keyof T): number {
  return rows.reduce((sum, row) => sum + Number(row[field]), 0);
}

const rate = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);

// A rep's SSI on a given day (or 0 if there's no score that day).
function ssiOn(snapshots: SsiSnapshot[], repId: string, date: string): number {
  return snapshots.find((s) => s.repId === repId && s.date === date)?.ssi ?? 0;
}

// ---------------------------------------------------------------------------
// The function the page uses
// ---------------------------------------------------------------------------

const WEEKS_SHOWN = 12;

export async function getProspectingData(
  range: DateRange,
  requestedRepId: string | null = null,
): Promise<ProspectingData> {
  const [allActivity, snapshots, allOutcomes, reps] = await Promise.all([
    fetchActivity(),
    fetchSsi(),
    fetchOutcomes(),
    fetchReps(),
  ]);

  const repId = requestedRepId && reps.some((r) => r.id === requestedRepId) ? requestedRepId : null;
  const forRep = <T extends { repId: string }>(rows: T[]) =>
    repId === null ? rows : rows.filter((r) => r.repId === repId);

  // The selected range and the same number of days before it.
  const days = DAYS_IN_RANGE[range];
  const previousEndMs = TODAY_MS - days * ONE_DAY_MS;
  const activityNow = inDays(forRep(allActivity), days, TODAY_MS);
  const activityBefore = inDays(forRep(allActivity), days, previousEndMs);
  const outcomesNow = inDays(forRep(allOutcomes), days, TODAY_MS);
  const outcomesBefore = inDays(forRep(allOutcomes), days, previousEndMs);

  // Weekly outreach: the last 12 full weeks (Monday–Sunday), oldest first.
  // Today is inside the current, unfinished week, so that week is left out.
  const today = new Date(TODAY_MS);
  const daysSinceMonday = (today.getUTCDay() + 6) % 7; // Monday → 0, Sunday → 6
  const thisMondayMs = TODAY_MS - daysSinceMonday * ONE_DAY_MS;
  const weeklyOutreach: WeeklyOutreach[] = Array.from({ length: WEEKS_SHOWN }, (_, i) => {
    const weekStartMs = thisMondayMs - (WEEKS_SHOWN - i) * 7 * ONE_DAY_MS;
    const week = inDays(forRep(allActivity), 7, weekStartMs + 6 * ONE_DAY_MS);
    return {
      weekStart: isoDate(weekStartMs),
      inmails: total(week, "inmailsSent"),
      messages: total(week, "messagesSent"),
      connectionRequests: total(week, "connectionRequestsSent"),
    };
  });

  // Funnel for the selected range: outreach → accepted → meetings → deals.
  const funnel = [
    { step: "Outreach", count: total(activityNow, "inmailsSent") + total(activityNow, "connectionRequestsSent") },
    { step: "Accepted", count: total(activityNow, "inmailsAccepted") + total(activityNow, "connectionRequestsAccepted") },
    { step: "Meetings", count: total(outcomesNow, "meetingsBooked") },
    { step: "Deals", count: total(outcomesNow, "dealsCreated") },
  ];

  // Per-rep table: every rep, whatever the rep filter says, so reps can be compared.
  const rangeStart = isoDate(TODAY_MS - (days - 1) * ONE_DAY_MS);
  const repTable: RepActivityRow[] = reps
    .map((rep) => {
      const a = inDays(allActivity.filter((r) => r.repId === rep.id), days, TODAY_MS);
      const o = inDays(allOutcomes.filter((r) => r.repId === rep.id), days, TODAY_MS);
      const latestSsi = ssiOn(snapshots, rep.id, isoDate(TODAY_MS));
      return {
        repId: rep.id,
        rep: rep.name,
        inmailsSent: total(a, "inmailsSent"),
        inmailAcceptanceRate: rate(total(a, "inmailsAccepted"), total(a, "inmailsSent")),
        meetingsBooked: total(o, "meetingsBooked"),
        ssi: latestSsi,
        ssiChange: latestSsi - ssiOn(snapshots, rep.id, rangeStart),
      };
    })
    // Most meetings first; ties alphabetical by name.
    .sort((a, b) => b.meetingsBooked - a.meetingsBooked || a.rep.localeCompare(b.rep));

  return {
    range,
    repId,
    reps,
    kpis: {
      inmailsSent: { current: total(activityNow, "inmailsSent"), previous: total(activityBefore, "inmailsSent") },
      inmailAcceptanceRate: {
        current: rate(total(activityNow, "inmailsAccepted"), total(activityNow, "inmailsSent")),
        previous: rate(total(activityBefore, "inmailsAccepted"), total(activityBefore, "inmailsSent")),
      },
      connectionRequests: {
        current: total(activityNow, "connectionRequestsSent"),
        previous: total(activityBefore, "connectionRequestsSent"),
      },
      meetingsBooked: {
        current: total(outcomesNow, "meetingsBooked"),
        previous: total(outcomesBefore, "meetingsBooked"),
      },
    },
    weeklyOutreach,
    funnel,
    repTable,
  };
}
