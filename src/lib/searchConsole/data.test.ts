// Tests for getSearchData (on sample data). Run with: npm test
import { describe, expect, test } from "vitest";
import { clickThroughRate } from "@/lib/rates";
import { getSearchData, OPPORTUNITY_RULES, parseTermsFilter } from "./data";

describe("getSearchData", () => {
  test("the toggle filters the top search terms", async () => {
    const brand = await getSearchData("28d", "brand");
    const nonBrand = await getSearchData("28d", "nonbrand");
    expect(brand.topTerms.length).toBeGreaterThan(0);
    expect(brand.topTerms.every((t) => t.isBrand)).toBe(true);
    expect(nonBrand.topTerms.every((t) => !t.isBrand)).toBe(true);
  });

  test("top terms are sorted by clicks and never add up to more than the totals", async () => {
    const data = await getSearchData("28d", "all");
    const clicks = data.topTerms.map((t) => t.clicks);
    expect(clicks).toEqual([...clicks].sort((a, b) => b - a));
    expect(clicks.reduce((sum, c) => sum + c, 0)).toBeLessThanOrEqual(data.current.clicks);
  });

  test("every opportunity has enough impressions and a below-average CTR", async () => {
    const data = await getSearchData("28d", "all");
    expect(data.opportunities.length).toBeGreaterThan(0);
    for (const page of data.opportunities) {
      expect(page.impressions).toBeGreaterThanOrEqual(OPPORTUNITY_RULES.minImpressionsPerDay * 28);
      expect(clickThroughRate(page)!).toBeLessThan(data.nonBrandCtr!);
      expect(page.missedClicks).toBeGreaterThan(0);
    }
  });

  test("one daily entry per day, ending 2 days before sample today", async () => {
    const data = await getSearchData("7d", "all");
    expect(data.daily).toHaveLength(7);
    expect(data.lastDate).toBe("2026-11-08");
    expect(data.daily.at(-1)!.date).toBe("2026-11-08");
  });
});

describe("parseTermsFilter: ?terms= from the URL", () => {
  test("known values pass through, anything else is 'all'", () => {
    expect(parseTermsFilter("brand")).toBe("brand");
    expect(parseTermsFilter("nonbrand")).toBe("nonbrand");
    expect(parseTermsFilter(undefined)).toBe("all");
    expect(parseTermsFilter("everything")).toBe("all");
    expect(parseTermsFilter(["brand", "nonbrand"])).toBe("all"); // ?terms=a&terms=b
  });
});
