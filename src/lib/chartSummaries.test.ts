import { describe, expect, it } from 'vitest';
import { articleTrendSummary, categorySummary, trendSummary } from './chartSummaries';

const days = (views: number[]) =>
  views.map((v, i) => ({ date: `2026-11-0${i + 1}`, views: v }));

describe('trendSummary', () => {
  it('describes total, daily average, highest and lowest days', () => {
    const text = trendSummary(days([100, 300, 200, 400]));
    expect(text).toContain('1,000 views from 1 Nov to 4 Nov 2026');
    expect(text).toContain('an average of 250 a day');
    expect(text).toContain('Highest: 400 on 4 Nov');
    expect(text).toContain('Lowest: 100 on 1 Nov');
  });

  it('describes the direction of change between the two halves', () => {
    expect(trendSummary(days([100, 100, 150, 150]))).toContain('50% higher than in the first half');
    expect(trendSummary(days([200, 200, 100, 100]))).toContain('50% lower than in the first half');
    expect(trendSummary(days([100, 100, 100, 100]))).toContain('flat');
  });

  it('handles empty and all-zero data', () => {
    expect(trendSummary([])).toBe('No views were recorded in this period.');
    expect(trendSummary(days([0, 0]))).toBe('No views were recorded in this period.');
  });
});

describe('categorySummary', () => {
  it('lists categories in chart order and compares highest with lowest', () => {
    const text = categorySummary([
      { category: 'Culture', views: 9000, avgViews: 3000, articles: 3 },
      { category: 'Business', views: 2000, avgViews: 1000, articles: 2 },
    ]);
    expect(text).toBe(
      'Average views per article, highest to lowest: Culture 3,000, Business 1,000. ' +
        'Culture averages 3.0 times as many views per article as Business.',
    );
  });

  it('handles a single category and no categories', () => {
    expect(categorySummary([{ category: 'Sport', views: 10, avgViews: 10, articles: 1 }])).toBe(
      'Average views per article, highest to lowest: Sport 10.',
    );
    expect(categorySummary([])).toBe('No category had views in this period.');
  });
});

describe('articleTrendSummary', () => {
  it('counts the days the article beat its category average', () => {
    const data = [
      { date: '2026-11-01', views: 50, categoryAvg: 40 },
      { date: '2026-11-02', views: 30, categoryAvg: 40 },
      { date: '2026-11-03', views: 80, categoryAvg: 40 },
    ];
    const text = articleTrendSummary(data, 'Science');
    expect(text).toContain('160 views from 1 Nov to 3 Nov 2026');
    expect(text).toContain('peaking at 80 on 3 Nov');
    expect(text).toContain('beat the Science average per article on 2 of 3 days');
  });

  it('handles an article without views', () => {
    expect(articleTrendSummary([], 'Science')).toBe('This article had no views in this period.');
  });
});
