import type { DateRange } from "@/lib/dateRange";

// Field names follow LinkedIn's Marketing (ads) and Community Management
// (Company Page) APIs, and HubSpot for revenue. They're a close match, not
// copied from a live response: check them when API access arrives.
// LinkedIn identifies everything with "URNs", e.g. "urn:li:sponsoredCampaign:600000001".

// ===========================================================================
// RAW: what the APIs send
// ===========================================================================

// --- Ads: campaign groups and campaigns ------------------------------------

export interface LinkedInCampaignGroup {
  id: string; // URN, "urn:li:sponsoredCampaignGroup:…"
  name: string;
}

export interface LinkedInCampaign {
  id: string; // URN, "urn:li:sponsoredCampaign:…"
  name: string;
  campaignGroup: string; // URN of its campaign group
  status: "ACTIVE" | "PAUSED" | "COMPLETED";
  objectiveType: "LEAD_GENERATION" | "WEBSITE_VISIT" | "WEBSITE_CONVERSION" | "BRAND_AWARENESS";
}

// --- Ads: analytics ---------------------------------------------------------

// A date the way LinkedIn's analytics send it.
export interface LinkedInDate {
  year: number;
  month: number; // 1–12
  day: number;
}

// One campaign's numbers for one day (ad analytics, pivot CAMPAIGN, daily).
export interface AdAnalyticsElement {
  dateRange: { start: LinkedInDate; end: LinkedInDate };
  pivotValues: string[]; // [campaign URN]
  impressions: number;
  clicks: number;
  costInLocalCurrency: string; // sent as text, e.g. "123.45"
  oneClickLeads: number; // lead gen form submissions
  landingPageClicks: number;
  externalWebsiteConversions: number;
}

// Who saw a campaign over a whole period (ad analytics pivoted by a member attribute).
export type AudiencePivot = "MEMBER_COMPANY" | "MEMBER_INDUSTRY" | "MEMBER_JOB_FUNCTION" | "MEMBER_SENIORITY";

export interface AudienceAnalyticsElement {
  pivot: AudiencePivot;
  pivotValue: string; // URN of the company / industry / function / seniority
  pivotValueName: string; // its name, looked up separately in the real API
  campaign: string; // campaign URN the numbers belong to
  dateRange: { start: LinkedInDate; end: LinkedInDate }; // the whole period
  impressions: number;
  clicks: number;
}

// --- Organic: Company Page --------------------------------------------------

// One day of follower statistics. LinkedIn only reports gains per day and the
// CURRENT total, so our sync records the total each day (totalFollowers).
export interface FollowerStatisticsElement {
  timeRange: { start: number; end: number }; // milliseconds
  followerGains: { organicFollowerGain: number; paidFollowerGain: number };
  totalFollowers: number; // recorded by our sync at the end of the day
}

// One day of page statistics.
export interface PageStatisticsElement {
  timeRange: { start: number; end: number }; // milliseconds
  totalPageStatistics: { views: { allPageViews: { pageViews: number } } };
}

// Lifetime follower counts by industry and by job function (follower statistics).
// These cover ALL current followers who share that information, not just new ones,
// so they don't follow the date range and won't add up to the total.
export interface FollowerCounts {
  organicFollowerCount: number;
  paidFollowerCount: number;
}
export interface FollowerDemographics {
  followerCountsByIndustry: { industry: string; followerCounts: FollowerCounts }[]; // industry URN
  followerCountsByFunction: { function: string; followerCounts: FollowerCounts }[]; // job function URN
}

// A Company Page post.
export interface LinkedInPost {
  id: string; // URN, "urn:li:share:…"
  publishedAt: number; // milliseconds
  commentary: string; // the post text
}

// A post's lifetime numbers. LinkedIn calls reactions "likes" and reposts "shares" here.
export interface ShareStatisticsElement {
  share: string; // the post's URN
  totalShareStatistics: {
    impressionCount: number;
    clickCount: number;
    likeCount: number; // reactions
    commentCount: number;
    shareCount: number; // reposts
  };
}

// --- LinkedIn to revenue: HubSpot -------------------------------------------

// HubSpot's "original source" values for LinkedIn traffic.
export type HubSpotSocialSource = "PAID_SOCIAL" | "SOCIAL_MEDIA"; // ads | organic

