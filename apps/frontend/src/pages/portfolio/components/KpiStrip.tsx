import type { DocumentListSummary } from '@/types/contracts';
import styles from './KpiStrip.module.css';

interface KpiStripProps {
  summary: DocumentListSummary;
  isLoading: boolean;
}

function KpiCard({ label, value, hint }: { label: string; value: string | number; hint?: string }) {
  return (
    <div className={styles.card}>
      <p className={styles.label}>{label}</p>
      <p className={styles.value}>{value}</p>
      {hint && <p className={styles.hint}>{hint}</p>}
    </div>
  );
}

export function KpiStrip({ summary, isLoading }: KpiStripProps) {
  const blank = isLoading ? '—' : undefined;

  return (
    <div className={styles.strip} aria-label="Portfolio KPIs">
      <KpiCard label="Total contracts" value={blank ?? summary.totalContracts} />
      <KpiCard
        label="Analysed"
        value={blank ?? summary.analysed}
        hint={
          !isLoading && summary.totalContracts > 0
            ? `${Math.round((summary.analysed / summary.totalContracts) * 100)}% of total`
            : undefined
        }
      />
      <KpiCard
        label="Avg risk score"
        value={blank ?? (summary.avgRisk > 0 ? summary.avgRisk.toFixed(1) : '—')}
        hint="Out of 10"
      />
      <KpiCard label="Critical flags" value={blank ?? summary.criticalFlags} />
      <KpiCard label="Unlimited liability" value={blank ?? summary.unlimitedLiability} />
    </div>
  );
}
