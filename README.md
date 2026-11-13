# Content Analytics Dashboard

A responsive content analytics dashboard built with React, TypeScript and Recharts.

**Live demo:** https://lucyhao.github.io/content-analytics-dashboard/

> **All data is sample data.** Articles, authors and figures are generated in
> `src/data/sampleData.ts` with a fixed seed. Nothing comes from a real publication
> or news organisation.

## Features

- **Overview** – articles with views, total views, engagements and engagement rate, with change vs the previous period
- **Charts** – daily views trend (hover crosshair) and average views per article by category
- **Performance tiers** – Top 20% / Middle 60% / Bottom 20% (see below)
- **Articles table** – search, sort by any column, filter by tier, pagination
- **Content preview** – title, thumbnail, summary and stats (side panel on desktop, bottom sheet on mobile)
- **Article analysis page** (`#/article/<id>`) – article information, performance metrics vs previous period,
  daily views vs category average, engagement breakdown (likes / comments / shares) and comparison with the
  category average
- **Filters** – last 7 / 30 / 90 days and category
- **Responsive** – desktop, tablet and phone layouts; follows system dark mode

## Accessibility

- **Preview dialog** – `role="dialog"` labelled by the article title. On wide screens it is a
  non-modal side panel; on small screens it is a modal bottom sheet (`aria-modal`, focus trap,
  page scroll locked). Focus moves to the dialog title on open and returns to the button that
  opened it on close (Escape, close button or backdrop).
- **Charts** – each chart is a `<figure>` with a plain-language summary as its caption
  (`src/lib/chartSummaries.ts`) and a "Show data table" disclosure with the exact values.
  The SVG itself is hidden from assistive tech.
- **Table** – each row has one control (the title button, with `aria-haspopup="dialog"` /
  `aria-expanded`); clicking elsewhere on the row goes through that same button. Sortable headers
  use `aria-sort`, the result count is a live region, and pagination is a labelled `nav`.
- **Other** – `main` landmark, visible `:focus-visible` rings, text contrast ≥ 4.5:1 in light and
  dark mode, and smooth scrolling is disabled under `prefers-reduced-motion`.

Checked with axe-core (no violations on the dashboard, with the preview open, and on the article
page, in light and dark mode) plus scripted keyboard tests in Chrome.

## How performance tiers are calculated

Performance tiers are calculated by ranking articles based on total views within the selected
reporting period (last 7, 30 or 90 days):

| Tier | Rule |
|------|------|
| Top | Top 20% of ranked articles |
| Middle | The next 60% |
| Bottom | Bottom 20% of ranked articles |

- Only articles with at least one view in the period are ranked.
- Top and Bottom sizes are rounded up (`Math.ceil`), so each contains at least one article.
- On the dashboard, an active category filter ranks articles within that category only.
  The article analysis page always ranks across all categories.
- Tiers are relative, so an article's tier can change when the period or filter changes.

The logic lives in `articleMetrics()` in `src/lib/analytics.ts`.

## Getting started

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # type-check + production build
npm test         # run unit tests once (Vitest)
npm run test:watch
```

## Deployment

Every push to `main` runs `.github/workflows/deploy.yml`: lint → tests → build → publish `dist/`
to GitHub Pages. The Vite `base` is `/content-analytics-dashboard/` for builds and `vite preview`,
and routes use the URL hash (`#/article/<id>`), so deep links work on static hosting.

## Tests

`src/lib/analytics.test.ts` covers the analytics logic with small hand-built fixtures
(known daily views and engagement rates), so every expected value can be checked by hand:

| Area | What is verified |
|------|------------------|
| `totals` | total views, engagements, pooled engagement rate, zero-view articles excluded |
| `articleMetrics` | ranking by views, Top 20% / Middle 60% / Bottom 20%, rounding at 1, 3, 7, 60 articles |
| `dailyTrend` | per-day sums, zeros before publication, trend adds up to the period total |
| `viewsByCategory` | per-category totals, rounded averages, sort order (ties A→Z by name) |
| Empty data | no articles, or articles with no views, return zeros / empty lists (no `NaN`) |
| Date ranges | 7 / 30 / 90 days cover the right dates; previous-period windows |
| `articleDetail` | category average, in-category rank, trend start, previous period |
| Chart summaries | `chartSummaries.test.ts`: totals, highs/lows, trend direction, empty data |

## Project structure

```
src/
  data/sampleData.ts      generated sample articles + daily views
  lib/analytics.ts        metrics, tiers, trend and formatting helpers
  lib/router.ts           hash routes: dashboard and article pages
  lib/analytics.test.ts   unit tests for the analytics logic
  lib/theme.ts            chart colours for light / dark mode
  components/             Overview, Charts, Performance, ArticleTable, ContentPreview, ArticleDetail, Thumbnail
  App.tsx                 layout and filter state
```
