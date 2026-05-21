import { ChevronRightIcon } from '@/components/core/icons';
import { SimilarityBar } from '../SimilarityBar';
import { usePrecedentRow, type UsePrecedentRowProps } from './usePrecedentRow';

/**
 * One precedent row in the SimilarClausesDrawer (Phase 11). Geometry
 * matches the design handoff:
 *
 *   ┌─────────────────────────────────────────────────────────┐
 *   │  [████████░░░] 50/75/90 ticks            94% match       │   ← row 1
 *   │  Limitation of liability                                 │   ← row 2
 *   │  Globex MSA · Mar 2025                                   │   ← row 3
 *   │  "Aggregate liability capped at amounts paid in prior 12 │   ← rows 4-6
 *   │   months, except in cases of gross negligence or…"       │
 *   │                                                       →  │   ← arrow (abs)
 *   └─────────────────────────────────────────────────────────┘
 *
 * Snippet uses Georgia italic — the design call to make clause text
 * read like quoted source material rather than UI chrome.
 *
 * Reused unchanged by US-CI-2 (Semantic Search overlay + /search page).
 */
export function PrecedentRow(props: UsePrecedentRowProps) {
  const {
    similarity,
    displayPercent,
    isStrong,
    type,
    contractName,
    contractDate,
    textSnippet,
    isActive,
    handleClick,
    handleKeyDown,
  } = usePrecedentRow(props);

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'relative block w-full rounded-[10px] border px-3.5 py-3 text-left',
        'transition-[background-color,border-color,transform,box-shadow] duration-150',
        'focus:outline-none focus-visible:-translate-y-px focus-visible:shadow-[0_4px_12px_rgba(15,23,42,0.06)]',
        isActive
          ? 'border-blue bg-blue-light focus-visible:border-blue'
          : 'border-border bg-surface hover:bg-bg-alt focus-visible:border-border-mid focus-visible:bg-bg-alt',
      ].join(' ')}
      aria-current={isActive ? 'true' : undefined}
    >
      {/* ── Similarity bar + percent label ───────────────────────── */}
      <div className="mb-2.5 flex items-center gap-2.5">
        <div className="flex-1">
          <SimilarityBar value={similarity} strong={isActive} />
        </div>
        <span
          className="font-mono text-xs font-bold tabular-nums text-right"
          style={{
            minWidth: 64,
            color: isStrong ? 'var(--color-blue-dark)' : 'var(--color-ink)',
          }}
        >
          {displayPercent}% match
        </span>
      </div>

      {/* ── Clause type ──────────────────────────────────────────── */}
      <div className="text-ink mb-0.5 text-[13px] font-bold tracking-[-0.01em]">
        {type}
      </div>

      {/* ── Meta line: contract · date ───────────────────────────── */}
      <div className="mb-1.5 flex items-center gap-2 text-[11px] text-ink-soft">
        <span className="overflow-hidden text-ellipsis whitespace-nowrap" style={{ maxWidth: 240 }}>
          {contractName}
        </span>
        <span className="text-border-mid">·</span>
        <span className="font-mono">{contractDate}</span>
      </div>

      {/* ── Snippet (Georgia italic, 3-line clamp) ───────────────── */}
      <p
        className="m-0 text-ink-mid line-clamp-3"
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 12.5,
          lineHeight: 1.55,
          paddingRight: 24,
        }}
      >
        &ldquo;{textSnippet}&rdquo;
      </p>

      {/* ── Arrow chevron (absolute, bottom-right) ───────────────── */}
      <ChevronRightIcon
        aria-hidden="true"
        className={[
          'absolute bottom-3 right-3 h-3.5 w-3.5 transition-[color,opacity] duration-150',
          isActive ? 'text-blue opacity-100' : 'text-ink-mute opacity-60 group-hover:opacity-100',
        ].join(' ')}
      />
    </button>
  );
}
