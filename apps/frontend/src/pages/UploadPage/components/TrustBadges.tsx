import { Check } from 'lucide-react';
import styles from './TrustBadges.module.css';

const BADGES = ['End-to-end encrypted', 'Never shared with third parties', 'Delete anytime'];

export function TrustBadges() {
  return (
    <ul className={styles.list} aria-label="Privacy guarantees">
      {BADGES.map((label) => (
        <li key={label} className={styles.item}>
          <Check size={14} strokeWidth={2.5} aria-hidden="true" className={styles.icon} />
          <span>{label}</span>
        </li>
      ))}
    </ul>
  );
}
