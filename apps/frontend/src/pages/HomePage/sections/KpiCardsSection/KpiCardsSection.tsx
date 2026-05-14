import { KPICard } from '@/components/core/KPICard';
import { RiskBadge } from '@/components/core/RiskBadge';
import { DashboardKpis } from '@/types/referenceData';
import styles from './KpiCardsSection.module.css';

interface KpiCardsSectionProps {
  kpis: DashboardKpis;
}

export function KpiCardsSection({ kpis }: KpiCardsSectionProps) {
  return (
    <section className={styles.section}>
      <div className={styles.grid}>
        <KPICard
          label="Active Contracts"
          value={kpis.activeContractCount}
          delta={{ direction: 'up', text: '+5 vs last week' }}
        />

        <KPICard
          label="Avg Risk Score"
          value={
            <span className={styles.riskValue}>
              {kpis.avgRiskScore} <RiskBadge score={kpis.avgRiskScore} />
            </span>
          }
        />

        <KPICard
          label="Critical Flags Open"
          value={kpis.criticalFlagCount}
          delta={{ direction: 'down', text: '-2 vs last week' }}
        />

        <KPICard
          label="Renewals <60 Days"
          value={kpis.urgentRenewalCount}
          delta={{ direction: 'flat', text: 'No change' }}
        />
      </div>
    </section>
  );
}
