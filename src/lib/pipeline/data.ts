import type { DataSource } from "@/lib/dataSource";
import { DAYS_IN_RANGE, type DateRange } from "@/lib/dateRange";
import { SAMPLE_REPS, type SalesRep } from "@/lib/salesReps";
import { ONE_DAY_MS, SAMPLE_TODAY_MS } from "@/lib/sampleData";
import { PIPELINE_ID, SAMPLE_DEALS, SAMPLE_QUARTERLY_TARGETS, STAGES } from "./sampleDeals";
import type {
  Deal,
  HubSpotDeal,
  MonthlyWon,
  OpenDealRow,
  PipelineData,
  StageValue,
} from "./types";

// Sample deals, so the Pipeline page shows a "Sample data" badge.
// Change to "live" when fetchDeals() returns real HubSpot data.
export const pipelineDataSource: DataSource = "sample";

// "Today" for the sample data. Real data will use the actual date.
const TODAY_MS = SAMPLE_TODAY_MS;

// ---------------------------------------------------------------------------
// Getting the deals — THE ONLY PART THAT CHANGES WHEN REAL DATA ARRIVES
// ---------------------------------------------------------------------------

// Returns deals in HubSpot's own format. Later this reads the synced HubSpot
// data instead; everything below stays the same.
async function fetchDeals(): Promise<HubSpotDeal[]> {
  return SAMPLE_DEALS;
}

// The sales reps for the filter. Later this comes from HubSpot's owners list.
async function fetchReps(): Promise<SalesRep[]> {
  return SAMPLE_REPS;
}

// Each rep's won-revenue target per quarter, by rep id. Later this comes from
// wherever sales sets its targets.
async function fetchQuarterlyTargets(): Promise<Record<string, number>> {
  return SAMPLE_QUARTERLY_TARGETS;
}

// ---------------------------------------------------------------------------
// Turning HubSpot's text into numbers and dates
// ---------------------------------------------------------------------------

