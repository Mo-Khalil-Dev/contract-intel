import { useRef, useState } from 'react';
import { Upload } from 'lucide-react';
import { ACCEPTED_EXTENSIONS, MAX_FILE_SIZE_BYTES } from '@/types/documents';
import styles from './UploadDropzone.module.css';

interface UploadDropzoneProps {
  /** Called with a validated File when the user picks/drops one. */
  onFileSelected: (file: File) => void;
  /** Called when validation fails — reason is suitable for analytics. */
  onValidationError?: (reason: 'file_too_large' | 'invalid_type', message: string) => void;
  /** Any error message to display below the zone (validation or upload). */
  error?: string | null;
  /** Disabled while an upload is in flight. */
  disabled?: boolean;
}

const ACCEPT_ATTR = ACCEPTED_EXTENSIONS.join(',');

export function UploadDropzone({
  onFileSelected,
  onValidationError,
  error,
  disabled = false,
}: UploadDropzoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function validateAndPick(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE_BYTES) {
      onValidationError?.('file_too_large', 'File is larger than 50 MB.');
      return;
    }
    // Accept by extension OR MIME (some browsers don't set MIME for drag-and-drop).
    const name = file.name.toLowerCase();
    const extensionOk = ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext));
    const mimeOk = file.type === 'application/pdf';
    if (!extensionOk && !mimeOk) {
      onValidationError?.('invalid_type', 'Only PDF files are accepted.');
      return;
    }

    onFileSelected(file);
  }

  function openPicker() {
    if (disabled) return;
    inputRef.current?.click();
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
    if (disabled) return;
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      openPicker();
    }
  }

  return (
    <div>
      <div
        className={`${styles.zone} ${dragging ? styles.zoneDragging : ''} ${
          disabled ? styles.zoneDisabled : ''
        }`}
        onClick={openPicker}
        onKeyDown={onKeyDown}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-disabled={disabled}
        aria-label="Upload a PDF file. Drag and drop or click to choose."
        onDragOver={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          if (disabled) return;
          e.preventDefault();
          setDragging(false);
          validateAndPick(e.dataTransfer.files);
        }}
      >
        <div className={styles.iconWrap}>
          <Upload size={22} strokeWidth={2} aria-hidden="true" />
        </div>
        <div className={styles.title}>
          {dragging ? 'Drop to upload' : 'Drag a PDF here to upload'}
        </div>
        <div className={styles.subtitle}>or click to browse from your computer</div>
        <div className={styles.metaRow}>
          <span className={styles.tag}>PDF</span>
          <span className={styles.metaText}>· up to 50 MB · 60s analysis</span>
        </div>

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR}
          className={styles.hiddenInput}
          onChange={(e) => validateAndPick(e.target.files)}
          aria-hidden="true"
          tabIndex={-1}
        />
      </div>

      {error && (
        <div role="alert" className={styles.error}>
          {error}
        </div>
      )}
    </div>
  );
}
