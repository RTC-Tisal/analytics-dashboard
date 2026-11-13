import { ONE_DAY_MS, SAMPLE_TODAY_MS, isoDate, stableNoise, stableRound } from "@/lib/sampleData";
import type { Platform, PlatformDailyStats, PlatformInfo, SocialPost } from "./types";

// SAMPLE DATA for the Social page. Everything here is fictional. Post links go
// to example.com, a domain reserved for examples, so a sample link can never
// open someone's real post.

// The platforms on the Social page. LinkedIn is NOT here: it has its own page
// (/linkedin), with ads and Company Page analytics together.
// This list drives everything: the platform filter, the charts and the totals.
export const PLATFORMS: PlatformInfo[] = [
  { id: "instagram", label: "Instagram", reachLabel: "Views" },
  { id: "facebook", label: "Facebook", reachLabel: "Views" },
  { id: "youtube", label: "YouTube", reachLabel: "Views" },
];

// A fixed number per platform for its "random-looking" sample numbers. Fixed, not
// the platform's position in the list, so adding or removing a platform never
// changes the others' numbers.
const SEED: Record<Platform, number> = { instagram: 1, facebook: 2, youtube: 3 };

// Enough days for a 90-day range plus the 90 days before it.
const HISTORY_DAYS = 200;

// Each platform's sample behaviour.
const STYLE: Record<
  Platform,
  {
    followersAtStart: number;
    gainedPerDay: number; // new followers on an ordinary day
    lostPerDay: number;
    baselineReach: number; // impressions/views per day without new posts
    postChance: number[]; // chance of a post on Sun, Mon, … Sat
    postReach: [number, number]; // a post's lifetime reach: min, max
    engagementRate: number; // typical engagements ÷ reach
  }
> = {
  instagram: {
    followersAtStart: 5_600, gainedPerDay: 6, lostPerDay: 2, baselineReach: 350,
    postChance: [0.3, 0.45, 0.45, 0.45, 0.45, 0.45, 0.3], postReach: [800, 4_500], engagementRate: 0.031,
  },
  facebook: {
    followersAtStart: 9_400, gainedPerDay: 4, lostPerDay: 2, baselineReach: 450,
    postChance: [0, 0.3, 0.35, 0.3, 0.35, 0.3, 0], postReach: [500, 3_000], engagementRate: 0.015,
  },
  youtube: {
    followersAtStart: 1_900, gainedPerDay: 3, lostPerDay: 0.5, baselineReach: 550,
    postChance: [0, 0.1, 0.12, 0.12, 0.12, 0.1, 0], postReach: [1_500, 12_000], engagementRate: 0.04,
  },
};

// Fictional post titles, built from a template + a made-up client + a project,
// so titles rarely repeat. Clients are the same obviously fictional names as Pipeline.
const CLIENTS = [
  "Example Ltd", "Sample Corp", "Placeholder Inc", "Fictional Ventures", "Demo Holdings",
  "Mock Retail Group", "Dummy Health", "Imaginary Bank", "Pretend Logistics", "Specimen Energy",
];
const PROJECTS = [
  "mobile app", "data platform", "AI assistant", "cloud migration", "customer portal",
  "MVP", "analytics dashboard", "payments integration",
];
// "a mobile app" but "an AI assistant", "an MVP", "an analytics dashboard".
const withArticle = (project: string) => (/^(a|e|i|o|u|AI|MVP)/i.test(project) ? `an ${project}` : `a ${project}`);

const TEMPLATES: Record<Platform, ((client: string, project: string) => string)[]> = {
  instagram: [
    (c, p) => `Sketch to screen: ${c} ${p}`,
    (_c, p) => `Behind the scenes: our ${p} design sprint`,
    (c) => `Demo day with the ${c} team`,
  ],
  facebook: [
    (c, p) => `New case study: ${c} ${p}`,
    (_c, p) => `Community meetup recap: building ${withArticle(p)}`,
  ],
  youtube: [
    (c, p) => `Client story: ${c} ${p}`,
    (_c, p) => `Tech talk: designing a reliable ${p}`,
  ],
};

