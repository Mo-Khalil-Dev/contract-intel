import { Card, CardContent } from '@/components/ui/card';
import { useKPICard, type UseKPICardProps } from './useKPICard';

export function KPICard(props: UseKPICardProps) {
  const { label, value, delta, hint } = props;
  const { deltaColor, deltaSymbol } = useKPICard(props);

  return (
    <Card>
      <CardContent className="space-y-0.5 p-md">
        <p className="text-ink-soft text-xs font-semibold uppercase tracking-tight leading-tight">{label}</p>
        <p className="text-ink-950 text-2xl font-bold leading-tight">{value}</p>
        {hint && <p className="text-ink-mute text-xs">{hint}</p>}
      </CardContent>
    </Card>
  );
}
