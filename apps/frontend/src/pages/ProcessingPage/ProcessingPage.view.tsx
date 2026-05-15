import { Loader2, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { Button } from '../HomePageV2/components/Button';
import styles from './ProcessingPage.module.css';
import type { ProcessingStatusResponse } from '@/types/processing';

/**
 * Presentational view. Driven entirely by props — no React Query, no
 * router. Containers wire it; Storybook drives it with fixture data.
 *
 * Four visual variants, one per status × retry-affordance combination:
 *   - processing         → spinner + "Extracting text…"
 *   - ocr_complete       → success flash; container auto-redirects
 *   - ocr_failed + retry → error card with "Retry OCR" button
 *   - ocr_failed + cap   → error card with "Upload another" only
 *
 * Initial `not_started` is rendered as "processing" — by the time the
 * page polls, the StartOcrProcessingHandler will have moved it on.
 */
export interface ProcessingPageViewProps {
  documentId: string | undefined;
  status: ProcessingStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  onRetry: () => void;
  onUploadAnother: () => void;
  onBackToDashboard: () => void;
}

export function ProcessingPageView({
  documentId,
  status,
  isLoading,
  isError,
  isRetrying,
  onRetry,
  onUploadAnother,
  onBackToDashboard,
}: ProcessingPageViewProps) {
  // ── Loading & network-error preludes ─────────────────────────────
  if (isLoading || !status) {
    return (
      <Layout>
        <Variant variant="processing" title="Loading…" subtitle="Checking your document's status." documentId={documentId} />
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <Variant
          variant="failed"
          title="Couldn't load status"
          subtitle="We hit a problem reading the processing state. Try refreshing the page."
          documentId={documentId}
        >
          <div className={styles.actions}>
            <Button variant="secondary" onClick={onBackToDashboard}>
              Back to dashboard
            </Button>
          </div>
        </Variant>
      </Layout>
    );
  }

  // ── Real states ──────────────────────────────────────────────────
  if (status.status === 'ocr_complete') {
    return (
      <Layout>
        <Variant
          variant="success"
          title="Analysis ready"
          subtitle="We've extracted the text. Taking you to the results."
          documentId={documentId}
        />
      </Layout>
    );
  }

  if (status.status === 'ocr_failed') {
    return (
      <Layout>
        <Variant
          variant="failed"
          title="OCR couldn't complete"
          subtitle="Something went wrong extracting text from your contract."
          documentId={documentId}
        >
          <div className={styles.errorCard} role="alert">
            <p className={styles.errorHeading}>Reason</p>
            <p className={styles.errorReason}>
              {status.failureReason ?? 'unknown'}
            </p>
            {status.userRetryCount > 0 && (
              <p className={styles.retryCount}>
                {status.userRetryCount} of 3 retries used
              </p>
            )}
          </div>
          <div className={styles.actions}>
            {status.canRetry ? (
              <Button onClick={onRetry} disabled={isRetrying}>
                <RefreshCw size={16} aria-hidden="true" />
                {isRetrying ? 'Retrying…' : 'Retry OCR'}
              </Button>
            ) : null}
            <Button variant="secondary" onClick={onUploadAnother}>
              Upload another
            </Button>
          </div>
        </Variant>
      </Layout>
    );
  }

  // not_started OR processing
  return (
    <Layout>
      <Variant
        variant="processing"
        title="Extracting text…"
        subtitle="This usually takes a few seconds for a digital PDF, longer for scanned pages."
        documentId={documentId}
      />
    </Layout>
  );
}

// ── Internal helpers (kept colocated; not exported) ─────────────────

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className={styles.root}>
      <main className={styles.main}>{children}</main>
    </div>
  );
}

interface VariantProps {
  variant: 'processing' | 'success' | 'failed';
  title: string;
  subtitle: string;
  documentId: string | undefined;
  children?: React.ReactNode;
}

function Variant({ variant, title, subtitle, documentId, children }: VariantProps) {
  return (
    <>
      <div
        className={`${styles.iconWrap} ${
          variant === 'processing'
            ? styles.iconWrapProcessing
            : variant === 'success'
              ? styles.iconWrapSuccess
              : styles.iconWrapFailed
        }`}
        aria-hidden="true"
      >
        {variant === 'processing' && (
          <Loader2 size={28} strokeWidth={2} className={styles.spinner} />
        )}
        {variant === 'success' && <CheckCircle2 size={28} strokeWidth={2} />}
        {variant === 'failed' && <AlertTriangle size={28} strokeWidth={2} />}
      </div>
      <h1 className={styles.title}>{title}</h1>
      <p className={styles.subtitle}>{subtitle}</p>
      {documentId && (
        <div className={styles.idRow}>
          <span className={styles.idLabel}>Document ID</span>
          <code className={styles.idValue}>{documentId}</code>
        </div>
      )}
      {children}
    </>
  );
}