function sampleTitle(platform: Platform, roll: (k: number) => number): string {
  const templates = TEMPLATES[platform];
  const template = templates[Math.floor(roll(6) * templates.length)];
  return template(CLIENTS[Math.floor(roll(7) * CLIENTS.length)], PROJECTS[Math.floor(roll(8) * PROJECTS.length)]);
}

// Split a post's reach over the day it's published and the next two days.
const SPREAD = [0.6, 0.25, 0.15];

// ---------------------------------------------------------------------------
// Build every post and every daily row once, when this file is first loaded.
// ---------------------------------------------------------------------------

const posts: SocialPost[] = [];
const stats: PlatformDailyStats[] = [];

PLATFORMS.forEach(({ id: platform }) => {
  const seed = SEED[platform];
  const style = STYLE[platform];
  const startMs = SAMPLE_TODAY_MS - (HISTORY_DAYS - 1) * ONE_DAY_MS;

  // 1. Posts. Reach that each post adds to its platform's daily numbers.
  const extraReach = new Array<number>(HISTORY_DAYS + SPREAD.length).fill(0);
  const extraEngagements = new Array<number>(HISTORY_DAYS + SPREAD.length).fill(0);

  for (let day = 0; day < HISTORY_DAYS; day++) {
    const dayMs = startMs + day * ONE_DAY_MS;
    const dayNumber = Math.round(dayMs / ONE_DAY_MS);
    const noise = (k: number) => stableNoise(dayNumber * 50 + seed * 7 + k);

    if (noise(1) >= style.postChance[new Date(dayMs).getUTCDay()]) continue; // no post today

    const [minReach, maxReach] = style.postReach;
    const impressions = Math.round(minReach + noise(2) ** 2 * (maxReach - minReach)); // a few posts do much better
    const engagements = stableRound(impressions * style.engagementRate * (0.5 + noise(3)), noise(4));
    const id = `${platform}-${dayNumber}`;

    posts.push({
      id,
      platform,
      publishedAt: new Date(dayMs + Math.floor(8 + noise(5) * 9) * 60 * 60 * 1000).toISOString(), // 8:00–17:00
      title: sampleTitle(platform, noise),
      url: `https://example.com/sample-posts/${id}`,
      impressions,
      engagements,
    });

    SPREAD.forEach((share, offset) => {
      extraReach[day + offset] += impressions * share;
      extraEngagements[day + offset] += engagements * share;
    });
  }

  // 2. Daily stats: baseline reach plus the reach of recent posts; followers grow,
  //    with a small bump on days when posts are doing well.
  let followers = style.followersAtStart;
  for (let day = 0; day < HISTORY_DAYS; day++) {
    const dayMs = startMs + day * ONE_DAY_MS;
    const dayNumber = Math.round(dayMs / ONE_DAY_MS);
    const noise = (k: number) => stableNoise(dayNumber * 50 + seed * 7 + 20 + k);

    const baseline = style.baselineReach * (0.7 + 0.6 * noise(1));
    const impressions = Math.round(baseline + extraReach[day]);
    const engagements = stableRound(
      baseline * style.engagementRate * (0.6 + 0.8 * noise(2)) + extraEngagements[day],
      noise(3),
    );
    const postBoost = extraReach[day] / style.postReach[1]; // 0 on quiet days, up to ~1 after a hit
    const followersGained = stableRound(style.gainedPerDay * (0.5 + noise(4)) * (1 + postBoost), noise(5));
    const followersLost = stableRound(style.lostPerDay * (0.5 + noise(6)), noise(7));
    followers += followersGained - followersLost;

    stats.push({
      date: isoDate(dayMs),
      platform,
      followers,
      followersGained,
      followersLost,
      impressions,
      engagements,
    });
  }
});

export const SAMPLE_POSTS: SocialPost[] = posts;
export const SAMPLE_DAILY_STATS: PlatformDailyStats[] = stats;
