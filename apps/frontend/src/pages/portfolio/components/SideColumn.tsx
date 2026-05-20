import type { DocumentListSummary } from '@/types/contracts';
import styles from './SideColumn.module.css';

interface SideColumnProps {
  summary: DocumentListSummary;
  isLoading: boolean;
}

export function SideColumn({ summary, isLoading }: SideColumnProps) {
  const analysed = summary.analysed;
  const unlimited = summary.unlimitedLiability;
  const capped = Math.max(0, analysed - unlimited);

  const liabilityRows = [
    { label: 'Capped', count: capped,    color: '#10B981' },
    { label: 'Unlimited / unknown', count: unlimited, color: '#EF4444' },
  ];

  return (
    <div className={styles.col}>
      {/* Liability exposure */}
      <div className={styles.card}>
        <p className={styles.cardTitle}>Liability exposure</p>

        {!isLoading && liabilityRows.map((row) => {
          const pct = analysed > 0 ? (row.count / analysed) * 100 : 0;
          return (
            <div key={row.label} className={styles.liabilityRow}>
              <div className={styles.liabilityRowHeader}>
                <span className={styles.liabilityLabel}>{row.label}</span>
                <span className={styles.liabilityCount} style={{ color: row.color }}>
                  {row.count}
                </span>
              </div>
              <div className={styles.liabilityTrack}>
                <div
                  className={styles.liabilityFill}
                  style={{ width: `${pct}%`, background: row.color }}
                />
              </div>
            </div>
          );
        })}

        {!isLoading && unlimited > 0 && (
          <div className={styles.alert}>
            <strong>⚠ Action needed.</strong> {unlimited} contract{unlimited !== 1 ? 's' : ''} with
            unlimited or unknown liability.
          </div>
        )}
      </div>

      {/* Upcoming renewals — data not yet available from API */}
      <div className={styles.card}>
        <div className={styles.renewalsHeader}>
          <p className={styles.cardTitle} style={{ margin: 0 }}>Upcoming renewals</p>
          <span className={styles.renewalsSub}>Next 90 days</span>
        </div>
        <p className={styles.empty}>Renewals data coming soon.</p>
      </div>
    </div>
  );
}
