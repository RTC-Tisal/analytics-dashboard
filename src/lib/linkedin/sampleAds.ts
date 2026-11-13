import { DAYS_IN_RANGE, DATE_RANGES } from "@/lib/dateRange";
import { ONE_DAY_MS, SAMPLE_TODAY_MS, isoDate, stableNoise, stableRound } from "@/lib/sampleData";
import type {
  AdAnalyticsElement,
  AudienceAnalyticsElement,
  AudiencePivot,
  LinkedInCampaign,
  LinkedInCampaignGroup,
  LinkedInDate,
} from "./types";

// SAMPLE DATA: a fictional LinkedIn Campaign Manager account (about $10K a month).
// Every name says "(sample)". Shaped like LinkedIn's Marketing API responses.

export const HISTORY_DAYS = 200; // a 90-day range plus the 90 days before it, with room to spare

// ---------------------------------------------------------------------------
// Campaign groups and campaigns
// ---------------------------------------------------------------------------

export const SAMPLE_CAMPAIGN_GROUPS: LinkedInCampaignGroup[] = [
  { id: "urn:li:sponsoredCampaignGroup:610000001", name: "Lead generation (sample)" },
  { id: "urn:li:sponsoredCampaignGroup:610000002", name: "Website traffic (sample)" },
  { id: "urn:li:sponsoredCampaignGroup:610000003", name: "Brand awareness (sample)" },
];

export const SAMPLE_CAMPAIGNS: LinkedInCampaign[] = [
  { id: "urn:li:sponsoredCampaign:600000001", name: "Lead gen – CTOs, Financial Services (sample)", campaignGroup: "urn:li:sponsoredCampaignGroup:610000001", status: "ACTIVE", objectiveType: "LEAD_GENERATION" },
  { id: "urn:li:sponsoredCampaign:600000002", name: "Lead gen – Heads of Product, Retail (sample)", campaignGroup: "urn:li:sponsoredCampaignGroup:610000001", status: "PAUSED", objectiveType: "LEAD_GENERATION" },
  { id: "urn:li:sponsoredCampaign:600000003", name: "Case study – Cloud migration (sample)", campaignGroup: "urn:li:sponsoredCampaignGroup:610000002", status: "ACTIVE", objectiveType: "WEBSITE_VISIT" },
  { id: "urn:li:sponsoredCampaign:600000004", name: "Retargeting – Website visitors (sample)", campaignGroup: "urn:li:sponsoredCampaignGroup:610000002", status: "ACTIVE", objectiveType: "WEBSITE_CONVERSION" },
  { id: "urn:li:sponsoredCampaign:600000005", name: "Thought leadership video (sample)", campaignGroup: "urn:li:sponsoredCampaignGroup:610000003", status: "ACTIVE", objectiveType: "BRAND_AWARENESS" },
];

// When each campaign ran (in days before "today") and how much it spends per weekday, in USD.
const SCHEDULE: Record<string, { dailyBudget: number; startDaysAgo: number; stopDaysAgo: number | null }> = {
  "urn:li:sponsoredCampaign:600000001": { dailyBudget: 130, startDaysAgo: 199, stopDaysAgo: null },
  "urn:li:sponsoredCampaign:600000002": { dailyBudget: 90, startDaysAgo: 199, stopDaysAgo: 21 }, // paused 3 weeks ago
  "urn:li:sponsoredCampaign:600000003": { dailyBudget: 70, startDaysAgo: 150, stopDaysAgo: null },
  "urn:li:sponsoredCampaign:600000004": { dailyBudget: 40, startDaysAgo: 199, stopDaysAgo: null },
  "urn:li:sponsoredCampaign:600000005": { dailyBudget: 60, startDaysAgo: 45, stopDaysAgo: null }, // started recently
};

// Typical results per objective: cost per 1,000 impressions, click-through rate,
// share of clicks that submit a lead form / go to the website, and website conversion rate.
const OBJECTIVE_BEHAVIOUR: Record<
  LinkedInCampaign["objectiveType"],
  { cpm: number; ctr: number; leadRate: number; landingShare: number; websiteConversionRate: number }
