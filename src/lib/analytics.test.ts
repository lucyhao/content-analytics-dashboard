import { describe, expect, it } from 'vitest';
import {
  HISTORY_DAYS,
  SAMPLE_ARTICLES,
  SAMPLE_DATES,
  type Article,
  type Category,
} from '../data/sampleData';
import {
  RANGES,
  articleDetail,
  articleMetrics,
  dailyTrend,
  hasPreviousPeriod,
  totals,
  viewsByCategory,
  type RangeDays,
} from './analytics';

// Hand-built fixtures with known numbers, so every expectation can be checked by hand.
// Index 0 of dailyViews is the oldest day; index HISTORY_DAYS - 1 is "today".

interface FixtureOptions {
  id?: string;
  category?: Category;
  /** Views on each day, or a function of the day index. */
  views: number | ((day: number) => number);
  /** Only the last N days have views (earlier days are 0). Defaults to every day. */
  lastDays?: number;
  likeRate?: number;
  commentRate?: number;
  shareRate?: number;
}

let nextId = 0;

function makeArticle({
  id = `test-${++nextId}`,
  category = 'Technology',
  views,
  lastDays = HISTORY_DAYS,
  likeRate = 0.1,
  commentRate = 0.05,
  shareRate = 0.05,
}: FixtureOptions): Article {
  const firstDay = HISTORY_DAYS - lastDays;
  const dailyViews = Array.from({ length: HISTORY_DAYS }, (_, day) =>
    day < firstDay ? 0 : typeof views === 'number' ? views : views(day),
  );
  return {
    id,
    title: `Fixture ${id}`,
    summary: 'Fixture summary',
    category,
    author: 'Test Author',
    publishedAt: SAMPLE_DATES[firstDay],
    readMinutes: 5,
    dailyViews,
    likeRate,
    commentRate,
    shareRate,
  };
}

const LAST_DAY = SAMPLE_DATES[HISTORY_DAYS - 1];

describe('date ranges', () => {
  it('offers exactly 7, 30 and 90 days', () => {
    expect(RANGES.map((r) => r.days)).toEqual([7, 30, 90]);
  });

  it.each([7, 30, 90] as RangeDays[])('a %i-day range covers the last %i days', (range) => {
    const trend = dailyTrend([], range);
    expect(trend).toHaveLength(range);
    expect(trend[0].date).toBe(SAMPLE_DATES[HISTORY_DAYS - range]);
    expect(trend.at(-1)!.date).toBe(LAST_DAY);
  });

  it.each([7, 30, 90] as RangeDays[])('a %i-day range sums exactly %i days of views', (range) => {
    const article = makeArticle({ views: 1 });
    expect(totals([article], range).views).toBe(range);
  });

  it('dates in a range are consecutive calendar days', () => {
    const dates = dailyTrend([], 90).map((p) => p.date);
    for (let i = 1; i < dates.length; i++) {
      const gap = Date.parse(dates[i]) - Date.parse(dates[i - 1]);
      expect(gap).toBe(24 * 60 * 60 * 1000);
    }
  });

  it('the previous period is the same length, immediately before the current one', () => {
    // 1 view/day for the oldest 60 days, 10 views/day for the newest 30.
    const article = makeArticle({ views: (day) => (day >= HISTORY_DAYS - 30 ? 10 : 1) });
    expect(totals([article], 30).views).toBe(300);
    expect(totals([article], 30, true).views).toBe(30);
    expect(totals([article], 7).views).toBe(70);
    expect(totals([article], 7, true).views).toBe(70);
  });

  it('only 7 and 30 days have a previous period inside the 90-day history', () => {
    expect(hasPreviousPeriod(7)).toBe(true);
    expect(hasPreviousPeriod(30)).toBe(true);
    expect(hasPreviousPeriod(90)).toBe(false);
    expect(totals([makeArticle({ views: 5 })], 90, true)).toEqual({
      articles: 0,
      views: 0,
      engagements: 0,
      engagementRate: 0,
    });
  });
});

describe('totals', () => {
  it('sums views and engagements across articles', () => {
    const a = makeArticle({ views: 100 }); // 700 views → 70 + 35 + 35 = 140
    const b = makeArticle({ views: 50, likeRate: 0.02, commentRate: 0.01, shareRate: 0.01 });
    // b: 350 views → likes 7, comments round(3.5) = 4, shares 4 → 15
    const result = totals([a, b], 7);
    expect(result.articles).toBe(2);
    expect(result.views).toBe(1050);
    expect(result.engagements).toBe(155);
  });

  it('engagement rate is total engagements ÷ total views, not the mean of article rates', () => {
    const big = makeArticle({ views: 1000, likeRate: 0.1, commentRate: 0, shareRate: 0 }); // 10%
    const small = makeArticle({ views: 10, likeRate: 0.5, commentRate: 0, shareRate: 0 }); // 50%
    const result = totals([big, small], 7);
    // (700 + 35) / (7000 + 70) = 0.10396..., whereas the mean of rates would be 0.30.
    expect(result.engagementRate).toBeCloseTo(735 / 7070, 10);
  });

  it('does not count articles with no views in the period', () => {
    const live = makeArticle({ views: 10 });
    const old = makeArticle({ views: 10, lastDays: 0 });
    expect(totals([live, old], 7).articles).toBe(1);
  });

  it('counts an article published inside the period only for its live days', () => {
    const fresh = makeArticle({ views: 100, lastDays: 3 });
    expect(totals([fresh], 7).views).toBe(300);
    expect(totals([fresh], 30).views).toBe(300);
    expect(totals([fresh], 7, true).articles).toBe(0);
  });
});

