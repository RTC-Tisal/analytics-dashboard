// Where a page's numbers come from.
//   "sample" → made up for layout; the page shows a "Sample data" badge
//   "live"   → real data (GA4, HubSpot…); no badge
//
// Each data module declares its own source right next to its data function,
// e.g. `export const websiteDataSource: DataSource = "sample";`. When real data
// is connected, change that one word and the badge disappears from the page.
export type DataSource = "sample" | "live";
