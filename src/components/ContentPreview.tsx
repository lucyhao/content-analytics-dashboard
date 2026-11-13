import { useCallback, useEffect, useRef, type KeyboardEvent as ReactKeyboardEvent } from 'react';
import { fmtDate, fmtNumber, fmtPercent, type ArticleMetrics } from '../lib/analytics';
import { articleHref } from '../lib/router';
import { MOBILE_QUERY, useMediaQuery } from '../lib/useMediaQuery';
import { Thumbnail } from './Thumbnail';

interface Props {
  row: ArticleMetrics | null;
  onClose: () => void;
}

const FOCUSABLE = 'a[href], button:not([disabled]), input, select, textarea, [tabindex]:not([tabindex="-1"])';

/**
 * Article preview dialog. On wide screens it is a non-modal side panel next to the
 * table; on small screens it is a modal bottom sheet with a focus trap.
 * Focus moves into the dialog when it opens and returns to the trigger when it closes.
 */
export function ContentPreview({ row, onClose }: Props) {
  const modal = useMediaQuery(MOBILE_QUERY);
  const dialogRef = useRef<HTMLElement>(null);
  const headingRef = useRef<HTMLHeadingElement>(null);
  const triggerRef = useRef<HTMLElement | null>(null);
  const articleId = row?.article.id;

  const close = useCallback(() => {
    const trigger = triggerRef.current;
    triggerRef.current = null;
    onClose();
    if (trigger?.isConnected) trigger.focus();
  }, [onClose]);

  // Remember what opened the dialog, then move focus into it.
  useEffect(() => {
    if (!articleId) return;
    const active = document.activeElement as HTMLElement | null;
    if (active && active !== document.body && !dialogRef.current?.contains(active)) {
      triggerRef.current = active;
    }
    headingRef.current?.focus({ preventScroll: true });
  }, [articleId]);

  // Escape closes: anywhere while modal, or from inside the panel when non-modal.
  useEffect(() => {
    if (!articleId) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (modal || dialogRef.current?.contains(document.activeElement)) {
        e.preventDefault();
        close();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [articleId, modal, close]);

  // Modal only: lock page scroll behind the sheet.
  useEffect(() => {
    if (!articleId || !modal) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [articleId, modal]);

  // Modal only: keep Tab / Shift+Tab inside the sheet.
  const trapFocus = (e: ReactKeyboardEvent) => {
    if (!modal || e.key !== 'Tab' || !dialogRef.current) return;
    const items = [...dialogRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)];
    if (!items.length) return;
    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;
    if (e.shiftKey && (active === first || active === headingRef.current)) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  };

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
      {modal && <div className="preview-backdrop" onClick={close} aria-hidden="true" />}
      <section
        ref={dialogRef}
        id="content-preview"
        className="panel preview"
        role="dialog"
        aria-modal={modal}
        aria-labelledby="preview-title"
        aria-describedby="preview-summary"
        onKeyDown={trapFocus}
      >
        <button type="button" className="preview__close" onClick={close} aria-label="Close preview">
          <span aria-hidden="true">×</span>
        </button>
        <Thumbnail category={article.category} size="lg" />
        <div className="preview__meta">
          <span>{article.category}</span>
          <span className={`badge badge--${row.tier.toLowerCase()}`}>{row.tier} tier</span>
          <span className="sample-tag">Sample</span>
        </div>
        <h2 id="preview-title" className="preview__title" ref={headingRef} tabIndex={-1}>
          {article.title}
        </h2>
        <p className="preview__byline">
          {article.author} · {fmtDate(article.publishedAt, true)}
        </p>
        <p id="preview-summary" className="preview__summary">
          {article.summary}
        </p>
        <dl className="preview__stats">
          {stats.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <p className="preview__note muted">Stats cover the selected period.</p>
        {/* Leaving for the article page closes the preview, so going back doesn't reopen it. */}
        <a className="button" href={articleHref(article.id)} onClick={onClose}>
          View full analysis<span aria-hidden="true">{'\u00a0'}→</span>
        </a>
      </section>
    </>
  );
}
