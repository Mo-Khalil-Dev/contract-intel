import { Fragment, useMemo, useState } from 'react';
import type { CSSProperties } from 'react';
import { useDocumentText } from '@/hooks/useClauses';
import type { ClauseResponse } from '@/types/clauses';
import type { DocumentId } from '@/types/documents';
import type { DocumentTextResponse } from '@/types/documentText';
import styles from './DocumentTab.module.css';

interface DocumentTabProps {
  documentId: string | undefined;
  filename?: string;
  clauses: ClauseResponse[];
  /** True when this tab is currently selected. The hook only fires
   *  when it is — saves a wasted network call for users who never
   *  open this tab. */
  enabled: boolean;
}

/**
 * Container — fetches the document text and delegates rendering to
 * DocumentTabView. Keeps the View pure for Storybook fixtures.
 */
export function DocumentTab({
  documentId,
  filename,
  clauses,
  enabled,
}: DocumentTabProps) {
  const { data, isLoading, isError } = useDocumentText(
    documentId as DocumentId | undefined,
    enabled,
  );

  return (
    <DocumentTabView
      filename={filename ?? documentId}
      data={data}
      isLoading={isLoading}
      isError={isError}
      clauses={clauses}
    />
  );
}

// ── View ──────────────────────────────────────────────────────────

const MIN_ZOOM = 0.6;
const MAX_ZOOM = 1.8;
const ZOOM_STEP = 0.2;

export interface DocumentTabViewProps {
  filename: string | undefined;
  data: DocumentTextResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  clauses: ClauseResponse[];
}

/**
 * Inline contract rendering with offset-based clause highlights.
 *
 * Only critical and high-risk clauses get highlighted (per design
 * pick — less visual noise). Medium / low clauses remain visible in
 * the text but unmarked.
 *
 * Implementation notes:
 *   - The text is sliced into spans by sorted, non-overlapping clause
 *     ranges. Overlaps prefer the higher-severity one.
 *   - Page breaks are derived from per-page offsets returned by the
 *     backend; a "Page N" separator is inserted between pages.
 *   - Zoom is implemented as a CSS variable so we don't re-render the
 *     entire span tree on every +/- click.
 */
export function DocumentTabView({
  filename,
  data,
  isLoading,
  isError,
  clauses,
}: DocumentTabViewProps) {
  const [zoom, setZoom] = useState(1);

  const highlightable = useMemo(
    () =>
      clauses
        .filter(
          (c) => c.risk?.level === 'critical' || c.risk?.level === 'high',
        )
        .sort((a, b) => a.startOffset - b.startOffset),
    [clauses],
  );

  if (isLoading) {
    return (
      <div className={styles.column}>
        <div className={styles.empty}>Loading document…</div>
      </div>
    );
  }
  if (isError || !data) {
    return (
      <div className={styles.column}>
        <div className={styles.empty}>
          Couldn't load the document text. Try refreshing the page.
        </div>
      </div>
    );
  }

  return (
    <div className={styles.column}>
      <Legend />
      <div
        className={styles.card}
        style={{ ['--doc-zoom' as never]: zoom } as CSSProperties}
      >
        <div className={styles.header}>
          <span className={styles.headerFilename} title={filename}>
            {filename}
          </span>
          <div className={styles.headerActions}>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, z - ZOOM_STEP))}
              disabled={zoom <= MIN_ZOOM + 0.001}
              aria-label="Zoom out"
            >
              −
            </button>
            <span className={styles.headerBtn} aria-live="polite">
              {Math.round(zoom * 100)}%
            </span>
            <button
              type="button"
              className={styles.headerBtn}
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, z + ZOOM_STEP))}
              disabled={zoom >= MAX_ZOOM - 0.001}
              aria-label="Zoom in"
            >
              +
            </button>
          </div>
        </div>
        <div className={styles.body}>
          <RenderedText
            text={data.text}
            pages={data.pages}
            highlights={highlightable}
          />
        </div>
      </div>
    </div>
  );
}

// ── Legend ────────────────────────────────────────────────────────

