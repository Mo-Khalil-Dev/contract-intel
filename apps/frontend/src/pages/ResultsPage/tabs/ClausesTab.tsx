import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CLAUSE_TYPE_LABELS,
  type ClauseResponse,
  type RiskLevel,
} from '@/types/clauses';
import type { SimilarClauseDto } from '@/types/similarClauses';
import {
  FindSimilarButton,
  SimilarClausesDrawer,
} from '@/components/features/similar-clauses';
import styles from './ClausesTab.module.css';

interface ClausesTabProps {
  clauses: ClauseResponse[];
}

/**
 * Phase 11 — Clauses tab on the Results screen. Lists every clause
 * extracted from the contract; each card has a "Find similar" trigger
 * that opens the SimilarClausesDrawer with the portfolio-wide
 * precedent match for that clause.
 *
 * State owned at the tab level (not in the drawer):
 *   - drawerForClauseId  which clause is currently driving the drawer
 *   - activeResultId     which precedent in the drawer is "in comparison"
 *   - highlightedSourceId  short-lived: which clause card got the
 *                          one-shot "IN COMPARISON" ring animation
 *
 * Keyboard:
 *   - F            opens the drawer for the focused clause (or the
 *                  first clause when nothing is focused)
 *   - Ignored when an input / textarea is focused.
 *
 * Result-row click navigation: opens the matched contract in a NEW
 * TAB (Option C from the navigation discussion). Zero coordination
 * needed — the source contract stays put, the user can flip between
 * tabs to compare.
 */
export function ClausesTab({ clauses }: ClausesTabProps) {
  const [drawerForClauseId, setDrawerForClauseId] = useState<string | null>(null);
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const focusedClauseIdRef = useRef<string | null>(null);

  const openDrawerFor = useCallback((clauseId: string) => {
    setDrawerForClauseId(clauseId);
    setActiveResultId(null);
    setHighlightedSourceId(clauseId);
    // Clear the one-shot ring animation after it plays.
    window.setTimeout(() => setHighlightedSourceId(null), 1800);
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawerForClauseId(null);
    setActiveResultId(null);
  }, []);

  // ── F shortcut (skip when inside text inputs) ───────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'f' && e.key !== 'F') return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (drawerForClauseId) return; // already open
      const id = focusedClauseIdRef.current ?? clauses[0]?.id;
      if (!id) return;
      e.preventDefault();
      openDrawerFor(id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clauses, drawerForClauseId, openDrawerFor]);

  const onSelectResult = useCallback((target: SimilarClauseDto) => {
    setActiveResultId(target.id);
    // Open the matched contract in a new tab (Option C). Production
    // routes are /contracts/:documentId — same as the existing
    // ResultsPage.
    const url = `/contracts/${target.document.id}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }, []);

  const headerNote = useMemo(() => {
    const n = clauses.length;
    return `${n} clause${n === 1 ? '' : 's'} extracted`;
  }, [clauses.length]);

  if (clauses.length === 0) {
    return (
      <div className={styles.empty}>
        <h3>No clauses extracted yet</h3>
        <p>
          Clauses appear here after the contract has been processed. If
          extraction is still running, refresh in a moment.
        </p>
      </div>
    );
  }

  return (
    <div className={styles.column}>
      <div className={styles.headerBar}>
        <div>
          <strong>{headerNote}</strong> · Press <strong>F</strong> on any clause to find precedents
        </div>
        <span className={styles.headerPin}>kNN search across portfolio</span>
      </div>

      <ul className={styles.list} aria-label="Extracted clauses">
        {clauses.map((c) => (
          <li key={c.id}>
            <ClauseCard
              clause={c}
              isHighlighted={highlightedSourceId === c.id}
              isInComparison={drawerForClauseId === c.id}
              onFocus={() => {
                focusedClauseIdRef.current = c.id;
              }}
              onFindSimilar={() => openDrawerFor(c.id)}
              isLoading={drawerForClauseId === c.id && highlightedSourceId === c.id}
            />
          </li>
        ))}
      </ul>

      <SimilarClausesDrawer
        clauseId={drawerForClauseId}
        onClose={closeDrawer}
        onSelectResult={onSelectResult}
        activeResultId={activeResultId}
        onClearActive={() => setActiveResultId(null)}
      />
    </div>
  );
}

// ── ClauseCard ────────────────────────────────────────────────────

interface ClauseCardProps {
  clause: ClauseResponse;
  isHighlighted: boolean;
  isInComparison: boolean;
  isLoading: boolean;
  onFocus: () => void;
  onFindSimilar: () => void;
}

function ClauseCard({
  clause,
  isHighlighted,
  isInComparison,
  isLoading,
  onFocus,
  onFindSimilar,
}: ClauseCardProps) {
  const label = CLAUSE_TYPE_LABELS[clause.type] ?? clause.type;
  const severity = clause.risk?.level;
  const stripeColor = severityStripe(severity);

  return (
    <div
      className={[
        styles.card,
        isHighlighted ? styles.highlighted : '',
      ].join(' ')}
      tabIndex={0}
      onFocus={onFocus}
      data-clause-id={clause.id}
      style={{ ['--stripe-color' as string]: stripeColor }}
    >
      {isInComparison && <span className={styles.comparisonEyebrow}>IN COMPARISON</span>}
      <div className={styles.titleRow}>
        <div className={styles.titleGroup}>
          <span className={styles.label}>{label}</span>
          {severity && severity !== 'low' && (
            <span className={[styles.severityBadge, styles[severity]].join(' ')}>
              {severityBadgeLabel(severity)}
            </span>
          )}
        </div>
        <FindSimilarButton
          onClick={onFindSimilar}
          isLoading={isLoading}
          hidden={!clause.hasEmbedding}
        />
      </div>
      <p className={styles.snippet}>&ldquo;{clause.text}&rdquo;</p>
      <div className={styles.meta}>Page {clause.pageNumber}</div>
    </div>
  );
}

function severityStripe(level: RiskLevel | undefined): string {
  switch (level) {
    case 'critical':
    case 'high':
      return 'var(--color-red)';
    case 'medium':
      return 'var(--color-orange)';
    case 'low':
      return 'var(--color-green)';
    default:
      return 'var(--color-border)';
  }
}

function severityBadgeLabel(level: RiskLevel): string {
  switch (level) {
    case 'critical':
      return 'Critical risk';
    case 'high':
      return 'High risk';
    case 'medium':
      return 'Caution';
    case 'low':
      return 'Low risk';
  }
}
