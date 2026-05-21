import { useSimilarityBar, type UseSimilarityBarProps } from './useSimilarityBar';

/**
 * Cosine-similarity bar with threshold-coloured fill and tick marks at
 * 50/75/90%. The most-scannable element of every PrecedentRow and
 * ContractResultRow — reused across the Similar Clauses drawer, the
 * Semantic Search overlay, and the dedicated /search page.
 *
 * Geometry matches the design handoff: 6px tall, 6px radius, ticks
 * extend 2px above and below the track so they remain visible when
 * overlaid by the fill (via a lighter overlaid colour).
 */
export function SimilarityBar(props: UseSimilarityBarProps) {
  const { fillStyle, trackStyle, ariaValueNow, ariaLabel, showTicks, height } =
    useSimilarityBar(props);

  return (
    <div
      className="relative w-full"
      role="progressbar"
      aria-valuenow={ariaValueNow}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={ariaLabel}
    >
      <div
        className="overflow-hidden rounded-md"
        style={{ ...trackStyle, height }}
      >
        <div
          className="h-full rounded-md transition-[width] duration-300 ease-out"
          style={fillStyle}
        />
      </div>
      {showTicks && (
        <>
          <Tick percent={50} pastFill={ariaValueNow > 50} />
          <Tick percent={75} pastFill={ariaValueNow > 75} />
          <Tick percent={90} pastFill={ariaValueNow > 90} />
        </>
      )}
    </div>
  );
}

/**
 * One 1px vertical tick. `pastFill` switches the colour to a
 * white-overlay tone when the bar fill covers the tick, so the tick
 * stays visible against the coloured fill without competing with it.
 */
function Tick({ percent, pastFill }: { percent: number; pastFill: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute"
      style={{
        left: `${percent}%`,
        top: -2,
        bottom: -2,
        width: 1,
        backgroundColor: pastFill
          ? 'rgba(255, 255, 255, 0.5)'
          : 'var(--color-border-mid)',
      }}
    />
  );
}
