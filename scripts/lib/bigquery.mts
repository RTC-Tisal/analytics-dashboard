// Shared BigQuery helpers for the sync scripts.
// Login: Application Default Credentials (impersonating dashboard-sync), no key file.

import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { BigQuery } from "@google-cloud/bigquery";
import type { TableDefinition } from "../hubspot/tables.mts";
import { requireEnv } from "./env.mts";

const projectId = requireEnv("GCP_PROJECT_ID");
const datasetId = requireEnv("BQ_DATASET");
const location = requireEnv("BQ_LOCATION");

export const dataset = new BigQuery({ projectId, location }).dataset(datasetId);
export const datasetName = `${projectId}.${datasetId}`;

// A row ready for BigQuery: column name → value (null for empty).
export type Row = Record<string, string | number | boolean | null>;

// Swap the whole table for `rows` in one step (a load job that overwrites).
// If anything fails, BigQuery keeps the old contents: the table is never half-written.
export async function replaceTable(table: TableDefinition, rows: Row[]): Promise<number> {
  // Load jobs read from a file: one JSON object per line ("newline-delimited JSON").
  const folder = await mkdtemp(join(tmpdir(), "bq-load-"));
  const file = join(folder, `${table.name}.json`);
  try {
    await writeFile(file, rows.map((row) => JSON.stringify(row)).join("\n"));
    const [job] = await dataset.table(table.name).load(file, {
      sourceFormat: "NEWLINE_DELIMITED_JSON",
      writeDisposition: "WRITE_TRUNCATE", // overwrite
      // Send our column definitions (with descriptions) every time, so the overwrite
      // can't change or drop them. Unknown columns in a row make the load fail.
      schema: { fields: table.fields },
      ignoreUnknownValues: false,
    });
    const errors = job.status?.errors;
    if (errors?.length) {
      throw new Error(`Load into ${table.name} failed: ${errors.map((e) => e.message).join("; ")}`);
    }
    return Number(job.statistics?.load?.outputRows ?? 0);
  } finally {
    await rm(folder, { recursive: true, force: true }); // never leave data lying around
  }
}
