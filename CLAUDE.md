@AGENTS.md

## About this project
Internal sales and marketing dashboard for Rootcode.
Build order: Website (GA4), then LinkedIn (Campaign Manager ads + Company Page analytics), then Pipeline (HubSpot), then Social (Instagram, Facebook, YouTube).
We don't use Sales Navigator. LinkedIn ads run through Campaign Manager.
Stack: Next.js + TypeScript + Tailwind, BigQuery, Auth.js (Google, rootcode.io only), Cloud Run, sync scripts in TypeScript on GitHub Actions.

## How to work with me
- I'm learning to code. Explain each step in plain words before you do it.
- Work in small steps and stop after each one so I can run it.
- After each step, give me one small change to make myself, then review it.
- Never put API keys or secrets in code, and never commit .env files.

## Progress
- Module 1 done: layout on made-up data
  - Sidebar and four pages inside the `(dashboard)` route group; `/` redirects to `/website`
  - Date filter stored in the URL as `?range=` (7d / 28d / 90d, default 28d), read inside `<Suspense>` (cacheComponents is on)
- Module 2 done: Website charts on made-up data (lint, type check and build pass)
  - `getWebsiteData(range)` in `src/lib/website/` returns KPIs, a daily series, traffic by channel and the top 10 landing pages
  - Sessions and engaged sessions KPIs are added up from the daily series; made-up daily numbers are stable (no `Math.random`)
  - Sessions over time (line) and Traffic by channel (horizontal bars) use Recharts in `src/components/charts/` (`"use client"`); Top landing pages is a server-rendered table
  - Shared pieces: `Card` for every card, `src/lib/format.ts` for all number/date formatting, `src/lib/chartColors.ts` for all chart colours
- Redesign done (ui-ux-pro-max skill, "Data-Dense Dashboard" style)
  - Colour tokens in `src/app/globals.css` (`primary`, `accent`, `sidebar`, `positive`/`negative`, `sample`…); components use token names, not hex
  - Fira Sans for text, Fira Code for code-like text (page paths), via `next/font`; light mode only for now
  - Navy sidebar with amber active marker; `Card` has an optional icon; `KpiTile` has a change pill and optional sparkline (`charts/Sparkline.tsx`)
  - `lucide-react` pinned at 1.62.0 for icons
- Module 2b in progress: lay out the other pages on sample data while Google Cloud access is pending
  - Rules: reuse the shared components; sample data behind `get…Data(range, …)` in `src/lib/<page>/`, shaped like the real data; obviously fictional names only (no real clients); a "Sample data" badge on every page not on real data
  - Every page uses `PageHeader` with its data module's `…DataSource` ("sample" | "live"); the badge follows it
  - Layout: navy top bar on phones (below 768px), sidebar from 768px; `<main>` has `min-w-0` so wide content scrolls inside its card, never the page; every link/button/select is at least 44px tall
  - Shared components: `Card` (optional icon), `KpiTile` (`better: "up" | "down" | "neither"`, `null` shows "—", optional `note`, skips all-zero sparklines), `FilterBar` (one row under the header: date range first), `DateRangeFilter` (`keep` preserves other URL filters), `SelectFilter` (dropdown stored in the URL, `"use client"`), `DataTable` (shared table style), `FunnelChart` (steps + step-to-step rates)
  - Shared charts in `src/components/charts/`: `TimeSeriesChart` (`zeroBaseline={false}` for slow totals like followers), `HorizontalBarChart` (one-line labels shortened with "…"), `Sparkline`; Website's charts are thin wrappers around them
  - Shared lib: `src/lib/rates.ts` is the ONLY place rates are calculated (store/return raw counts only; rates return `null` when they can't be calculated); `format.ts` has `"currency"` (USD, set in `CURRENCY`), two decimals for percentages under 1%, `formatTableDate`; `sampleData.ts` (sample "today" 10 Nov 2026, `stableNoise`, `stableRound`, `isoDate`); `types.ts` (`PeriodValue`); `salesReps.ts` (4 fictional reps)
  - LinkedIn page (`/linkedin`, replaced Prospecting; `/prospecting` redirects there): filters date range + campaign group; headline tiles (ad spend, leads, cost per lead, pipeline from LinkedIn, followers gained); "Who's engaging" (top 10 companies, industries, job functions, seniority by clicks); Organic (followers over time, followers by industry and job function, top 10 posts table); "From ads to revenue" (impressions → clicks → leads → deals → won deals, plus pipeline from LinkedIn ads)
  - LinkedIn data in `src/lib/linkedin/`: raw shapes close to LinkedIn's Marketing and Community Management APIs and HubSpot; `getLinkedInData(range, groupId)`; ads and audience follow the group filter, organic and revenue/funnel don't (HubSpot can't split by campaign group)
  - Pipeline: sample data done in `src/lib/pipeline/` (HubSpot deal format, default stages, `getPipelineData(range, repId)`); page is a header only
  - Social: Instagram, Facebook and YouTube only (LinkedIn has its own page; the Social header links to it); sample data done in `src/lib/social/` (`getSocialData(range, platform)`, each platform has a fixed sample seed); page is a header only
- Next: Module 2b
  - LinkedIn page: spend and clicks over time (two small charts, different units, no dual axis) and a sortable campaign table (spend, impressions, clicks, CTR, CPC, leads, cost per lead)
  - Build the Pipeline page (filters: date range + sales rep) and the Social page (filters: date range + platform) from the shared components
  - After the next commit: delete `src/lib/prospecting/` (old Sales Navigator sample data, never committed, so not in Git history yet)
- Notes for module 5 (real LinkedIn data):
  - Check field names in `src/lib/linkedin/types.ts` against real API responses; LinkedIn sends cost as text and ids as URNs; industry/function names need separate lookups
  - LinkedIn only gives the CURRENT follower total, so the sync must record the total every day from day one, or "Followers over time" has no history
  - Audience numbers are approximate and leave out small groups; they won't add up to the totals
  - The funnel counts each step within the period, so it has no deal→won rate; add a matched rate ("of the deals created in this period, won so far") from per-deal HubSpot data
  - Post links switch from example.com to linkedin.com automatically when `linkedinDataSource` is "live"
- Notes for module 3 (real GA4 data in `getWebsiteData`, without changing the page):
  - Keep the `WebsiteData` shape; lists must stay sorted (channels and landing pages most sessions first, landing pages limited to 10)
  - Made-up data ends on a fixed date (10 Nov 2026); real data needs real dates, sent as "YYYY-MM-DD" text
  - Form submissions are still typed totals, not part of the daily series
  - Made-up channels leave out GA4's "Unassigned"; decide whether to show it
  - Change `websiteDataSource` to "live" so the Sample data badge disappears
- Still open:
  - Decisions needed: currency (sample data uses USD, set in `CURRENCY` in `format.ts`) and date style (US "Nov 9, 2026" or day-first "9 Nov 2026", set in `format.ts`)
  - Shared formats still missing for Pipeline: whole days (sales cycle), month and week labels
  - Website and Social data still have their own small `rate` helpers (return 0, not null); move them to `src/lib/rates.ts` with a before/after check of the numbers
  - Dark mode: not supported yet (the app stays light)
  - My practice changes: `/login` page without the sidebar, Form submissions as the first tile, "Last 14 days" option, "Deals by stage" `Card` on Pipeline
- Later (real data): LinkedIn is module 5, Pipeline module 6, Social module 7
