import styles from './UploadProgress.module.css';

interface UploadProgressProps {
  /** 0..100 — clamped. */
  progress: number;
  /** Optional status label shown above the bar. */
  label?: string;
}

export function UploadProgress({ progress, label }: UploadProgressProps) {
  const pct = Math.max(0, Math.min(100, progress));
  const done = pct >= 100;

  return (
    <div className={styles.wrap}>
      <div className={styles.row}>
        <span className={styles.label}>{label ?? (done ? 'Finalising…' : 'Uploading…')}</span>
        <span className={styles.percent}>{Math.round(pct)}%</span>
      </div>
      <div
        className={styles.track}
        role="progressbar"
        aria-valuenow={Math.round(pct)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label ?? 'Upload progress'}
      >
        <div className={styles.fill} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
