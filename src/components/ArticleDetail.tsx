import { useEffect, useMemo } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { SAMPLE_ARTICLES } from '../data/sampleData';
import {
  RANGES,
  articleDetail,
  fmtCompact,
  fmtDate,
  fmtNumber,
  fmtPercent,
  type RangeDays,
} from '../lib/analytics';
import { dashboardHref } from '../lib/router';
import { useChartColors } from '../lib/theme';
import { Delta } from './Overview';
import { Thumbnail } from './Thumbnail';

interface Props {
  id: string;
  range: RangeDays;
  onRangeChange: (range: RangeDays) => void;
}

type TrendRow = { date: string; views: number; categoryAvg: number };

function TrendTooltip({ active, payload }: { active?: boolean; payload?: { payload: TrendRow }[] }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip__title">{fmtDate(p.date, true)}</div>
      <div>
        <span className="tooltip__swatch" /> This article: {fmtNumber(p.views)}
      </div>
      <div>
        <span className="tooltip__swatch tooltip__swatch--ref" /> Category avg: {fmtNumber(p.categoryAvg)}
      </div>
    </div>
  );
}

/** Direct label drawn at the last point of a line. */
function endLabel(text: string, color: string, lastIndex: number) {
  return ({ x, y, index }: { x?: number | string; y?: number | string; index?: number }) =>
    index === lastIndex ? (
      <text x={Number(x) + 8} y={Number(y)} dy={4} fill={color} fontSize={12}>
        {text}
      </text>
    ) : null;
}

const fmtCount = (n: number) => fmtNumber(Math.round(n));

/** Signed difference vs the category average, as % (or percentage points for rates). */
function vsAverage(value: number, avg: number, isRate = false) {
  if (!avg) return { text: '—', up: true };
  const diff = isRate ? (value - avg) * 100 : ((value - avg) / avg) * 100;
  const sign = diff >= 0 ? '+' : '−';
  return { text: `${sign}${Math.abs(diff).toFixed(isRate ? 1 : 0)}${isRate ? ' pts' : '%'}`, up: diff >= 0 };
}

