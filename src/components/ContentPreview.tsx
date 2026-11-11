import { useEffect } from 'react';
import { fmtDate, fmtNumber, fmtPercent, type ArticleMetrics } from '../lib/analytics';
import { Thumbnail } from './Thumbnail';

interface Props {
  row: ArticleMetrics | null;
  onClose: () => void;
}

export function ContentPreview({ row, onClose }: Props) {
  useEffect(() => {
    if (!row) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [row, onClose]);

  if (!row) {
    return (
      <aside className="panel preview preview--empty" aria-label="Content preview">
        <p className="muted">Select an article to preview its title, thumbnail and summary.</p>
      </aside>
    );
  }

  const { article } = row;
  const stats = [
    ['Views', fmtNumber(row.views)],
    ['Likes', fmtNumber(row.likes)],
    ['Comments', fmtNumber(row.comments)],
    ['Shares', fmtNumber(row.shares)],
    ['Engagement rate', fmtPercent(row.engagementRate)],
    ['Read time', `${article.readMinutes} min`],
  ];

  return (
    <>
      <div className="preview-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="panel preview" aria-labelledby="preview-title">
        <button type="button" className="preview__close" onClick={onClose} aria-label="Close preview">
          ×
        </button>
        <Thumbnail category={article.category} size="lg" />
        <div className="preview__meta">
          <span>{article.category}</span>
          <span className={`badge badge--${row.tier.toLowerCase()}`}>{row.tier}</span>
          <span className="sample-tag">Sample</span>
        </div>
        <h2 id="preview-title" className="preview__title">
          {article.title}
        </h2>
        <p className="preview__byline">
          {article.author} · {fmtDate(article.publishedAt, true)}
        </p>
        <p className="preview__summary">{article.summary}</p>
        <dl className="preview__stats">
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="preview__note muted">Stats cover the selected period.</p>
      </aside>
    </>
  );
}
