// Sales reps, shared by every page with a "sales rep" filter (currently Pipeline).
// A rep's id is their HubSpot owner id, so data from different sources can be
// matched to the same person.

export interface SalesRep {
  id: string; // HubSpot owner id
  name: string;
}

// SAMPLE: four obviously fictional reps. Real reps will come from HubSpot's owners list.
export const SAMPLE_REPS: SalesRep[] = [
  { id: "70000001", name: "Alex Sample" },
  { id: "70000002", name: "Jordan Example" },
  { id: "70000003", name: "Sam Placeholder" },
  { id: "70000004", name: "Riley Demo" },
];

// Turn the raw ?rep= value from the URL into a known rep id, or null for "All reps".
// Anything unexpected (?rep=banana, ?rep=1&rep=2, nothing) means "All reps".
export function parseRepId(value: string | string[] | undefined, reps: SalesRep[]): string | null {
  return reps.find((rep) => rep.id === value)?.id ?? null;
}
