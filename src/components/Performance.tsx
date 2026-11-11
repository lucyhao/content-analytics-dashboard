import { fmtCompact, fmtNumber, fmtPercent, type ArticleMetrics, type Tier } from '../lib/analytics';
import { Thumbnail } from './Thumbnail';

const TIERS: { tier: Tier; label: string; rule: string }[] = [
  { tier: 'Top', label: 'Top performers', rule: 'Top 20% by views' },
  { tier: 'Middle', label: 'Middle', rule: 'Middle 60% by views' },
  { tier: 'Bottom', label: 'Needs attention', rule: 'Bottom 20% by views' },
];

interface Props {
  rows: ArticleMetrics[];
  onSelect: (id: string) => void;
  onFilterTier: (tier: Tier) => void;
}

export function Performance({ rows, onSelect, onFilterTier }: Props) {
  const totalViews = rows.reduce((s, r) => s + r.views, 0);
  return (
    <section className="panel" aria-labelledby="performance-heading">
      <div className="panel__head">
        <h2 id="performance-heading">Performance tiers</h2>
        <span className="panel__hint">Ranked by views in the selected period</span>
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
              <p className="tier__rule">{rule}</p>
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
