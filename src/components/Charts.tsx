import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import type { Category } from '../data/sampleData';
import {
  fmtCompact,
  fmtDate,
  fmtNumber,
  type CategoryPoint,
  type TrendPoint,
} from '../lib/analytics';
import { categorySummary, trendSummary } from '../lib/chartSummaries';
import { useChartColors } from '../lib/theme';
import { ChartFigure } from './ChartFigure';

interface TooltipPayload<T> {
  active?: boolean;
  payload?: { payload: T }[];
}

function TrendTooltip({ active, payload }: TooltipPayload<TrendPoint>) {
  if (!active || !payload?.length) return null;
  const point = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip__title">{fmtDate(point.date, true)}</div>
      <div>
        <span className="tooltip__swatch" /> {fmtNumber(point.views)} views
      </div>
    </div>
  );
}

export function TrendChart({ data }: { data: TrendPoint[] }) {
  const c = useChartColors();
  const peak = data.reduce((best, p) => (p.views > best.views ? p : best), data[0]);
  return (
    <section className="panel" aria-labelledby="trend-heading">
      <div className="panel__head">
        <h2 id="trend-heading">Daily views</h2>
        {peak && (
          <span className="panel__hint">
            Peak {fmtNumber(peak.views)} on {fmtDate(peak.date)}
          </span>
        )}
      </div>
      <ChartFigure
        summary={trendSummary(data)}
        table={{
          caption: 'Total daily views',
          columns: ['Date', 'Views'],
          rows: data.map((p) => [fmtDate(p.date, true), fmtNumber(p.views)]),
        }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <AreaChart accessibilityLayer={false} data={data} margin={{ top: 8, right: 12, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={c.series} stopOpacity={0.18} />
                <stop offset="100%" stopColor={c.series} stopOpacity={0} />
              </linearGradient>
            </defs>
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
            <Tooltip
              content={<TrendTooltip />}
              cursor={{ stroke: c.axis, strokeWidth: 1 }}
            />
            <Area
              type="monotone"
              dataKey="views"
              stroke={c.series}
              strokeWidth={2}
              fill="url(#trendFill)"
              activeDot={{ r: 5, stroke: c.surface, strokeWidth: 2, fill: c.series }}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </ChartFigure>
    </section>
  );
}

function CategoryTooltip({ active, payload }: TooltipPayload<CategoryPoint>) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="tooltip">
      <div className="tooltip__title">{p.category}</div>
      <div>{fmtNumber(p.avgViews)} avg views per article</div>
      <div className="muted">
        {fmtNumber(p.views)} total · {p.articles} articles
      </div>
    </div>
  );
}

interface CategoryProps {
  data: CategoryPoint[];
  selected: Category | 'All';
}

export function CategoryChart({ data, selected }: CategoryProps) {
  const c = useChartColors();
  return (
    <section className="panel" aria-labelledby="category-heading">
      <div className="panel__head">
        <h2 id="category-heading">Average views per article, by category</h2>
      </div>
      <ChartFigure
        summary={categorySummary(data)}
        table={{
          caption: 'Views by category',
          columns: ['Category', 'Avg views per article', 'Total views', 'Articles'],
          rows: data.map((d) => [d.category, fmtNumber(d.avgViews), fmtNumber(d.views), d.articles]),
        }}
      >
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            accessibilityLayer={false}
            data={data}
            layout="vertical"
            margin={{ top: 4, right: 48, bottom: 0, left: 0 }}
            barCategoryGap={6}
          >
            <CartesianGrid horizontal={false} stroke={c.grid} />
            <XAxis
              type="number"
              tickFormatter={fmtCompact}
              tick={{ fill: c.muted, fontSize: 12 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              type="category"
              dataKey="category"
              tick={{ fill: c.muted, fontSize: 12 }}
              axisLine={{ stroke: c.axis }}
              tickLine={false}
              width={84}
            />
            <Tooltip content={<CategoryTooltip />} cursor={{ fill: c.grid, fillOpacity: 0.5 }} />
            <Bar
              dataKey="avgViews"
              radius={[0, 4, 4, 0]}
              maxBarSize={22}
              isAnimationActive={false}
              label={{ position: 'right', fill: c.muted, fontSize: 12, formatter: (v) => fmtCompact(Number(v)) }}
            >
              {data.map((d) => (
                <Cell
                  key={d.category}
                  fill={selected === 'All' || selected === d.category ? c.series : c.seriesMuted}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </ChartFigure>
      {selected !== 'All' && (
        <p className="panel__foot">Highlighting {selected}. Other categories are shown for comparison.</p>
      )}
    </section>
  );
}
