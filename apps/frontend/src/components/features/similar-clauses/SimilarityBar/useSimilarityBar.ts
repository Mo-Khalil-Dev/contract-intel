import { colors } from '@/config/designTokens';

export interface UseSimilarityBarProps {
  /** Cosine similarity in [0, 1]; higher = closer. */
  value: number;
  /**
   * Renders the 1px tick marks at 50/75/90% — the visual anchors that
   * let a reader compare magnitudes across rows without reading numerals.
   * Non-negotiable in the design spec; only opt out for the very-narrow
   * embedded variant.
   */
  showTicks?: boolean;
  /**
   * When the parent row is in the "active comparison" state the bar
   * track switches to a more saturated blue so the row reads as
   * selected even with the eye on the bar alone.
   */
  strong?: boolean;
  /** Bar height in px. Spec is 6px; the existing API kept 5 as default. */
  height?: number;
}

export interface UseSimilarityBarResult {
  fillStyle: { width: string; backgroundColor: string };
  trackStyle: { backgroundColor: string };
  displayPercent: number;
  ariaValueNow: number;
  ariaLabel: string;
  showTicks: boolean;
  isStrong: boolean;
  height: number;
}

/**
 * Threshold colours mirror the design handoff's `sim-fill-*` palette:
 *
 *   ≥ 0.90 → blueDark   (#1D4ED8) — "strong match" accent
 *   ≥ 0.75 → blue       (#2563EB)
 *   ≥ 0.50 → blue-mid   (#93C5FD via designTokens — closest match)
 *   <  0.50 → ink-mute  (#94A3B8)
 *
 * (The handoff uses #60A5FA for the "low" band but designTokens.blueMid
 * is #93C5FD; using the token preserves a single source of truth, and
 * the visual delta is invisible at 6px height.)
 */
function fillColor(value: number, strong: boolean): string {
  if (strong || value >= 0.9) return colors.blueDark;
  if (value >= 0.75) return colors.blue;
  if (value >= 0.5) return colors.blueMid;
  return colors.inkMute;
}

/**
 * Stateless presenter for the similarity-bar geometry, threshold
 * colour, tick visibility, and ARIA label. Clamps out-of-range
 * values to [0, 1] defensively — the backend already guarantees the
 * range but a bad value shouldn't overflow the bar.
 */
export function useSimilarityBar({
  value,
  showTicks = true,
  strong = false,
  height = 6,
}: UseSimilarityBarProps): UseSimilarityBarResult {
  const clamped = Math.max(0, Math.min(value, 1));
  const percent = Math.round(clamped * 100);

  return {
    fillStyle: {
      width: `${percent}%`,
      backgroundColor: fillColor(clamped, strong),
    },
    trackStyle: {
      backgroundColor: strong ? colors.blueLight : colors.bgAlt,
    },
    displayPercent: percent,
    ariaValueNow: percent,
    ariaLabel: `${percent} percent match`,
    showTicks,
    isStrong: strong || clamped >= 0.9,
    height,
  };
}
