// Tests for src/lib/searchConsole/rows.ts. Run with: npm test
import { describe, expect, test } from "vitest";
import { isBrandQuery, toSearchRow } from "./rows";

describe("isBrandQuery: does the search contain 'rootcode'?", () => {
  test("our name on its own or inside a longer search is brand", () => {
    expect(isBrandQuery("rootcode")).toBe(true);
    expect(isBrandQuery("rootcode careers")).toBe(true);
    expect(isBrandQuery("jobs at rootcode sri lanka")).toBe(true);
  });

  test("capital letters don't matter", () => {
    expect(isBrandQuery("RootCode Software")).toBe(true);
  });

  test("our name typed with a space still counts", () => {
    expect(isBrandQuery("root code careers")).toBe(true);
  });

  test("searches without our name are not brand", () => {
    expect(isBrandQuery("custom software development")).toBe(false);
    expect(isBrandQuery("root canal")).toBe(false); // starts like us, but isn't us
    expect(isBrandQuery("")).toBe(false);
  });
});

describe("toSearchRow: raw API row → our row", () => {
  const apiRow = {
    keys: ["2026-11-08", "rootcode careers", "https://www.example.com/careers", "lka", "MOBILE"],
    clicks: 5,
    impressions: 12,
    ctr: 0.4167,
    position: 1.3,
  };

  test("unpacks keys into named fields, keeps counts and position, drops ctr", () => {
    expect(toSearchRow(apiRow)).toEqual({
      date: "2026-11-08",
      query: "rootcode careers",
      page: "https://www.example.com/careers",
      country: "lka",
      device: "MOBILE",
      clicks: 5,
      impressions: 12,
      position: 1.3,
      isBrand: true,
    });
  });

  test("rejects rows whose keys aren't the five dimensions we asked for", () => {
    expect(() => toSearchRow({ ...apiRow, keys: ["2026-11-08", "rootcode"] })).toThrow();
    expect(() => toSearchRow({ ...apiRow, keys: [...apiRow.keys.slice(0, 4), "SMART_TV"] })).toThrow();
  });
});
