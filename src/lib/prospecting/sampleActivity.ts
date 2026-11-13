import { SAMPLE_REPS } from "@/lib/salesReps";
import { ONE_DAY_MS, SAMPLE_TODAY_MS, stableNoise } from "@/lib/sampleData";
import type { LinkedInOutcomeRow, SalesNavActivityRow, SsiSnapshot } from "./types";

// SAMPLE DATA for the Prospecting page. Everything here is fictional. The rows
// are shaped like a Sales Navigator usage report (one row per rep per day), plus
// daily SSI scores and LinkedIn-sourced meetings/deals from HubSpot.

// Enough days for a 90-day range plus the 90 days before it (for comparisons).
const HISTORY_DAYS = 200;

// Each fictional rep's working style: average per working day, and how well it converts.
const REP_STYLE: Record<
  string,
  {
    inmails: number; messages: number; connectionRequests: number; profileViews: number; savedLeads: number;
    inmailAcceptRate: number; connectionAcceptRate: number; meetingRate: number; ssiStart: number;
  }
> = {
  "70000001": { inmails: 6, messages: 20, connectionRequests: 16, profileViews: 35, savedLeads: 5, inmailAcceptRate: 0.3, connectionAcceptRate: 0.38, meetingRate: 0.12, ssiStart: 68 }, // Alex Sample
  "70000002": { inmails: 4, messages: 14, connectionRequests: 12, profileViews: 28, savedLeads: 4, inmailAcceptRate: 0.26, connectionAcceptRate: 0.34, meetingRate: 0.1, ssiStart: 61 }, // Jordan Example
  "70000003": { inmails: 3, messages: 10, connectionRequests: 18, profileViews: 40, savedLeads: 7, inmailAcceptRate: 0.22, connectionAcceptRate: 0.42, meetingRate: 0.08, ssiStart: 54 }, // Sam Placeholder
  "70000004": { inmails: 2, messages: 8, connectionRequests: 9, profileViews: 20, savedLeads: 3, inmailAcceptRate: 0.18, connectionAcceptRate: 0.3, meetingRate: 0.07, ssiStart: 44 }, // Riley Demo
};

// Almost no LinkedIn activity at weekends; Tuesday is the busiest day.
const WEEKDAY_FACTOR = [0.05, 1.1, 1.15, 1.1, 1.0, 0.75, 0.05]; // Sun, Mon, … Sat

// Round a fractional amount up or down using a stable "dice roll", so that on
// average the result equals `value` (e.g. 0.3 meetings a day → a meeting about
// every third day, not never).
const stableRound = (value: number, roll: number) => Math.floor(value + roll);

// Build every sample row once, when this file is first loaded.
const activity: SalesNavActivityRow[] = [];
const ssi: SsiSnapshot[] = [];
const outcomes: LinkedInOutcomeRow[] = [];

for (let day = HISTORY_DAYS - 1; day >= 0; day--) {
  const dayMs = SAMPLE_TODAY_MS - day * ONE_DAY_MS; // oldest first
  const date = new Date(dayMs).toISOString().slice(0, 10);
  const weekday = WEEKDAY_FACTOR[new Date(dayMs).getUTCDay()];
  const dayNumber = Math.round(dayMs / ONE_DAY_MS);

  SAMPLE_REPS.forEach((rep, repIndex) => {
    const style = REP_STYLE[rep.id];
    const noise = (k: number) => stableNoise(dayNumber * 100 + repIndex * 13 + k);
    const amount = (perDay: number, k: number) => Math.round(perDay * weekday * (0.6 + 0.8 * noise(k)));

    const inmailsSent = amount(style.inmails, 1);
    const connectionRequestsSent = amount(style.connectionRequests, 2);
    // stableRound, not Math.round: with small daily numbers (2 InMails × 18% = 0.36),
    // Math.round would give 0 every single day and the acceptance rate would come out far too low.
    const inmailsAccepted = Math.min(inmailsSent, stableRound(inmailsSent * style.inmailAcceptRate, noise(3)));
    const connectionRequestsAccepted = Math.min(
      connectionRequestsSent,
      stableRound(connectionRequestsSent * style.connectionAcceptRate, noise(4)),
    );

    activity.push({
      date,
      repId: rep.id,
      inmailsSent,
      inmailsAccepted,
      messagesSent: amount(style.messages, 5),
      connectionRequestsSent,
      connectionRequestsAccepted,
      profileViews: amount(style.profileViews, 6),
      savedLeads: amount(style.savedLeads, 7),
    });

    // Meetings come from accepted outreach; about 30% of meetings become deals.
    const meetingsBooked = stableRound((inmailsAccepted + connectionRequestsAccepted) * style.meetingRate, noise(8));
    outcomes.push({
      date,
      repId: rep.id,
      meetingsBooked,
      dealsCreated: stableRound(meetingsBooked * 0.3, noise(9)),
    });

    // SSI drifts up slowly (about 3 points over the 200 days) with a little daily wobble.
    const drift = ((HISTORY_DAYS - 1 - day) / HISTORY_DAYS) * 3;
    ssi.push({
      date,
      repId: rep.id,
      ssi: Math.max(0, Math.min(100, Math.round(style.ssiStart + drift + (noise(10) - 0.5) * 2))),
    });
  });
}

export const SAMPLE_ACTIVITY: SalesNavActivityRow[] = activity;
export const SAMPLE_SSI: SsiSnapshot[] = ssi;
export const SAMPLE_OUTCOMES: LinkedInOutcomeRow[] = outcomes;
