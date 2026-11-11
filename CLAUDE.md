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
- Current module: 1, layout on made-up data (built; lint, type check and build pass)
  - Sidebar and four pages inside the `(dashboard)` route group; `/` redirects to `/website`
  - Website KPI tiles (`KpiTile`) fed by `getWebsiteData(range)` in `src/lib/website/`
  - Date filter stored in the URL as `?range=` (7d / 28d / 90d, default 28d)
  - Placeholder cards for module 2; "Coming in module N" notes on the other pages
- Still open in module 1:
  - Sidebar is cramped on phones (move it to the top on small screens)
  - My practice changes: `/login` page without the sidebar, Form submissions as the first tile, "Last 14 days" option, "Deals by stage" card on Pipeline
- Next: Module 2, Website cards: Sessions over time, Traffic by channel, Top landing pages
- Later: Module 3 swaps real GA4 data into `getWebsiteData`; Prospecting is module 5, Pipeline module 6, Social module 7
