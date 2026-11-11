import type { DateRange } from "@/lib/dateRange";

// One KPI measured over two periods, so the page can show the change.
export interface PeriodValue {
  current: number; // the selected period, e.g. the last 28 days
  previous: number; // the same length of time just before it, e.g. the 28 days before that
}

// The four KPIs on the Website page.
export interface WebsiteKpis {
  sessions: PeriodValue; // visits to the site
  engagedSessions: PeriodValue; // visits that lasted 10s+, viewed 2+ pages, or converted
  engagementRate: PeriodValue; // engagedSessions ÷ sessions, as a fraction: 0.63 means 63%
  formSubmissions: PeriodValue; // contact / enquiry forms sent
}

// Everything getWebsiteData() returns for one date range.
export interface WebsiteData {
  range: DateRange; // which range these numbers are for
  kpis: WebsiteKpis;
}
