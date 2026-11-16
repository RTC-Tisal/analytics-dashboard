// Read-only check: for every contact and company, how many have each useful field filled in?
// Prints counts and HubSpot's own category labels only: no names, emails or company names.
//
// Run:  node --env-file=.env.local scripts/hubspot-fields.mts

const key = process.env.HUBSPOT_SERVICE_KEY;
if (!key) {
  throw new Error("HUBSPOT_SERVICE_KEY is not set. Add it to .env.local (see .env.example).");
}

// Fields a dashboard could use. HubSpot only sends the fields we ask for by name.
const FIELDS = {
  contacts: [
    "createdate",
    "lifecyclestage", // subscriber → lead → … → customer
    "hs_lead_status",
    "hs_analytics_source", // original source: organic search, paid social, offline…
    "hs_analytics_source_data_1", // more detail on the source
    "hubspot_owner_id", // which sales rep owns the contact
    "associatedcompanyid",
    "jobtitle",
    "country",
  ],
  companies: [
    "createdate",
    "lifecyclestage",
    "hs_analytics_source",
    "hubspot_owner_id",
    "industry",
    "numberofemployees",
    "country",
    "domain",
    "num_associated_contacts",
  ],
} as const;

// These two get a count per category, e.g. "lead: 120".
const BREAKDOWN = ["lifecyclestage", "hs_analytics_source"];

type HubSpotRecord = { properties: Record<string, string | null> };

// HubSpot sends at most 100 records per request, plus a "next page" marker.
async function fetchAll(object: string, fields: readonly string[]): Promise<HubSpotRecord[]> {
  const records: HubSpotRecord[] = [];
  let after: string | undefined;
  do {
    const url = new URL(`https://api.hubapi.com/crm/v3/objects/${object}`);
    url.searchParams.set("limit", "100");
    url.searchParams.set("properties", fields.join(","));
    if (after) url.searchParams.set("after", after);

    const response = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
    const body = await response.json();
    if (!response.ok) {
      throw new Error(`HubSpot ${object}: ${response.status} ${body.message ?? ""}`);
    }
    records.push(...body.results);
    after = body.paging?.next?.after;
  } while (after);
  return records;
}

const isFilled = (value: string | null | undefined) => value != null && value.trim() !== "";

for (const [object, fields] of Object.entries(FIELDS)) {
  const records = await fetchAll(object, fields);
  console.log(`\n=== ${object}: ${records.length} records ===`);

  for (const field of fields) {
    const filled = records.filter((r) => isFilled(r.properties[field])).length;
    const percent = records.length ? Math.round((filled / records.length) * 100) : 0;
    console.log(`${field.padEnd(28)} ${String(filled).padStart(4)} filled (${percent}%)`);
  }

  // Oldest and newest created dates, by month: how far back the data goes.
  const months = records
    .map((r) => r.properties.createdate?.slice(0, 7))
    .filter((m): m is string => Boolean(m))
    .sort();
  console.log(`Created between: ${months[0] ?? "?"} and ${months.at(-1) ?? "?"}`);

  for (const field of BREAKDOWN) {
    if (!(fields as readonly string[]).includes(field)) continue;
    const counts = new Map<string, number>();
    for (const r of records) {
      const label = isFilled(r.properties[field]) ? r.properties[field]! : "(empty)";
      counts.set(label, (counts.get(label) ?? 0) + 1);
    }
    const sorted = [...counts].sort((a, b) => b[1] - a[1]);
    console.log(`${field} breakdown: ${sorted.map(([label, n]) => `${label}: ${n}`).join(", ")}`);
  }
}
