import { Button } from './Button';
import { track, useHoverTracker } from '@/analytics';
import styles from './DarkCallToActionCard.module.css';

interface DarkCallToActionCardProps {
  onUpload: () => void;
}

/**
 * The hero "Where to start" CTA card — dark navy with a blue radial
 * accent blob in the top-right, headline copy, primary Upload button
 * and a quiet file-format hint.
 */
export function DarkCallToActionCard({ onUpload }: DarkCallToActionCardProps) {
  const hover = useHoverTracker('dashboard_upload_cta_hovered', { source: 'where_to_start' });

  const handleUploadClick = () => {
    track('dashboard_upload_cta_clicked', { source: 'where_to_start' });
    onUpload();
  };

  return (
    <div
      className={styles.card}
      onClick={handleUploadClick}
      role="button"
      tabIndex={0}
      {...hover}
    >
      <div className={styles.blob} />
      <div className={styles.inner}>
        <div className={styles.eyebrow}>Where to start</div>
        <div className={styles.headline}>Send a contract for review</div>
        <p className={styles.copy}>
          Drop a PDF or Word file here and ContractIntel will run it against the Northwind playbook
          before passing it to a reviewer.
        </p>
        <div className={styles.actions}>
          <Button
            size="md"
            onClick={(e) => {
              e.stopPropagation();
              handleUploadClick();
            }}
          >
            + Upload contract
          </Button>
          <span className={styles.hint}>PDF, DOCX · up to 50 MB · 60s analysis</span>
        </div>
      </div>
    </div>
  );
}
