import { sevColor, type Severity } from '@/config/designTokens';

export interface UseFlagsSummaryProps {
  red?: number;
  orange?: number;
  green?: number;
}

export interface FlagEntry {
  severity: Severity;
  count: number;
  color: string;
}

export interface UseFlagsSummaryResult {
  entries: FlagEntry[];
  isEmpty: boolean;
  ariaLabel: string;
}

export function useFlagsSummary({
  red = 0,
  orange = 0,
  green = 0,
}: UseFlagsSummaryProps): UseFlagsSummaryResult {
  const entries: FlagEntry[] = (
    [
      { severity: 'red', count: red },
      { severity: 'orange', count: orange },
      { severity: 'green', count: green },
    ] as const
  )
    .filter((entry) => entry.count > 0)
    .map((entry) => ({
      severity: entry.severity,
      count: entry.count,
      color: sevColor(entry.severity),
    }));

  const hasUrgent = red > 0 || orange > 0;

  return {
    entries,
    isEmpty: !hasUrgent,
    ariaLabel: hasUrgent
      ? `${red} critical, ${orange} warning, ${green} info flags`
      : 'No critical or warning flags',
  };
}
