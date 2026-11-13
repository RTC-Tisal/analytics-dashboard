// THE ONE PLACE where rates are calculated from raw counts.
//
// Data modules store and return only counts (impressions, clicks, cost, leads…).
// Pages call these functions when they need a rate. Why not store rates?
//   - Rates can't be added up or averaged: the CTR of a month is total clicks ÷
//     total impressions, NOT the average of 30 daily CTRs. Counts can always be
//     added, so any period or any group of campaigns gets the right rate.
//   - One definition: if "engagement rate" changes, it changes here, everywhere.
//   - Counts are what the APIs report; a stored rate is a second copy that can
//     drift out of sync with them.
//
// Every function returns null when the rate doesn't exist (dividing by zero):
// "cost per lead" with zero leads isn't $0, it's "no leads yet". Pages show null as "—".

// part ÷ whole, or null when there's nothing to divide by.
export function ratio(part: number, whole: number): number | null {
  return whole === 0 ? null : part / whole;
}

// ---------------------------------------------------------------------------
// Ads (LinkedIn Campaign Manager)
// ---------------------------------------------------------------------------

// Click-through rate: clicks ÷ impressions. A fraction: 0.006 means 0.6%.
export const clickThroughRate = (c: { clicks: number; impressions: number }) =>
  ratio(c.clicks, c.impressions);

// Cost per click: cost ÷ clicks, in the ad account's currency.
export const costPerClick = (c: { cost: number; clicks: number }) => ratio(c.cost, c.clicks);

// Cost per 1,000 impressions (CPM).
export const costPerThousandImpressions = (c: { cost: number; impressions: number }) => {
  const perImpression = ratio(c.cost, c.impressions);
  return perImpression === null ? null : perImpression * 1000;
};

// Cost per lead: cost ÷ lead form submissions.
export const costPerLead = (c: { cost: number; leadFormSubmissions: number }) =>
  ratio(c.cost, c.leadFormSubmissions);

// Lead form conversion rate: lead form submissions ÷ clicks.
export const leadFormConversionRate = (c: { leadFormSubmissions: number; clicks: number }) =>
  ratio(c.leadFormSubmissions, c.clicks);

// Website conversion rate: website conversions ÷ landing page clicks.
export const websiteConversionRate = (c: { websiteConversions: number; landingPageClicks: number }) =>
  ratio(c.websiteConversions, c.landingPageClicks);

// ---------------------------------------------------------------------------
// Organic (LinkedIn Company Page)
// ---------------------------------------------------------------------------

// Engagement rate of a post or a period: (clicks + reactions + comments + reposts) ÷ impressions.
// This follows LinkedIn's own definition, minus follows (which LinkedIn doesn't report per post).
export const engagementRate = (c: {
  clicks: number;
  reactions: number;
  comments: number;
  reposts: number;
  impressions: number;
}) => ratio(c.clicks + c.reactions + c.comments + c.reposts, c.impressions);

// ---------------------------------------------------------------------------
// LinkedIn to revenue
// ---------------------------------------------------------------------------

// Pipeline value created per unit of ad spend: e.g. 4.2 means $4.20 of pipeline per $1.
export const pipelinePerAdSpend = (c: { pipelineValue: number; cost: number }) =>
  ratio(c.pipelineValue, c.cost);

// Lead-to-deal rate: deals created ÷ leads.
export const leadToDealRate = (c: { deals: number; leads: number }) => ratio(c.deals, c.leads);

// Deal win rate: deals won ÷ deals created (in the same period, so not the same deals).
export const dealWinRate = (c: { wonDeals: number; deals: number }) => ratio(c.wonDeals, c.deals);
