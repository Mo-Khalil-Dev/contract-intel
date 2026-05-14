import { HTMLAttributes, ReactNode } from 'react';
import { T } from '../tokens';
import styles from './KpiCard.module.css';

interface KpiCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'children'> {
  label: string;
  value: ReactNode;
  sub?: string;
  /** Override colour for the big number — defaults to ink. */
  valueColor?: string;
}

/** Big-number tile used in the 4-up KPI strip. */
export function KpiCard({ label, value, sub, valueColor, ...rest }: KpiCardProps) {
  return (
    <div className={styles.card} {...rest}>
      <div className={styles.label}>{label}</div>
      <div className={styles.value} style={{ color: valueColor ?? T.ink }}>
        {value}
      </div>
      {sub && <div className={styles.sub}>{sub}</div>}
    </div>
  );
}