function Legend() {
  return (
    <div className={styles.legend}>
      <span className={styles.legendChip}>
        <span
          className={`${styles.legendSwatch} ${styles.legendSwatchCritical}`}
          aria-hidden="true"
        />
        Critical
      </span>
      <span className={styles.legendChip}>
        <span
          className={`${styles.legendSwatch} ${styles.legendSwatchHigh}`}
          aria-hidden="true"
        />
        High
      </span>
      <span className={styles.legendNote}>
        Only critical and high-risk clauses are highlighted.
      </span>
    </div>
  );
}

// ── Highlight + page-break renderer ──────────────────────────────

interface PageOffsetLite {
  pageNumber: number;
  text: string;
}

/**
 * Walks the document text once, interleaving plain spans, highlight
 * marks, and page-break separators. Highlights and page breaks are
 * pre-sorted by offset; the function tracks a moving cursor and emits
 * whatever element comes next.
 */
function RenderedText({
  text,
  pages,
  highlights,
}: {
  text: string;
  pages: PageOffsetLite[];
  highlights: ClauseResponse[];
}) {
  const pageOffsets = useMemo(() => {
    const out: { pageNumber: number; start: number }[] = [];
    let cursor = 0;
    for (const p of pages) {
      out.push({ pageNumber: p.pageNumber, start: cursor });
      cursor += p.text.length;
    }
    return out;
  }, [pages]);

  const segments = useMemo(() => {
    type Seg =
      | { kind: 'text'; text: string }
      | { kind: 'mark'; text: string; clause: ClauseResponse }
      | { kind: 'page'; pageNumber: number };

    const out: Seg[] = [];
    let cursor = 0;

    // Sort highlights and resolve overlaps: prefer higher severity at
    // a given start offset. Drop any highlight that starts before the
    // previous one ended.
    const sorted = [...highlights].sort(
      (a, b) =>
        a.startOffset - b.startOffset || severityRank(a) - severityRank(b),
    );
    const nonOverlapping: ClauseResponse[] = [];
    let lastEnd = -1;
    for (const h of sorted) {
      if (h.startOffset >= lastEnd) {
        nonOverlapping.push(h);
        lastEnd = h.endOffset;
      }
    }

    let pageIdx = 0;
    let hlIdx = 0;
    const pageBreakOffsets = pageOffsets.slice(1).map((p) => ({
      offset: p.start,
      pageNumber: p.pageNumber,
    }));

    while (cursor < text.length) {
      const nextPage = pageBreakOffsets[pageIdx]?.offset ?? Infinity;
      const nextHighlight = nonOverlapping[hlIdx]?.startOffset ?? Infinity;
      const target = Math.min(text.length, nextPage, nextHighlight);

      if (target > cursor) {
        out.push({ kind: 'text', text: text.slice(cursor, target) });
        cursor = target;
      }

      if (cursor === nextPage && cursor < text.length) {
        out.push({
          kind: 'page',
          pageNumber: pageBreakOffsets[pageIdx].pageNumber,
        });
        pageIdx += 1;
        continue;
      }

      if (cursor === nextHighlight) {
        const c = nonOverlapping[hlIdx];
        out.push({
          kind: 'mark',
          text: text.slice(c.startOffset, c.endOffset),
          clause: c,
        });
        cursor = c.endOffset;
        hlIdx += 1;
      }
    }

    return out;
  }, [text, highlights, pageOffsets]);

  return (
    <>
      {segments.map((s, i) => {
        if (s.kind === 'text') return <Fragment key={i}>{s.text}</Fragment>;
        if (s.kind === 'page') {
          return (
            <div key={i} className={styles.pageBreak} aria-hidden="true">
              <span>Page {s.pageNumber}</span>
            </div>
          );
        }
        const isCritical = s.clause.risk?.level === 'critical';
        return (
          <mark
            key={i}
            id={`clause-${s.clause.id}`}
            className={`${styles.mark} ${
              isCritical ? styles.markCritical : styles.markHigh
            }`}
            title={s.clause.risk?.explanation ?? 'Highlighted risk clause'}
          >
            {s.text}
          </mark>
        );
      })}
    </>
  );
}

function severityRank(c: ClauseResponse): number {
  // Lower rank = higher priority during overlap resolution.
  switch (c.risk?.level) {
    case 'critical':
      return 0;
    case 'high':
      return 1;
    default:
      return 99;
  }
}
