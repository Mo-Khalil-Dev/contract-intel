import { colors } from '@/config/designTokens';
import type { ReactNode } from 'react';

export type KPIDelta = 'up' | 'down' | 'flat';

export interface UseKPICardProps {
  label: string;
  value: ReactNode;
  delta?: { direction: KPIDelta; text: string };
  hint?: string;
}

export interface UseKPICardResult {
  deltaColor: string;
  deltaSymbol: string;
}

const deltaColors: Record<KPIDelta, string> = {
  up: colors.green,
  down: colors.red,
  flat: colors.inkSoft,
};

const deltaSymbols: Record<KPIDelta, string> = {
  up: '▲',
  down: '▼',
  flat: '·',
};

export function useKPICard({ delta }: UseKPICardProps): UseKPICardResult {
  const direction = delta?.direction ?? 'flat';
  return {
    deltaColor: deltaColors[direction],
    deltaSymbol: deltaSymbols[direction],
  };
}
