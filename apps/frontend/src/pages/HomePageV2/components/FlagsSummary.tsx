import { T } from '../tokens';
import styles from './FlagsSummary.module.css';

interface FlagsSummaryProps {
  /** Single rolled-up flag count (matches the real DashboardViewModel shape). */
  count: number;
  /** Risk score (0–100) used to colour the bullet. */
  riskScore: number;
}

/**
 * Compact flag-count chip — one coloured bullet + the number.
 *
 * The wireframe shows separate red/orange/green tallies, but the real
 * backend DTO only exposes a single rolled-up `flagCount`. We colour
 * the bullet by the row's risk score so the urgency still reads visually.
 */
export function FlagsSummary({ count, riskScore }: FlagsSummaryProps) {
  if (count === 0) {
    return <span className={styles.empty}>—</span>;
  }
  const color = riskScore >= 70 ? T.red : riskScore >= 40 ? T.orange : T.green;
  return (
    <span className={styles.wrap}>
      <span className={styles.count} style={{ color }}>
        ●{count}
      </span>
    </span>
  );
}
