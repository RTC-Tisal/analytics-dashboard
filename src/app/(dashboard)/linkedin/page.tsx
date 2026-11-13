import {
  BadgeDollarSign,
  Briefcase,
  Building,
  ExternalLink,
  Factory,
  HandCoins,
  Layers,
  Newspaper,
  Route,
  TrendingUp,
  UserPlus,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { Suspense } from "react";
import Card from "@/components/Card";
import HorizontalBarChart from "@/components/charts/HorizontalBarChart";
import TimeSeriesChart from "@/components/charts/TimeSeriesChart";
import DataTable, { type Column } from "@/components/DataTable";
import DateRangeFilter from "@/components/DateRangeFilter";
import FilterBar from "@/components/FilterBar";
import FunnelChart from "@/components/FunnelChart";
import KpiTile from "@/components/KpiTile";
import PageHeader from "@/components/PageHeader";
import SelectFilter from "@/components/SelectFilter";
import { parseDateRange } from "@/lib/dateRange";
import { formatTableDate, formatValue } from "@/lib/format";
import { getLinkedInData, linkedinDataSource } from "@/lib/linkedin/data";
import type { AudienceItem, FollowerSegment, LinkedInData, PostRow } from "@/lib/linkedin/types";
import { clickThroughRate, costPerLead, engagementRate, ratio } from "@/lib/rates";

// The page itself. The header never changes, so Next.js prepares it ahead of time.
// Everything that depends on the URL (?range=, ?group=) is inside <Suspense>.
export default function LinkedInPage(props: PageProps<"/linkedin">) {
  return (
    <div>
      <PageHeader
        title="LinkedIn"
        description="Campaign Manager ads and Company Page analytics."
        dataSource={linkedinDataSource}
      />

      <Suspense fallback={<LoadingTop />}>
        <LinkedInContent searchParams={props.searchParams} />
      </Suspense>
    </div>
  );
}

// Reads the filters from the URL, loads the data, and shows the filters and tiles.
async function LinkedInContent({ searchParams }: Pick<PageProps<"/linkedin">, "searchParams">) {
  const { range: rawRange, group: rawGroup } = await searchParams;
  const range = parseDateRange(rawRange);
  // getLinkedInData checks the group against the real list and falls back to "All".
  const data = await getLinkedInData(range, typeof rawGroup === "string" ? rawGroup : null);

  const ads = data.ads.totals;
  const revenue = data.revenue;
  const groupParam: Record<string, string> = data.campaignGroupId ? { group: data.campaignGroupId } : {};

  // Pipeline from LinkedIn = deals from ads + deals from organic (HubSpot original source).
  const pipeline = {
    current: revenue.fromAds.current.pipelineValue + revenue.fromOrganic.current.pipelineValue,
    previous: revenue.fromAds.previous.pipelineValue + revenue.fromOrganic.previous.pipelineValue,
  };
  const filtered = data.campaignGroupId !== null; // a group is selected

  return (
    <>
      <FilterBar>
        <DateRangeFilter pathname="/linkedin" selected={range} keep={groupParam} />
        <SelectFilter
          label="Campaign group"
          param="group"
          allLabel="All campaign groups"
          options={data.campaignGroups.map((g) => ({ value: g.id, label: g.name }))}
          selected={data.campaignGroupId}
          pathname="/linkedin"
          keep={{ range }}
        />
      </FilterBar>

      {/* 1 column on phones, 2 from small tablets, 5 in a row on wide screens. */}
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiTile
          label="Ad spend"
          icon={Wallet}
          format="currency"
          better="neither" // spending more or less isn't good or bad by itself: grey pill
          current={ads.current.cost}
          previous={ads.previous.cost}
          trend={data.ads.daily.map((d) => d.cost)}
        />
        <KpiTile
          label="Leads"
          icon={UserPlus}
          format="number"
          current={ads.current.leadFormSubmissions}
          previous={ads.previous.leadFormSubmissions}
          trend={data.ads.daily.map((d) => d.leadFormSubmissions)}
          note="Lead form submissions in Campaign Manager"
        />
        <KpiTile
          label="Cost per lead"
          icon={BadgeDollarSign}
          format="currency"
          better="down" // a lower cost per lead is good news: green when it drops
          current={costPerLead(ads.current)}
          previous={costPerLead(ads.previous)}
        />
        <KpiTile
          label="Pipeline from LinkedIn"
          icon={HandCoins}
          format="currency"
          current={pipeline.current}
          previous={pipeline.previous}
          note={`Deals from LinkedIn ads and organic, in HubSpot.${filtered ? " Not split by campaign group." : ""}`}
        />
        <KpiTile
          label="Followers gained"
          icon={Users}
          format="number"
          current={data.organic.totals.current.followersGained}
          previous={data.organic.totals.previous.followersGained}
          trend={data.organic.daily.map((d) => d.followersGained)}
          note={`Company Page, organic and from ads.${filtered ? " Not split by campaign group." : ""}`}
        />
      </div>

      <WhosEngaging audience={data.audience} />

      <Organic organic={data.organic} />

      <AdsToRevenue funnel={data.paidFunnel} />
    </>
  );
}

// ---------------------------------------------------------------------------
// From ads to revenue: the paid funnel and pipeline from LinkedIn ads.
// All campaign groups: HubSpot can't split leads and deals by campaign group, and
// a funnel mixing one group's clicks with everyone's leads would give nonsense rates.
// ---------------------------------------------------------------------------

function AdsToRevenue({ funnel }: { funnel: LinkedInData["paidFunnel"] }) {
  const f = funnel.current;
  return (
    <section aria-labelledby="ads-to-revenue" className="mt-10">
      <h3 id="ads-to-revenue" className="text-lg font-semibold text-gray-900">
        From ads to revenue
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-gray-500">
        LinkedIn ads only, across all campaign groups (HubSpot can&apos;t split leads and deals by campaign
        group). Leads are new HubSpot contacts from LinkedIn ads, so they can differ from the Leads tile at the
        top. Each step counts what happened in this period: deals won now mostly started as leads weeks earlier,
        so there&apos;s no rate for the last step.
      </p>

      {/* Funnel across three quarters, the pipeline tile in the last quarter, on wide screens. */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-4">
        <Card title="Funnel" icon={Route} className="xl:col-span-3">
          <FunnelChart
            steps={[
              { label: "Impressions", count: f.impressions },
              { label: "Clicks", count: f.clicks, rateLabel: "of impressions (CTR)" },
              { label: "Leads", count: f.leads, rateLabel: "of clicks" },
              { label: "Deals", count: f.deals, rateLabel: "of leads" },
              { label: "Won deals", count: f.wonDeals, note: "Won this period" },
            ]}
          />
        </Card>
        <KpiTile
          label="Pipeline from LinkedIn ads"
          icon={HandCoins}
          format="currency"
          current={funnel.current.pipelineValue}
          previous={funnel.previous.pipelineValue}
          note="Deals created from LinkedIn ads, in HubSpot. All campaign groups."
        />
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Organic: the Company Page. Follows the date range, not the campaign group filter.
// ---------------------------------------------------------------------------

const TOP_POSTS = 10;
const TOP_SEGMENTS = 10;

function Organic({ organic }: { organic: LinkedInData["organic"] }) {
  const followersToday = organic.totalFollowers.current;
  const segmentRows = (segments: FollowerSegment[]) =>
    segments.slice(0, TOP_SEGMENTS).map((s) => {
      const share = formatValue(ratio(s.followers, followersToday), "percent");
      return { label: s.name, value: s.followers, detail: `${share} of followers`, tableCells: [share] };
    });
  const posts = organic.posts.slice(0, TOP_POSTS);

  return (
    <section aria-labelledby="organic" className="mt-10">
      <h3 id="organic" className="text-lg font-semibold text-gray-900">
        Organic
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-gray-500">
        Your LinkedIn Company Page. Not affected by the campaign group filter. Followers by industry and job
        function cover all current followers who share that information, so they add up to less than the total.
      </p>

      {/* The y-axis starts near the lowest day, not at 0: on a 0–20,000 scale,
          a few hundred new followers would look like a flat line. */}
      <Card title="Followers over time" icon={TrendingUp} className="mt-4">
        <TimeSeriesChart
          points={organic.daily.map((d) => ({ date: d.date, value: d.totalFollowers }))}
          unit="followers"
          caption="Total followers per day"
          valueHeader="Followers"
          zeroBaseline={false}
          yAxisWidth={56}
        />
      </Card>

      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card title="Followers by industry" icon={Factory}>
          <HorizontalBarChart
            rows={segmentRows(organic.followersByIndustry)}
            unit="followers"
            caption="Followers by industry, top 10"
            labelHeader="Industry"
            valueHeader="Followers"
            tableExtraHeaders={["Share of followers"]}
            labelWidth={170}
            maxLabelChars={22}
          />
        </Card>
        <Card title="Followers by job function" icon={Briefcase}>
          <HorizontalBarChart
            rows={segmentRows(organic.followersByFunction)}
            unit="followers"
            caption="Followers by job function, top 10"
            labelHeader="Job function"
            valueHeader="Followers"
            tableExtraHeaders={["Share of followers"]}
            labelWidth={170}
            maxLabelChars={22}
          />
        </Card>
      </div>

      <Card title="Top 10 posts" icon={Newspaper} className="mt-4">
        {posts.length === 0 ? (
          <p className="py-6 text-sm text-gray-500">No posts published in this period.</p>
        ) : (
          <DataTable rows={posts} columns={postColumns} rowKey={(post) => post.id} />
        )}
      </Card>
    </section>
  );
}

// The top posts table: published in the date range, most impressions first.
const postColumns: Column<PostRow>[] = [
  { header: "Date", cell: (post) => formatTableDate(post.publishedDate), className: "whitespace-nowrap" },
  {
    header: "Post",
    align: "left",
    // Two lines at most; hovering shows the whole snippet.
    cell: (post) => <span className="line-clamp-2">{post.snippet}</span>,
    className: "min-w-64 max-w-xl",
    title: (post) => post.snippet,
  },
  { header: "Impressions", cell: (post) => formatValue(post.impressions, "number") },
  { header: "Engagement rate", cell: (post) => formatValue(engagementRate(post), "percent") },
  {
    header: "Link",
    cell: (post) => (
      <a
        href={post.url}
        target="_blank" // opens in a new tab, so the dashboard stays open
        rel="noopener noreferrer" // the opened page can't control or see the dashboard tab
        aria-label={`View post from ${formatTableDate(post.publishedDate)} (opens in a new tab)`}
        className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline-offset-2 hover:underline"
      >
        View
        <ExternalLink aria-hidden="true" className="h-3.5 w-3.5" />
      </a>
    ),
  },
];

// ---------------------------------------------------------------------------
// "Who's engaging": top 10 companies, industries, job functions and seniority
// levels by clicks, as four small bar charts. Follows the campaign group filter.
// ---------------------------------------------------------------------------

const AUDIENCE_CARDS: { key: keyof LinkedInData["audience"]; title: string; icon: LucideIcon; noun: string }[] = [
  { key: "company", title: "Companies", icon: Building, noun: "Company" },
  { key: "industry", title: "Industries", icon: Factory, noun: "Industry" },
  { key: "jobFunction", title: "Job functions", icon: Briefcase, noun: "Job function" },
  { key: "seniority", title: "Seniority", icon: Layers, noun: "Seniority" },
];

const TOP_AUDIENCE = 10;

function WhosEngaging({ audience }: { audience: LinkedInData["audience"] }) {
  return (
    <section aria-labelledby="whos-engaging" className="mt-10">
      <h3 id="whos-engaging" className="text-lg font-semibold text-gray-900">
        Who&apos;s engaging
      </h3>
      <p className="mt-1 max-w-3xl text-sm text-gray-500">
        Top 10 by clicks on your ads. LinkedIn rounds these numbers and hides companies and groups with very
        few interactions, to protect members&apos; privacy, so they won&apos;t add up to the totals above.
      </p>

      {/* Two charts side by side on wide screens, stacked on narrower ones. */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {AUDIENCE_CARDS.map(({ key, title, icon, noun }) => {
          const rows = audience[key].slice(0, TOP_AUDIENCE).map((item) => toBarRow(item));
          return (
            <Card key={key} title={title} icon={icon}>
              {rows.length === 0 ? (
                <p className="py-6 text-sm text-gray-500">No data for this period.</p>
              ) : (
                <HorizontalBarChart
                  rows={rows}
                  unit="clicks"
                  caption={`${title}: top ${rows.length} by clicks`}
                  labelHeader={noun}
                  valueHeader="Clicks"
                  tableExtraHeaders={["Impressions", "Click-through rate"]}
                  labelWidth={170} // wide enough for 22 characters on one line
                  maxLabelChars={22} // e.g. "Transportation, Logis…" (full name in the tooltip)
                />
              )}
            </Card>
          );
        })}
      </div>
    </section>
  );
}

// One bar: clicks as the length; impressions and click-through rate (from rates.ts) in the tooltip.
function toBarRow(item: AudienceItem) {
  const impressions = formatValue(item.impressions, "number");
  const ctr = formatValue(clickThroughRate(item), "percent");
  return {
    label: item.name,
    value: item.clicks,
    detail: `${impressions} impressions · ${ctr} CTR`,
    tableCells: [impressions, ctr],
  };
}

// Grey placeholders shown while LinkedInContent loads. Heights measured in the
// browser (wide screen, sample data), so the page doesn't jump when the data arrives.
function LoadingTop() {
  return (
    <div aria-hidden="true">
      <div className="mt-6 h-[54px] w-full max-w-xl animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {Array.from({ length: 5 }, (_, i) => (
          <div key={i} className="h-[282px] animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      {/* Who's engaging: heading + note, then four chart cards. */}
      <div className="mt-10 h-[72px] w-full max-w-3xl animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        {[454, 454, 382, 382].map((height, i) => (
          <div key={i} style={{ height }} className="animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
      {/* Organic: heading + note, followers chart, two follower breakdowns, posts table. */}
      <div className="mt-10 h-[72px] w-full max-w-3xl animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 h-[342px] animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 grid grid-cols-1 gap-4 xl:grid-cols-2">
        <div className="h-[454px] animate-pulse rounded-lg bg-gray-100" />
        <div className="h-[454px] animate-pulse rounded-lg bg-gray-100" />
      </div>
      <div className="mt-4 h-[728px] animate-pulse rounded-lg bg-gray-100" />
      {/* From ads to revenue: heading + note, then the funnel and the pipeline tile. */}
      <div className="mt-10 h-[92px] w-full max-w-3xl animate-pulse rounded-lg bg-gray-100" />
      <div className="mt-4 h-[200px] animate-pulse rounded-lg bg-gray-100" />
    </div>
  );
}
