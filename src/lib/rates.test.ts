// Tests for src/lib/rates.ts. Run with: npm test
//
// How to read a test:
//   test("what should happen", () => {
//     expect(actualResult).toBe(expectedResult);
//   });
// .toBe(x)          → exactly x (use for null and whole numbers)
// .toBeCloseTo(x)   → x, allowing for tiny rounding in decimals (0.1 + 0.2 = 0.30000000000000004)
//
// The rule every rate follows: when it can't be calculated (dividing by zero), it's null,
// which the page shows as "—". Never 0, never NaN, never Infinity.

import { describe, expect, test } from "vitest";
import {
  clickThroughRate,
  closedDealWinRate,
  costPerClick,
  costPerLead,
  costPerThousandImpressions,
  dealWinRate,
  engagementRate,
  leadFormConversionRate,
  leadToDealRate,
  pipelinePerAdSpend,
  ratio,
  websiteConversionRate,
} from "@/lib/rates";

describe("ratio: the building block every rate uses", () => {
  test("divides part by whole", () => {
    expect(ratio(1, 4)).toBe(0.25);
  });

  test("nothing to divide by gives null, not NaN or Infinity", () => {
    expect(ratio(5, 0)).toBe(null);
    expect(ratio(0, 0)).toBe(null); // 0 ÷ 0 would be NaN in plain JavaScript
  });

  test("zero of something is a real 0, not null", () => {
    // 0 clicks out of 1,000 impressions is a 0% rate: we know it, it's just bad news.
    expect(ratio(0, 1000)).toBe(0);
  });

  test("the part can be bigger than the whole (e.g. cost per click above $1)", () => {
    expect(ratio(150, 100)).toBe(1.5);
  });
});

describe("ads (LinkedIn Campaign Manager)", () => {
  test("click-through rate: clicks ÷ impressions", () => {
    expect(clickThroughRate({ clicks: 6, impressions: 1000 })).toBeCloseTo(0.006);
  });

  test("click-through rate with zero impressions is null", () => {
    expect(clickThroughRate({ clicks: 0, impressions: 0 })).toBe(null);
  });

  test("click-through rate with impressions but no clicks is 0", () => {
    expect(clickThroughRate({ clicks: 0, impressions: 5000 })).toBe(0);
  });

  test("cost per click: cost ÷ clicks", () => {
    expect(costPerClick({ cost: 100, clicks: 40 })).toBe(2.5);
  });

  test("cost per click with zero clicks is null, not $0", () => {
    expect(costPerClick({ cost: 100, clicks: 0 })).toBe(null);
  });

  test("CPM: cost per 1,000 impressions", () => {
    expect(costPerThousandImpressions({ cost: 50, impressions: 10_000 })).toBeCloseTo(5);
  });

  test("CPM with zero impressions is null", () => {
    expect(costPerThousandImpressions({ cost: 50, impressions: 0 })).toBe(null);
  });

  test("CPM with impressions but no spend is 0", () => {
    expect(costPerThousandImpressions({ cost: 0, impressions: 10_000 })).toBe(0);
  });

  test("cost per lead: cost ÷ leads", () => {
    expect(costPerLead({ cost: 8142.36, leadFormSubmissions: 42 })).toBeCloseTo(193.87, 2);
  });

  test("cost per lead with zero leads is null (shown as —), not $0", () => {
    expect(costPerLead({ cost: 8142.36, leadFormSubmissions: 0 })).toBe(null);
  });

  test("cost per lead with no spend and no leads is null", () => {
    expect(costPerLead({ cost: 0, leadFormSubmissions: 0 })).toBe(null);
  });

  test("lead form conversion rate: leads ÷ clicks", () => {
    expect(leadFormConversionRate({ leadFormSubmissions: 3, clicks: 120 })).toBeCloseTo(0.025);
  });

  test("lead form conversion rate with zero clicks is null", () => {
    expect(leadFormConversionRate({ leadFormSubmissions: 0, clicks: 0 })).toBe(null);
  });

  test("website conversion rate: conversions ÷ landing page clicks", () => {
    expect(websiteConversionRate({ websiteConversions: 2, landingPageClicks: 80 })).toBeCloseTo(0.025);
  });

  test("website conversion rate with zero landing page clicks is null", () => {
    expect(websiteConversionRate({ websiteConversions: 0, landingPageClicks: 0 })).toBe(null);
  });
});

describe("organic (LinkedIn Company Page)", () => {
  test("engagement rate adds clicks, reactions, comments and reposts, then ÷ impressions", () => {
    const post = { clicks: 30, reactions: 15, comments: 4, reposts: 1, impressions: 1000 };
    expect(engagementRate(post)).toBeCloseTo(0.05); // 50 ÷ 1,000
  });

  test("engagement rate with zero impressions is null", () => {
    const post = { clicks: 0, reactions: 0, comments: 0, reposts: 0, impressions: 0 };
    expect(engagementRate(post)).toBe(null);
  });
});

describe("LinkedIn to revenue", () => {
  test("pipeline per ad spend: $4.20 of pipeline per $1", () => {
    expect(pipelinePerAdSpend({ pipelineValue: 42_000, cost: 10_000 })).toBeCloseTo(4.2);
  });

  test("pipeline per ad spend with no spend is null", () => {
    expect(pipelinePerAdSpend({ pipelineValue: 42_000, cost: 0 })).toBe(null);
  });

  test("lead-to-deal rate with zero leads is null", () => {
    expect(leadToDealRate({ deals: 0, leads: 0 })).toBe(null);
  });

  test("deal win rate (won ÷ created) with no deals created is null", () => {
    expect(dealWinRate({ wonDeals: 0, deals: 0 })).toBe(null);
  });
});

describe("closed deal win rate (Pipeline): won ÷ (won + lost)", () => {
  test("3 won and 1 lost is 75%", () => {
    expect(closedDealWinRate({ won: 3, lost: 1 })).toBe(0.75);
  });

  test("no closed deals is null: 'no win rate yet', not 0%", () => {
    // HubSpot has 0 deals today, so this is exactly what the page will get at first.
    expect(closedDealWinRate({ won: 0, lost: 0 })).toBe(null);
  });

  test("only lost deals is a real 0%", () => {
    expect(closedDealWinRate({ won: 0, lost: 4 })).toBe(0);
  });

  test("only won deals is 100%", () => {
    expect(closedDealWinRate({ won: 5, lost: 0 })).toBe(1);
  });
});
