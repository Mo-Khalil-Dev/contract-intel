import { riskColor, riskLabel } from '@/config/designTokens';

export interface UseRiskBarProps {
  score: number;
  max?: number;
}

export interface UseRiskBarResult {
  fillStyle: { width: string; backgroundColor: string };
  ariaValueNow: number;
  ariaValueMax: number;
  ariaLabel: string;
  displayScore: number;
}

export function useRiskBar({ score, max = 100 }: UseRiskBarProps): UseRiskBarResult {
  const clamped = Math.max(0, Math.min(score, max));
  const percent = (clamped / max) * 100;

  return {
    fillStyle: {
      width: `${percent}%`,
      backgroundColor: riskColor(score, max),
    },
    ariaValueNow: clamped,
    ariaValueMax: max,
    ariaLabel: `${riskLabel(score, max)} — ${Math.round(clamped)} of ${max}`,
    displayScore: Math.round(clamped),
  };
}
