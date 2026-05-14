import { Button } from '../HomePageV2/components/Button';
import { TopNav } from '../HomePageV2/components/TopNav';
import { ConsentCheckbox } from './components/ConsentCheckbox';
import { FileSelectedCard } from './components/FileSelectedCard';
import { TrustBadges } from './components/TrustBadges';
import { UploadDropzone } from './components/UploadDropzone';
import { UploadProgress } from './components/UploadProgress';
import styles from './UploadPage.module.css';

interface UploadPageProps {
  file: File | null;
  consent: boolean;
  isUploading: boolean;
  progress: number;
  error: string | null;
  userInitials: string;
  onFileSelected: (file: File) => void;
  onFileRemoved: () => void;
  onValidationError: (reason: 'file_too_large' | 'invalid_type', message: string) => void;
  onConsentChange: (checked: boolean) => void;
  onSubmit: () => void;
  onCancel: () => void;
  onNav: (id: string) => void;
}

/**
 * Pure presentational upload screen. The container owns the file +
 * consent state and the upload flow; this component just lays it out.
 *
 * Wireframe: wirframes/version_02/design_handoff_ci_redesign/screens/upload.html
 * (`UploadScreen` in `screens-a.jsx`).
 */
export function UploadPage({
  file,
  consent,
  isUploading,
  progress,
  error,
  userInitials,
  onFileSelected,
  onFileRemoved,
  onValidationError,
  onConsentChange,
  onSubmit,
  onCancel,
  onNav,
}: UploadPageProps) {
  const canSubmit = !!file && consent && !isUploading;
  const hasError = !!error;
  const submitLabel = isUploading
    ? 'Uploading…'
    : hasError && file
      ? 'Try again'
      : 'Analyze contract';

  // Helper text under the submit button explaining why it's disabled,
  // so the user knows what's missing without having to guess.
  const disabledHint = !file
    ? 'Pick a PDF to continue.'
    : !consent
      ? 'Tick the consent box to continue.'
      : null;

  return (
    <div className={styles.root}>
      <TopNav active="upload" userInitials={userInitials} onNav={onNav} />

      <main className={styles.main}>
        <header className={styles.header}>
          <h1 className={styles.title}>Upload a contract</h1>
          <p className={styles.subtitle}>
            PDF, up to 50&nbsp;MB. Analysis runs in about a minute.
          </p>
        </header>

        <section className={styles.body}>
          {!file ? (
            <UploadDropzone
              onFileSelected={onFileSelected}
              onValidationError={onValidationError}
              error={error}
              disabled={isUploading}
            />
          ) : (
            <FileSelectedCard
              file={file}
              onRemove={onFileRemoved}
              removable={!isUploading}
            />
          )}

          {isUploading && (
            <div className={styles.progressWrap} aria-live="polite">
              <UploadProgress progress={progress} />
            </div>
          )}

          {error && file && (
            <div role="alert" aria-live="assertive" className={styles.error}>
              {error}
            </div>
          )}

          <ConsentCheckbox
            checked={consent}
            onChange={onConsentChange}
            disabled={isUploading}
          />

          <div className={styles.actions}>
            <Button variant="secondary" onClick={onCancel} disabled={isUploading}>
              {isUploading ? 'Stop' : 'Cancel'}
            </Button>
            <Button
              onClick={onSubmit}
              disabled={!canSubmit}
              full
              aria-describedby={disabledHint ? 'submit-hint' : undefined}
            >
              {submitLabel}
            </Button>
          </div>

          {disabledHint && !isUploading && (
            <div id="submit-hint" className={styles.hint}>
              {disabledHint}
            </div>
          )}

          <div className={styles.footer}>
            <TrustBadges />
          </div>
        </section>
      </main>
    </div>
  );
}
