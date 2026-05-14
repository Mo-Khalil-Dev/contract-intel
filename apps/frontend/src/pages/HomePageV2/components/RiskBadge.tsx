import { riskBg, riskColor } from '../tokens';
import styles from './RiskBadge.module.css';

interface RiskBadgeProps {
  score: number;
  size?: 'sm' | 'lg';
}

/**
 * Coloured risk pill (red/orange/green based on score).
 * The score colour drives both text and the leading dot.
 */
export function RiskBadge({ score, size = 'sm' }: RiskBadgeProps) {
  const color = riskColor(score);
  const bg = riskBg(score);

  return (
    <span
      className={`${styles.badge} ${size === 'lg' ? styles.lg : styles.sm}`}
      style={{
        background: bg,
        color,
        borderColor: `${color}33`,
      }}
    >
      <span
        className={`${styles.dot} ${size === 'lg' ? styles.dotLg : styles.dotSm}`}
        style={{ background: color }}
      />
      {/* Backend serves 0–100 ints. Display whole numbers; tolerate
          fractional scores (e.g. averages) by rounding to one decimal. */}
      {Number.isInteger(score) ? score : score.toFixed(1)}
    </span>
  );
}