describe('articleMetrics', () => {
  it('ranks articles by views, highest first', () => {
    const articles = [3, 9, 1, 7, 5].map((v) => makeArticle({ id: `v${v}`, views: v }));
    const ids = articleMetrics(articles, 7).map((r) => r.article.id);
    expect(ids).toEqual(['v9', 'v7', 'v5', 'v3', 'v1']);
  });

  it('assigns Top 20% / Middle 60% / Bottom 20%', () => {
    const articles = Array.from({ length: 10 }, (_, i) => makeArticle({ views: i + 1 }));
    const tiers = articleMetrics(articles, 7).map((r) => r.tier);
    expect(tiers).toEqual([
      'Top', 'Top',
      'Middle', 'Middle', 'Middle', 'Middle', 'Middle', 'Middle',
      'Bottom', 'Bottom',
    ]);
  });

  it.each([
    [1, 1, 0, 0],
    [3, 1, 1, 1],
    [7, 2, 3, 2],
    [60, 12, 36, 12],
  ])('with %i articles: %i Top, %i Middle, %i Bottom (sizes rounded up)', (n, top, middle, bottom) => {
    const articles = Array.from({ length: n }, (_, i) => makeArticle({ views: i + 1 }));
    const rows = articleMetrics(articles, 7);
    expect(rows.filter((r) => r.tier === 'Top')).toHaveLength(top);
    expect(rows.filter((r) => r.tier === 'Middle')).toHaveLength(middle);
    expect(rows.filter((r) => r.tier === 'Bottom')).toHaveLength(bottom);
  });

  it('computes per-article views, engagement counts and rate', () => {
    const [row] = articleMetrics([makeArticle({ views: 100 })], 30);
    expect(row).toMatchObject({
      views: 3000,
      likes: 300,
      comments: 150,
      shares: 150,
      engagements: 600,
      engagementRate: 0.2,
    });
  });

  it('excludes articles without views in the period from ranking', () => {
    const rows = articleMetrics(
      [makeArticle({ views: 5 }), makeArticle({ views: 5, lastDays: 0 })],
      7,
    );
    expect(rows).toHaveLength(1);
  });

  it('tiers depend on the selected period', () => {
    // Steady: 10/day all along. Spike: 0 until the last 7 days, then 50/day.
    const steady = makeArticle({ id: 'steady', views: 10 });
    const spike = makeArticle({ id: 'spike', views: 50, lastDays: 7 });
    const filler = Array.from({ length: 8 }, () => makeArticle({ views: 4 }));
    const tierOf = (range: RangeDays, id: string) =>
      articleMetrics([steady, spike, ...filler], range).find((r) => r.article.id === id)!.tier;

    expect(tierOf(7, 'spike')).toBe('Top'); // 350 vs steady 70
    expect(tierOf(90, 'steady')).toBe('Top'); // 900 vs spike 350
    expect(articleMetrics([steady, spike, ...filler], 90)[0].article.id).toBe('steady');
  });
});

describe('dailyTrend', () => {
  it('sums views across articles for each day', () => {
    const a = makeArticle({ views: (day) => day }); // views = day index
    const b = makeArticle({ views: 100 });
    const trend = dailyTrend([a, b], 7);
    expect(trend.map((p) => p.views)).toEqual(
      [83, 84, 85, 86, 87, 88, 89].map((day) => day + 100),
    );
  });

  it('reports 0 for days before an article was published', () => {
    const fresh = makeArticle({ views: 40, lastDays: 2 });
    expect(dailyTrend([fresh], 7).map((p) => p.views)).toEqual([0, 0, 0, 0, 0, 40, 40]);
  });

  it('the trend adds up to the period total', () => {
    const articles = [makeArticle({ views: 12 }), makeArticle({ views: 30, lastDays: 20 })];
    for (const range of [7, 30, 90] as RangeDays[]) {
      const trendSum = dailyTrend(articles, range).reduce((s, p) => s + p.views, 0);
      expect(trendSum).toBe(totals(articles, range).views);
    }
  });
});

