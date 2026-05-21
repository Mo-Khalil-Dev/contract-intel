import { ArrowRightIcon } from '@/components/core/icons';
import { SimilarityBar } from '../SimilarityBar';
import { usePrecedentRow, type UsePrecedentRowProps } from './usePrecedentRow';

/**
 * One precedent row in the SimilarClausesDrawer (Phase 11). The whole
 * row is a single click target with an `isActive` accent for the row
 * the user just navigated into. Reused unchanged by Phase 11 US-CI-2
 * (Semantic Search) — see `docs/design/similar-clauses-visual.md` §6.
 *
 * JSX-only, all logic in usePrecedentRow.
 */
export function PrecedentRow(props: UsePrecedentRowProps) {
  const { similarity, type, textSnippet, metaLine, isActive, handleClick, handleKeyDown } =
    usePrecedentRow(props);

  return (
    <button
      type="button"
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      className={[
        'group block w-full rounded-lg border bg-surface px-4 py-3 text-left transition-colors',
        'hover:bg-surfaceAlt focus:outline-none focus-visible:ring-2 focus-visible:ring-blue',
        isActive ? 'border-blue ring-2 ring-blue/30' : 'border-border',
      ].join(' ')}
      aria-current={isActive ? 'true' : undefined}
    >
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <SimilarityBar value={similarity} />
        <ArrowRightIcon
          className={[
            'h-4 w-4 shrink-0 transition-colors',
            isActive ? 'text-blue' : 'text-inkMute group-hover:text-inkSoft',
          ].join(' ')}
          aria-hidden="true"
        />
      </div>
      <div className="text-ink mb-0.5 text-sm font-semibold">{type}</div>
      <div className="text-inkSoft mb-1.5 text-xs">{metaLine}</div>
      <p className="text-inkMid line-clamp-2 text-sm leading-snug">{textSnippet}</p>
    </button>
  );
}
