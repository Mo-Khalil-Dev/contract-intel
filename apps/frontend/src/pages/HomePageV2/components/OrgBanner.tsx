import styles from './OrgBanner.module.css';

interface OrgBannerProps {
  orgName: string;
  workspace: string;
  systemStatus?: string;
}

/**
 * Slim white banner under the dark nav: org name + workspace label
 * on the left, system-status pulse + label on the right.
 */
export function OrgBanner({
  orgName,
  workspace,
  systemStatus = 'All systems operational',
}: OrgBannerProps) {
  return (
    <div className={styles.banner}>
      <div className={styles.inner}>
        <div className={styles.orgGroup}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden>
            <rect x="1" y="1" width="12" height="12" rx="2" fill="#0F172A" />
            <path
              d="M4 10V4l3 4 3-4v6"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span className={styles.orgName}>{orgName}</span>
        </div>
        <span className={styles.dot}>·</span>
        <span>{workspace}</span>
        <span className={styles.status}>
          <span className={styles.statusPulse} />
          {systemStatus}
        </span>
      </div>
    </div>
  );
}
