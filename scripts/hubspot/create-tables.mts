// Creates the HubSpot tables in BigQuery (definitions in tables.mts).
//
// Dry run (default, changes nothing):  node --env-file=.env.local scripts/hubspot/create-tables.mts
// Really create:                       node --env-file=.env.local scripts/hubspot/create-tables.mts --apply
//
// Safe to run again: tables that already exist are skipped, never changed or deleted.
// Login: Application Default Credentials (impersonating dashboard-sync), no key file.

import { BigQuery } from "@google-cloud/bigquery";
import { isApply as apply, requireEnv } from "../lib/env.mts";
import { HUBSPOT_TABLES, type TableDefinition } from "./tables.mts";

const projectId = requireEnv("GCP_PROJECT_ID");
const datasetId = requireEnv("BQ_DATASET");
const location = requireEnv("BQ_LOCATION");

const bigquery = new BigQuery({ projectId, location });
const dataset = bigquery.dataset(datasetId);

// Stop if the dataset isn't where .env.local says: better than creating tables in the wrong place.
const [datasetInfo] = await dataset.getMetadata();
if (datasetInfo.location !== location) {
  throw new Error(`Dataset ${datasetId} is in ${datasetInfo.location}, but BQ_LOCATION is ${location}.`);
}

const [existingTables] = await dataset.getTables();
const existing = new Set(existingTables.map((table) => table.id));

console.log(apply ? "MODE: APPLY (creating tables)" : "MODE: DRY RUN (nothing will be changed)");
console.log(`Dataset: ${projectId}.${datasetId} (${datasetInfo.location})\n`);

function describe(table: TableDefinition) {
  const split = table.partitionByDay ? `, split by day on ${table.partitionByDay}` : "";
  console.log(`  ${table.description}`);
  console.log(`  Write mode: ${table.writeMode}${split}`);
  for (const field of table.fields) {
    console.log(`    ${field.name!.padEnd(24)} ${field.type!.padEnd(10)} ${field.mode}`);
  }
}

let toCreate = 0;
for (const table of HUBSPOT_TABLES) {
  if (existing.has(table.name)) {
    console.log(`SKIP    ${table.name} (already exists, left unchanged)`);
    continue;
  }
  toCreate++;
  console.log(`${apply ? "CREATE" : "WOULD CREATE"}  ${table.name}`);
  describe(table);

  if (apply) {
    await dataset.createTable(table.name, {
      description: table.description,
      schema: { fields: table.fields },
      ...(table.partitionByDay && {
        timePartitioning: { type: "DAY", field: table.partitionByDay },
      }),
    });
    console.log("  Created.");
  }
  console.log();
}

console.log(
  apply
    ? `Done: ${toCreate} table(s) created.`
    : `Dry run done: ${toCreate} table(s) would be created. Add --apply to create them.`,
);
