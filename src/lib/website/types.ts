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

// One day of website traffic. A list of these feeds the "Sessions over time"
// chart, and adding them up gives the Sessions and Engaged sessions KPIs.
export interface DailyTraffic {
  date: string; // the day, as "YYYY-MM-DD", e.g. "2026-11-10"
  sessions: number; // sessions on that day
  engagedSessions: number; // engaged sessions on that day (never more than sessions)
}

// One bar on the "Traffic by channel" chart.
export interface ChannelSessions {
  channel: string; // GA4's channel group name, e.g. "Organic Search"
  sessions: number; // sessions from that channel in the selected period
}

// One row of the "Top landing pages" table.
export interface LandingPage {
  path: string; // the first page of the visit, e.g. "/contact"
  sessions: number; // sessions that started on this page
  engagementRate: number; // fraction, like WebsiteKpis.engagementRate
  formSubmissions: number; // forms sent during sessions that started here
}

// Everything getWebsiteData() returns for one date range.
export interface WebsiteData {
  range: DateRange; // which range these numbers are for
  kpis: WebsiteKpis;
  daily: DailyTraffic[]; // one entry per day of the selected range, oldest first
  trafficByChannel: ChannelSessions[]; // biggest channel first
  topLandingPages: LandingPage[]; // top 10, most sessions first
}
