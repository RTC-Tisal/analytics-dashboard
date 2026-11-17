@AGENTS.md

## About this project
Internal sales and marketing dashboard for Rootcode.
Build order: Website (GA4 + Search Console), then LinkedIn (Campaign Manager ads + Company Page analytics), then Pipeline (HubSpot), then Social (Instagram, Facebook, YouTube).
We don't use Sales Navigator. LinkedIn ads run through Campaign Manager.
Stack: Next.js + TypeScript + Tailwind, BigQuery, Auth.js (Google, rootcode.io only), Cloud Run, sync scripts in TypeScript on GitHub Actions.

## Google Cloud setup
- Project: `rtc-sales-dashboard` (set as the gcloud default). BigQuery dataset: `sales`, location US (empty until the first sync)
- Two logins, two jobs:
  - My account (`gcloud auth login`): what I type in `gcloud`/`bq`. Reader on `sales`: can query, can't change data or project settings
  - Code (Application Default Credentials): impersonates the service account `dashboard-sync@rtc-sales-dashboard.iam.gserviceaccount.com`, which can write to `sales`. Set up with `gcloud auth application-default login --impersonate-service-account=…`
- No service account key files: impersonation gives short-lived passes instead. The ADC file lives in `~/.config/gcloud/`, outside the project; never copy it in
- Check it works: `gcloud auth application-default print-access-token > /dev/null && echo "Impersonation works"`
- Test queries with `--dry_run` first (free, shows bytes that would be read)
- Google Cloud CLI is in `~/google-cloud-sdk` (uses Python 3.14). The Claude Code `!` prompt doesn't load `~/.zshrc`, so there use `~/google-cloud-sdk/bin/gcloud` and `~/google-cloud-sdk/bin/bq`

## How to work with me
- I'm learning to code. Explain each step in plain words before you do it.
- Work in small steps and stop after each one so I can run it.
- After each step, give me one small change to make myself, then review it.
- Never put API keys or secrets in code, and never commit .env files.