// One day of contacts and deals whose original source is LinkedIn.
export interface LinkedInRevenueRow {
  date: string; // "YYYY-MM-DD"
  source: HubSpotSocialSource;
  newContacts: number; // leads
  dealsCreated: number;
  dealAmountCreated: number; // total amount of those deals (pipeline value)
  dealsWon: number; // deals marked won that day (usually created weeks earlier)
  dealAmountWon: number; // total amount of those won deals
}

// ===========================================================================
// CLEAN: what the app works with. Raw counts only; rates come from src/lib/rates.ts.
// ===========================================================================

export interface AdCounts {
  impressions: number;
  clicks: number;
  cost: number; // in the ad account's currency
  leadFormSubmissions: number;
  landingPageClicks: number;
  websiteConversions: number;
}

export interface OrganicCounts {
  followersGained: number; // organic + paid
  paidFollowersGained: number;
  pageViews: number;
  postImpressions: number;
  clicks: number;
  reactions: number;
  comments: number;
  reposts: number;
}

export interface RevenueCounts {
  leads: number;
  deals: number;
  pipelineValue: number;
  wonDeals: number;
  wonValue: number;
}

// The paid funnel: LinkedIn ads (all campaign groups) through to won deals in HubSpot.
export interface FunnelCounts {
  impressions: number;
  clicks: number;
  leads: number; // new HubSpot contacts from LinkedIn ads
  deals: number; // deals created from those
  wonDeals: number;
  pipelineValue: number; // amount of deals created
  wonValue: number; // amount of deals won
}

// Totals for the selected range and the same length of time before it.
export interface PeriodCounts<T> {
  current: T;
  previous: T;
}

export interface CampaignGroupInfo {
  id: string;
  name: string;
}

export interface CampaignInfo {
  id: string;
  name: string;
  groupId: string;
  groupName: string;
  status: LinkedInCampaign["status"];
  objective: LinkedInCampaign["objectiveType"];
}

export interface AudienceItem {
  name: string;
  impressions: number;
  clicks: number;
}

export interface OrganicDay {
  date: string; // "YYYY-MM-DD"
  totalFollowers: number;
  followersGained: number;
  pageViews: number;
}

// Current followers in one industry or job function.
export interface FollowerSegment {
  name: string;
  followers: number; // organic + paid
}

export interface PostRow {
  id: string;
  url: string; // link to the post (example.com for sample posts)
  publishedDate: string; // "YYYY-MM-DD"
  snippet: string; // the first ~120 characters of the post
  impressions: number;
  clicks: number;
  reactions: number;
  comments: number;
  reposts: number;
}

// ===========================================================================
// What getLinkedInData() returns to the page
// ===========================================================================

export interface LinkedInData {
  range: DateRange;
  campaignGroupId: string | null; // the selected campaign group, or null for "All campaign groups"
  campaignGroups: CampaignGroupInfo[]; // everything the campaign group filter can pick

  ads: {
    totals: PeriodCounts<AdCounts>; // follows the campaign group filter
    daily: ({ date: string } & AdCounts)[]; // one entry per day of the range, oldest first
    byCampaign: (CampaignInfo & AdCounts)[]; // campaigns in the selected group(s), most cost first
  };

  // Who engaged with the ads in the range; follows the campaign group filter. Most clicks first.
  // LinkedIn's numbers here are approximate and leave out very small groups.
  audience: {
    company: AudienceItem[];
    industry: AudienceItem[];
    jobFunction: AudienceItem[];
    seniority: AudienceItem[];
  };

  // Company Page: not tied to a campaign, so the campaign group filter doesn't apply.
  organic: {
    totalFollowers: { current: number; previous: number }; // today vs the start of the range
    totals: PeriodCounts<OrganicCounts>;
    daily: OrganicDay[]; // one entry per day of the range, oldest first
    posts: PostRow[]; // posts published in the range, most impressions first
    // All current followers (not just the date range), most first.
    followersByIndustry: FollowerSegment[];
    followersByFunction: FollowerSegment[];
  };

  // From HubSpot: not tied to a campaign, so the campaign group filter doesn't apply.
  revenue: {
    fromAds: PeriodCounts<RevenueCounts>; // original source PAID_SOCIAL
    fromOrganic: PeriodCounts<RevenueCounts>; // original source SOCIAL_MEDIA
  };

  // Ads (ALL campaign groups) → HubSpot. Ignores the campaign group filter, because
  // HubSpot can't split leads and deals by campaign group.
  paidFunnel: PeriodCounts<FunnelCounts>;
}
