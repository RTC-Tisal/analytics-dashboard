import { ONE_DAY_MS, SAMPLE_TODAY_MS, isoDate, stableNoise, stableRound } from "@/lib/sampleData";
import { HISTORY_DAYS, SAMPLE_AD_ANALYTICS } from "./sampleAds";
import { SAMPLE_POST_BOOST_BY_DAY } from "./sampleOrganic";
import type { LinkedInRevenueRow } from "./types";

// SAMPLE DATA: contacts and deals whose HubSpot "original source" is LinkedIn,
// one row per day per source. Kept roughly in line with the sample ads, so the
// "LinkedIn to revenue" numbers agree with the ads numbers.
// Not linked to the Pipeline page's sample deals (that's a separate sample).

// Ad lead form submissions and website conversions per day, across all campaigns.
const adResultsByDate = new Map<string, { leads: number; conversions: number }>();
for (const a of SAMPLE_AD_ANALYTICS) {
  const { year, month, day } = a.dateRange.start;
  const date = isoDate(Date.UTC(year, month - 1, day));
  const sum = adResultsByDate.get(date) ?? { leads: 0, conversions: 0 };
  sum.leads += a.oneClickLeads;
  sum.conversions += a.externalWebsiteConversions;
  adResultsByDate.set(date, sum);
}

// A deal's amount: mostly $20K–60K, a few bigger; rounded to $500.
const dealAmount = (roll: number) => Math.round((20_000 + roll ** 2 * 70_000) / 500) * 500;

const WIN_LAG_DAYS = 45; // deals are typically won about 6–7 weeks after they're created

const rows: LinkedInRevenueRow[] = [];
const startMs = SAMPLE_TODAY_MS - (HISTORY_DAYS - 1) * ONE_DAY_MS;

for (let day = 0; day < HISTORY_DAYS; day++) {
  const dayMs = startMs + day * ONE_DAY_MS;
  const date = isoDate(dayMs);
  const dayNumber = Math.round(dayMs / ONE_DAY_MS);
  const noise = (k: number) => stableNoise(dayNumber * 20 + 1300 + k);

  // Ads: most lead form submissions sync into HubSpot as new contacts (some are duplicates),
  // plus about half of website conversions.
  const ads = adResultsByDate.get(date) ?? { leads: 0, conversions: 0 };
  const paidContacts = stableRound(ads.leads * 0.9 + ads.conversions * 0.5, noise(1));
  const paidDeals = stableRound(paidContacts * 0.06, noise(2)); // ~6% of ad leads become deals

  // Organic: a few contacts a week, more after a well-performing post.
  const organicContacts = stableRound(0.25 + (SAMPLE_POST_BOOST_BY_DAY[day] / 4_000) * 0.35, noise(3));
  const organicDeals = stableRound(organicContacts * 0.1, noise(4)); // organic leads convert a bit better

  const amounts = (deals: number, k: number) =>
    Array.from({ length: deals }, (_, i) => dealAmount(noise(k + i))).reduce((sum, a) => sum + a, 0);

  // Wins: about 30% of deals are won, ~45 days after they were created. Rows go in
  // pairs per day (paid, organic), so the same source 45 days ago is 90 rows back.
  const won = (source: 0 | 1, k: number) => {
    const earlier = rows[rows.length - WIN_LAG_DAYS * 2 + source];
    if (!earlier || earlier.dealsCreated === 0) return { dealsWon: 0, dealAmountWon: 0 };
    const dealsWon = Math.min(earlier.dealsCreated, stableRound(earlier.dealsCreated * 0.3, noise(k)));
    const averageDeal = earlier.dealAmountCreated / earlier.dealsCreated;
    return { dealsWon, dealAmountWon: Math.round((dealsWon * averageDeal) / 500) * 500 };
  };

  // Work out both before adding either row: adding the paid row first would shift
  // the "90 rows back" position for the organic one.
  const paidWon = won(0, 30);
  const organicWon = won(1, 31);
  rows.push({ date, source: "PAID_SOCIAL", newContacts: paidContacts, dealsCreated: paidDeals, dealAmountCreated: amounts(paidDeals, 10), ...paidWon });
  rows.push({ date, source: "SOCIAL_MEDIA", newContacts: organicContacts, dealsCreated: organicDeals, dealAmountCreated: amounts(organicDeals, 20), ...organicWon });
}

export const SAMPLE_REVENUE: LinkedInRevenueRow[] = rows;
