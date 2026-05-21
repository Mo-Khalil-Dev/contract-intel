import { SearchIcon } from '@/components/core/icons';
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
 * explains *why*, doesn't apologise. See visual spec §4.2.
 */
export function EmptyPrecedentState({ clauseType }: EmptyPrecedentStateProps) {
  const typeName = clauseType ? humaniseClauseType(clauseType) : null;

  return (
    <div className="mx-auto flex max-w-[280px] flex-col items-center pt-8 text-center">
      <div className="bg-surfaceAlt text-inkMute mb-4 flex h-12 w-12 items-center justify-center rounded-full">
        <SearchIcon className="h-5 w-5" aria-hidden="true" />
      </div>
      <h3 className="text-ink mb-2 text-sm font-semibold">
        No similar clauses found yet
      </h3>
      <p className="text-inkSoft text-xs leading-relaxed">
        {typeName
          ? `This is the first ${typeName} clause in your portfolio, or none of your existing ones are close enough to compare meaningfully.`
          : "We couldn't find clauses similar enough to compare meaningfully."}
        {' '}As you add more contracts, precedents will appear here.
      </p>
    </div>
  );
}