> = {
  LEAD_GENERATION: { cpm: 65, ctr: 0.0065, leadRate: 0.11, landingShare: 0.05, websiteConversionRate: 0.01 },
  WEBSITE_VISIT: { cpm: 45, ctr: 0.0075, leadRate: 0, landingShare: 0.85, websiteConversionRate: 0.015 },
  WEBSITE_CONVERSION: { cpm: 70, ctr: 0.009, leadRate: 0, landingShare: 0.9, websiteConversionRate: 0.04 },
  BRAND_AWARENESS: { cpm: 25, ctr: 0.003, leadRate: 0, landingShare: 0.6, websiteConversionRate: 0.005 },
};

// B2B ads still run at weekends, but deliver less.
const WEEKDAY_FACTOR = [0.55, 1.05, 1.1, 1.1, 1.05, 0.9, 0.55]; // Sun, Mon, … Sat

const toLinkedInDate = (ms: number): LinkedInDate => {
  const d = new Date(ms);
  return { year: d.getUTCFullYear(), month: d.getUTCMonth() + 1, day: d.getUTCDate() };
};

// ---------------------------------------------------------------------------
// Daily ad analytics (one element per campaign per day it ran)
// ---------------------------------------------------------------------------

const analytics: AdAnalyticsElement[] = [];

SAMPLE_CAMPAIGNS.forEach((campaign, c) => {
  const schedule = SCHEDULE[campaign.id];
  const behaviour = OBJECTIVE_BEHAVIOUR[campaign.objectiveType];

  for (let daysAgo = schedule.startDaysAgo; daysAgo >= (schedule.stopDaysAgo ?? 0); daysAgo--) {
    const dayMs = SAMPLE_TODAY_MS - daysAgo * ONE_DAY_MS;
    const dayNumber = Math.round(dayMs / ONE_DAY_MS);
    const noise = (k: number) => stableNoise(dayNumber * 40 + c * 9 + k);

    const cost = schedule.dailyBudget * WEEKDAY_FACTOR[new Date(dayMs).getUTCDay()] * (0.85 + 0.3 * noise(1));
    const impressions = Math.round((cost / behaviour.cpm) * 1000 * (0.9 + 0.2 * noise(2)));
    const clicks = stableRound(impressions * behaviour.ctr * (0.8 + 0.4 * noise(3)), noise(4));
    const landingPageClicks = Math.min(clicks, stableRound(clicks * behaviour.landingShare, noise(5)));

    analytics.push({
      dateRange: { start: toLinkedInDate(dayMs), end: toLinkedInDate(dayMs) },
      pivotValues: [campaign.id],
      impressions,
      clicks,
      costInLocalCurrency: cost.toFixed(2), // LinkedIn sends money as text
      oneClickLeads: stableRound(clicks * behaviour.leadRate * (0.7 + 0.6 * noise(6)), noise(7)),
      landingPageClicks,
      externalWebsiteConversions: stableRound(landingPageClicks * behaviour.websiteConversionRate, noise(8)),
    });
  }
});

export const SAMPLE_AD_ANALYTICS: AdAnalyticsElement[] = analytics;

// ---------------------------------------------------------------------------
// Audience: who saw each campaign, per period (7, 28 and 90 days ending today)
// ---------------------------------------------------------------------------

// The fictional clients (same as Pipeline) and LinkedIn's standard categories.
// Ids are sample ids in LinkedIn's URN format, not LinkedIn's real ids.
const AUDIENCE_VALUES: Record<AudiencePivot, { urnType: string; names: string[]; coverage: number }> = {
  // Only part of the audience can be matched to a company page, so companies cover ~35%.
  MEMBER_COMPANY: {
    urnType: "organization",
    coverage: 0.35,
    names: ["Example Ltd", "Sample Corp", "Placeholder Inc", "Fictional Ventures", "Demo Holdings", "Mock Retail Group", "Dummy Health", "Imaginary Bank", "Pretend Logistics", "Specimen Energy"],
  },
  MEMBER_INDUSTRY: {
    urnType: "industry",
    coverage: 0.9,
    names: ["Financial Services", "Banking", "Software Development", "IT Services and IT Consulting", "Retail", "Hospitals and Health Care", "Transportation, Logistics, Supply Chain and Storage", "Telecommunications"],
  },
  MEMBER_JOB_FUNCTION: {
    urnType: "function",
    coverage: 0.85,
    names: ["Information Technology", "Engineering", "Product Management", "Operations", "Business Development", "Finance", "Marketing", "Program and Project Management"],
  },
  MEMBER_SENIORITY: {
    urnType: "seniority",
    coverage: 0.9,
    names: ["Senior", "Manager", "Director", "Entry", "VP", "CXO", "Owner", "Partner"], // typical B2B audience first
  },
};

