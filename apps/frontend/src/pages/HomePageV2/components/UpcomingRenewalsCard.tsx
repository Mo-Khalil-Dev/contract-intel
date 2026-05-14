import type { UrgentRenewalItem } from '../types';
import { urgencyColor } from '../tokens';
import styles from './UpcomingRenewalsCard.module.css';

interface UpcomingRenewalsCardProps {
  renewals: UrgentRenewalItem[];
  onSeeAll: () => void;
  onRowClick: (renewal: UrgentRenewalItem) => void;
}

function formatRenewalDate(raw: string | Date): string {
  const d = raw instanceof Date ? raw : new Date(raw);
  if (Number.isNaN(d.getTime())) return String(raw);
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
}

/** Card listing upcoming renewals, ordered by daysRemaining. */
export function UpcomingRenewalsCard({
  renewals,
  onSeeAll,
  onRowClick,
}: UpcomingRenewalsCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <div className={styles.title}>Upcoming renewals</div>
        <button type="button" className={styles.seeAll} onClick={onSeeAll}>
          All →
        </button>
      </div>
      {renewals.length === 0 && <div className={styles.empty}>No upcoming renewals.</div>}
      {renewals.map((r) => {
        const color = urgencyColor(r.urgency);
        return (
          <div
            key={r.id}
            className={styles.row}
            style={{ borderLeftColor: color }}
            onClick={() => onRowClick(r)}
          >
            <div className={styles.rowTitle}>{r.contractName}</div>
            <div className={styles.rowMeta}>
              <span className={styles.metaText}>
                {formatRenewalDate(r.renewalDate)} · {r.party}
              </span>
              <span className={styles.metaCountdown} style={{ color }}>
                {r.daysRemaining < 0
                  ? `${Math.abs(r.daysRemaining)}d late`
                  : `${r.daysRemaining}d`}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
