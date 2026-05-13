import { useRiskBar, type UseRiskBarProps } from './useRiskBar';

export function RiskBar(props: UseRiskBarProps) {
  const { fillStyle, ariaValueNow, ariaValueMax, ariaLabel, displayScore } = useRiskBar(props);

  return (
    <div
      className="inline-flex items-center gap-2"
      role="progressbar"
      aria-valuenow={ariaValueNow}
      aria-valuemin={0}
      aria-valuemax={ariaValueMax}
      aria-label={ariaLabel}
    >
      <div className="bg-border h-[5px] w-[72px] overflow-hidden rounded-[3px]">
        <div className="h-full rounded-[3px] transition-all" style={fillStyle} />
      </div>
      <span className="text-ink font-mono text-xs font-bold">{displayScore}</span>
    </div>
  );
}
