import type { DataSource } from "@/lib/dataSource";
import { DAYS_IN_RANGE, type DateRange } from "@/lib/dateRange";
import { ONE_DAY_MS, SAMPLE_TODAY_MS } from "@/lib/sampleData";
import { PLATFORMS, SAMPLE_DAILY_STATS, SAMPLE_POSTS } from "./samplePosts";
import type {
  FollowersPoint,
  Platform,
  PlatformDailyStats,
  PlatformEngagement,
  SocialData,
  SocialPost,
  TopPostRow,
} from "./types";

// Sample numbers, so the Social page shows a "Sample data" badge.
// Change to "live" when the fetch functions below return real data.
export const socialDataSource: DataSource = "sample";

// "Today" for the sample data. Real data will use the actual date.
const TODAY_MS = SAMPLE_TODAY_MS;

// ---------------------------------------------------------------------------
// Getting the rows — THE ONLY PART THAT CHANGES WHEN REAL DATA ARRIVES
// ---------------------------------------------------------------------------

async function fetchDailyStats(): Promise<PlatformDailyStats[]> {
  return SAMPLE_DAILY_STATS; // later: synced daily stats from each platform's API
}

async function fetchPosts(): Promise<SocialPost[]> {
  return SAMPLE_POSTS; // later: synced posts from each platform's API
}

// ---------------------------------------------------------------------------
// The platform filter
// ---------------------------------------------------------------------------

// Turn the raw ?platform= value from the URL into a platform, or null for "All".
export function parsePlatform(value: string | string[] | undefined): Platform | null {
  return PLATFORMS.find((p) => p.id === value)?.id ?? null;
}

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const isoDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const rate = (part: number, whole: number) => (whole === 0 ? 0 : part / whole);

// Rows dated within the `days` days ending on `endMs` (inclusive). "YYYY-MM-DD"
// text compares correctly as text, so plain >= and <= work.
function inDays<T extends { date: string }>(rows: T[], days: number, endMs: number): T[] {
  const first = isoDate(endMs - (days - 1) * ONE_DAY_MS);
  const last = isoDate(endMs);
  return rows.filter((r) => r.date >= first && r.date <= last);
}

function total(rows: PlatformDailyStats[], field: "impressions" | "engagements" | "followersGained" | "followersLost") {
  return rows.reduce((sum, row) => sum + row[field], 0);
}

// Followers added up across the given platforms, on one day.
function followersOn(rows: PlatformDailyStats[], date: string): number {
  return rows.filter((r) => r.date === date).reduce((sum, r) => sum + r.followers, 0);
}

// ---------------------------------------------------------------------------
// The function the page uses
// ---------------------------------------------------------------------------

const TOP_POSTS = 10;

export async function getSocialData(
  range: DateRange,
  requestedPlatform: Platform | null = null,
): Promise<SocialData> {
  const [allStats, allPosts] = await Promise.all([fetchDailyStats(), fetchPosts()]);

  const platform = PLATFORMS.some((p) => p.id === requestedPlatform) ? requestedPlatform : null;
  const shown = platform === null ? PLATFORMS : PLATFORMS.filter((p) => p.id === platform);
  const stats = allStats.filter((r) => shown.some((p) => p.id === r.platform));

  // The selected range and the same number of days before it.
  const days = DAYS_IN_RANGE[range];
  const previousEndMs = TODAY_MS - days * ONE_DAY_MS;
  const now = inDays(stats, days, TODAY_MS);
  const before = inDays(stats, days, previousEndMs);

  // Followers: today, at the end of the previous period (= just before this range
  // started), and at the end of the period before that.
  const followersToday = followersOn(stats, isoDate(TODAY_MS));
  const followersAtRangeStart = followersOn(stats, isoDate(previousEndMs));

  // Followers over time: one entry per day, with one number per shown platform.
  const followersOverTime: FollowersPoint[] = Array.from({ length: days }, (_, i) => {
    const date = isoDate(TODAY_MS - (days - 1 - i) * ONE_DAY_MS);
    const point: FollowersPoint = { date };
    for (const p of shown) {
      point[p.id] = stats.find((r) => r.platform === p.id && r.date === date)?.followers ?? 0;
    }
    return point;
  });

  // Engagement rate per platform: always all four platforms, for comparison.
  const engagementByPlatform: PlatformEngagement[] = PLATFORMS.map((p) => {
    const rows = inDays(allStats.filter((r) => r.platform === p.id), days, TODAY_MS);
    const impressions = total(rows, "impressions");
    const engagements = total(rows, "engagements");
    return { platform: p.id, label: p.label, engagementRate: rate(engagements, impressions), impressions, engagements };
  });

  // Top posts: published in the range, on the shown platforms, most reach first.
  const firstDay = isoDate(TODAY_MS - (days - 1) * ONE_DAY_MS);
  const lastDay = isoDate(TODAY_MS);
  const info = new Map(PLATFORMS.map((p) => [p.id, p]));
  const topPosts: TopPostRow[] = allPosts
    .filter((post) => shown.some((p) => p.id === post.platform))
    .filter((post) => post.publishedAt.slice(0, 10) >= firstDay && post.publishedAt.slice(0, 10) <= lastDay)
    .sort((a, b) => b.impressions - a.impressions || a.id.localeCompare(b.id))
    .slice(0, TOP_POSTS)
    .map((post) => ({
      id: post.id,
      platform: post.platform,
      platformLabel: info.get(post.platform)!.label,
      publishedDate: post.publishedAt.slice(0, 10),
      title: post.title,
      impressions: post.impressions,
      reachLabel: info.get(post.platform)!.reachLabel,
      engagementRate: rate(post.engagements, post.impressions),
      url: post.url,
    }));

  return {
    range,
    platform,
    platforms: PLATFORMS,
    kpis: {
      totalFollowers: { current: followersToday, previous: followersAtRangeStart },
      followersGained: {
        current: total(now, "followersGained") - total(now, "followersLost"),
        previous: total(before, "followersGained") - total(before, "followersLost"),
      },
      impressions: { current: total(now, "impressions"), previous: total(before, "impressions") },
      engagementRate: {
        current: rate(total(now, "engagements"), total(now, "impressions")),
        previous: rate(total(before, "engagements"), total(before, "impressions")),
      },
    },
    followersOverTime,
    engagementByPlatform,
    topPosts,
  };
}