// Each campaign's targeting makes some audiences more likely (multiplier per name).
const TARGETING_BOOST: Record<string, Record<string, number>> = {
  "urn:li:sponsoredCampaign:600000001": { "Financial Services": 4, Banking: 3, "Imaginary Bank": 3, "Information Technology": 3, Engineering: 2, CXO: 4, VP: 2 },
  "urn:li:sponsoredCampaign:600000002": { Retail: 5, "Mock Retail Group": 3, "Product Management": 5, Director: 3, VP: 2 },
  "urn:li:sponsoredCampaign:600000003": { "Software Development": 2, "IT Services and IT Consulting": 2, "Information Technology": 2, Manager: 2, Senior: 2 },
};

const audience: AudienceAnalyticsElement[] = [];

DATE_RANGES.forEach((range, r) => {
  const days = DAYS_IN_RANGE[range];
  const firstDay = isoDate(SAMPLE_TODAY_MS - (days - 1) * ONE_DAY_MS);
  const lastDay = isoDate(SAMPLE_TODAY_MS);
  const dateRange = {
    start: toLinkedInDate(SAMPLE_TODAY_MS - (days - 1) * ONE_DAY_MS),
    end: toLinkedInDate(SAMPLE_TODAY_MS),
  };

  SAMPLE_CAMPAIGNS.forEach((campaign, c) => {
    // The campaign's totals in this period, from the daily analytics above.
    const rows = analytics.filter((a) => {
      const d = a.dateRange.start;
      const date = `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
      return a.pivotValues[0] === campaign.id && date >= firstDay && date <= lastDay;
    });
    const impressions = rows.reduce((sum, a) => sum + a.impressions, 0);
    const clicks = rows.reduce((sum, a) => sum + a.clicks, 0);
    if (impressions === 0) return; // the campaign didn't run in this period

    (Object.keys(AUDIENCE_VALUES) as AudiencePivot[]).forEach((pivot, p) => {
      const { urnType, names, coverage } = AUDIENCE_VALUES[pivot];
      const noise = (i: number, k: number) => stableNoise(r * 1000 + c * 100 + p * 20 + i * 2 + k);
      // Earlier names in each list are a bit more common; targeting boosts some; a little wobble.
      const weights = names.map((name, i) => (1 / (1 + i * 0.25)) * (TARGETING_BOOST[campaign.id]?.[name] ?? 1) * (0.8 + 0.4 * noise(i, 1)));
      const weightSum = weights.reduce((sum, w) => sum + w, 0);

      names.forEach((name, i) => {
        const share = (weights[i] / weightSum) * coverage;
        const itemImpressions = Math.round(impressions * share);
        const itemClicks = Math.min(itemImpressions, Math.round(clicks * share * (0.75 + 0.5 * noise(i, 2))));
        // Like LinkedIn, leave out groups with very few interactions (privacy).
        // LinkedIn sets its own cut-off; 3 clicks is our stand-in for the sample.
        if (itemClicks < 3) return;
        audience.push({
          pivot,
          pivotValue: `urn:li:${urnType}:${900 + i}`,
          pivotValueName: name,
          campaign: campaign.id,
          dateRange,
          impressions: itemImpressions,
          clicks: itemClicks,
        });
      });
    });
  });
});

export const SAMPLE_AUDIENCE: AudienceAnalyticsElement[] = audience;
