import type { DataSource } from "@/lib/dataSource";
import { DAYS_IN_RANGE, type DateRange } from "@/lib/dateRange";
import { ONE_DAY_MS, SAMPLE_TODAY_MS, isoDate } from "@/lib/sampleData";
import { SAMPLE_AD_ANALYTICS, SAMPLE_AUDIENCE, SAMPLE_CAMPAIGNS, SAMPLE_CAMPAIGN_GROUPS } from "./sampleAds";
import {
  SAMPLE_FOLLOWER_DEMOGRAPHICS,
  SAMPLE_FOLLOWER_STATISTICS,
  SAMPLE_FUNCTION_NAMES,
  SAMPLE_INDUSTRY_NAMES,
  SAMPLE_PAGE_STATISTICS,
  SAMPLE_POSTS,
  SAMPLE_SHARE_STATISTICS,
} from "./sampleOrganic";
import { SAMPLE_REVENUE } from "./sampleRevenue";
import type {
  AdAnalyticsElement,
  AdCounts,
  AudienceAnalyticsElement,
  AudienceItem,
  AudiencePivot,
  CampaignInfo,
  FollowerDemographics,
  FollowerSegment,
  FollowerStatisticsElement,
  FunnelCounts,
  LinkedInCampaign,
  LinkedInCampaignGroup,
  LinkedInData,
  LinkedInDate,
  LinkedInPost,
  LinkedInRevenueRow,
  OrganicCounts,
  OrganicDay,
  PageStatisticsElement,
  PostRow,
  RevenueCounts,
  ShareStatisticsElement,
} from "./types";

// Sample numbers, so the LinkedIn page shows a "Sample data" badge.
// Change to "live" when the fetch functions below return real data.
export const linkedinDataSource: DataSource = "sample";

// "Today" for the sample data. Real data will use the actual date.
const TODAY_MS = SAMPLE_TODAY_MS;

// ---------------------------------------------------------------------------
// Getting the raw data — THE ONLY PART THAT CHANGES WHEN REAL DATA ARRIVES
// ---------------------------------------------------------------------------

async function fetchCampaignGroups(): Promise<LinkedInCampaignGroup[]> {
  return SAMPLE_CAMPAIGN_GROUPS; // later: Marketing API campaign groups
}
async function fetchCampaigns(): Promise<LinkedInCampaign[]> {
  return SAMPLE_CAMPAIGNS; // later: Marketing API campaigns
}
async function fetchAdAnalytics(): Promise<AdAnalyticsElement[]> {
  return SAMPLE_AD_ANALYTICS; // later: ad analytics, pivot CAMPAIGN, daily
}
async function fetchAudience(): Promise<AudienceAnalyticsElement[]> {
  return SAMPLE_AUDIENCE; // later: ad analytics pivoted by member company/industry/function/seniority
}
async function fetchFollowerStatistics(): Promise<FollowerStatisticsElement[]> {
  return SAMPLE_FOLLOWER_STATISTICS; // later: follower statistics + our daily total
}
async function fetchPageStatistics(): Promise<PageStatisticsElement[]> {
  return SAMPLE_PAGE_STATISTICS; // later: page statistics, daily
}
async function fetchPosts(): Promise<LinkedInPost[]> {
  return SAMPLE_POSTS; // later: the Company Page's posts
}
async function fetchShareStatistics(): Promise<ShareStatisticsElement[]> {
  return SAMPLE_SHARE_STATISTICS; // later: share statistics per post
}
async function fetchRevenue(): Promise<LinkedInRevenueRow[]> {
  return SAMPLE_REVENUE; // later: HubSpot contacts and deals with a LinkedIn original source
}
async function fetchFollowerDemographics(): Promise<FollowerDemographics> {
  return SAMPLE_FOLLOWER_DEMOGRAPHICS; // later: lifetime follower statistics
}
// Names for industry and job function URNs (LinkedIn sends only the URNs).
async function fetchIndustryNames(): Promise<Record<string, string>> {
  return SAMPLE_INDUSTRY_NAMES; // later: LinkedIn's industry list
}
async function fetchFunctionNames(): Promise<Record<string, string>> {
  return SAMPLE_FUNCTION_NAMES; // later: LinkedIn's job function list
}