## Tests
- Vitest 4.1.12 (dev only; Vitest 5 needs @types/node 22+, we have 20). Run `npm test` (once) or `npm run test:watch` (reruns on save)
- Tests sit next to the code: `src/**/*.test.ts`. Config in `vitest.config.mts` (knows the `@/` shortcut)
- `src/lib/rates.test.ts` covers every rate, including the edge cases: dividing by zero gives null (never 0, NaN or Infinity), and zero of something is a real 0
- New or changed rates: add a test with the edge cases. Run `npm test` before committing

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
  - Every page uses `PageHeader` with `status={get…Status()}` from its data module. The status line under the description (`DataStatusLine`, own `<Suspense>`) shows the "Sample data" pill, "Live, last updated …" (green dot), or an amber warning when live data is over `STALE_AFTER_HOURS` (30) old or the time is unknown; if the check fails it says so instead of breaking. Wording lives only in `describeStatus` (`src/lib/dataSource.ts`). Going live: set `…DataSource` to "live" and make `get…Status()` return the newest `synced_at`
  - Times are shown in `DISPLAY_TIME_ZONE` ("Asia/Colombo", in `format.ts`), because Cloud Run runs on UTC
  - Layout: navy top bar on phones (below 768px), sidebar from 768px; `<main>` has `min-w-0` so wide content scrolls inside its card, never the page; every link/button/select is at least 44px tall
  - KPI definitions: every `KpiTile` has a required `definition` id; the texts live ONLY in `src/lib/kpiDefinitions.ts` and show via an ⓘ `InfoTip` (hover, keyboard focus or tap; pure CSS; 44px tap area; the pop-up spans the card so it never leaves the screen). New tile → add its definition there first
  - Shared components: `Card` (optional icon, optional `titleExtra` after the title), `KpiTile` (`better: "up" | "down" | "neither"`, `null` shows "—", a change that rounds to 0 on screen shows as "no change" (grey), optional `note`, skips all-zero sparklines), `FilterBar` (one row under the header: date range first), `DateRangeFilter` (`keep` preserves other URL filters), `SelectFilter` (dropdown stored in the URL, `"use client"`), `LinkToggle` (a few options as links in the URL, e.g. `?terms=`; `scroll={false}`, no JavaScript), `DataTable` (shared table style), `FunnelChart` (steps + step-to-step rates)
  - Shared charts in `src/components/charts/`: `TimeSeriesChart` (`zeroBaseline={false}` for slow totals like followers), `HorizontalBarChart` (one-line labels shortened with "…"), `Sparkline`; Website's charts are thin wrappers around them
  - Shared lib: `src/lib/rates.ts` is the ONLY place rates are calculated (store/return raw counts only; rates return `null` when they can't be calculated); `format.ts` has `"currency"` (USD, set in `CURRENCY`), `"decimal"` (one decimal; its change is a plain difference, e.g. positions), two decimals for percentages under 1%, `formatTableDate`; `sampleData.ts` (sample "today" 10 Nov 2026, `stableNoise`, `stableRound`, `isoDate`); `types.ts` (`PeriodValue`); `salesReps.ts` (4 fictional reps)
  - LinkedIn page (`/linkedin`, replaced Prospecting; `/prospecting` redirects there): filters date range + campaign group; headline tiles (ad spend, leads, cost per lead, pipeline from LinkedIn, followers gained); "Who's engaging" (top 10 companies, industries, job functions, seniority by clicks); Organic (followers over time, followers by industry and job function, top 10 posts table); "From ads to revenue" (impressions → clicks → leads → deals → won deals, plus pipeline from LinkedIn ads)
  - LinkedIn data in `src/lib/linkedin/`: raw shapes close to LinkedIn's Marketing and Community Management APIs and HubSpot; `getLinkedInData(range, groupId)`; ads and audience follow the group filter, organic and revenue/funnel don't (HubSpot can't split by campaign group)
  - Pipeline: sample data done in `src/lib/pipeline/` (HubSpot deal format, default stages, `getPipelineData(range, repId)`); page is a header only
  - Social: Instagram, Facebook and YouTube only (LinkedIn has its own page; the Social header links to it); sample data done in `src/lib/social/` (`getSocialData(range, platform)`, each platform has a fixed sample seed); page is a header only
- Next: Module 2b
  - LinkedIn page: spend and clicks over time (two small charts, different units, no dual axis) and a sortable campaign table (spend, impressions, clicks, CTR, CPC, leads, cost per lead)
  - Website page: a Search section on sample data (Search Console; see the module 4 notes)
  - Build the Pipeline page (filters: date range + sales rep) and the Social page (filters: date range + platform) from the shared components
  - After the next commit: delete `src/lib/prospecting/` (old Sales Navigator sample data, never committed, so not in Git history yet)
- Module 3 in progress: HubSpot into BigQuery (moved ahead of GA4: HubSpot access came first)
  - HubSpot (portal …533) has 0 deals, ~380 contacts, ~210 companies (since mid-2026). All lifecycle stages are "lead", sources mostly "OFFLINE" (imported), industry/country/employees empty. The deal pipeline is HubSpot's default (7 stages). Pipeline page stays on sample data until deals exist
  - Six tables in `sales` (defined in `scripts/hubspot/tables.mts`, created by `create-tables.mts`): `hubspot_contacts`, `hubspot_companies`, `hubspot_deals`, `hubspot_deal_stages`, `hubspot_owners` (full refresh each run) and `hubspot_deal_snapshots` (a daily photo of every deal, split by day, for "pipeline value vs. the past")
  - Table rules: ids are STRING, dates TIMESTAMP (UTC), money NUMERIC, empty = NULL (never 0); no contact names, emails, phones or job titles; every table has `synced_at`. Tables exist now, so changing a column means changing BigQuery, not just `tables.mts`
  - Script rules: run with `node --env-file=.env.local scripts/….mts`; dry run by default, `--apply` to write; print counts only (no names); shared helpers in `scripts/lib/` (`env.mts`, `bigquery.mts` with `replaceTable`) and `scripts/hubspot/api.mts` (`fetchAllPages`). `tsconfig.json` has `allowImportingTsExtensions` so scripts can import `.mts` files
  - `replaceTable` overwrites in one load job and sends our schema each time (keeps column descriptions)
  - Done: `sync-owners.mts` (9 owners: 7 current + 2 archived, no emails)
  - Next: sync deal stages, companies, contacts, deals, then deal snapshots; then run the syncs daily on GitHub Actions; then switch reps and Pipeline data to BigQuery
- Module 7 early step: YouTube access
  - `scripts/connect-youtube.mts` (one-time, run on this Mac): Google sign-in with a 127.0.0.1 redirect, PKCE and state check; scopes `youtube.readonly` + `yt-analytics.readonly` only; saves `YOUTUBE_REFRESH_TOKEN` to `.env.local` without printing it, then prints the channel name as a check
  - Uses `google-auth-library` (pinned 11.3.4, same copy BigQuery uses). Client is a "Desktop app" OAuth client (`YOUTUBE_CLIENT_ID`/`_SECRET` in `.env.local`)
  - The OAuth consent screen must be "Internal": an External app in Testing makes refresh tokens expire after 7 days
  - NOT DONE YET: first attempt (17 Nov 2026) timed out during the owner's 2-step verification. Client ID/secret format checked OK. Rerun with the owner and their 2FA device at hand
- Notes for module 5 (real LinkedIn data):
  - Check field names in `src/lib/linkedin/types.ts` against real API responses; LinkedIn sends cost as text and ids as URNs; industry/function names need separate lookups
  - LinkedIn only gives the CURRENT follower total, so the sync must record the total every day from day one, or "Followers over time" has no history
  - Audience numbers are approximate and leave out small groups; they won't add up to the totals
  - The funnel counts each step within the period, so it has no deal→won rate; add a matched rate ("of the deals created in this period, won so far") from per-deal HubSpot data
  - Post links switch from example.com to linkedin.com automatically when `linkedinDataSource` is "live"
- Module 4 (Website real data): GA4 + Search Console, after HubSpot
- Notes for real GA4 data (module 4; in `getWebsiteData`, without changing the page):
  - Keep the `WebsiteData` shape; lists must stay sorted (channels and landing pages most sessions first, landing pages limited to 10)
  - Made-up data ends on a fixed date (10 Nov 2026); real data needs real dates, sent as "YYYY-MM-DD" text
  - Form submissions are still typed totals, not part of the daily series
  - Made-up channels leave out GA4's "Unassigned"; decide whether to show it
  - Change `websiteDataSource` to "live" so the Sample data badge disappears
- Notes for Search Console (module 4, Website page):
  - Planned Search section on the Website page: tiles for impressions, clicks, CTR and average position; clicks and impressions over time; top queries and top pages tables. Sample data first, sync script once access is ready
  - Done: `src/lib/searchConsole/`: `types.ts` (raw `SearchAnalyticsApiRow` with packed `keys` in `SEARCH_DIMENSIONS` order; our `SearchRow` with `isBrand`, no stored ctr), `rows.ts` (`isBrandQuery`, `toSearchRow`, tested), `sample.ts` (`sampleSearchRows(firstDayMs, lastDayMs)`: 14 queries, 5 countries, 3 devices, ends 2 days before sample today, no 0-impression rows, example.com URLs). Rates: `clickThroughRate` for search CTR, `averagePosition(rows)` (weighted by impressions, tested)
  - Done: Search section on the Website page (`src/components/SearchSection.tsx`, own `<Suspense>`, own heading + Sample data badge via `searchConsoleDataSource`): 4 tiles (clicks, impressions, CTR, average position with `better: "down"`), search clicks over time, Top search terms (top 10, All/Brand/Non-brand toggle in `?terms=`, a "Brand" tag on brand rows), Opportunities (non-brand only, ≥ `OPPORTUNITY_RULES.minImpressionsPerDay` × days impressions, CTR below the non-brand average, sorted by `missedClicks`, top 5). Data: `getSearchData(range, terms)` in `src/lib/searchConsole/data.ts` (counts + position per group; the period ends 2 days before sample today and the section shows its own dates). Sample has a slow upward trend so periods differ
  - Next (when access is ready): decide service account vs bulk export, then the sync into BigQuery and `getSearchData` reading from it
  - Store clicks, impressions and each row's position (never ctr). CTR = clicks ÷ impressions and average position = (position × impressions, added up) ÷ impressions are calculated in `rates.ts` (positions can't be averaged directly; lower is better). In BigQuery, the brand flag column is `is_brand`
  - Google hides rare queries for privacy, so the top queries table adds up to less than the totals; say so on the page
  - Data is 2–3 days late, so the 30-hour staleness warning needs its own limit for this source
  - Access: add the `dashboard-sync` service account as a Restricted user on the Search Console property (no OAuth or refresh token), OR use Google's built-in daily bulk export to BigQuery. Decide when access is ready
- Still open:
  - Decisions needed: currency (sample data uses USD, set in `CURRENCY` in `format.ts`) and date style (US "Nov 9, 2026" or day-first "9 Nov 2026", set in `format.ts`)
  - Shared formats still missing for Pipeline: whole days (sales cycle), month and week labels
  - Website, Social and Pipeline data still have their own small rate helpers that return 0, not null. Pipeline's `winRate` would show "0%" when no deals have closed (HubSpot has 0 deals): switch it to `closedDealWinRate` from `rates.ts` first, then the others, with a before/after check of the numbers
  - Dark mode: not supported yet (the app stays light)
  - My practice changes: `/login` page without the sidebar, Form submissions as the first tile, "Last 14 days" option, "Deals by stage" `Card` on Pipeline
- Later (real data): Website (GA4 + Search Console) is module 4, LinkedIn is module 5, Social module 7 (Pipeline's HubSpot data is now Module 3)
