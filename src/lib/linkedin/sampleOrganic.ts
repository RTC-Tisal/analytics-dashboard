import { ONE_DAY_MS, SAMPLE_TODAY_MS, stableNoise, stableRound } from "@/lib/sampleData";
import { HISTORY_DAYS, SAMPLE_AD_ANALYTICS } from "./sampleAds";
import type {
  FollowerDemographics,
  FollowerStatisticsElement,
  LinkedInPost,
  PageStatisticsElement,
  ShareStatisticsElement,
} from "./types";

// SAMPLE DATA: a fictional LinkedIn Company Page. Shaped like LinkedIn's Community
// Management API responses (follower statistics, page statistics, posts, share statistics).

// Fictional post texts; client names are the same made-up ones as Pipeline.
const CLIENTS = ["Example Ltd", "Sample Corp", "Imaginary Bank", "Pretend Logistics", "Dummy Health", "Fictional Ventures", "Demo Holdings", "Mock Retail Group"];
const PROJECTS = ["mobile app", "data platform", "AI assistant", "cloud migration", "customer portal", "MVP", "analytics dashboard", "payments integration"];
const withArticle = (p: string) => (/^(a|e|i|o|u|AI|MVP)/i.test(p) ? `an ${p}` : `a ${p}`);
const possessive = (c: string) => (c.endsWith("s") ? `${c}'` : `${c}'s`); // "Demo Holdings'" not "Demo Holdings's"
const TEMPLATES: ((client: string, project: string) => string)[] = [
  (c, p) => `Case study: how we helped ${c} launch ${withArticle(p)} in 12 weeks. Here's what made the difference, and what we'd do again.`,
  (c, p) => `What we learned building ${withArticle(p)} for ${c}: three decisions that saved months, and one we'd change.`,
  (_c, p) => `Five questions to ask before you start your next ${p} project. Number three is the one most teams skip.`,
  (c, p) => `Meet the team behind ${possessive(c)} ${p}. A short thread on how a small squad shipped something big.`,
  (_c, p) => `We're hiring engineers who love shipping. If ${withArticle(p)} sounds like your kind of challenge, read on. (sample post)`,
];

// Posts on most weekdays, rarely at weekends.
const POST_CHANCE = [0, 0.75, 0.8, 0.75, 0.7, 0.4, 0]; // Sun, Mon, … Sat
// Each post's reach is spread over the day it's published and the next two days.
const SPREAD = [0.6, 0.25, 0.15];

const startMs = SAMPLE_TODAY_MS - (HISTORY_DAYS - 1) * ONE_DAY_MS;

// ---------------------------------------------------------------------------
// Posts and their statistics
// ---------------------------------------------------------------------------

const posts: LinkedInPost[] = [];
const shareStats: ShareStatisticsElement[] = [];
const postBoost = new Array<number>(HISTORY_DAYS + SPREAD.length).fill(0); // impressions from recent posts, per day

for (let day = 0; day < HISTORY_DAYS; day++) {
  const dayMs = startMs + day * ONE_DAY_MS;
  const dayNumber = Math.round(dayMs / ONE_DAY_MS);
  const noise = (k: number) => stableNoise(dayNumber * 30 + 700 + k);
  if (noise(1) >= POST_CHANCE[new Date(dayMs).getUTCDay()]) continue; // no post today

  const id = `urn:li:share:74000000${dayNumber}`;
  const impressionCount = Math.round(1_800 + noise(2) ** 2 * 7_200); // a few posts do much better
  const template = TEMPLATES[Math.floor(noise(3) * TEMPLATES.length)];

  posts.push({
    id,
    publishedAt: dayMs + Math.floor(8 + noise(4) * 9) * 60 * 60 * 1000, // 8:00–17:00
    commentary: template(CLIENTS[Math.floor(noise(5) * CLIENTS.length)], PROJECTS[Math.floor(noise(6) * PROJECTS.length)]),
  });
  shareStats.push({
    share: id,
    totalShareStatistics: {
      impressionCount,
      clickCount: stableRound(impressionCount * 0.016 * (0.6 + 0.8 * noise(7)), noise(8)),
      likeCount: stableRound(impressionCount * 0.024 * (0.6 + 0.8 * noise(9)), noise(10)),
      commentCount: stableRound(impressionCount * 0.0035 * (0.4 + 1.2 * noise(11)), noise(12)),
      shareCount: stableRound(impressionCount * 0.002 * (0.4 + 1.2 * noise(13)), noise(14)),
    },
  });
  SPREAD.forEach((share, offset) => (postBoost[day + offset] += impressionCount * share));
}

export const SAMPLE_POSTS: LinkedInPost[] = posts;
export const SAMPLE_SHARE_STATISTICS: ShareStatisticsElement[] = shareStats;

// ---------------------------------------------------------------------------
// Daily follower and page statistics
// ---------------------------------------------------------------------------

