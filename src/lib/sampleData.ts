// Helpers shared by every page's sample (made-up) data.

// All sample data ends on this day, as if "today" were 10 Nov 2026. A fixed
// date (not the real today) keeps sample numbers identical on every refresh.
export const SAMPLE_TODAY_MS = Date.UTC(2026, 10, 10); // months count from 0, so 10 = November

export const ONE_DAY_MS = 24 * 60 * 60 * 1000;

// A "random-looking" number between 0 and 1 that is always the same for the
// same seed. Unlike Math.random(), stableNoise(42) returns the same value on
// every call, so sample numbers never change between refreshes.
export function stableNoise(seed: number): number {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x); // keep only the part after the decimal point
}

// Turn a fractional amount into a whole number that averages out to `value`,
// using a stable "dice roll" between 0 and 1. Plain Math.round would round small
// daily amounts (like 0.4 leads) the same way every day and skew the totals.
export function stableRound(value: number, roll: number): number {
  return Math.floor(value + roll);
}

// A timestamp as "YYYY-MM-DD" (in UTC, like all sample dates).
export function isoDate(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}
