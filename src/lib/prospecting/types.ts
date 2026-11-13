import type { DateRange } from "@/lib/dateRange";
import type { SalesRep } from "@/lib/salesReps";
import type { PeriodValue } from "@/lib/types";

// ---------------------------------------------------------------------------
// What the sources send
// ---------------------------------------------------------------------------
// Field names follow Sales Navigator's usage report (one row per seat per day).
// They are a best match, not copied from a real export: rename them here when
// the real report arrives.

// One rep's Sales Navigator activity on one day.
export interface SalesNavActivityRow {
  date: string; // "YYYY-MM-DD"
  repId: string; // HubSpot owner id the Sales Navigator seat is linked to
  inmailsSent: number;
  inmailsAccepted: number; // recipient accepted (replied to) the InMail
  messagesSent: number; // messages to existing connections
  connectionRequestsSent: number;
  connectionRequestsAccepted: number; // needed for the funnel's "accepted" step
  profileViews: number; // profiles the rep viewed
  savedLeads: number; // leads the rep saved to a list
}

// One rep's Social Selling Index on one day. LinkedIn scores it 0–100, daily.
export interface SsiSnapshot {
  date: string; // "YYYY-MM-DD"
  repId: string;
  ssi: number; // 0–100
}

// LinkedIn-sourced results recorded in HubSpot, for one rep on one day.
export interface LinkedInOutcomeRow {
  date: string; // "YYYY-MM-DD"
  repId: string;
  meetingsBooked: number; // meetings whose source is LinkedIn
  dealsCreated: number; // deals whose source is LinkedIn
}

// ---------------------------------------------------------------------------
// What getProspectingData() returns to the page
// ---------------------------------------------------------------------------

export interface ProspectingKpis {
  inmailsSent: PeriodValue;
  inmailAcceptanceRate: PeriodValue; // inmailsAccepted ÷ inmailsSent, a fraction
  connectionRequests: PeriodValue; // connection requests sent
  meetingsBooked: PeriodValue; // meetings booked from LinkedIn
}

// One week of the "weekly outreach by activity type" chart.
export interface WeeklyOutreach {
  weekStart: string; // the Monday, "YYYY-MM-DD"
  inmails: number;
  messages: number;
  connectionRequests: number;
}

// One step of the funnel, in order: outreach → accepted → meetings → deals.
export interface FunnelStep {
  step: string; // label, e.g. "Accepted"
  count: number;
}

// One row of the per-rep table.
export interface RepActivityRow {
  repId: string;
  rep: string; // name
  inmailsSent: number;
  inmailAcceptanceRate: number; // fraction
  meetingsBooked: number;
  ssi: number; // latest score, 0–100
  ssiChange: number; // points since the start of the range, e.g. +3
}

export interface ProspectingData {
  range: DateRange;
  repId: string | null; // the selected rep, or null for "All reps"
  reps: SalesRep[]; // everyone who can be picked in the rep filter
  kpis: ProspectingKpis;
  weeklyOutreach: WeeklyOutreach[]; // last 12 full weeks, oldest first
  funnel: FunnelStep[]; // 4 steps, in funnel order
  repTable: RepActivityRow[]; // every rep (the rep filter doesn't hide rows), most meetings first
}
