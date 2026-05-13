import { riskColor, riskBg, riskLabel } from '@/config/designTokens';

export type RiskBadgeSize = 'sm' | 'lg';

export interface UseRiskBadgeProps {
  score: number;
  max?: number;
  size?: RiskBadgeSize;
}

export interface UseRiskBadgeResult {
  containerStyle: { backgroundColor: string };
  dotStyle: { backgroundColor: string };
  containerClass: string;
  dotClass: string;
  scoreClass: string;
  ariaLabel: string;
  displayScore: number;
}

const containerClasses: Record<RiskBadgeSize, string> = {
  sm: 'inline-flex items-center gap-1.5 rounded-md px-2 py-0.5',
  lg: 'inline-flex items-center gap-2 rounded-md px-3 py-1',
};

const dotClasses: Record<RiskBadgeSize, string> = {
  sm: 'w-1.5 h-1.5 rounded-full',
  lg: 'w-2 h-2 rounded-full',
};

const scoreClasses: Record<RiskBadgeSize, string> = {
  sm: 'font-mono font-bold text-xs',
  lg: 'font-mono font-bold text-sm',
};

export function useRiskBadge({
  score,
  max = 100,
  size = 'sm',
}: UseRiskBadgeProps): UseRiskBadgeResult {
  return {
    containerStyle: { backgroundColor: riskBg(score, max) },
    dotStyle: { backgroundColor: riskColor(score, max) },
    containerClass: containerClasses[size],
    dotClass: dotClasses[size],
    scoreClass: scoreClasses[size],
    ariaLabel: `${riskLabel(score, max)} — score ${Math.round(score)}`,
    displayScore: Math.round(score),
  };
}
