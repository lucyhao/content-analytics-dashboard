import { HISTORY_DAYS, SAMPLE_DATES, type Article, type Category } from '../data/sampleData';

export type RangeDays = 7 | 30 | 90;
export type Tier = 'Top' | 'Middle' | 'Bottom';

export const RANGES: { days: RangeDays; label: string }[] = [
  { days: 7, label: 'Last 7 days' },
  { days: 30, label: 'Last 30 days' },
  { days: 90, label: 'Last 90 days' },
];

export interface ArticleMetrics {
  article: Article;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  engagements: number;
  engagementRate: number;
  tier: Tier;
}

export interface Totals {
  articles: number;
  views: number;
  engagements: number;
  engagementRate: number;
}

const sum = (list: number[]) => list.reduce((a, b) => a + b, 0);

/** Index range [start, end) into SAMPLE_DATES for the current or the previous period. */
function window(range: RangeDays, previous = false): [number, number] {
  const end = previous ? HISTORY_DAYS - range : HISTORY_DAYS;
  return [Math.max(0, end - range), end];
}

function measure(article: Article, [start, end]: [number, number]) {
  const views = sum(article.dailyViews.slice(start, end));
  const likes = Math.round(views * article.likeRate);
  const comments = Math.round(views * article.commentRate);
  const shares = Math.round(views * article.shareRate);
  const engagements = likes + comments + shares;
  return { views, likes, comments, shares, engagements, engagementRate: views ? engagements / views : 0 };
}

/**
 * Metrics for every article that received views in the period, ranked by views.
 * Tiers: top 20% = Top, bottom 20% = Bottom, the rest = Middle.
 */
export function articleMetrics(articles: Article[], range: RangeDays): ArticleMetrics[] {
  const span = window(range);
  const rows = articles
    .map((article) => ({ article, ...measure(article, span) }))
    .filter((row) => row.views > 0)
    .sort((a, b) => b.views - a.views);

  const topCut = Math.ceil(rows.length * 0.2);
  const bottomCut = rows.length - Math.ceil(rows.length * 0.2);
  return rows.map((row, i) => ({
    ...row,
    tier: i < topCut ? 'Top' : i >= bottomCut ? 'Bottom' : 'Middle',
  }));
}

export function totals(articles: Article[], range: RangeDays, previous = false): Totals {
  const span = window(range, previous);
  const measured = articles.map((a) => measure(a, span)).filter((m) => m.views > 0);
  const views = sum(measured.map((m) => m.views));
  const engagements = sum(measured.map((m) => m.engagements));
  return {
    articles: measured.length,
    views,
    engagements,
    engagementRate: views ? engagements / views : 0,
  };
}

/** Whether a previous period of equal length exists in the sample history. */
export const hasPreviousPeriod = (range: RangeDays) => range * 2 <= HISTORY_DAYS;

export interface TrendPoint {
  date: string;
  views: number;
}

export function dailyTrend(articles: Article[], range: RangeDays): TrendPoint[] {
  const [start, end] = window(range);
  return SAMPLE_DATES.slice(start, end).map((date, i) => ({
    date,
    views: sum(articles.map((a) => a.dailyViews[start + i])),
  }));
}

export interface CategoryPoint {
  category: Category;
  views: number;
  avgViews: number;
  articles: number;
}

export function viewsByCategory(articles: Article[], range: RangeDays): CategoryPoint[] {
  const groups = new Map<Category, number[]>();
  for (const row of articleMetrics(articles, range)) {
    const list = groups.get(row.article.category) ?? [];
    list.push(row.views);
    groups.set(row.article.category, list);
  }
  return [...groups.entries()]
    .map(([category, views]) => ({
      category,
      views: sum(views),
      avgViews: Math.round(sum(views) / views.length),
      articles: views.length,
    }))
    .sort((a, b) => b.avgViews - a.avgViews);
}

export interface PeerAverages {
  views: number;
  engagements: number;
  engagementRate: number;
  likes: number;
  comments: number;
  shares: number;
}

export interface ArticleDetail {
  self: ArticleMetrics;
  /** Mean per article across the same category (including this one). */
  categoryAvg: PeerAverages;
  categoryRank: number;
  categorySize: number;
  previous: Totals | null;
  trend: { date: string; views: number; categoryAvg: number }[];
}

const mean = (list: number[]) => (list.length ? sum(list) / list.length : 0);

/**
 * Full analysis of one article for the period. Tier is ranked across all articles,
 * comparisons are against articles in the same category.
 */
export function articleDetail(id: string, all: Article[], range: RangeDays): ArticleDetail | null {
  const self = articleMetrics(all, range).find((r) => r.article.id === id);
  if (!self) return null;

  const category = self.article.category;
  const peers = articleMetrics(
    all.filter((a) => a.category === category),
    range,
  );
  const categoryAvg: PeerAverages = {
    views: mean(peers.map((p) => p.views)),
    engagements: mean(peers.map((p) => p.engagements)),
    engagementRate: mean(peers.map((p) => p.engagementRate)),
    likes: mean(peers.map((p) => p.likes)),
    comments: mean(peers.map((p) => p.comments)),
    shares: mean(peers.map((p) => p.shares)),
  };

  const [start, end] = window(range);
  const peerArticles = peers.map((p) => p.article);
  const firstDay = Math.max(start, SAMPLE_DATES.indexOf(self.article.publishedAt));
  const trend = SAMPLE_DATES.slice(firstDay, end).map((date, i) => {
    const day = firstDay + i;
    // Average only over category articles that were live that day.
    const live = peerArticles.map((a) => a.dailyViews[day]).filter((v) => v > 0);
    return { date, views: self.article.dailyViews[day], categoryAvg: Math.round(mean(live)) };
  });

  return {
    self,
    categoryAvg,
    categoryRank: peers.findIndex((p) => p.article.id === id) + 1,
    categorySize: peers.length,
    previous: hasPreviousPeriod(range) ? totals([self.article], range, true) : null,
    trend,
  };
}

const compact = new Intl.NumberFormat('en-GB', { notation: 'compact', maximumFractionDigits: 1 });
const full = new Intl.NumberFormat('en-GB');

export const fmtCompact = (n: number) => compact.format(n);
export const fmtNumber = (n: number) => full.format(n);
export const fmtPercent = (n: number, digits = 1) => `${(n * 100).toFixed(digits)}%`;
export const fmtDate = (iso: string, withYear = false) =>
  new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  });
