// Google Search Console: how rootcode.io shows up in Google search results.
// Shapes follow the Search Analytics API (searchanalytics.query). They're a close match,
// not copied from a live response: check them when access arrives.

// ===========================================================================
// RAW: what the API sends
// ===========================================================================

// We ask for these five dimensions, in this order. The API packs each row's values
// into one `keys` list in the same order, so keys[0] is the date, keys[1] the query…
export const SEARCH_DIMENSIONS = ["date", "query", "page", "country", "device"] as const;

export interface SearchAnalyticsApiRow {
  keys: string[]; // [date "YYYY-MM-DD", query, page URL, country, device]
  clicks: number;
  impressions: number; // times a result appeared in someone's search results
  ctr: number; // clicks ÷ impressions for THIS row only (we recalculate, never store it)
  position: number; // average position for THIS row only; 1 = top result, lower is better
}

export interface SearchAnalyticsApiResponse {
  rows?: SearchAnalyticsApiRow[]; // missing when there's no data at all
  responseAggregationType: "auto" | "byPage" | "byProperty";
}

// ===========================================================================
// OURS: one row per date + query + page + country + device
// ===========================================================================

export type SearchDevice = "DESKTOP" | "MOBILE" | "TABLET";

export interface SearchRow {
  date: string; // "YYYY-MM-DD"
  query: string; // what someone typed into Google
  page: string; // full URL of our page that appeared
  country: string; // 3-letter code in lower case, e.g. "lka" (Sri Lanka), "gbr", "usa"
  device: SearchDevice;
  clicks: number;
  impressions: number;
  // This row's average position. Never add these up or take a plain average:
  // use averagePosition() from rates.ts, which weights each row by its impressions.
  position: number;
  isBrand: boolean; // the query contains "rootcode" (see isBrandQuery)
}

// ===========================================================================
// What getSearchData() returns to the page
// ===========================================================================

// Which searches the "Top search terms" table shows (the toggle, ?terms= in the URL).
export type TermsFilter = "all" | "brand" | "nonbrand";

// Counts for any group of rows (a period, a day, a search term, a page). CTR is not
// here: pages calculate it with clickThroughRate. Position is here because it can only
// be worked out from the rows themselves (averagePosition, weighted by impressions).
export interface SearchCounts {
  clicks: number;
  impressions: number;
  position: number | null; // null when there were no impressions
}

export interface SearchDay extends SearchCounts {
  date: string; // "YYYY-MM-DD"
}

export interface SearchTerm extends SearchCounts {
  query: string;
  isBrand: boolean;
}

export interface SearchOpportunity extends SearchCounts {
  page: string; // full URL
  missedClicks: number; // extra clicks at the site's average non-brand CTR
}

export interface SearchData {
  firstDate: string; // first day of the selected period, "YYYY-MM-DD"
  lastDate: string; // last day: 2–3 days before today, because Search Console data is late
  current: SearchCounts; // the selected period
  previous: SearchCounts; // the same number of days just before it
  daily: SearchDay[]; // one per day of the selected period, oldest first
  topTerms: SearchTerm[]; // top 10 for the chosen TermsFilter, most clicks first
  opportunities: SearchOpportunity[]; // see OPPORTUNITY_RULES in data.ts, most missed clicks first
  nonBrandCtr: number | null; // the benchmark the opportunities are compared with
}
