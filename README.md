# Content Analytics Dashboard

A responsive content analytics dashboard built with React, TypeScript and Recharts.

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
```

## Project structure

```
src/
  data/sampleData.ts      generated sample articles + daily views
  lib/analytics.ts        metrics, tiers, trend and formatting helpers
  lib/router.ts           hash routes: dashboard and article pages
  lib/theme.ts            chart colours for light / dark mode
  components/             Overview, Charts, Performance, ArticleTable, ContentPreview, ArticleDetail, Thumbnail
  App.tsx                 layout and filter state
```
