import { ONE_DAY_MS, SAMPLE_TODAY_MS, stableNoise } from "@/lib/sampleData";
import { SAMPLE_REPS } from "@/lib/salesReps";
import type { DealStage, HubSpotDeal } from "./types";

// SAMPLE DATA for the Pipeline page. Everything here is fictional: company names,
// rep names, amounts and dates. It's shaped exactly like HubSpot's CRM API
// response, so the real data can replace it without changing anything else.

// HubSpot's default "Sales Pipeline" and its stages, in the order deals move through them.
// When your own HubSpot pipeline has different stages, this is the list to update.
export const PIPELINE_ID = "default";

export const STAGES: DealStage[] = [
  { id: "appointmentscheduled", label: "Appointment Scheduled", isClosed: false, isWon: false },
  { id: "qualifiedtobuy", label: "Qualified To Buy", isClosed: false, isWon: false },
  { id: "presentationscheduled", label: "Presentation Scheduled", isClosed: false, isWon: false },
  { id: "decisionmakerboughtin", label: "Decision Maker Bought-In", isClosed: false, isWon: false },
  { id: "contractsent", label: "Contract Sent", isClosed: false, isWon: false },
  { id: "closedwon", label: "Closed Won", isClosed: true, isWon: true },
  { id: "closedlost", label: "Closed Lost", isClosed: true, isWon: false },
];

// Sample won-revenue targets per quarter, in USD, by rep id (the fictional reps
// in src/lib/salesReps.ts). Real targets will come from wherever sales sets them.
export const SAMPLE_QUARTERLY_TARGETS: Record<string, number> = {
  "70000001": 360_000, // Alex Sample
  "70000002": 300_000, // Jordan Example
  "70000003": 300_000, // Sam Placeholder
  "70000004": 240_000, // Riley Demo
};

// Obviously fictional clients and project types, combined into deal names.
const COMPANIES = [
  "Example Ltd", "Sample Corp", "Placeholder Inc", "Fictional Ventures",
  "Demo Holdings", "Mock Retail Group", "Dummy Health", "Imaginary Bank",
  "Pretend Logistics", "Specimen Energy", "Prototype Labs", "Test Freight Co",
];
const PROJECTS = [
  "Mobile app", "Data platform", "AI assistant", "Cloud migration",
  "Customer portal", "MVP build", "Analytics dashboard", "Payments integration",
];

const DEAL_COUNT = 320;
const HISTORY_DAYS = 300; // deals were created over the last ~10 months

// The open stages, in order (everything except Closed Won / Closed Lost).
const OPEN_STAGES = STAGES.filter((s) => !s.isClosed);

// Build one fictional deal. Every "random" choice uses stableNoise with a seed
// based on the deal number, so the same deal comes out identical every time.
function sampleDeal(i: number): HubSpotDeal {
  const noise = (k: number) => stableNoise(i * 17 + k); // k picks a different "dice roll" per field

  const createdDaysAgo = Math.floor(noise(1) * HISTORY_DAYS);
  const createdMs =
    SAMPLE_TODAY_MS - createdDaysAgo * ONE_DAY_MS + Math.floor(9 + noise(2) * 8) * 60 * 60 * 1000; // 9:00–17:00
  const cycleDays = Math.round(25 + noise(3) * 95); // 25–120 days from create to close
  const plannedCloseMs = createdMs + cycleDays * ONE_DAY_MS;

  // Mostly small and mid-sized deals, a few big ones; rounded to $500.
  const amount = Math.round((8_000 + noise(4) ** 2 * 112_000) / 500) * 500;

  // ~3% of deals have no owner yet, and ~2% have no amount: real HubSpot data has gaps too.
  const owner = noise(5) < 0.03 ? null : SAMPLE_REPS[Math.floor(noise(6) * SAMPLE_REPS.length)];
  const hasAmount = noise(7) >= 0.02;

  let stage: DealStage;
  if (plannedCloseMs <= SAMPLE_TODAY_MS) {
    // Old enough to have closed: won about a third of the time.
    stage = noise(8) < 0.36 ? STAGES.find((s) => s.id === "closedwon")! : STAGES.find((s) => s.id === "closedlost")!;
  } else {
    // Still open: the further through its cycle, the later the stage.
    const progress = createdDaysAgo / cycleDays; // 0 = just created, close to 1 = nearly due
    stage = OPEN_STAGES[Math.min(OPEN_STAGES.length - 1, Math.floor(progress * OPEN_STAGES.length))];
  }

  const company = COMPANIES[i % COMPANIES.length];
  const project = PROJECTS[Math.floor(noise(9) * PROJECTS.length)];

  return {
    id: String(30_000_000_000 + i), // HubSpot ids are long numbers, sent as text
    properties: {
      dealname: `${company} – ${project}`,
      amount: hasAmount ? String(amount) : null,
      dealstage: stage.id,
      pipeline: PIPELINE_ID,
      hubspot_owner_id: owner ? owner.id : null,
      createdate: new Date(createdMs).toISOString(),
      closedate: new Date(plannedCloseMs).toISOString(),
    },
  };
}

// All sample deals, built once when this file is first loaded.
export const SAMPLE_DEALS: HubSpotDeal[] = Array.from({ length: DEAL_COUNT }, (_, i) => sampleDeal(i));
