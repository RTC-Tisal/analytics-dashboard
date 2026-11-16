// Lists the tables in our BigQuery dataset: a quick check that the BigQuery login works.
//
// Run:  node --env-file=.env.local scripts/list-bq-tables.mts
//
// Login: no key file. The BigQuery library finds Application Default Credentials
// (~/.config/gcloud/), which impersonate the dashboard-sync service account.

import { BigQuery } from "@google-cloud/bigquery";

// Read a setting from the environment, or stop with a clear message if it's missing.
function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not set. Add it to .env.local (see .env.example).`);
  }
  return value;
}

const projectId = requireEnv("GCP_PROJECT_ID");
const datasetId = requireEnv("BQ_DATASET");
const location = requireEnv("BQ_LOCATION");

const bigquery = new BigQuery({ projectId, location });
const [tables] = await bigquery.dataset(datasetId).getTables();

console.log(`Connected to ${projectId}.${datasetId} (${location})`);
if (tables.length === 0) {
  console.log("No tables yet (the dataset is empty).");
} else {
  for (const table of tables) {
    console.log(`- ${table.id}`);
  }
}