// HubSpot sends every property as text. This converts one deal into proper
// numbers and timestamps, in one place, so nothing else has to worry about it.
export function normalizeDeal(raw: HubSpotDeal): Deal {
  const p = raw.properties;
  const amount = Number(p.amount);
  const closeMs = p.closedate ? Date.parse(p.closedate) : NaN;
  return {
    id: raw.id,
    name: p.dealname,
    amount: Number.isFinite(amount) ? amount : 0, // missing or broken amount → 0
    stageId: p.dealstage,
    pipelineId: p.pipeline,
    ownerId: p.hubspot_owner_id,
    createdMs: Date.parse(p.createdate),
    closeMs: Number.isFinite(closeMs) ? closeMs : null,
  };
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const stageById = new Map(STAGES.map((s) => [s.id, s]));
const isWon = (d: Deal) => stageById.get(d.stageId)?.isWon === true;
const isClosed = (d: Deal) => stageById.get(d.stageId)?.isClosed === true;
const sumAmounts = (deals: Deal[]) => deals.reduce((sum, d) => sum + d.amount, 0);

// Was this deal open at a given moment? Created by then, and not yet closed then.
function wasOpenAt(d: Deal, atMs: number): boolean {
  if (d.createdMs > atMs) return false;
  if (!isClosed(d)) return true;
  return d.closeMs !== null && d.closeMs > atMs;
}

// Deals that closed (won or lost) after `fromMs` and on or before `toMs`.
function closedBetween(deals: Deal[], fromMs: number, toMs: number): Deal[] {
  return deals.filter((d) => isClosed(d) && d.closeMs !== null && d.closeMs > fromMs && d.closeMs <= toMs);
}

// Won ÷ (won + lost). 0 when nothing closed, instead of dividing by zero.
function winRate(closed: Deal[]): number {
  return closed.length === 0 ? 0 : closed.filter(isWon).length / closed.length;
}

// Average days from create date to close date, for won deals. 0 when there are none.
function averageCycleDays(closed: Deal[]): number {
  const won = closed.filter(isWon);
  if (won.length === 0) return 0;
  const totalDays = won.reduce((sum, d) => sum + (d.closeMs! - d.createdMs) / ONE_DAY_MS, 0);
  return Math.round(totalDays / won.length);
}

// "YYYY-MM" for a timestamp, e.g. "2026-11".
const monthKey = (ms: number) => new Date(ms).toISOString().slice(0, 7);

// The calendar quarter that contains `ms`: its label and the timestamp it starts at.
function quarterOf(ms: number): { label: string; startMs: number } {
  const date = new Date(ms);
  const quarter = Math.floor(date.getUTCMonth() / 3); // 0–3
  return {
    label: `Q${quarter + 1} ${date.getUTCFullYear()}`,
    startMs: Date.UTC(date.getUTCFullYear(), quarter * 3, 1),
  };
}

// ---------------------------------------------------------------------------
// The function the page uses
// ---------------------------------------------------------------------------

const MONTHS_SHOWN = 6;
const TOP_DEALS = 10;

export async function getPipelineData(
  range: DateRange,
  requestedOwnerId: string | null = null,
): Promise<PipelineData> {
  const [rawDeals, reps, targets] = await Promise.all([
    fetchDeals(),
    fetchReps(),
    fetchQuarterlyTargets(),
  ]);

  // Only the sales pipeline, only known reps, and only the selected rep (if any).
  const ownerId = requestedOwnerId && reps.some((r) => r.id === requestedOwnerId) ? requestedOwnerId : null;
  const deals = rawDeals
    .map(normalizeDeal)
    .filter((d) => d.pipelineId === PIPELINE_ID)
    .filter((d) => ownerId === null || d.ownerId === ownerId);

  // The selected range and the same length of time before it.
  const rangeMs = DAYS_IN_RANGE[range] * ONE_DAY_MS;
  const rangeStartMs = TODAY_MS - rangeMs;
  const previousStartMs = rangeStartMs - rangeMs;
  const closedNow = closedBetween(deals, rangeStartMs, TODAY_MS);
  const closedBefore = closedBetween(deals, previousStartMs, rangeStartMs);

  // Targets: the selected rep's, or everyone's added up.
  const quarterlyTarget = reps
    .filter((r) => ownerId === null || r.id === ownerId)
    .reduce((sum, r) => sum + (targets[r.id] ?? 0), 0);

  // Won this quarter so far.
  const quarter = quarterOf(TODAY_MS);
  const wonThisQuarter = sumAmounts(
    deals.filter((d) => isWon(d) && d.closeMs !== null && d.closeMs >= quarter.startMs && d.closeMs <= TODAY_MS),
  );

  // Open deals today, and the value per open stage, in stage order.
  const openDeals = deals.filter((d) => !isClosed(d));
  const valueByStage: StageValue[] = STAGES.filter((s) => !s.isClosed).map((stage) => {
    const inStage = openDeals.filter((d) => d.stageId === stage.id);
    return { stageId: stage.id, stage: stage.label, value: sumAmounts(inStage), deals: inStage.length };
  });

  // Won revenue per month for the last 6 months (oldest first), with a monthly target.
  const today = new Date(TODAY_MS);
  const wonByMonth: MonthlyWon[] = Array.from({ length: MONTHS_SHOWN }, (_, i) => {
    const monthsAgo = MONTHS_SHOWN - 1 - i;
    const month = monthKey(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - monthsAgo, 1));
    const won = sumAmounts(deals.filter((d) => isWon(d) && d.closeMs !== null && monthKey(d.closeMs) === month));
    return { month, won, target: Math.round(quarterlyTarget / 3) };
  });

  // The 10 biggest open deals, biggest first (ties: alphabetical by name).
  const repName = new Map(reps.map((r) => [r.id, r.name]));
  const biggestOpenDeals: OpenDealRow[] = [...openDeals]
    .sort((a, b) => b.amount - a.amount || a.name.localeCompare(b.name))
    .slice(0, TOP_DEALS)
    .map((d) => ({
      id: d.id,
      name: d.name,
      amount: d.amount,
      stage: stageById.get(d.stageId)?.label ?? d.stageId,
      owner: (d.ownerId && repName.get(d.ownerId)) || "Unassigned",
      expectedCloseDate: d.closeMs === null ? null : new Date(d.closeMs).toISOString().slice(0, 10),
    }));

  return {
    range,
    ownerId,
    reps,
    kpis: {
      openPipelineValue: {
        current: sumAmounts(openDeals),
        previous: sumAmounts(deals.filter((d) => wasOpenAt(d, rangeStartMs))),
      },
      winRate: { current: winRate(closedNow), previous: winRate(closedBefore) },
      averageSalesCycleDays: {
        current: averageCycleDays(closedNow),
        previous: averageCycleDays(closedBefore),
      },
    },
    wonThisQuarter: { label: quarter.label, won: wonThisQuarter, target: quarterlyTarget },
    valueByStage,
    wonByMonth,
    biggestOpenDeals,
  };
}
