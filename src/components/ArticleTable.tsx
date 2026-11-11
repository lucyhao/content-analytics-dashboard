import { useMemo, useState } from 'react';
import {
  fmtDate,
  fmtNumber,
  fmtPercent,
  type ArticleMetrics,
  type Tier,
} from '../lib/analytics';
import { Thumbnail } from './Thumbnail';

type SortKey = 'title' | 'publishedAt' | 'views' | 'engagements' | 'engagementRate';
type SortDir = 'asc' | 'desc';

const COLUMNS: { key: SortKey; label: string; numeric?: boolean; className?: string }[] = [
  { key: 'title', label: 'Article' },
  { key: 'publishedAt', label: 'Published', className: 'hide-sm' },
  { key: 'views', label: 'Views', numeric: true },
  { key: 'engagements', label: 'Engagements', numeric: true, className: 'hide-sm' },
  { key: 'engagementRate', label: 'Eng. rate', numeric: true },
];

const PAGE_SIZE = 12;

interface Props {
  rows: ArticleMetrics[];
  selectedId: string | null;
  tierFilter: Tier | 'All';
  onTierFilter: (tier: Tier | 'All') => void;
  onSelect: (id: string) => void;
}

function sortValue(row: ArticleMetrics, key: SortKey) {
  if (key === 'title') return row.article.title.toLowerCase();
  if (key === 'publishedAt') return row.article.publishedAt;
  return row[key];
}

export function ArticleTable({ rows, selectedId, tierFilter, onTierFilter, onSelect }: Props) {
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<{ key: SortKey; dir: SortDir }>({ key: 'views', dir: 'desc' });
  const [page, setPage] = useState(0);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = rows.filter(
      (r) =>
        (tierFilter === 'All' || r.tier === tierFilter) &&
        (!q ||
          r.article.title.toLowerCase().includes(q) ||
          r.article.author.toLowerCase().includes(q) ||
          r.article.category.toLowerCase().includes(q)),
    );
    const dir = sort.dir === 'asc' ? 1 : -1;
    return [...filtered].sort((a, b) => {
      const av = sortValue(a, sort.key);
      const bv = sortValue(b, sort.key);
      return av < bv ? -dir : av > bv ? dir : 0;
    });
  }, [rows, query, sort, tierFilter]);

  const pageCount = Math.max(1, Math.ceil(visible.length / PAGE_SIZE));
  const current = Math.min(page, pageCount - 1);
  const pageRows = visible.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  function toggleSort(key: SortKey) {
    setPage(0);
    setSort((s) =>
      s.key === key
        ? { key, dir: s.dir === 'asc' ? 'desc' : 'asc' }
        : { key, dir: key === 'title' ? 'asc' : 'desc' },
    );
  }

  return (
    <section className="panel" aria-labelledby="table-heading">
      <div className="panel__head">
        <h2 id="table-heading">Articles</h2>
        <span className="panel__hint">
          {visible.length} of {rows.length}
        </span>
      </div>

      <div className="table-tools">
        <input
          type="search"
          className="input"
          placeholder="Search title, author or category"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(0);
          }}
          aria-label="Search articles"
        />
        <div className="segmented" role="group" aria-label="Filter by performance tier">
          {(['All', 'Top', 'Middle', 'Bottom'] as const).map((t) => (
            <button
              key={t}
              type="button"
              aria-pressed={tierFilter === t}
              onClick={() => {
                onTierFilter(t);
                setPage(0);
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {COLUMNS.map((col) => {
                const active = sort.key === col.key;
                return (
                  <th
                    key={col.key}
                    className={[col.numeric ? 'num' : '', col.className ?? ''].join(' ')}
                    aria-sort={active ? (sort.dir === 'asc' ? 'ascending' : 'descending') : 'none'}
                  >
                    <button type="button" onClick={() => toggleSort(col.key)}>
                      {col.label}
                      <span className="sort-icon" aria-hidden="true">
                        {active ? (sort.dir === 'asc' ? '↑' : '↓') : '↕'}
                      </span>
                    </button>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((r) => (
              <tr
                key={r.article.id}
                className={r.article.id === selectedId ? 'is-selected' : undefined}
                onClick={() => onSelect(r.article.id)}
              >
                <td>
                  <button type="button" className="row-title" onClick={() => onSelect(r.article.id)}>
                    <Thumbnail category={r.article.category} />
                    <span>
                      <span className="row-title__text">{r.article.title}</span>
                      <span className="row-title__meta">
                        {r.article.category} ·{' '}
                        <span className={`badge badge--${r.tier.toLowerCase()}`}>{r.tier}</span>
                      </span>
                    </span>
                  </button>
                </td>
                <td className="hide-sm nowrap">{fmtDate(r.article.publishedAt, true)}</td>
                <td className="num">{fmtNumber(r.views)}</td>
                <td className="num hide-sm">{fmtNumber(r.engagements)}</td>
                <td className="num">{fmtPercent(r.engagementRate)}</td>
              </tr>
            ))}
            {pageRows.length === 0 && (
              <tr>
                <td colSpan={COLUMNS.length} className="empty">
                  No articles match these filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {pageCount > 1 && (
        <div className="pager">
          <button type="button" disabled={current === 0} onClick={() => setPage(current - 1)}>
            ← Prev
          </button>
          <span>
            Page {current + 1} of {pageCount}
          </span>
          <button
            type="button"
            disabled={current >= pageCount - 1}
            onClick={() => setPage(current + 1)}
          >
            Next →
          </button>
        </div>
      )}
    </section>
  );
}
