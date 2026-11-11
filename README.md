# Content Analytics Dashboard

A responsive content analytics dashboard built with React, TypeScript and Recharts.

> **All data is sample data.** Articles, authors and figures are generated in
> `src/data/sampleData.ts` with a fixed seed. Nothing comes from a real publication
> or news organisation.

## Features

- **Overview** – articles with views, total views, engagements and engagement rate, with change vs the previous period
- **Charts** – daily views trend (hover crosshair) and average views per article by category
- **Performance tiers** – Top 20% / Middle 60% / Bottom 20% by views in the selected period
- **Articles table** – search, sort by any column, filter by tier, pagination
- **Content preview** – title, thumbnail, summary and stats (side panel on desktop, bottom sheet on mobile)
- **Filters** – last 7 / 30 / 90 days and category
- **Responsive** – desktop, tablet and phone layouts; follows system dark mode

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
  lib/theme.ts            chart colours for light / dark mode
  components/             Overview, Charts, Performance, ArticleTable, ContentPreview, Thumbnail
  App.tsx                 layout and filter state
```
