import { isoDate, ONE_DAY_MS, SAMPLE_TODAY_MS, stableNoise, stableRound } from "@/lib/sampleData";
import { isBrandQuery } from "./rows";
import type { SearchDevice, SearchRow } from "./types";

// MADE-UP Search Console rows, shaped like real ones (see types.ts).
// Every number comes from the date, the query and the country/device, so a day
// always has the same rows on every refresh.

// Sample page URLs use example.com, like the LinkedIn sample posts.
export const SAMPLE_SITE = "https://www.example.com";

// Real Search Console data is 2–3 days late, so the sample stops 2 days before sample "today".
export const SEARCH_DATA_DELAY_DAYS = 2;
export const SAMPLE_SEARCH_LAST_DAY_MS = SAMPLE_TODAY_MS - SEARCH_DATA_DELAY_DAYS * ONE_DAY_MS; // 8 Nov 2026

// Made-up searches. dailyImpressions is for all countries and devices together on a
// weekday; ctr is the share of those that click; position is where we usually rank.
const sampleQueries: { query: string; path: string; dailyImpressions: number; ctr: number; position: number }[] = [
  // Brand: people looking for us by name. Top of Google, lots of clicks.
  { query: "rootcode", path: "/", dailyImpressions: 140, ctr: 0.48, position: 1.1 },
  { query: "rootcode careers", path: "/careers", dailyImpressions: 35, ctr: 0.42, position: 1.3 },
  { query: "rootcode software", path: "/", dailyImpressions: 18, ctr: 0.4, position: 1.2 },
  { query: "rootcode case studies", path: "/case-studies", dailyImpressions: 6, ctr: 0.35, position: 1.6 },
  // Non-brand: people looking for what we do. Lower down, far fewer clicks.
  { query: "software development company sri lanka", path: "/services/software-development", dailyImpressions: 210, ctr: 0.045, position: 6.5 },
  { query: "custom software development", path: "/services/software-development", dailyImpressions: 380, ctr: 0.006, position: 24 },
  { query: "offshore software development", path: "/services/software-development", dailyImpressions: 160, ctr: 0.009, position: 18 },
  { query: "mvp development agency", path: "/blog/mvp-in-12-weeks", dailyImpressions: 70, ctr: 0.02, position: 11 },
  { query: "how long does it take to build an mvp", path: "/blog/mvp-in-12-weeks", dailyImpressions: 120, ctr: 0.03, position: 8.2 },
  { query: "how to choose a tech partner", path: "/blog/choosing-a-tech-partner", dailyImpressions: 90, ctr: 0.05, position: 5.4 },
  { query: "ai solutions for fintech", path: "/blog/ai-in-fintech", dailyImpressions: 55, ctr: 0.015, position: 14 },
  { query: "ai development services", path: "/services/ai-solutions", dailyImpressions: 140, ctr: 0.007, position: 21 },
  { query: "cloud migration services", path: "/services/cloud", dailyImpressions: 95, ctr: 0.005, position: 27 },
  { query: "hire react developers", path: "/services/software-development", dailyImpressions: 60, ctr: 0.012, position: 16 },
];

// Countries use Search Console's 3-letter lower-case codes.
const countryShares: { country: string; share: number }[] = [
  { country: "lka", share: 0.34 }, // Sri Lanka
  { country: "usa", share: 0.22 },
  { country: "gbr", share: 0.16 },
  { country: "aus", share: 0.12 },
  { country: "ind", share: 0.16 },
];

const deviceShares: { device: SearchDevice; share: number }[] = [
  { device: "DESKTOP", share: 0.6 },
  { device: "MOBILE", share: 0.37 },
  { device: "TABLET", share: 0.03 },
];

// Every made-up row from firstDayMs to lastDayMs (both included, UTC midnights).
export function sampleSearchRows(firstDayMs: number, lastDayMs: number): SearchRow[] {
  const rows: SearchRow[] = [];

  for (let dayMs = firstDayMs; dayMs <= lastDayMs; dayMs += ONE_DAY_MS) {
    const dayNumber = Math.round(dayMs / ONE_DAY_MS);
    const weekday = new Date(dayMs).getUTCDay(); // 0 = Sunday, 6 = Saturday
    const weekendDip = weekday === 0 || weekday === 6 ? 0.6 : 1; // B2B searches drop at weekends
    // Slow improvement over time, so this period differs from the previous one:
    // about 0.2% fewer impressions and a 0.2% lower (better) position for each day further back.
    const daysBeforeEnd = (SAMPLE_SEARCH_LAST_DAY_MS - dayMs) / ONE_DAY_MS;
    const growth = 1 - daysBeforeEnd * 0.002;
    const rankDrift = 1 + daysBeforeEnd * 0.002;

    sampleQueries.forEach((q, queryIndex) => {
      let comboIndex = 0;
      for (const { country, share: countryShare } of countryShares) {
        for (const { device, share: deviceShare } of deviceShares) {
          comboIndex += 1;
          const seed = dayNumber * 1000 + queryIndex * 20 + comboIndex; // unique per row

          const expected =
            q.dailyImpressions * countryShare * deviceShare * weekendDip * growth * (0.7 + 0.6 * stableNoise(seed));
          const impressions = stableRound(expected, stableNoise(seed + 0.25));
          if (impressions === 0) continue; // the real API never sends rows with 0 impressions

          const clicks = Math.min(impressions, stableRound(impressions * q.ctr, stableNoise(seed + 0.5)));
          // Wobble ±15% around the usual position, one decimal, never above the top (1).
          const usual = q.position * rankDrift;
          const wobble = (stableNoise(seed + 0.75) - 0.5) * 0.3 * usual;
          const position = Math.max(1, Math.round((usual + wobble) * 10) / 10);

          rows.push({
            date: isoDate(dayMs),
            query: q.query,
            page: SAMPLE_SITE + q.path,
            country,
            device,
            clicks,
            impressions,
            position,
            isBrand: isBrandQuery(q.query),
          });
        }
      }
    });
  }

  return rows;
}
