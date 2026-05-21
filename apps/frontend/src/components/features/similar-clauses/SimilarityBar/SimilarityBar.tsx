import { useSimilarityBar, type UseSimilarityBarProps } from './useSimilarityBar';

/**
 * Cosine-similarity bar + `{n}% match` label. Used as the leftmost,
 * scannable element of every PrecedentRow (Phase 11). Reusable across
 * Phase 11 features and Phase 12 outlier UI — flagged in the
 * component inventory in `docs/design/similar-clauses-visual.md` §6.
 */
export function SimilarityBar(props: UseSimilarityBarProps) {
  const { fillStyle, displayPercent, ariaValueNow, ariaLabel } =
    useSimilarityBar(props);

  return (
    <div
      className="inline-flex items-center gap-2"
      role="progressbar"
      aria-valuenow={ariaValueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div className="bg-border h-[5px] w-[88px] overflow-hidden rounded-[3px]">
        <div className="h-full rounded-[3px] transition-all" style={fillStyle} />
      </div>
      <span className="text-inkMid font-mono text-xs font-semibold">
        {displayPercent}% match
      </span>
    </div>
  );
}
