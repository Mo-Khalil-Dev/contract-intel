import { humaniseClauseType } from '../PrecedentRow/usePrecedentRow';

export interface EmptyPrecedentStateProps {
  /**
   * Source clause type — used to personalise the explanation copy
   * ("This is the first {type} clause…"). Optional; falls back to a
   * generic message if the caller doesn't have it handy.
   */
  clauseType?: string;
}

/**
 * Empty state inside SimilarClausesDrawer when zero precedents are
 * found above the similarity threshold. Tone is matter-of-fact —
 * explains *why*, doesn't apologise. See visual spec §4.2 and the
 * Claude Design handoff (README §Drawer states / `empty`).
 */
export function EmptyPrecedentState({ clauseType }: EmptyPrecedentStateProps) {
  const typeName = clauseType ? humaniseClauseType(clauseType) : null;

  return (
    <div className="mx-auto flex max-w-[280px] flex-col items-center pt-8 text-center">
      <CrossedMagnifier />
      <h3 className="text-ink mb-2 mt-4 text-sm font-semibold">
        No similar clauses found yet
      </h3>
      <p className="text-ink-soft text-[12.5px]" style={{ lineHeight: 1.6 }}>
        {typeName ? (
          <>
            This is the first <strong className="font-semibold">{typeName}</strong> clause in your portfolio, or none of your existing ones are close enough to compare meaningfully.
          </>
        ) : (
          "We couldn't find clauses similar enough to compare meaningfully."
        )}{' '}
        As you add more contracts, precedents will appear here.
      </p>
    </div>
  );
}

/**
 * Inline 56px circle with a crossed-out magnifier — matches the
 * design handoff's empty-state illustration. Built inline so we can
 * stay consistent with the icons module's "no inline SVG elsewhere"
 * rule (this isn't really an icon, it's an illustration).
 */
function CrossedMagnifier() {
  return (
    <div
      aria-hidden="true"
      className="bg-surface-alt text-ink-mute flex h-14 w-14 items-center justify-center rounded-full"
    >
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
        {/* magnifier circle */}
        <circle cx="12" cy="12" r="6.5" stroke="currentColor" strokeWidth="1.5" />
        {/* magnifier handle */}
        <line
          x1="17"
          y1="17"
          x2="22"
          y2="22"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        {/* slash through the whole symbol */}
        <line
          x1="4"
          y1="24"
          x2="24"
          y2="4"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}
