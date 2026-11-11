import { useCallback, useMemo, useState } from 'react';
import { ArticleDetail } from './components/ArticleDetail';
import { ArticleTable } from './components/ArticleTable';
import { CategoryChart, TrendChart } from './components/Charts';
import { ContentPreview } from './components/ContentPreview';
import { Overview } from './components/Overview';
import { Performance } from './components/Performance';
import { CATEGORIES, SAMPLE_ARTICLES, SAMPLE_DATES, type Category } from './data/sampleData';
import {
  RANGES,
  articleMetrics,
  dailyTrend,
  fmtDate,
  hasPreviousPeriod,
  totals,
  viewsByCategory,
  type RangeDays,
  type Tier,
} from './lib/analytics';
import { useRoute } from './lib/router';

const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

export default function App() {
  const route = useRoute();
  const [range, setRange] = useState<RangeDays>(30);
  const [category, setCategory] = useState<Category | 'All'>('All');
  const [tierFilter, setTierFilter] = useState<Tier | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const articles = useMemo(
    () => (category === 'All' ? SAMPLE_ARTICLES : SAMPLE_ARTICLES.filter((a) => a.category === category)),
    [category],
  );
  const rows = useMemo(() => articleMetrics(articles, range), [articles, range]);
  const current = useMemo(() => totals(articles, range), [articles, range]);
  const previous = useMemo(
    () => (hasPreviousPeriod(range) ? totals(articles, range, true) : null),
    [articles, range],
  );
  const trend = useMemo(() => dailyTrend(articles, range), [articles, range]);
  const byCategory = useMemo(() => viewsByCategory(SAMPLE_ARTICLES, range), [range]);
  const selectedRow = rows.find((r) => r.article.id === selectedId) ?? null;

  const rangeLabel = RANGES.find((r) => r.days === range)!.label;
  const periodText = `${fmtDate(SAMPLE_DATES[SAMPLE_DATES.length - range])} – ${fmtDate(
    SAMPLE_DATES[SAMPLE_DATES.length - 1],
    true,
  )}`;

  const scrollToArticles = () => {
    if (!isMobile()) document.getElementById('articles')?.scrollIntoView({ behavior: 'smooth' });
  };
  const closePreview = useCallback(() => setSelectedId(null), []);

  if (route.page === 'article') {
    return (
      <div className="app">
        <ArticleDetail id={route.id} range={range} onRangeChange={setRange} />
        <footer className="footer">
          Content Analytics Dashboard · Demo project · All data is sample data
        </footer>
      </div>
    );
  }

  return (
    <div className="app">
      <header className="header">
        <div>
          <h1>Content Analytics Dashboard</h1>
          <p className="header__sub">
            {rangeLabel} · {periodText}
          </p>
        </div>
        <span className="sample-pill" title="All figures are generated sample data">
          Sample data
        </span>
      </header>

      <div className="notice" role="note">
        <strong>Sample data only.</strong> Every article, author and figure on this page is generated
        for demonstration. None of it comes from a real publication or news organisation.
      </div>

      <div className="filters" role="group" aria-label="Dashboard filters">
        <div className="segmented" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={range === r.days}
              onClick={() => setRange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <label className="select">
          <span>Category</span>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value as Category | 'All');
              setSelectedId(null);
            }}
          >
            <option value="All">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </label>
      </div>

      <Overview current={current} previous={previous} rangeLabel={rangeLabel} />

      <div className="grid-2">
        <TrendChart data={trend} />
        <CategoryChart data={byCategory} selected={category} />
      </div>

      <Performance
        rows={rows}
        rangeLabel={rangeLabel}
        category={category}
        onSelect={(id) => {
          setSelectedId(id);
          scrollToArticles();
        }}
        onFilterTier={(tier) => {
          setTierFilter(tier);
          scrollToArticles();
        }}
      />

      <div className="grid-table" id="articles">
        <ArticleTable
          rows={rows}
          selectedId={selectedId}
          tierFilter={tierFilter}
          onTierFilter={setTierFilter}
          onSelect={setSelectedId}
        />
        <ContentPreview row={selectedRow} onClose={closePreview} />
      </div>

      <footer className="footer">
        Content Analytics Dashboard · Demo project · All data is sample data
      </footer>
    </div>
  );
}
