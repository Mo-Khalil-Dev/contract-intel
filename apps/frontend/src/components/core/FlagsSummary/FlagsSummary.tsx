import { useFlagsSummary, type UseFlagsSummaryProps } from './useFlagsSummary';

export function FlagsSummary(props: UseFlagsSummaryProps) {
  const { entries, isEmpty, ariaLabel } = useFlagsSummary(props);

  if (isEmpty) {
    return (
      <span className="text-ink-mute font-mono text-xs" aria-label={ariaLabel}>
        —
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2" aria-label={ariaLabel}>
      {entries.map((entry) => (
        <span key={entry.severity} className="inline-flex items-center gap-1">
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ backgroundColor: entry.color }}
            aria-hidden="true"
          />
          <span className="text-ink font-mono text-xs font-bold">{entry.count}</span>
        </span>
      ))}
    </span>
  );
}
