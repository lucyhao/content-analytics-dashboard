import { fmtDate, fmtNumber, type CategoryPoint, type TrendPoint } from './analytics';

// Plain-language summaries of each chart, so the same insight is available
// to screen-reader users (and anyone who prefers text) without the visual.

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

/** Compares the average of the second half of a series with the first half. */
function halfOverHalf(values: number[]): string {
  if (values.length < 2) return '';
  const mid = Math.floor(values.length / 2);
  const first = sum(values.slice(0, mid)) / mid;
  const second = sum(values.slice(values.length - mid)) / mid;
  if (!first) return '';
  const change = ((second - first) / first) * 100;
  if (Math.abs(change) < 1) return ' Daily views were flat between the first and second half of the period.';
  return ` Daily views in the second half of the period were ${Math.abs(change).toFixed(0)}% ${
    change > 0 ? 'higher' : 'lower'
  } than in the first half.`;
}

function extremes<T extends { date: string }>(points: T[], value: (p: T) => number) {
  let low = points[0];
  let high = points[0];
  for (const p of points) {
    if (value(p) < value(low)) low = p;
    if (value(p) > value(high)) high = p;
  }
  return { low, high };
}

export function trendSummary(data: TrendPoint[]): string {
  const total = sum(data.map((p) => p.views));
  if (!data.length || !total) return 'No views were recorded in this period.';
  const { low, high } = extremes(data, (p) => p.views);
  return (
    `${fmtNumber(total)} views from ${fmtDate(data[0].date)} to ${fmtDate(data.at(-1)!.date, true)}, ` +
    `an average of ${fmtNumber(Math.round(total / data.length))} a day. ` +
    `Highest: ${fmtNumber(high.views)} on ${fmtDate(high.date)}. ` +
    `Lowest: ${fmtNumber(low.views)} on ${fmtDate(low.date)}.` +
    halfOverHalf(data.map((p) => p.views))
  );
}

export function categorySummary(data: CategoryPoint[]): string {
  if (!data.length) return 'No category had views in this period.';
  const list = data.map((d) => `${d.category} ${fmtNumber(d.avgViews)}`).join(', ');
  const top = data[0];
  const bottom = data.at(-1)!;
  const ratio = bottom.avgViews ? top.avgViews / bottom.avgViews : 0;
  const gap =
    data.length > 1 && ratio
      ? ` ${top.category} averages ${ratio.toFixed(1)} times as many views per article as ${bottom.category}.`
      : '';
  return `Average views per article, highest to lowest: ${list}.${gap}`;
}

export function articleTrendSummary(
  data: { date: string; views: number; categoryAvg: number }[],
  category: string,
): string {
  const total = sum(data.map((p) => p.views));
  if (!data.length || !total) return 'This article had no views in this period.';
  const { high } = extremes(data, (p) => p.views);
  const above = data.filter((p) => p.views > p.categoryAvg).length;
  return (
    `${fmtNumber(total)} views from ${fmtDate(data[0].date)} to ${fmtDate(data.at(-1)!.date, true)}, ` +
    `peaking at ${fmtNumber(high.views)} on ${fmtDate(high.date)}. ` +
    `It beat the ${category} average per article on ${above} of ${data.length} days.` +
    halfOverHalf(data.map((p) => p.views))
  );
}
