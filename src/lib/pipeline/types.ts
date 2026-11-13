import type { DateRange } from "@/lib/dateRange";
import type { SalesRep } from "@/lib/salesReps";
import type { PeriodValue } from "@/lib/types";

// ---------------------------------------------------------------------------
// What HubSpot sends
// ---------------------------------------------------------------------------

// One deal exactly as HubSpot's CRM API returns it. Note that EVERY property
// value is text, even the amount ("45000") and dates ("2026-03-14T09:30:00.000Z").
// normalizeDeal() turns this into the Deal type below.
export interface HubSpotDeal {
  id: string;
  properties: {
    dealname: string; // e.g. "Example Ltd – Mobile app"
    amount: string | null; // deal value as text, e.g. "45000"; can be empty
    dealstage: string; // stage id, e.g. "presentationscheduled"
    pipeline: string; // pipeline id, e.g. "default"
    hubspot_owner_id: string | null; // the sales rep's HubSpot owner id
    createdate: string; // when the deal was created (ISO date-time)
    closedate: string | null; // open deals: EXPECTED close date; closed deals: actual close date
  };
}

// ---------------------------------------------------------------------------
// What the app works with (after normalizeDeal)
// ---------------------------------------------------------------------------

// One stage of a pipeline, in the order deals move through it.
export interface DealStage {
  id: string; // HubSpot's internal id, e.g. "contractsent"
  label: string; // shown on screen, e.g. "Contract Sent"
  isClosed: boolean; // true for Closed Won and Closed Lost
  isWon: boolean; // true only for Closed Won
}

// A deal with real numbers and dates instead of text.
export interface Deal {
  id: string;
  name: string;
  amount: number; // 0 if HubSpot had no amount
  stageId: string;
  pipelineId: string;
  ownerId: string | null;
  createdMs: number; // create date as a timestamp (milliseconds)
  closeMs: number | null; // close date as a timestamp, or null if HubSpot had none
}

// ---------------------------------------------------------------------------
// What getPipelineData() returns to the page
// ---------------------------------------------------------------------------

export interface PipelineKpis {
  openPipelineValue: PeriodValue; // total of open deals: today vs the start of the range
  winRate: PeriodValue; // won ÷ (won + lost), for deals closed in the range; a fraction
  averageSalesCycleDays: PeriodValue; // days from create to close, for deals won in the range
}

// Won revenue this quarter so far, against the target.
export interface QuarterProgress {
  label: string; // e.g. "Q4 2026"
  won: number;
  target: number;
}

// One bar of "pipeline value by stage".
export interface StageValue {
  stageId: string;
  stage: string; // label, e.g. "Contract Sent"
  value: number; // total amount of open deals in this stage
  deals: number; // how many open deals are in this stage
}

// One month of "won revenue per month against target".
export interface MonthlyWon {
  month: string; // "YYYY-MM", e.g. "2026-11"
  won: number;
  target: number;
}

// One row of "the 10 biggest open deals".
export interface OpenDealRow {
  id: string;
  name: string;
  amount: number;
  stage: string; // stage label
  owner: string; // rep name, or "Unassigned"
  expectedCloseDate: string | null; // "YYYY-MM-DD"
}

export interface PipelineData {
  range: DateRange;
  ownerId: string | null; // the selected rep, or null for "All reps"
  reps: SalesRep[]; // everyone who can be picked in the rep filter
  kpis: PipelineKpis;
  wonThisQuarter: QuarterProgress;
  valueByStage: StageValue[]; // open stages only, in stage order
  wonByMonth: MonthlyWon[]; // the last 6 months, oldest first
  biggestOpenDeals: OpenDealRow[]; // top 10 by amount, biggest first
}
