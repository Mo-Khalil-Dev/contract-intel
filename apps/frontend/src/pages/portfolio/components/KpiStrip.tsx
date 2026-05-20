import type { DocumentListSummary } from '@/types/contracts';
import { colors, riskColor } from '@/config/designTokens';
import styles from './KpiStrip.module.css';

interface KpiStripProps {
  summary: DocumentListSummary;
  isLoading: boolean;
}

function KpiCard({
  label,
  value,
  hint,
  valueColor,
}: {
  label: string;
  value: string | number;
  hint?: string;
  valueColor?: string;
}) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value} style={valueColor ? { color: valueColor } : undefined}>
        {value}
      </p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export function KpiStrip({ summary, isLoading }: KpiStripProps) {
  const blank = isLoading ? '—' : undefined;
  const avgRiskValue =
    !isLoading && summary.avgRisk > 0 ? summary.avgRisk.toFixed(1) : null;

  return (
    <div className={styles.strip} aria-label="Portfolio KPIs">
      <KpiCard
        label="Total contracts"
        value={blank ?? summary.totalContracts}
        hint={!isLoading ? `${summary.analysed} analysed` : undefined}
      />
      <KpiCard
        label="Average risk"
        value={blank ?? (avgRiskValue ?? '—')}
        hint="Out of 10.0"
        valueColor={avgRiskValue !== null ? riskColor(summary.avgRisk, 10) : undefined}
      />
      <KpiCard
        label="Critical flags"
        value={blank ?? summary.criticalFlags}
        hint="High severity"
        valueColor={!isLoading && summary.criticalFlags > 0 ? colors.red : undefined}
      />
      <KpiCard
        label="Unlimited liability"
        value={blank ?? summary.unlimitedLiability}
        hint="Contracts exposed"
        valueColor={
          !isLoading && summary.unlimitedLiability > 0 ? colors.red : undefined
        }
      />
    </div>
  );
}
