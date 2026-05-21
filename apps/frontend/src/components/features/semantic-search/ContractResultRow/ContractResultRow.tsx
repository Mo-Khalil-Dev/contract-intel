import { ChevronRightIcon } from '@/components/core/icons';
import { SimilarityBar } from '@/components/features/similar-clauses';
import { formatContractDate } from '@/components/features/similar-clauses/PrecedentRow/usePrecedentRow';
import type { ContractSearchResult } from '@/types/semanticSearch';

export interface ContractResultRowProps {
  result: ContractSearchResult;
  onSelect: () => void;
  isActive?: boolean;
}

/**
 * Per-contract result row for the semantic search overlay and the
 * dedicated /search page. Geometry matches the design handoff:
 *
 *   ┌─────────────────────────────────────────────────────────────┐
 *   │ [████████░░░] 50/75/90 ticks               91% match         │
 *   │ Globex MSA                                       [TypePill] │
 *   │ Signed Apr 2026 · $2.4M · Counterparty: Acme Inc.           │
 *   │ ┌──────────────────────────────────────────────────────┐   │
 *   │ │ MATCHED ON · Limitation of Liability · §9.2          │   │
 *   │ └──────────────────────────────────────────────────────┘   │
 *   │ "Vendor's liability shall be unlimited for any breach…"     │
 *   │                                                          →  │
 *   └─────────────────────────────────────────────────────────────┘
 *
 * The "Matched on" chip is this component's defining feature — it's
 * the explainability anchor that distinguishes a semantic-search
 * contract result from a generic list row.
 */
export function ContractResultRow({
  result,
  onSelect,
  isActive = false,
}: ContractResultRowProps) {
  const pct = Math.round(result.score * 100);
  const isStrong = pct >= 90;
  const { contract, matchedOn } = result;
  const signed = formatContractDate(contract.signedAt);

  return (
    <button
      type="button"
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-current={isActive ? 'true' : undefined}
      className={[
        'relative block w-full rounded-[10px] border px-4 py-3 text-left',
        'transition-[background-color,border-color,transform,box-shadow] duration-150',
        'focus:outline-none focus-visible:-translate-y-px focus-visible:shadow-[0_4px_12px_rgba(15,23,42,0.06)]',
        isActive
          ? 'border-blue bg-blue-light'
          : 'border-border bg-surface hover:bg-bg-alt focus-visible:border-border-mid focus-visible:bg-bg-alt',
      ].join(' ')}
    >
      {/* ── Similarity bar + percent ─────────────────────────────── */}
      <div className="mb-2 flex items-center gap-2.5">
        <div className="flex-1">
          <SimilarityBar value={result.score} strong={isActive} />
        </div>
        <span
          className="font-mono text-xs font-bold tabular-nums text-right"
          style={{
            minWidth: 64,
            color: isStrong ? 'var(--color-blue-dark)' : 'var(--color-ink)',
          }}
        >
          {pct}% match
        </span>
      </div>

      {/* ── Title row ────────────────────────────────────────────── */}
      <div className="mb-1 flex items-center justify-between gap-3">
        <span className="text-ink text-[15px] font-bold tracking-[-0.01em]">
          {contract.name}
        </span>
        <span className="text-ink-soft bg-bg-alt rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide">
          {contract.type}
        </span>
      </div>

      {/* ── Meta line ─────────────────────────────────────────────── */}
      <div className="text-ink-soft mb-2 text-xs">
        Signed {signed} · {contract.dealSize} · Counterparty:{' '}
        <strong className="text-ink-mid font-semibold">
          {contract.counterparty}
        </strong>
      </div>

      {/* ── Matched-on chip ──────────────────────────────────────── */}
      <div
        className="bg-blue-light text-blue-dark mb-2 inline-flex items-center gap-1.5 rounded-[5px] px-2 py-0.5"
        style={{ border: '1px solid rgba(147, 197, 253, 0.33)' }}
      >
        <span
          className="text-[10px] font-bold uppercase"
          style={{ letterSpacing: '0.06em' }}
        >
          Matched on
        </span>
        <span className="text-[11px] font-semibold">{matchedOn.label}</span>
        <span className="font-mono text-[10px] opacity-75">
          {matchedOn.section}
        </span>
      </div>

      {/* ── Snippet ──────────────────────────────────────────────── */}
      <p
        className="text-ink-mid m-0 line-clamp-2"
        style={{
          fontFamily: 'Georgia, serif',
          fontStyle: 'italic',
          fontSize: 12.5,
          lineHeight: 1.55,
          paddingRight: 24,
        }}
      >
        &ldquo;{matchedOn.text}&rdquo;
      </p>

      <ChevronRightIcon
        aria-hidden="true"
        className={[
          'absolute bottom-3 right-3 h-3.5 w-3.5 transition-[color,opacity] duration-150',
          isActive ? 'text-blue opacity-100' : 'text-ink-mute opacity-60',
        ].join(' ')}
      />
    </button>
  );
}
