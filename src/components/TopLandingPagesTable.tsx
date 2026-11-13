import DataTable, { type Column } from "@/components/DataTable";
import { formatValue } from "@/lib/format";
import type { LandingPage } from "@/lib/website/types";

interface TopLandingPagesTableProps {
  rows: LandingPage[]; // already sorted and limited to the top 10 by getWebsiteData
}

const columns: Column<LandingPage>[] = [
  {
    header: "Page",
    cell: (row) => row.path,
    // Long paths are cut off with "…"; hovering shows the full path.
    className: "max-w-64 truncate font-mono text-[13px]",
    title: (row) => row.path,
  },
  { header: "Sessions", cell: (row) => formatValue(row.sessions, "number") },
  { header: "Engagement rate", cell: (row) => formatValue(row.engagementRate, "percent") },
  { header: "Form submissions", cell: (row) => formatValue(row.formSubmissions, "number") },
];

// Top landing pages on the Website page, in the shared table style.
export default function TopLandingPagesTable({ rows }: TopLandingPagesTableProps) {
  // The path is unique, so it's a good key.
  return <DataTable rows={rows} columns={columns} rowKey={(row) => row.path} />;
}