describe('viewsByCategory', () => {
  it('groups views by category with totals, averages and article counts', () => {
    const articles = [
      makeArticle({ category: 'Technology', views: 100 }), // 700
      makeArticle({ category: 'Technology', views: 300 }), // 2100
      makeArticle({ category: 'Sport', views: 250 }), // 1750
    ];
    expect(viewsByCategory(articles, 7)).toEqual([
      { category: 'Sport', views: 1750, avgViews: 1750, articles: 1 },
      { category: 'Technology', views: 2800, avgViews: 1400, articles: 2 },
    ]);
  });

  it('sorts categories by average views per article, highest first', () => {
    const articles = [
      makeArticle({ category: 'Culture', views: 10 }),
      makeArticle({ category: 'Science', views: 30 }),
      makeArticle({ category: 'Business', views: 20 }),
    ];
    expect(viewsByCategory(articles, 7).map((c) => c.category)).toEqual([
      'Science',
      'Business',
      'Culture',
    ]);
  });

  it('breaks ties on average views by category name, A→Z, regardless of input order', () => {
    const tied = [
      makeArticle({ category: 'Technology', views: 10 }),
      makeArticle({ category: 'Sport', views: 10 }),
      makeArticle({ category: 'Business', views: 10 }),
      makeArticle({ category: 'Culture', views: 99 }),
    ];
    const expected = ['Culture', 'Business', 'Sport', 'Technology'];
    expect(viewsByCategory(tied, 7).map((c) => c.category)).toEqual(expected);
    expect(viewsByCategory([...tied].reverse(), 7).map((c) => c.category)).toEqual(expected);
  });

  it('rounds the average to a whole number', () => {
    const articles = [
      makeArticle({ category: 'Lifestyle', views: 1 }), // 7
      makeArticle({ category: 'Lifestyle', views: 1 }), // 7
      makeArticle({ category: 'Lifestyle', views: 2 }), // 14 → 28 / 3 = 9.33
    ];
    expect(viewsByCategory(articles, 7)[0].avgViews).toBe(9);
  });

  it('leaves out categories with no views in the period', () => {
    const articles = [
      makeArticle({ category: 'Technology', views: 5 }),
      makeArticle({ category: 'Sport', views: 5, lastDays: 0 }),
    ];
    expect(viewsByCategory(articles, 7).map((c) => c.category)).toEqual(['Technology']);
  });
});

describe('empty data', () => {
  it.each([7, 30, 90] as RangeDays[])('handles no articles for %i days', (range) => {
    expect(totals([], range)).toEqual({ articles: 0, views: 0, engagements: 0, engagementRate: 0 });
    expect(articleMetrics([], range)).toEqual([]);
    expect(viewsByCategory([], range)).toEqual([]);
    expect(dailyTrend([], range).every((p) => p.views === 0)).toBe(true);
    expect(articleDetail('missing', [], range)).toBeNull();
  });

  it('handles articles that have no views at all', () => {
    const silent = [makeArticle({ views: 0 }), makeArticle({ views: 0 })];
    const result = totals(silent, 30);
    expect(result).toEqual({ articles: 0, views: 0, engagements: 0, engagementRate: 0 });
    expect(Number.isNaN(result.engagementRate)).toBe(false);
    expect(articleMetrics(silent, 30)).toEqual([]);
    expect(articleDetail(silent[0].id, silent, 30)).toBeNull();
  });
});

describe('articleDetail', () => {
  it('compares an article with the mean of its category', () => {
    const target = makeArticle({ id: 'target', category: 'Science', views: 30 }); // 210
    const peer = makeArticle({ category: 'Science', views: 10 }); // 70
    const other = makeArticle({ category: 'Sport', views: 1000 });
    const detail = articleDetail('target', [target, peer, other], 7)!;

    expect(detail.self.views).toBe(210);
    expect(detail.categoryAvg.views).toBe(140);
    expect(detail.categoryRank).toBe(1);
    expect(detail.categorySize).toBe(2);
    // Tier is ranked across all categories: Sport is #1, so target is not Top.
    expect(detail.self.tier).toBe('Middle');
  });

  it('starts the daily trend on the publication day', () => {
    const fresh = makeArticle({ id: 'fresh', views: 10, lastDays: 4 });
    const detail = articleDetail('fresh', [fresh], 30)!;
    expect(detail.trend).toHaveLength(4);
    expect(detail.trend[0].date).toBe(fresh.publishedAt);
  });

  it('has no previous period for the 90-day range', () => {
    const a = makeArticle({ id: 'a', views: 1 });
    expect(articleDetail('a', [a], 90)!.previous).toBeNull();
    expect(articleDetail('a', [a], 30)!.previous?.views).toBe(30);
  });
});

describe('sample data', () => {
  it('is deterministic and covers the full history', () => {
    expect(SAMPLE_ARTICLES).toHaveLength(60);
    expect(SAMPLE_DATES).toHaveLength(HISTORY_DAYS);
    expect(SAMPLE_ARTICLES.every((a) => a.dailyViews.length === HISTORY_DAYS)).toBe(true);
    expect(SAMPLE_ARTICLES.every((a) => a.id.startsWith('sample-'))).toBe(true);
  });
});
