import { colors } from '@/config/designTokens';

export interface UseSimilarityBarProps {
  /** Cosine similarity in [0, 1]; higher = closer. */
  value: number;
}

export interface UseSimilarityBarResult {
  fillStyle: { width: string; backgroundColor: string };
  displayPercent: number;
  ariaValueNow: number;
  ariaLabel: string;
}

/**
 * Stateless presenter for the similarity-bar geometry + label. Clamps
 * out-of-range values to [0, 1] defensively — the backend already
 * guarantees the range but we don't want a bad value to overflow the
 * bar in production.
 */
export function useSimilarityBar({
  value,
}: UseSimilarityBarProps): UseSimilarityBarResult {
  const clamped = Math.max(0, Math.min(value, 1));
  const percent = Math.round(clamped * 100);

  return {
    fillStyle: {
      width: `${percent}%`,
      backgroundColor: colors.blue,
    },
    displayPercent: percent,
    ariaValueNow: percent,
    ariaLabel: `${percent} percent match`,
  };
}
