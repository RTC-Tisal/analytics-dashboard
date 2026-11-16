// Shared HubSpot request helper for the sync scripts. Read-only: GET requests only.

import { requireEnv } from "../lib/env.mts";

const key = requireEnv("HUBSPOT_SERVICE_KEY");

// HubSpot sends at most 100 records per request, plus a "next page" marker.
// This keeps asking until there are no more pages, and returns everything.
export async function fetchAllPages<T>(
  path: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const results: T[] = [];
  let after: string | undefined;
  do {
    const url = new URL(`https://api.hubapi.com${path}`);
    url.searchParams.set("limit", "100");
    for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
    if (after) url.searchParams.set("after", after);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    const body = await response.json();
    if (!response.ok) {
      // HubSpot's own explanation. The key is never printed.
      throw new Error(`HubSpot ${path}: ${response.status} ${body.message ?? ""}`);
    }
    results.push(...body.results);
    after = body.paging?.next?.after;
  } while (after);
  return results;
}
