import type { DateRange } from "@/lib/dateRange";
import type { PeriodValue } from "@/lib/types";

// The social platforms on the Social page. LinkedIn has its own page (/linkedin).
export type Platform = "instagram" | "facebook" | "youtube";

export interface PlatformInfo {
  id: Platform;
  label: string; // e.g. "Instagram"
  reachLabel: "Impressions" | "Views"; // what the platform calls its reach number (all three say "Views")
}

// ---------------------------------------------------------------------------
// What the sources send (after the sync script maps each platform's own API
// field names into this one shared shape)
// ---------------------------------------------------------------------------

// One platform's numbers for one day.
export interface PlatformDailyStats {
  date: string; // "YYYY-MM-DD"
  platform: Platform;
  followers: number; // total followers at the end of the day
  followersGained: number; // new followers that day
  followersLost: number; // unfollows that day
  impressions: number; // reach: what the platform reports as views
  engagements: number; // likes, comments, shares, clicks, saves…
}

// One published post or video, with its lifetime numbers.
export interface SocialPost {
  id: string;
  platform: Platform;
  publishedAt: string; // ISO date-time
  title: string; // first line of the caption, or the video title
  url: string; // link to the post
  impressions: number; // impressions or views
  engagements: number;
}

// ---------------------------------------------------------------------------
// What getSocialData() returns to the page
// ---------------------------------------------------------------------------

export interface SocialKpis {
  totalFollowers: PeriodValue; // today vs the start of the range
  followersGained: PeriodValue; // net: gained − lost
  impressions: PeriodValue; // impressions and views together
  engagementRate: PeriodValue; // engagements ÷ impressions, a fraction
}

// One day of "followers over time": the date plus one number per platform shown.
// e.g. { date: "2026-11-10", instagram: 6650, youtube: 2410 }
export type FollowersPoint = { date: string } & Partial<Record<Platform, number>>;

// One bar of "engagement rate by platform".
export interface PlatformEngagement {
  platform: Platform;
  label: string;
  engagementRate: number; // fraction
  impressions: number;
  engagements: number;
}

// One row of "top 10 posts".
export interface TopPostRow {
  id: string;
  platform: Platform;
  platformLabel: string;
  publishedDate: string; // "YYYY-MM-DD"
  title: string;
  impressions: number;
  reachLabel: "Impressions" | "Views"; // what `impressions` means for this platform
  engagementRate: number; // fraction
  url: string;
}

export interface SocialData {
  range: DateRange;
  platform: Platform | null; // the selected platform, or null for "All"
  platforms: PlatformInfo[]; // everything the platform filter can pick
  kpis: SocialKpis;
  followersOverTime: FollowersPoint[]; // one entry per day of the range, oldest first
  engagementByPlatform: PlatformEngagement[]; // always all four platforms (the filter doesn't hide bars)
  topPosts: TopPostRow[]; // top 10 by impressions/views, biggest first
}
