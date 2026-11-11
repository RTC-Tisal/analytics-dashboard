@AGENTS.md

## About this project
Internal sales and marketing dashboard for Rootcode.
Build order: Website (GA4), then Prospecting (Sales Navigator via HubSpot), then Pipeline (HubSpot), then Social.
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
- Next: Module 3, swap real GA4 data into `getWebsiteData` without changing the page
- Notes for module 3:
  - Keep the `WebsiteData` shape; lists must stay sorted (channels and landing pages most sessions first, landing pages limited to 10)
  - Made-up data ends on a fixed date (10 Nov 2026); real data needs real dates, sent as "YYYY-MM-DD" text
  - Form submissions are still typed totals, not part of the daily series
  - Made-up channels leave out GA4's "Unassigned"; decide whether to show it
- Still open:
  - Dark mode: the sidebar title is nearly invisible and the page background turns black
  - Sidebar is cramped on phones (move it to the top on small screens)
  - My practice changes: `/login` page without the sidebar, Form submissions as the first tile, "Last 14 days" option, "Deals by stage" `Card` on Pipeline
- Later: Prospecting is module 5, Pipeline module 6, Social module 7
