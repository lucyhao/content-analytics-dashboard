import { fmtCompact, fmtNumber, fmtPercent, type ArticleMetrics, type Tier } from '../lib/analytics';
import { Thumbnail } from './Thumbnail';

const TIERS: { tier: Tier; label: string; rule: string }[] = [
  { tier: 'Top', label: 'Top performers', rule: 'Top 20%' },
  { tier: 'Middle', label: 'Middle', rule: 'Middle 60%' },
  { tier: 'Bottom', label: 'Needs attention', rule: 'Bottom 20%' },
];

interface Props {
  rows: ArticleMetrics[];
  rangeLabel: string;
  category: string;
  onSelect: (id: string) => void;
  onFilterTier: (tier: Tier) => void;
}

export function Performance({ rows, rangeLabel, category, onSelect, onFilterTier }: Props) {
  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  // Rows arrive sorted by views, so each tier is a contiguous block of ranks.
  const rankRange = (tier: Tier) => {
    const ranks = rows.flatMap((r, i) => (r.tier === tier ? [i + 1] : []));
    if (!ranks.length) return 'no articles';
    const [first, last] = [ranks[0], ranks[ranks.length - 1]];
    return first === last ? `rank ${first}` : `ranks ${first}–${last}`;
  };
  return (
    <section className="panel" aria-labelledby="performance-heading">
      <div className="panel__head">
        <h2 id="performance-heading">Performance tiers</h2>
        <span className="panel__hint">
          {rows.length} articles ranked · {rangeLabel}
        </span>
      </div>
      <div className="method" role="note">
        <p>
          <strong>How tiers are calculated:</strong> Performance tiers are calculated by ranking
          articles based on total views within the selected reporting period ({rangeLabel.toLowerCase()}).
          The top 20% of articles are <strong>Top</strong>, the next 60% are <strong>Middle</strong>{' '}
          and the bottom 20% are <strong>Bottom</strong>.
        </p>
        <ul>
          <li>Only articles with at least one view in the period are ranked.</li>
          <li>Top and Bottom sizes are rounded up, so each has at least one article.</li>
          <li>
            {category === 'All'
              ? 'All categories are ranked together.'
              : `A category filter is active, so articles are ranked within ${category} only.`}
          </li>
          <li>Tiers are relative: an article’s tier can change when the period or filter changes.</li>
        </ul>
      </div>
      <div className="tiers">
        {TIERS.map(({ tier, label, rule }) => {
          const inTier = rows.filter((r) => r.tier === tier);
          const views = inTier.reduce((s, r) => s + r.views, 0);
          const engagements = inTier.reduce((s, r) => s + r.engagements, 0);
          const share = totalViews ? views / totalViews : 0;
          const preview = tier === 'Bottom' ? inTier.slice(-3).reverse() : inTier.slice(0, 3);
          return (
            <article className={`tier tier--${tier.toLowerCase()}`} key={tier}>
              <header className="tier__head">
                <span className={`badge badge--${tier.toLowerCase()}`}>{tier}</span>
                <h3>{label}</h3>
              </header>
              <p className="tier__rule">
                {rule} by views · {rankRange(tier)} of {rows.length}
              </p>
              <dl className="tier__stats">
                <div>
                  <dt>Articles</dt>
                  <dd>{inTier.length}</dd>
                </div>
                <div>
                  <dt>Share of views</dt>
                  <dd>{fmtPercent(share, 0)}</dd>
                </div>
                <div>
                  <dt>Engagement</dt>
                  <dd>{fmtPercent(views ? engagements / views : 0)}</dd>
                </div>
              </dl>
              <div className="share-bar" title={`${fmtPercent(share)} of all views`}>
                <span style={{ width: `${share * 100}%` }} />
              </div>
              <ul className="tier__list">
                {preview.map((r) => (
                  <li key={r.article.id}>
                    <button type="button" className="mini" onClick={() => onSelect(r.article.id)}>
                      <Thumbnail category={r.article.category} />
                      <span className="mini__title">{r.article.title}</span>
                      <span className="mini__value" title={`${fmtNumber(r.views)} views`}>
                        {fmtCompact(r.views)}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <button type="button" className="link" onClick={() => onFilterTier(tier)}>
                Show all {inTier.length} in table →
              </button>
            </article>
          );
        })}
      </div>
    </section>
  );
}
