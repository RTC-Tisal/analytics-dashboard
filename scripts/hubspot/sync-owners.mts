// Copies HubSpot owners (sales reps) into sales.hubspot_owners.
//
// Dry run (default, writes nothing):  node --env-file=.env.local scripts/hubspot/sync-owners.mts
// Really write:                       node --env-file=.env.local scripts/hubspot/sync-owners.mts --apply
//
// Prints counts only, never names or emails.

import { datasetName, replaceTable, type Row } from "../lib/bigquery.mts";
import { isApply } from "../lib/env.mts";
import { fetchAllPages } from "./api.mts";
import { owners as ownersTable } from "./tables.mts";

// What HubSpot sends for one owner (only the fields we use).
interface HubSpotOwner {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  archived: boolean;
}

// HubSpot lists current and archived (left the company) owners separately. We want both,
// so old contacts and deals still show a name.
const current = await fetchAllPages<HubSpotOwner>("/crm/v3/owners", { archived: "false" });
const archived = await fetchAllPages<HubSpotOwner>("/crm/v3/owners", { archived: "true" });

const syncedAt = new Date().toISOString();

// HubSpot's shape → our columns. The email stays behind on purpose.
function toRow(owner: HubSpotOwner): Row {
  const name = [owner.firstName, owner.lastName].filter(Boolean).join(" ").trim();
  return {
    owner_id: owner.id,
    name: name || null,
    is_active: !owner.archived,
    synced_at: syncedAt,
  };
}

const rows = [...current, ...archived].map(toRow);

console.log(isApply ? "MODE: APPLY (writing to BigQuery)" : "MODE: DRY RUN (nothing will be written)");
console.log(`From HubSpot: ${current.length} current + ${archived.length} archived = ${rows.length} owners`);
console.log(`Without a name: ${rows.filter((row) => row.name === null).length}`);

if (isApply) {
  const written = await replaceTable(ownersTable, rows);
  console.log(`Replaced ${datasetName}.${ownersTable.name}: ${written} rows`);
} else {
  console.log(`Would replace ${datasetName}.${ownersTable.name} with ${rows.length} rows. Add --apply to write.`);
}
