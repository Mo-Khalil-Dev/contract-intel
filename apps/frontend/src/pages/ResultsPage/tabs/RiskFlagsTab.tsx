import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { Button } from '../../HomePageV2/components/Button';
import styles from './RiskFlagsTab.module.css';
import { CLAUSE_TYPE_LABELS, type ClauseResponse, type RiskLevel } from '@/types/clauses';

interface RiskFlagsTabProps {
  clauses: ClauseResponse[];
}

/**
 * Lists clauses whose risk level is medium or higher as expandable
 * flag rows. Resolve / Dismiss are local-only React state — Phase 11
 * wires real persistence on the ExtractionRun or a separate
 * FlagDecision aggregate.
 *
 * The "Deep dive →" button is a stub in Phase 8 per the scoping
 * conversation (no market-standard / suggested-language data yet).
 */
export function RiskFlagsTab({ clauses }: RiskFlagsTabProps) {
  // ── Derived data ───────────────────────────────────────────────
  // Only flag-worthy clauses: critical, high, medium. Low riskLevel
  // is informational and lives in the Overview Info counter — never
  // shown as a flag.
  const flagClauses = useMemo(
    () =>
      clauses
        .filter((c) => c.risk && c.risk.level !== 'low')
        // Sort by severity descending, then by page so the user works
        // top-down: deepest red first, longest doc last.
        .sort((a, b) => {
          const rank = (lvl: RiskLevel) =>
            ({ critical: 0, high: 1, medium: 2, low: 3 })[lvl];
          const diff =
            rank(a.risk!.level) - rank(b.risk!.level);
          return diff !== 0 ? diff : a.pageNumber - b.pageNumber;
        }),
    [clauses],
  );

  const counts = useMemo(
    () => ({
      total: flagClauses.length,
      critical: flagClauses.filter((c) => c.risk!.level === 'critical').length,
      caution: flagClauses.filter((c) => c.risk!.level !== 'critical').length,
      info: clauses.filter((c) => c.risk?.level === 'low').length,
    }),
    [flagClauses, clauses],
  );

  // Local-only flag state. Per-clauseId tracking.
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [resolvedIds, setResolvedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const visible = flagClauses.filter((c) => !dismissedIds.has(c.id));

  return (
    <div className={styles.column}>
      <CounterBar
        total={visible.length}
        critical={visible.filter((c) => c.risk!.level === 'critical').length}
        caution={visible.filter((c) => c.risk!.level !== 'critical').length}
        info={counts.info}
      />

      {visible.length === 0 ? (
        <EmptyState hasAnyClauses={clauses.length > 0} />
      ) : (
        <ul className={styles.list} aria-label="Risk flags">
          {visible.map((c) => (
            <FlagRow
              key={c.id}
              clause={c}
              isExpanded={expandedId === c.id}
              isResolved={resolvedIds.has(c.id)}
              onToggle={() =>
                setExpandedId((cur) => (cur === c.id ? null : c.id))
              }
              onToggleResolved={() =>
                setResolvedIds((cur) => {
                  const next = new Set(cur);
                  if (next.has(c.id)) next.delete(c.id);
                  else next.add(c.id);
                  return next;
                })
              }
              onDismiss={() =>
                setDismissedIds((cur) => new Set(cur).add(c.id))
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

// ── Counter bar ───────────────────────────────────────────────────

function CounterBar({
  total,
  critical,
  caution,
  info,
}: {
  total: number;
  critical: number;
  caution: number;
  info: number;
}) {
  return (
    <div className={styles.counterBar}>
      <span>
        <strong>{total}</strong> total
      </span>
      <span className={`${styles.counterDot} ${styles.counterDotCritical}`}>
        {critical} critical
      </span>
      <span className={`${styles.counterDot} ${styles.counterDotCaution}`}>
        {caution} caution
      </span>
      <span className={`${styles.counterDot} ${styles.counterDotInfo}`}>
        {info} informational
      </span>
    </div>
  );
}

// ── Single flag row (header + expanded body) ─────────────────────

function FlagRow({
  clause,
  isExpanded,
  isResolved,
  onToggle,
  onToggleResolved,
  onDismiss,
}: {
  clause: ClauseResponse;
  isExpanded: boolean;
  isResolved: boolean;
  onToggle: () => void;
  onToggleResolved: () => void;
  onDismiss: () => void;
}) {
  const risk = clause.risk!;
  const isCritical = risk.level === 'critical';
  const dotClass = isCritical
    ? styles.severityDotCritical
    : styles.severityDotCaution;

  // Truncate the clause excerpt for the expanded view so a 30-page
  // indemnification doesn't take over the screen. Full text lives in
  // the Document tab (Task 8.6.g).
  const excerpt =
    clause.text.length > 320
      ? `${clause.text.slice(0, 320).trim()}…`
      : clause.text;

  return (
    <li
      className={`${styles.flag} ${isResolved ? styles.flagResolved : ''}`}
    >
      <button
        type="button"
        className={styles.flagHeader}
        onClick={onToggle}
        aria-expanded={isExpanded}
      >
        <span className={`${styles.severityDot} ${dotClass}`} aria-hidden="true" />
        <span className={styles.flagTitle}>
          {CLAUSE_TYPE_LABELS[clause.type]}
        </span>
        {isResolved && <span className={styles.resolvedBadge}>✓ Resolved</span>}
        <span className={styles.flagSection}>p.{clause.pageNumber}</span>
        <ChevronDown
          size={14}
          className={`${styles.chevron} ${isExpanded ? styles.chevronOpen : ''}`}
          aria-hidden="true"
        />
      </button>
      {isExpanded && (
        <div className={styles.flagBody}>
          {risk.explanation && (
            <p className={styles.flagText}>{risk.explanation}</p>
          )}
          <blockquote className={styles.flagClauseExcerpt}>"{excerpt}"</blockquote>
          {risk.flags.length > 0 && (
            <p className={styles.recommendation}>
              <span className={styles.recommendationLabel}>Flags:</span>
              {risk.flags.join(', ')}
            </p>
          )}
          <div className={styles.flagActions}>
            <Button size="sm" onClick={onToggleResolved}>
              {isResolved ? 'Undo' : '✓ Mark resolved'}
            </Button>
            <Button size="sm" variant="ghost" onClick={onDismiss}>
              Dismiss
            </Button>
            <Button
              size="sm"
              variant="secondary"
              disabled
              title="Coming soon — Phase 9"
            >
              Deep dive →
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}

// ── Empty state ──────────────────────────────────────────────────

function EmptyState({ hasAnyClauses }: { hasAnyClauses: boolean }) {
  return (
    <div className={styles.empty}>
      {hasAnyClauses
        ? 'No risk flags raised — all clauses scored low. The Overview tab still summarises the contract.'
        : 'No clauses extracted yet. Once analysis completes, any flagged clauses will appear here.'}
    </div>
  );
}
