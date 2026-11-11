import { fmtCompact, fmtNumber, fmtPercent, type Totals } from '../lib/analytics';

interface Props {
  current: Totals;
  previous: Totals | null;
  rangeLabel: string;
}

function Delta({ now, before, percentPoints }: { now: number; before: number; percentPoints?: boolean }) {
  if (!before) return null;
  const change = percentPoints ? (now - before) * 100 : ((now - before) / before) * 100;
  const up = change >= 0;
  const text = percentPoints ? `${Math.abs(change).toFixed(1)} pts` : `${Math.abs(change).toFixed(1)}%`;
  return (
    <span className={`delta ${up ? 'delta--up' : 'delta--down'}`}>
      <span aria-hidden="true">{up ? '▲' : '▼'}</span> {up ? 'Up' : 'Down'} {text}
    </span>
  );
}

export function Overview({ current, previous, rangeLabel }: Props) {
  const tiles = [
    {
      label: 'Articles with views',
      value: fmtNumber(current.articles),
      title: `${fmtNumber(current.articles)} articles`,
      delta: previous && <Delta now={current.articles} before={previous.articles} />,
    },
    {
      label: 'Total views',
      value: fmtCompact(current.views),
      title: `${fmtNumber(current.views)} views`,
      delta: previous && <Delta now={current.views} before={previous.views} />,
    },
    {
      label: 'Engagements',
      value: fmtCompact(current.engagements),
      title: `${fmtNumber(current.engagements)} likes, comments and shares`,
      delta: previous && <Delta now={current.engagements} before={previous.engagements} />,
    },
    {
      label: 'Engagement rate',
      value: fmtPercent(current.engagementRate),
      title: 'Engagements ÷ views',
      delta: previous && (
        <Delta now={current.engagementRate} before={previous.engagementRate} percentPoints />
      ),
    },
  ];

  return (
    <section className="panel" aria-labelledby="overview-heading">
      <div className="panel__head">
        <h2 id="overview-heading">Overview</h2>
        <span className="panel__hint">{rangeLabel}</span>
      </div>
      <div className="kpis">
        {tiles.map((tile) => (
          <div className="kpi" key={tile.label} title={tile.title}>
            <div className="kpi__label">{tile.label}</div>
            <div className="kpi__value">{tile.value}</div>
            <div className="kpi__delta">
              {tile.delta || <span className="muted">No previous period in sample</span>}
              {tile.delta && <span className="muted"> vs previous period</span>}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
