import { FileText, X } from 'lucide-react';
import styles from './FileSelectedCard.module.css';

interface FileSelectedCardProps {
  file: File;
  /** Called when the user clicks the ✕ to remove. Disabled if not provided. */
  onRemove?: () => void;
  /** Hide the remove button (e.g. while uploading). */
  removable?: boolean;
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function FileSelectedCard({ file, onRemove, removable = true }: FileSelectedCardProps) {
  return (
    <div className={styles.card}>
      <div className={styles.iconBox} aria-hidden="true">
        <FileText size={16} strokeWidth={1.5} />
      </div>
      <div className={styles.info}>
        <div className={styles.name} title={file.name}>
          {file.name}
        </div>
        <div className={styles.size}>{formatSize(file.size)}</div>
      </div>
      {removable && onRemove && (
        <button
          type="button"
          className={styles.remove}
          onClick={onRemove}
          aria-label={`Remove ${file.name}`}
        >
          <X size={16} strokeWidth={2} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
