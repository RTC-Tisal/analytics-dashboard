// The BigQuery tables the HubSpot sync writes to, all in the `sales` dataset.
// This file only DESCRIBES them; another script creates them.
//
// Rules (see CLAUDE.md):
// - Ids are text (STRING): they look like numbers, but nobody adds them up.
// - Dates are TIMESTAMP (UTC). Money is NUMERIC (exact, no rounding errors).
// - Empty in HubSpot = NULL here, never 0 or "" ("unknown" is not the same as "zero").
// - No personal details: no contact names, emails, phone numbers or job titles.

import type { TableField } from "@google-cloud/bigquery";

type ColumnType = "STRING" | "TIMESTAMP" | "DATE" | "NUMERIC" | "INT64" | "BOOL";

// REQUIRED: every row must have a value. NULLABLE: can be empty.
function column(
  name: string,
  type: ColumnType,
  mode: "REQUIRED" | "NULLABLE",
  description: string,
): TableField {
  return { name, type, mode, description };
}

// Every table has this, so the dashboard can say "data as of …".
const syncedAt = column("synced_at", "TIMESTAMP", "REQUIRED", "When the sync copied this row");

export interface TableDefinition {
  name: string;
  description: string;
  // "replace": each run swaps in a fresh copy of everything in HubSpot.
  // "daily-snapshot": each run adds (or replaces) today's rows; older days are kept.
  writeMode: "replace" | "daily-snapshot";
  fields: TableField[];
  partitionByDay?: string; // the DATE column that splits the table into one part per day
}

export const contacts: TableDefinition = {
  name: "hubspot_contacts",
  description: "HubSpot contacts, one row per contact. No names or contact details.",
  writeMode: "replace",
  fields: [
    column("contact_id", "STRING", "REQUIRED", "HubSpot contact id"),
    column("created_at", "TIMESTAMP", "NULLABLE", "createdate"),
    column("updated_at", "TIMESTAMP", "NULLABLE", "lastmodifieddate"),
    column("lifecycle_stage", "STRING", "NULLABLE", "lifecyclestage, e.g. lead, customer"),
    column("lead_status", "STRING", "NULLABLE", "hs_lead_status"),
    column("original_source", "STRING", "NULLABLE", "hs_analytics_source, e.g. OFFLINE, PAID_SOCIAL"),
    column("original_source_detail", "STRING", "NULLABLE", "hs_analytics_source_data_1, e.g. IMPORT"),
    column("owner_id", "STRING", "NULLABLE", "hubspot_owner_id: the sales rep"),
    column("company_id", "STRING", "NULLABLE", "associatedcompanyid: the contact's primary company"),
    column("country", "STRING", "NULLABLE", "country"),
    syncedAt,
  ],
};

export const companies: TableDefinition = {
  name: "hubspot_companies",
  description: "HubSpot companies, one row per company.",
  writeMode: "replace",
  fields: [
    column("company_id", "STRING", "REQUIRED", "HubSpot company id"),
    column("name", "STRING", "NULLABLE", "name"),
    column("domain", "STRING", "NULLABLE", "domain"),
    column("created_at", "TIMESTAMP", "NULLABLE", "createdate"),
    column("updated_at", "TIMESTAMP", "NULLABLE", "hs_lastmodifieddate"),
    column("lifecycle_stage", "STRING", "NULLABLE", "lifecyclestage"),
    column("original_source", "STRING", "NULLABLE", "hs_analytics_source"),
    column("owner_id", "STRING", "NULLABLE", "hubspot_owner_id"),
    column("contact_count", "INT64", "NULLABLE", "num_associated_contacts"),
    column("industry", "STRING", "NULLABLE", "industry"),
    column("employee_count", "INT64", "NULLABLE", "numberofemployees"),
    column("country", "STRING", "NULLABLE", "country"),
    syncedAt,
  ],
};

export const deals: TableDefinition = {
  name: "hubspot_deals",
  description: "HubSpot deals, one row per deal (matches HubSpotDeal in src/lib/pipeline/types.ts).",
  writeMode: "replace",
  fields: [
    column("deal_id", "STRING", "REQUIRED", "HubSpot deal id"),
    column("name", "STRING", "NULLABLE", "dealname"),
    column("amount", "NUMERIC", "NULLABLE", "amount; NULL when HubSpot has none (not 0)"),
    column("currency", "STRING", "NULLABLE", "deal_currency_code, e.g. USD"),
    column("pipeline_id", "STRING", "NULLABLE", "pipeline"),
    column("stage_id", "STRING", "NULLABLE", "dealstage: see hubspot_deal_stages"),
    column("owner_id", "STRING", "NULLABLE", "hubspot_owner_id: the sales rep"),
    column("company_id", "STRING", "NULLABLE", "the deal's primary company"),
    column("created_at", "TIMESTAMP", "NULLABLE", "createdate"),
    column("close_date", "TIMESTAMP", "NULLABLE", "closedate: expected while open, actual once closed"),
    column("is_closed", "BOOL", "NULLABLE", "hs_is_closed"),
    column("is_won", "BOOL", "NULLABLE", "hs_is_closed_won"),
    column("original_source", "STRING", "NULLABLE", "hs_analytics_source, e.g. PAID_SOCIAL"),
    column("updated_at", "TIMESTAMP", "NULLABLE", "hs_lastmodifieddate"),
    syncedAt,
  ],
};

export const dealStages: TableDefinition = {
  name: "hubspot_deal_stages",
  description: "Deal pipelines and their stages, in order.",
  writeMode: "replace",
  fields: [
    column("pipeline_id", "STRING", "REQUIRED", "pipeline id, e.g. default"),
    column("pipeline_label", "STRING", "NULLABLE", "pipeline name shown in HubSpot"),
    column("stage_id", "STRING", "REQUIRED", "stage id, e.g. contractsent"),
    column("stage_label", "STRING", "NULLABLE", "stage name shown in HubSpot"),
    column("display_order", "INT64", "NULLABLE", "position in the pipeline, 0 = first"),
    column("is_closed", "BOOL", "NULLABLE", "true for closed won and closed lost"),
    column("is_won", "BOOL", "NULLABLE", "true only for closed won"),
    syncedAt,
  ],
};

export const owners: TableDefinition = {
  name: "hubspot_owners",
  description: "HubSpot owners (sales reps). Names only, no emails.",
  writeMode: "replace",
  fields: [
    column("owner_id", "STRING", "REQUIRED", "HubSpot owner id (same as owner_id elsewhere)"),
    column("name", "STRING", "NULLABLE", "first and last name"),
    column("is_active", "BOOL", "REQUIRED", "false for people who have left (archived in HubSpot)"),
    syncedAt,
  ],
};

export const dealSnapshots: TableDefinition = {
  name: "hubspot_deal_snapshots",
  description: "A daily photo of every deal, so pipeline value can be compared with the past.",
  writeMode: "daily-snapshot",
  partitionByDay: "snapshot_date",
  fields: [
    column("snapshot_date", "DATE", "REQUIRED", "the day the photo was taken (UTC)"),
    column("deal_id", "STRING", "REQUIRED", "HubSpot deal id"),
    column("stage_id", "STRING", "NULLABLE", "dealstage on that day"),
    column("owner_id", "STRING", "NULLABLE", "hubspot_owner_id on that day"),
    column("amount", "NUMERIC", "NULLABLE", "amount on that day"),
    column("is_closed", "BOOL", "NULLABLE", "hs_is_closed on that day"),
    syncedAt,
  ],
};

export const HUBSPOT_TABLES = [contacts, companies, deals, dealStages, owners, dealSnapshots];
