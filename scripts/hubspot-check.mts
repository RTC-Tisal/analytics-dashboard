// Read-only check that HubSpot accepts our key: fetch ONE deal and print its field names.
// Prints no values (no client names or amounts) and never the key itself.
//
// Run:  node --env-file=.env.local scripts/hubspot-check.mts

const key = process.env.HUBSPOT_SERVICE_KEY;
if (!key) {
  throw new Error("HUBSPOT_SERVICE_KEY is not set. Add it to .env.local (see .env.example).");
}

// GET = read only. limit=1: we only need one deal to see what fields come back.
const response = await fetch("https://api.hubapi.com/crm/v3/objects/deals?limit=1", {
  headers: { Authorization: `Bearer ${key}` },
});

console.log(`HubSpot answered: ${response.status} ${response.statusText}`);
const body = await response.json();

if (!response.ok) {
  // HubSpot's own explanation, e.g. a missing permission ("scope").
  console.log(`Problem: ${body.message ?? "no message"}`);
  process.exit(1);
}

const deals: { properties: Record<string, unknown> }[] = body.results;
console.log(`Deals returned: ${deals.length} (asked for 1)`);
if (deals.length > 0) {
  console.log("Field names on that deal:");
  for (const name of Object.keys(deals[0].properties).sort()) {
    console.log(`- ${name}`);
  }
}
console.log(`More deals after this one: ${body.paging?.next ? "yes" : "no"}`);
