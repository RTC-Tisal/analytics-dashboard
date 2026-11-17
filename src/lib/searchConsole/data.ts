import type { DataSource } from "@/lib/dataSource";
import { DAYS_IN_RANGE, type DateRange } from "@/lib/dateRange";
import { averagePosition, clickThroughRate, missedClicks } from "@/lib/rates";
import { isoDate, ONE_DAY_MS } from "@/lib/sampleData";
import { SAMPLE_SEARCH_LAST_DAY_MS, sampleSearchRows } from "./sample";
import type { SearchCounts, SearchData, SearchOpportunity, SearchRow, SearchTerm, TermsFilter } from "./types";

// MADE-UP DATA for now. When Search Console is connected, the inside of getSearchData()
// reads rows from BigQuery instead of sampleSearchRows(). Its input and output stay the same.

// "sample" shows the Sample data badge on the Search section. Change to "live" with real data.
export const searchConsoleDataSource: DataSource = "sample";

export const TERMS_FILTERS: TermsFilter[] = ["all", "brand", "nonbrand"];

// Turn the raw ?terms= value from the URL into a valid TermsFilter ("all" if missing or unknown).
export function parseTermsFilter(value: string | string[] | undefined): TermsFilter {
  return TERMS_FILTERS.find((filter) => filter === value) ?? "all";
}

const TOP_TERMS = 10;

// Which pages count as an "opportunity": shown on the page too, so keep the wording in sync.
export const OPPORTUNITY_RULES = {
  minImpressionsPerDay: 10, // enough searches to be worth fixing (280 over 28 days)
  maxRows: 5,
};

// Add up any group of rows. Position is weighted by impressions (see averagePosition).
function countRows(rows: SearchRow[]): SearchCounts {
  let clicks = 0;
  let impressions = 0;
  for (const row of rows) {
    clicks += row.clicks;
    impressions += row.impressions;
  }
  return { clicks, impressions, position: averagePosition(rows) };
}

// Group rows by one field, e.g. by query or by page: { "rootcode": [rows…], … }.
function groupBy(rows: SearchRow[], field: "date" | "query" | "page"): Map<string, SearchRow[]> {
  const groups = new Map<string, SearchRow[]>();
  for (const row of rows) {
    const key = row[field];
    const group = groups.get(key);
    if (group) group.push(row);
    else groups.set(key, [row]);
  }
  return groups;
}

function topTerms(rows: SearchRow[], filter: TermsFilter): SearchTerm[] {
  const chosen = filter === "all" ? rows : rows.filter((row) => row.isBrand === (filter === "brand"));
  return (
    [...groupBy(chosen, "query")]
      .map(([query, group]) => ({ query, isBrand: group[0].isBrand, ...countRows(group) }))
      // Most clicks first; then most impressions; then A–Z, so the order never flips between refreshes.
      .sort((a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.query.localeCompare(b.query))
      .slice(0, TOP_TERMS)
  );
}

// Pages that appear a lot in non-brand searches but get clicked less than the site average.
function opportunities(rows: SearchRow[], days: number, benchmarkCtr: number | null): SearchOpportunity[] {
  if (benchmarkCtr === null) return []; // no non-brand impressions at all: nothing to compare with
  const minImpressions = OPPORTUNITY_RULES.minImpressionsPerDay * days;

  return [...groupBy(rows, "page")]
    .map(([page, group]) => {
      const counts = countRows(group);
      return { page, ...counts, missedClicks: missedClicks(counts, benchmarkCtr) };
    })
    .filter((page) => page.impressions >= minImpressions && page.missedClicks > 0)
    .sort((a, b) => b.missedClicks - a.missedClicks || a.page.localeCompare(b.page))
    .slice(0, OPPORTUNITY_RULES.maxRows);
}

export async function getSearchData(range: DateRange, terms: TermsFilter): Promise<SearchData> {
  const days = DAYS_IN_RANGE[range];
  const lastDayMs = SAMPLE_SEARCH_LAST_DAY_MS;
  const firstDayMs = lastDayMs - (days - 1) * ONE_DAY_MS;

  const rows = sampleSearchRows(firstDayMs, lastDayMs);
  const previousRows = sampleSearchRows(firstDayMs - days * ONE_DAY_MS, firstDayMs - ONE_DAY_MS);
  const nonBrandRows = rows.filter((row) => !row.isBrand);
  const nonBrandCtr = clickThroughRate(countRows(nonBrandRows));

  // One entry for every day, even a day without rows (it shows as 0 clicks, not a gap).
  const byDate = groupBy(rows, "date");
  const daily = Array.from({ length: days }, (_, i) => {
    const date = isoDate(firstDayMs + i * ONE_DAY_MS);
    return { date, ...countRows(byDate.get(date) ?? []) };
  });

  return {
    firstDate: isoDate(firstDayMs),
    lastDate: isoDate(lastDayMs),
    current: countRows(rows),
    previous: countRows(previousRows),
    daily,
    topTerms: topTerms(rows, terms),
    opportunities: opportunities(nonBrandRows, days, nonBrandCtr),
    nonBrandCtr,
  };
}
