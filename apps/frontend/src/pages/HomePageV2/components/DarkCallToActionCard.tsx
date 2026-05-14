import { Button } from './Button';
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
  return (
    <div className={styles.card} onClick={onUpload} role="button" tabIndex={0}>
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
              onUpload();
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
