import { useRiskBadge, type UseRiskBadgeProps } from './useRiskBadge';

export function RiskBadge(props: UseRiskBadgeProps) {
  const {
    containerStyle,
    dotStyle,
    containerClass,
    dotClass,
    scoreClass,
    ariaLabel,
    displayScore,
  } = useRiskBadge(props);

  return (
    <span className={containerClass} style={containerStyle} role="status" aria-label={ariaLabel}>
      <span className={dotClass} style={dotStyle} aria-hidden="true" />
      <span className={scoreClass}>{displayScore}</span>
    </span>
  );
}