// A link to a post. Sample posts have made-up ids, and a made-up LinkedIn link could
// open someone's real post or an error page, so they link to example.com (a domain
// reserved for examples). Real posts link to LinkedIn.
function postUrl(urn: string): string {
  return linkedinDataSource === "sample"
    ? `https://example.com/sample-posts/${encodeURIComponent(urn)}`
    : `https://www.linkedin.com/feed/update/${urn}/`;
}

// Organic + paid followers per segment, with names, most first.
function toSegments(
  rows: { urn: string; counts: { organicFollowerCount: number; paidFollowerCount: number } }[],
  names: Record<string, string>,
): FollowerSegment[] {
  return rows
    .map((r) => ({ name: names[r.urn] ?? "Unknown", followers: r.counts.organicFollowerCount + r.counts.paidFollowerCount }))
    .sort((a, b) => b.followers - a.followers || a.name.localeCompare(b.name));
}

// ---------------------------------------------------------------------------
// Raw → clean
// ---------------------------------------------------------------------------

const fromLinkedInDate = (d: LinkedInDate) =>
  `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;

// One day of one campaign, with plain names and a number (not text) for cost.
function normalizeAd(a: AdAnalyticsElement): { date: string; campaignId: string } & AdCounts {
  const cost = Number(a.costInLocalCurrency);
  return {
    date: fromLinkedInDate(a.dateRange.start),
    campaignId: a.pivotValues[0],
    impressions: a.impressions,
    clicks: a.clicks,
    cost: Number.isFinite(cost) ? cost : 0,
    leadFormSubmissions: a.oneClickLeads,
    landingPageClicks: a.landingPageClicks,
    websiteConversions: a.externalWebsiteConversions,
  };
}

// ---------------------------------------------------------------------------
// Adding up counts
// ---------------------------------------------------------------------------

const emptyAds = (): AdCounts => ({
  impressions: 0, clicks: 0, cost: 0, leadFormSubmissions: 0, landingPageClicks: 0, websiteConversions: 0,
});

function sumAds(rows: AdCounts[]): AdCounts {
  return rows.reduce(
    (t, r) => ({
      impressions: t.impressions + r.impressions,
      clicks: t.clicks + r.clicks,
      cost: Math.round((t.cost + r.cost) * 100) / 100, // money: keep it to whole cents
      leadFormSubmissions: t.leadFormSubmissions + r.leadFormSubmissions,
      landingPageClicks: t.landingPageClicks + r.landingPageClicks,
      websiteConversions: t.websiteConversions + r.websiteConversions,
    }),
    emptyAds(),
  );
}

function sumRevenue(rows: LinkedInRevenueRow[]): RevenueCounts {
  return rows.reduce(
    (t, r) => ({
      leads: t.leads + r.newContacts,
      deals: t.deals + r.dealsCreated,
      pipelineValue: t.pipelineValue + r.dealAmountCreated,
      wonDeals: t.wonDeals + r.dealsWon,
      wonValue: t.wonValue + r.dealAmountWon,
    }),
    { leads: 0, deals: 0, pipelineValue: 0, wonDeals: 0, wonValue: 0 },
  );
}

// The first and last "YYYY-MM-DD" of the `days` days ending on `endMs`.
function daySpan(days: number, endMs: number): { first: string; last: string } {
  return { first: isoDate(endMs - (days - 1) * ONE_DAY_MS), last: isoDate(endMs) };
}
const within = (date: string, span: { first: string; last: string }) => date >= span.first && date <= span.last;

// ---------------------------------------------------------------------------
// The campaign filter
// ---------------------------------------------------------------------------

// Turn the raw ?group= value from the URL into a known campaign group id, or null for "All campaign groups".
export function parseCampaignGroupId(
  value: string | string[] | undefined,
  groups: { id: string }[],
): string | null {
  return groups.find((g) => g.id === value)?.id ?? null;
}

// ---------------------------------------------------------------------------
// The function the page uses
// ---------------------------------------------------------------------------

const AUDIENCE_KEYS: Record<AudiencePivot, keyof LinkedInData["audience"]> = {
  MEMBER_COMPANY: "company",
  MEMBER_INDUSTRY: "industry",
  MEMBER_JOB_FUNCTION: "jobFunction",
  MEMBER_SENIORITY: "seniority",
};

export async function getLinkedInData(
  range: DateRange,
  requestedGroupId: string | null = null,
): Promise<LinkedInData> {
  const [
    groups, rawCampaigns, rawAds, rawAudience, followerStats, pageStats, rawPosts, shareStats, revenueRows,
    demographics, industryNames, functionNames,
  ] = await Promise.all([
    fetchCampaignGroups(), fetchCampaigns(), fetchAdAnalytics(), fetchAudience(),
    fetchFollowerStatistics(), fetchPageStatistics(), fetchPosts(), fetchShareStatistics(), fetchRevenue(),
    fetchFollowerDemographics(), fetchIndustryNames(), fetchFunctionNames(),
  ]);

  // Campaigns, with their group names.
  const groupName = new Map(groups.map((g) => [g.id, g.name]));
  const campaigns: CampaignInfo[] = rawCampaigns.map((c) => ({
    id: c.id,
    name: c.name,
    groupId: c.campaignGroup,
    groupName: groupName.get(c.campaignGroup) ?? "No group",
    status: c.status,
    objective: c.objectiveType,
  }));
  const campaignGroupId = parseCampaignGroupId(requestedGroupId ?? undefined, groups);

  // The campaigns shown: all of them, or only those in the selected group.
  const shownCampaigns = campaigns.filter((c) => campaignGroupId === null || c.groupId === campaignGroupId);
  const isShown = (id: string) => shownCampaigns.some((c) => c.id === id);

  const days = DAYS_IN_RANGE[range];
  const now = daySpan(days, TODAY_MS);
  const before = daySpan(days, TODAY_MS - days * ONE_DAY_MS);

  // --- Ads ------------------------------------------------------------------
  const allAds = rawAds.map(normalizeAd);
  const ads = allAds.filter((a) => isShown(a.campaignId));

  const daily = Array.from({ length: days }, (_, i) => {
    const date = isoDate(TODAY_MS - (days - 1 - i) * ONE_DAY_MS);
    return { date, ...sumAds(ads.filter((a) => a.date === date)) };
  });

  const byCampaign = shownCampaigns
    .map((c) => ({ ...c, ...sumAds(allAds.filter((a) => a.campaignId === c.id && within(a.date, now))) }))
    .sort((a, b) => b.cost - a.cost || a.name.localeCompare(b.name));

  // --- Audience: the period matching the range, summed over the shown campaigns -----
  const audience: LinkedInData["audience"] = { company: [], industry: [], jobFunction: [], seniority: [] };
  for (const pivot of Object.keys(AUDIENCE_KEYS) as AudiencePivot[]) {
    const totals = new Map<string, AudienceItem>();
    for (const a of rawAudience) {
      if (a.pivot !== pivot) continue;
      if (fromLinkedInDate(a.dateRange.start) !== now.first || fromLinkedInDate(a.dateRange.end) !== now.last) continue;
      if (!isShown(a.campaign)) continue;
      const item = totals.get(a.pivotValue) ?? { name: a.pivotValueName, impressions: 0, clicks: 0 };
      item.impressions += a.impressions;
      item.clicks += a.clicks;
      totals.set(a.pivotValue, item);
    }
    // Most clicks first; ties: more impressions first, then alphabetical.
    audience[AUDIENCE_KEYS[pivot]] = [...totals.values()].sort(
      (a, b) => b.clicks - a.clicks || b.impressions - a.impressions || a.name.localeCompare(b.name),
    );
  }

  // --- Organic --------------------------------------------------------------
  const pageViewsByDate = new Map(
    pageStats.map((p) => [isoDate(p.timeRange.start), p.totalPageStatistics.views.allPageViews.pageViews]),
  );
  const organicDays = followerStats.map((f) => ({
    date: isoDate(f.timeRange.start),
    totalFollowers: f.totalFollowers,
    organicGained: f.followerGains.organicFollowerGain,
    paidGained: f.followerGains.paidFollowerGain,
    pageViews: pageViewsByDate.get(isoDate(f.timeRange.start)) ?? 0,
  }));
  const followersAt = (date: string) => organicDays.find((d) => d.date === date)?.totalFollowers ?? 0;

  const statsByPost = new Map(shareStats.map((s) => [s.share, s.totalShareStatistics]));
  const allPosts: PostRow[] = rawPosts.map((p) => {
    const s = statsByPost.get(p.id);
    return {
      id: p.id,
      url: postUrl(p.id),
      publishedDate: isoDate(p.publishedAt),
      snippet: p.commentary.length > 120 ? `${p.commentary.slice(0, 117)}…` : p.commentary,
      impressions: s?.impressionCount ?? 0,
      clicks: s?.clickCount ?? 0,
      reactions: s?.likeCount ?? 0,
      comments: s?.commentCount ?? 0,
      reposts: s?.shareCount ?? 0,
    };
  });

  // Organic totals for a span: follower gains and page views by day; post numbers
  // from the posts PUBLISHED in that span (their lifetime numbers).
  function organicTotals(span: { first: string; last: string }): OrganicCounts {
    const dayRows = organicDays.filter((d) => within(d.date, span));
    const postRows = allPosts.filter((p) => within(p.publishedDate, span));
    const sum = <T>(rows: T[], pick: (r: T) => number) => rows.reduce((t, r) => t + pick(r), 0);
    return {
      followersGained: sum(dayRows, (d) => d.organicGained + d.paidGained),
      paidFollowersGained: sum(dayRows, (d) => d.paidGained),
      pageViews: sum(dayRows, (d) => d.pageViews),
      postImpressions: sum(postRows, (p) => p.impressions),
      clicks: sum(postRows, (p) => p.clicks),
      reactions: sum(postRows, (p) => p.reactions),
      comments: sum(postRows, (p) => p.comments),
      reposts: sum(postRows, (p) => p.reposts),
    };
  }

  const organicDaily: OrganicDay[] = organicDays
    .filter((d) => within(d.date, now))
    .map((d) => ({ date: d.date, totalFollowers: d.totalFollowers, followersGained: d.organicGained + d.paidGained, pageViews: d.pageViews }));

  // --- Revenue --------------------------------------------------------------
  const revenueIn = (span: { first: string; last: string }, source: LinkedInRevenueRow["source"]) =>
    sumRevenue(revenueRows.filter((r) => r.source === source && within(r.date, span)));

  // --- Paid funnel: ALL campaigns (not the group filter) → HubSpot PAID_SOCIAL ----
  function paidFunnel(span: { first: string; last: string }): FunnelCounts {
    const ads = sumAds(allAds.filter((a) => within(a.date, span)));
    const revenue = revenueIn(span, "PAID_SOCIAL");
    return {
      impressions: ads.impressions,
      clicks: ads.clicks,
      leads: revenue.leads,
      deals: revenue.deals,
      wonDeals: revenue.wonDeals,
      pipelineValue: revenue.pipelineValue,
      wonValue: revenue.wonValue,
    };
  }

  return {
    range,
    campaignGroupId,
    campaignGroups: groups.map((g) => ({ id: g.id, name: g.name })),
    ads: {
      totals: {
        current: sumAds(ads.filter((a) => within(a.date, now))),
        previous: sumAds(ads.filter((a) => within(a.date, before))),
      },
      daily,
      byCampaign,
    },
    audience,
    organic: {
      totalFollowers: { current: followersAt(now.last), previous: followersAt(before.last) },
      totals: { current: organicTotals(now), previous: organicTotals(before) },
      daily: organicDaily,
      posts: allPosts
        .filter((p) => within(p.publishedDate, now))
        .sort((a, b) => b.impressions - a.impressions || a.id.localeCompare(b.id)),
      followersByIndustry: toSegments(
        demographics.followerCountsByIndustry.map((r) => ({ urn: r.industry, counts: r.followerCounts })),
        industryNames,
      ),
      followersByFunction: toSegments(
        demographics.followerCountsByFunction.map((r) => ({ urn: r.function, counts: r.followerCounts })),
        functionNames,
      ),
    },
    revenue: {
      fromAds: { current: revenueIn(now, "PAID_SOCIAL"), previous: revenueIn(before, "PAID_SOCIAL") },
      fromOrganic: { current: revenueIn(now, "SOCIAL_MEDIA"), previous: revenueIn(before, "SOCIAL_MEDIA") },
    },
    paidFunnel: { current: paidFunnel(now), previous: paidFunnel(before) },
  };
}
