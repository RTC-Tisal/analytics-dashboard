import type { SearchAnalyticsApiRow, SearchDevice, SearchRow } from "./types";

// A "brand" search is someone looking for us by name ("rootcode careers"). Brand and
// non-brand searches behave very differently (brand ones rank #1 and get clicked a lot),
// so the page shows them apart: non-brand is the real test of our SEO.
// Spaces are removed first, so "root code careers" counts too.
export function isBrandQuery(query: string): boolean {
  return query.toLowerCase().replaceAll(" ", "").includes("rootcode");
}

const DEVICES: readonly SearchDevice[] = ["DESKTOP", "MOBILE", "TABLET"];

// Turn one raw API row (values packed in `keys`, see SEARCH_DIMENSIONS) into our row.
// The row's ctr is dropped on purpose: it's clicks ÷ impressions, which we can always recalculate.
export function toSearchRow(apiRow: SearchAnalyticsApiRow): SearchRow {
  const [date, query, page, country, device] = apiRow.keys;
  if (apiRow.keys.length !== 5 || !DEVICES.includes(device as SearchDevice)) {
    throw new Error(`Unexpected Search Console row keys: ${JSON.stringify(apiRow.keys)}`);
  }
  return {
    date,
    query,
    page,
    country,
    device: device as SearchDevice,
    clicks: apiRow.clicks,
    impressions: apiRow.impressions,
    position: apiRow.position,
    isBrand: isBrandQuery(query),
  };
}