// Brand-awareness ads bring some followers: impressions of that campaign per day.
const brandImpressionsByDay = new Map<number, number>();
for (const a of SAMPLE_AD_ANALYTICS) {
  if (a.pivotValues[0] !== "urn:li:sponsoredCampaign:600000005") continue;
  const { year, month, day } = a.dateRange.start;
  brandImpressionsByDay.set(Date.UTC(year, month - 1, day), a.impressions);
}

const followerStats: FollowerStatisticsElement[] = [];
const pageStats: PageStatisticsElement[] = [];
let totalFollowers = 17_400;

for (let day = 0; day < HISTORY_DAYS; day++) {
  const dayMs = startMs + day * ONE_DAY_MS;
  const dayNumber = Math.round(dayMs / ONE_DAY_MS);
  const noise = (k: number) => stableNoise(dayNumber * 30 + 900 + k);
  const isWeekend = [0, 6].includes(new Date(dayMs).getUTCDay());
  const boost = postBoost[day] / 4_000; // ~1 on a day with a typical post doing well

  const organicFollowerGain = stableRound((isWeekend ? 4 : 9) * (0.6 + 0.8 * noise(1)) * (1 + 0.5 * boost), noise(2));
  const paidFollowerGain = stableRound(((brandImpressionsByDay.get(dayMs) ?? 0) / 1_000) * 0.9, noise(3));
  const unfollows = stableRound(1.5 * noise(4), noise(5)); // LinkedIn doesn't report these; they only show in the total
  totalFollowers += organicFollowerGain + paidFollowerGain - unfollows;

  const timeRange = { start: dayMs, end: dayMs + ONE_DAY_MS };
  followerStats.push({ timeRange, followerGains: { organicFollowerGain, paidFollowerGain }, totalFollowers });
  pageStats.push({
    timeRange,
    totalPageStatistics: {
      views: { allPageViews: { pageViews: Math.round((isWeekend ? 35 : 90) * (0.7 + 0.6 * noise(6)) * (1 + 0.6 * boost)) } },
    },
  });
}

export const SAMPLE_FOLLOWER_STATISTICS: FollowerStatisticsElement[] = followerStats;
export const SAMPLE_PAGE_STATISTICS: PageStatisticsElement[] = pageStats;

// ---------------------------------------------------------------------------
// Follower demographics (all current followers) and the name lookups
// ---------------------------------------------------------------------------

// LinkedIn's standard industry and job function names, with sample ids in URN
// format (not LinkedIn's real ids). Earlier names get more followers.
const INDUSTRIES = [
  "Software Development", "IT Services and IT Consulting", "Financial Services", "Technology, Information and Internet",
  "Banking", "Business Consulting and Services", "Retail", "Hospitals and Health Care", "Telecommunications",
  "Higher Education", "Staffing and Recruiting", "Insurance", "Transportation, Logistics, Supply Chain and Storage",
  "Advertising Services",
];
const FUNCTIONS = [
  "Engineering", "Information Technology", "Business Development", "Operations", "Sales", "Product Management",
  "Marketing", "Consulting", "Human Resources", "Finance", "Program and Project Management", "Education",
  "Arts and Design", "Entrepreneurship",
];

export const SAMPLE_INDUSTRY_NAMES: Record<string, string> = Object.fromEntries(
  INDUSTRIES.map((name, i) => [`urn:li:industry:${800 + i}`, name]),
);
export const SAMPLE_FUNCTION_NAMES: Record<string, string> = Object.fromEntries(
  FUNCTIONS.map((name, i) => [`urn:li:function:${800 + i}`, name]),
);

// Split today's followers across the list. Only ~85% of members share their industry
// or job function, so the segments add up to less than the total; ~10% came from ads.
function followerCounts(names: string[], seed: number) {
  const weights = names.map((_, i) => (1 / (1 + i * 0.45)) * (0.8 + 0.4 * stableNoise(seed + i)));
  const weightSum = weights.reduce((sum, w) => sum + w, 0);
  return weights.map((w) => {
    const followers = Math.round((totalFollowers * 0.85 * w) / weightSum);
    const paid = Math.round(followers * 0.1);
    return { organicFollowerCount: followers - paid, paidFollowerCount: paid };
  });
}

export const SAMPLE_FOLLOWER_DEMOGRAPHICS: FollowerDemographics = {
  followerCountsByIndustry: followerCounts(INDUSTRIES, 3100).map((followerCounts, i) => ({
    industry: `urn:li:industry:${800 + i}`,
    followerCounts,
  })),
  followerCountsByFunction: followerCounts(FUNCTIONS, 3200).map((followerCounts, i) => ({
    function: `urn:li:function:${800 + i}`,
    followerCounts,
  })),
};

// Impressions from recent posts per day, used by the revenue sample (organic leads).
export const SAMPLE_POST_BOOST_BY_DAY: number[] = postBoost.slice(0, HISTORY_DAYS);