export function ArticleDetail({ id, range, onRangeChange }: Props) {
  const c = useChartColors();
  const detail = useMemo(() => articleDetail(id, SAMPLE_ARTICLES, range), [id, range]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [id]);

  useEffect(() => {
    if (!detail) return;
    document.title = `${detail.self.article.title} · Content Analytics Dashboard`;
    return () => {
      document.title = 'Content Analytics Dashboard';
    };
  }, [detail]);

  if (!detail) {
    return (
      <div className="panel not-found">
        <h1>Article not found</h1>
        <p className="muted">There is no sample article with the id “{id}”.</p>
        <a className="link" href={dashboardHref}>
          ← Back to dashboard
        </a>
      </div>
    );
  }

  const { self, categoryAvg, previous, trend, categoryRank, categorySize } = detail;
  const { article } = self;

  const metrics = [
    {
      label: 'Views',
      value: fmtNumber(self.views),
      delta: previous && <Delta now={self.views} before={previous.views} />,
    },
    {
      label: 'Engagements',
      value: fmtNumber(self.engagements),
      delta: previous && <Delta now={self.engagements} before={previous.engagements} />,
    },
    {
      label: 'Engagement rate',
      value: fmtPercent(self.engagementRate),
      delta: previous && (
        <Delta now={self.engagementRate} before={previous.engagementRate} percentPoints />
      ),
    },
  ];

  const breakdown = [
    { label: 'Likes', value: self.likes },
    { label: 'Comments', value: self.comments },
    { label: 'Shares', value: self.shares },
  ];

  const comparison = [
    { label: 'Views', value: self.views, avg: categoryAvg.views, fmt: fmtCount },
    { label: 'Engagements', value: self.engagements, avg: categoryAvg.engagements, fmt: fmtCount },
    {
      label: 'Engagement rate',
      value: self.engagementRate,
      avg: categoryAvg.engagementRate,
      fmt: (n: number) => fmtPercent(n),
      isRate: true,
    },
    { label: 'Likes', value: self.likes, avg: categoryAvg.likes, fmt: fmtCount },
    { label: 'Comments', value: self.comments, avg: categoryAvg.comments, fmt: fmtCount },
    { label: 'Shares', value: self.shares, avg: categoryAvg.shares, fmt: fmtCount },
  ];

  const lastIndex = trend.length - 1;
  const publishedInRange = trend[0]?.date === article.publishedAt;

  return (
    <div className="detail">
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <a className="link" href={dashboardHref}>
          ← Dashboard
        </a>
        <span className="muted">/ {article.category}</span>
      </nav>

      {/* Article information */}
      <section className="panel detail-hero" aria-labelledby="article-title">
        <Thumbnail category={article.category} size="lg" />
        <div className="detail-hero__body">
          <div className="preview__meta">
            <span
              className={`badge badge--${self.tier.toLowerCase()}`}
              title="Ranked by total views in the selected period, across all categories"
            >
              {self.tier} tier
            </span>
            <span className="sample-tag sample-tag--inline">Sample data</span>
          </div>
          <h1 id="article-title" className="detail-hero__title">
            {article.title}
          </h1>
          <p className="detail-hero__summary">{article.summary}</p>
          <dl className="info-grid">
            <div>
              <dt>Author</dt>
              <dd>{article.author}</dd>
            </div>
            <div>
              <dt>Category</dt>
              <dd>{article.category}</dd>
            </div>
            <div>
              <dt>Published</dt>
              <dd>{fmtDate(article.publishedAt, true)}</dd>
            </div>
            <div>
              <dt>Read time</dt>
              <dd>{article.readMinutes} min</dd>
            </div>
          </dl>
        </div>
      </section>

      <div className="filters">
        <div className="segmented" role="group" aria-label="Date range">
          {RANGES.map((r) => (
            <button
              key={r.days}
              type="button"
              aria-pressed={range === r.days}
              onClick={() => onRangeChange(r.days)}
            >
              {r.label}
            </button>
          ))}
        </div>
        <span className="panel__hint">
          #{categoryRank} of {categorySize} in {article.category} by views · Tier ranked across all
          categories
        </span>
      </div>

      {/* Performance metrics */}
      <section className="panel" aria-labelledby="metrics-heading">
        <div className="panel__head">
          <h2 id="metrics-heading">Performance metrics</h2>
        </div>
        <div className="kpis kpis--3">
          {metrics.map((m) => (
            <div className="kpi" key={m.label}>
              <div className="kpi__label">{m.label}</div>
              <div className="kpi__value">{m.value}</div>
              <div className="kpi__delta">
                {m.delta || <span className="muted">No previous period in sample</span>}
                {m.delta && <span className="muted"> vs previous period</span>}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Daily views */}
      <section className="panel" aria-labelledby="daily-heading">
        <div className="panel__head">
          <h2 id="daily-heading">Daily views</h2>
          {publishedInRange && (
            <span className="panel__hint">Starts on publication day, {fmtDate(article.publishedAt)}</span>
          )}
        </div>
        <ul className="legend" aria-label="Legend">
          <li>
            <span className="legend__line" style={{ background: c.series }} /> This article
          </li>
          <li>
            <span className="legend__line legend__line--dashed" style={{ color: c.muted }} />
            {article.category} average per article
          </li>
        </ul>
        <div
          className="chart"
          role="img"
          aria-label={`Line chart of daily views for this article compared with the ${article.category} average`}
        >
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={trend} margin={{ top: 8, right: 44, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={c.grid} />
              <XAxis
                dataKey="date"
                tickFormatter={(d: string) => fmtDate(d)}
                tick={{ fill: c.muted, fontSize: 12 }}
                axisLine={{ stroke: c.axis }}
                tickLine={false}
                minTickGap={28}
              />
              <YAxis
                tickFormatter={fmtCompact}
                tick={{ fill: c.muted, fontSize: 12 }}
                axisLine={false}
                tickLine={false}
                width={44}
              />
              <Tooltip content={<TrendTooltip />} cursor={{ stroke: c.axis, strokeWidth: 1 }} />
              <Line
                type="monotone"
                dataKey="categoryAvg"
                stroke={c.muted}
                strokeWidth={2}
                strokeDasharray="5 4"
                dot={false}
                activeDot={{ r: 4, stroke: c.surface, strokeWidth: 2, fill: c.muted }}
                label={endLabel('Avg', c.muted, lastIndex)}
                isAnimationActive={false}
              />
              <Line
                type="monotone"
                dataKey="views"
                stroke={c.series}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2, fill: c.series }}
                label={endLabel('Article', c.series, lastIndex)}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <div className="grid-detail">
        {/* Engagement breakdown */}
        <section className="panel" aria-labelledby="breakdown-heading">
          <div className="panel__head">
            <h2 id="breakdown-heading">Engagement breakdown</h2>
            <span className="panel__hint">{fmtNumber(self.engagements)} total</span>
          </div>
          <ul className="breakdown">
            {breakdown.map((b) => {
              const share = self.engagements ? b.value / self.engagements : 0;
              const per1k = self.views ? (b.value / self.views) * 1000 : 0;
              return (
                <li key={b.label}>
                  <div className="breakdown__row">
                    <span className="breakdown__label">{b.label}</span>
                    <span className="breakdown__value">{fmtNumber(b.value)}</span>
                  </div>
                  <div className="share-bar">
                    <span style={{ width: `${share * 100}%` }} />
                  </div>
                  <div className="breakdown__meta muted">
                    {fmtPercent(share, 0)} of engagements · {per1k.toFixed(1)} per 1,000 views
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Performance comparison */}
        <section className="panel" aria-labelledby="compare-heading">
          <div className="panel__head">
            <h2 id="compare-heading">Compared with {article.category} average</h2>
            <span className="panel__hint">Mean of {categorySize} articles</span>
          </div>
          <ul className="legend" aria-label="Legend">
            <li>
              <span className="legend__swatch" style={{ background: c.series }} /> This article
            </li>
            <li>
              <span className="legend__tick" /> Category average
            </li>
          </ul>
          <ul className="compare">
            {comparison.map((row) => {
              const max = Math.max(row.value, row.avg) * 1.15 || 1;
              const diff = vsAverage(row.value, row.avg, row.isRate);
              return (
                <li key={row.label}>
                  <div className="compare__head">
                    <span className="compare__label">{row.label}</span>
                    <span className={`delta ${diff.up ? 'delta--up' : 'delta--down'}`}>
                      {diff.text} <span className="sr-only">vs category average</span>
                    </span>
                  </div>
                  <div
                    className="bullet"
                    title={`This article ${row.fmt(row.value)} · Category average ${row.fmt(row.avg)}`}
                  >
                    <span className="bullet__bar" style={{ width: `${(row.value / max) * 100}%` }} />
                    <span className="bullet__avg" style={{ left: `${(row.avg / max) * 100}%` }} />
                  </div>
                  <div className="compare__values muted">
                    {row.fmt(row.value)} vs avg {row.fmt(row.avg)}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
  );
}
