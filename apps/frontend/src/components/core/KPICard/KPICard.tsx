import { Card, CardContent } from '@/components/ui/card';
import { useKPICard, type UseKPICardProps } from './useKPICard';

export function KPICard(props: UseKPICardProps) {
  const { label, value, delta, hint } = props;
  const { deltaColor, deltaSymbol } = useKPICard(props);

  return (
    <Card>
      <CardContent className="space-y-1 p-md">
        <p className="text-ink-soft text-xs font-semibold uppercase tracking-tight">{label}</p>
        <p className="text-ink text-3xl font-extrabold tracking-tighter">{value}</p>
        {delta && (
          <p className="font-mono text-xs font-bold" style={{ color: deltaColor }}>
            <span aria-hidden="true">{deltaSymbol}</span> {delta.text}
          </p>
        )}
        {hint && <p className="text-ink-mute text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
