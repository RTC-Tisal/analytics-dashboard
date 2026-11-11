import { Suspense } from "react";
import Card from "@/components/Card";
import SessionsOverTimeChart from "@/components/charts/SessionsOverTimeChart";
import TrafficByChannelChart from "@/components/charts/TrafficByChannelChart";
import DateRangeFilter from "@/components/DateRangeFilter";
import KpiTile from "@/components/KpiTile";
import TopLandingPagesTable from "@/components/TopLandingPagesTable";
import { parseDateRange } from "@/lib/dateRange";
import type { ValueFormat } from "@/lib/format";
import { getWebsiteData } from "@/lib/website/data";
import type { WebsiteKpis } from "@/lib/website/types";

// The tiles to show, in order. Labels and formats live here, on the page;
// the data function only returns numbers.
const tiles: { key: keyof WebsiteKpis; label: string; format: ValueFormat }[] = [
  { key: "sessions", label: "Sessions", format: "number" },
  { key: "engagedSessions", label: "Engaged sessions", format: "number" },
  { key: "engagementRate", label: "Engagement rate", format: "percent" },
  { key: "formSubmissions", label: "Form submissions", format: "number" },
];

// The page itself. The heading never changes, so Next.js can prepare it ahead
// of time. Everything that depends on ?range= is inside <Suspense>, because the
// URL is only known when someone actually visits.
export default function WebsitePage(props: PageProps<"/website">) {
  return (
    <div>
      <h2 className="text-2xl font-bold">Website</h2>
      <p className="mt-1 text-gray-500">Traffic and conversions from GA4.</p>

      <Suspense fallback={<LoadingTiles />}>
        <WebsiteContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

// Reads ?range= from the URL, loads the data for that range, and shows the
// filter, the tiles and the cards below them.
async function WebsiteContent({
  searchParams,
}: Pick<PageProps<"/website">, "searchParams">) {
  const { range: rawRange } = await searchParams; // e.g. "7d", or undefined
  const range = parseDateRange(rawRange); // always a valid DateRange
  const data = await getWebsiteData(range);

  return (
    <>
      <div className="mt-6">
        <DateRangeFilter pathname="/website" selected={range} />
      </div>

      {/* 1 column on phones, 2 from tablet width (md), 4 on wide screens (xl). */}
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <KpiTile
            key={tile.key}
            label={tile.label}
            current={data.kpis[tile.key].current}
            previous={data.kpis[tile.key].previous}
            format={tile.format}
          />
        ))}
      </div>

      {/* The server passes the daily series to the chart as a prop.
          The chart itself runs in the browser too ("use client"), for hover and resizing. */}
      <Card title="Sessions over time" className="mt-6">
        <SessionsOverTimeChart data={data.daily} />
      </Card>

      {/* Side by side on wide screens (xl), stacked on smaller ones. */}
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Traffic by channel">
          <TrafficByChannelChart data={data.trafficByChannel} />
        </Card>
        <Card title="Top landing pages">
          <TopLandingPagesTable rows={data.topLandingPages} />
        </Card>
      </div>
    </>
  );
}

// Grey placeholder boxes shown for a moment while WebsiteContent loads.
function LoadingTiles() {
  return (
    <div aria-hidden="true">
      <div className="mt-6 h-10 w-80 animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {tiles.map((tile) => (
          <div key={tile.key} className="h-[142px] animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      {/* Same heights as the real cards (measured in the browser), so nothing jumps when they load. */}
      <div className="mt-6 h-[330px] animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-6 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-[476px] animate-pulse rounded-lg bg-gray-100" />
        <div className="h-[476px] animate-pulse rounded-lg bg-gray-100" />
      </div>
    </div>
  );
}
