import { Badge } from '@/components/ui/badge';
import { UrgentRenewalItem } from '@/types/referenceData';
import styles from './UrgentRenewalsSection.module.css';

interface UrgentRenewalsSectionProps {
  renewals: UrgentRenewalItem[];
  onSelectRenewal: (renewalId: string) => void;
}

function getUrgencyBadge(urgency: string) {
  const urgencyMap: Record<string, 'default' | 'secondary' | 'destructive'> = {
    critical: 'destructive',
    high: 'secondary',
    medium: 'default',
  };
  return urgencyMap[urgency] || 'default';
}

export function UrgentRenewalsSection({
  renewals,
  onSelectRenewal,
}: UrgentRenewalsSectionProps) {
  const displayedRenewals = renewals.slice(0, 3);

  if (displayedRenewals.length === 0) {
    return (
      <section className={styles.section}>
        <h2 className={styles.title}>Urgent renewals</h2>
        <div className={styles.emptyState}>No urgent renewals</div>
      </section>
    );
  }

  return (
    <section className={styles.section}>
      <h2 className={styles.title}>Urgent renewals</h2>
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th scope="col">Contract</th>
              <th scope="col">Renewal date</th>
              <th scope="col">Days remaining</th>
              <th scope="col">Urgency</th>
            </tr>
          </thead>
          <tbody>
            {displayedRenewals.map((renewal) => (
              <tr
                key={renewal.id}
                className={`${styles.row} ${styles[`urgency-${renewal.urgency}`]}`}
                onClick={() => onSelectRenewal(renewal.id)}
                role="button"
                tabIndex={0}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    onSelectRenewal(renewal.id);
                  }
                }}
              >
                <td className={styles.nameCell}>{renewal.contractName}</td>
                <td className={styles.dateCell}>
                  {new Date(renewal.renewalDate).toLocaleDateString()}
                </td>
                <td className={styles.daysCell}>
                  <span className={styles[`days-${renewal.urgency}`]}>
                    {renewal.daysRemaining}d
                  </span>
                </td>
                <td>
                  <Badge variant={getUrgencyBadge(renewal.urgency)}>
                    {renewal.urgency}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
