import { ChartLine, Eye, Gauge, ListOrdered, MousePointerClick, Search, Target, type LucideIcon } from "lucide-react";
import Card from "@/components/Card";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import DataTable, { type Column } from "@/components/DataTable";
import KpiTile from "@/components/KpiTile";
import LinkToggle from "@/components/LinkToggle";
import SampleDataBadge from "@/components/SampleDataBadge";
import { parseDateRange } from "@/lib/dateRange";
import { formatShortDate, formatTableDate, formatValue, type ValueFormat } from "@/lib/format";
import type { KpiDefinitionId } from "@/lib/kpiDefinitions";
import { clickThroughRate } from "@/lib/rates";
import {
  getSearchData,
  OPPORTUNITY_RULES,
  parseTermsFilter,
  searchConsoleDataSource,
} from "@/lib/searchConsole/data";
import type { SearchCounts, SearchOpportunity, SearchTerm, TermsFilter } from "@/lib/searchConsole/types";

// The "Search" section of the Website page: how we show up in Google (Search Console).
// It has its own heading and Sample data badge, because its data comes from a different
// source than GA4 and goes live separately.

const termsOptions: { value: TermsFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "brand", label: "Brand" },
  { value: "nonbrand", label: "Non-brand" },
];

const tiles: {
  label: string;
  definition: KpiDefinitionId;
  icon: LucideIcon;
  format: ValueFormat;
  better?: "up" | "down";
  value: (counts: SearchCounts) => number | null; // pick or calculate the tile's number
}[] = [
  { label: "Search clicks", definition: "searchClicks", icon: MousePointerClick, format: "number", value: (c) => c.clicks },
  { label: "Impressions", definition: "searchImpressions", icon: Eye, format: "number", value: (c) => c.impressions },
  { label: "Click-through rate", definition: "searchClickThroughRate", icon: Gauge, format: "percent", value: clickThroughRate },
  // Lower is better: position 1 is the top of Google.
  { label: "Average position", definition: "searchAveragePosition", icon: ListOrdered, format: "decimal", better: "down", value: (c) => c.position },
];

// Shared columns for both tables: clicks, impressions, CTR, average position.
function countColumns<T extends SearchCounts>(): Column<T>[] {
  return [
    { header: "Clicks", cell: (row) => formatValue(row.clicks, "number") },
    { header: "Impressions", cell: (row) => formatValue(row.impressions, "number") },
    { header: "CTR", cell: (row) => formatValue(clickThroughRate(row), "percent") },
    { header: "Avg position", cell: (row) => formatValue(row.position, "decimal") },
  ];
}

const termColumns: Column<SearchTerm>[] = [
  {
    header: "Search term",
    cell: (row) => (
      <span className="flex items-center gap-2">
        {/* Long terms are cut off with "…" so the numbers stay visible; hovering shows the full term. */}
        <span className="block max-w-48 truncate">{row.query}</span>
        {row.isBrand && (
          <span className="shrink-0 rounded bg-icon-soft px-1.5 py-0.5 text-[11px] font-medium text-primary">Brand</span>
        )}
      </span>
    ),
    title: (row) => row.query,
  },
  ...countColumns<SearchTerm>(),
];

const opportunityColumns: Column<SearchOpportunity>[] = [
  {
    header: "Page",
    cell: (row) => new URL(row.page).pathname, // the path is enough; the site is always ours
    className: "max-w-64 truncate font-mono text-[13px]",
    title: (row) => row.page,
  },
  { header: "Impressions", cell: (row) => formatValue(row.impressions, "number") },
  { header: "CTR", cell: (row) => formatValue(clickThroughRate(row), "percent") },
  { header: "Avg position", cell: (row) => formatValue(row.position, "decimal") },
  { header: "Missed clicks", cell: (row) => formatValue(row.missedClicks, "number") },
];

export default async function SearchSection({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { range: rawRange, terms: rawTerms } = await searchParams;
  const range = parseDateRange(rawRange);
  const terms = parseTermsFilter(rawTerms);
  const data = await getSearchData(range, terms);

  return (
    <section aria-labelledby="search-heading" className="mt-10">
      <SectionHeading firstDate={data.firstDate} lastDate={data.lastDate} />

      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <KpiTile
            key={tile.definition}
            label={tile.label}
            definition={tile.definition}
            icon={tile.icon}
            current={tile.value(data.current)}
            previous={tile.value(data.previous)}
            format={tile.format}
            better={tile.better}
            // Days without a value (no impressions) show as 0 in the small trend line.
            trend={data.daily.map((day) => tile.value(day) ?? 0)}
          />
        ))}
      </div>

      <Card title="Search clicks over time" icon={ChartLine} className="mt-6">
        <TimeSeriesChart
          points={data.daily.map((day) => ({ date: day.date, value: day.clicks }))}
          unit="clicks"
          caption="Search clicks per day"
          valueHeader="Clicks"
        />
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Top search terms" icon={Search}>
          <LinkToggle
            label="Which search terms"
            param="terms"
            options={termsOptions}
            selected={terms}
            defaultValue="all"
            pathname="/website"
            keep={{ range }}
          />
          {data.topTerms.length === 0 ? (
            <EmptyMessage>No searches of this kind in this period.</EmptyMessage>
          ) : (
            <DataTable rows={data.topTerms} columns={termColumns} rowKey={(row) => row.query} />
          )}
          <p className="text-xs text-gray-500">
            Google leaves out searches that very few people made, so these rows add up to less than the
            totals above.
          </p>
        </Card>

        <Card title="Opportunities" icon={Target}>
          <p className="text-sm text-gray-600">
            Pages that often appear in non-brand searches (at least {OPPORTUNITY_RULES.minImpressionsPerDay}{" "}
            impressions a day) but get clicked less than our non-brand average of{" "}
            {formatValue(data.nonBrandCtr, "percent")}. Missed clicks: how many more they&apos;d get at that average.
            Better titles and descriptions in Google often help.
          </p>
          {data.opportunities.length === 0 ? (
            <EmptyMessage>No pages stand out in this period.</EmptyMessage>
          ) : (
            <DataTable rows={data.opportunities} columns={opportunityColumns} rowKey={(row) => row.page} />
          )}
        </Card>
      </div>
    </section>
  );
}

function SectionHeading({ firstDate, lastDate }: { firstDate: string; lastDate: string }) {
  return (
    <div className="flex flex-col gap-1">
      <div className="flex flex-wrap items-center gap-3">
        <h2 id="search-heading" className="text-lg font-semibold text-gray-900">
          Search
        </h2>
        {searchConsoleDataSource === "sample" && <SampleDataBadge />}
      </div>
      <p className="text-sm text-gray-500">
        How we show up in Google, from Search Console. {formatShortDate(firstDate)} – {formatTableDate(lastDate)}:
        Google&apos;s search data is 2–3 days behind.
      </p>
    </div>
  );
}

function EmptyMessage({ children }: { children: React.ReactNode }) {
  return <p className="rounded-md bg-gray-50 px-4 py-6 text-center text-sm text-gray-500">{children}</p>;
}

// Grey placeholder boxes while the Search section loads.
export function SearchSectionLoading() {
  return (
    <div aria-hidden="true" className="mt-10">
      <div className="h-[52px] w-96 max-w-full animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.definition} className="h-[210px] animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      <div className="mt-6 h-[342px] animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}
