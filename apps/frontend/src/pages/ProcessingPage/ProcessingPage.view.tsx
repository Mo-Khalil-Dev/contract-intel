import type { ReactNode } from 'react';
import { CheckCircle2, AlertTriangle } from 'lucide-react';
import { Button } from '../HomePageV2/components/Button';
import styles from './ProcessingPage.module.css';
import type { ProcessingStatusResponse } from '@/types/processing';

/**
 * Six wireframe steps. Each entry is purely cosmetic — the index is what
 * the container drives via `displayedStep`. The mapping from backend
 * status → max-allowed-step lives in the container.
 */
export const PROCESSING_STEPS = [
  { label: 'Reading document', desc: 'Extracting text from your PDF' },
  { label: 'Identifying parties', desc: 'Finding who signed this contract' },
  { label: 'Extracting key terms', desc: 'Dates, values, payment schedules' },
  { label: 'Analyzing risk clauses', desc: 'Liability, indemnity, IP, termination' },
  { label: 'Scoring and ranking', desc: 'Prioritizing flags by severity' },
  { label: 'Building your report', desc: 'Formatting results and recommendations' },
] as const;

/** Rotating tip banner copy. */
export const PROCESSING_TIPS = [
  'ContractIntel identifies risks that junior lawyers commonly miss on first read.',
  'Average contract has 4.2 risk flags worth negotiating.',
  'Unlimited liability clauses appear in 1 in 3 vendor contracts.',
  'Auto-renewal clauses cost businesses £12k/year on average when missed.',
  'Our AI is trained on 50,000+ real contracts across all major industries.',
] as const;

export interface ProcessingPageViewProps {
  documentId: string | undefined;
  filename?: string;
  status: ProcessingStatusResponse | undefined;
  isLoading: boolean;
  isError: boolean;
  isRetrying: boolean;
  /** Step index 0..5 currently shown as active. Steps below are checked,
   *  above are pending. Pure display state — owned by the container. */
  displayedStep: number;
  /** Tip index — container rotates this on a timer. */
  tipIndex: number;
  /** 0..100. Driven by the container, not the steps — separate animation
   *  so the bar fills smoothly even when the step index is clamped. */
  progressPercent: number;
  onRetry: () => void;
  onUploadAnother: () => void;
  onBackToDashboard: () => void;
}

/**
 * Pure presentational component. All state — step index, tip index,
 * progress percentage — lives in the container. Storybook drives this
 * with fixture values to exercise every visual variant.
 */
export function ProcessingPageView({
  documentId,
  filename,
  status,
  isLoading,
  isError,
  isRetrying,
  displayedStep,
  tipIndex,
  progressPercent,
  onRetry,
  onUploadAnother,
  onBackToDashboard,
}: ProcessingPageViewProps) {
  // ── Loading / network-error preludes ──────────────────────────────
  if (isLoading || !status) {
    return (
      <Layout>
        <RunningHeader
          progressPercent={progressPercent}
          title="Loading…"
          filename={filename ?? documentId}
        />
        <StepList displayedStep={displayedStep} />
        <Tip text={PROCESSING_TIPS[tipIndex]} />
      </Layout>
    );
  }

  if (isError) {
    return (
      <Layout>
        <FailedHeader title="Couldn't load status" />
        <ErrorCard reason="We hit a problem reading the processing state. Try refreshing the page." />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onBackToDashboard}>
            Back to dashboard
          </Button>
        </div>
      </Layout>
    );
  }

  // ── Terminal: extraction complete ─────────────────────────────────
  if (status.extractionStatus === 'extraction_complete') {
    return (
      <Layout>
        <SuccessHeader title="Analysis complete!" filename={filename ?? documentId} />
        <StepList displayedStep={5} allComplete />
        <Tip text={PROCESSING_TIPS[tipIndex]} />
      </Layout>
    );
  }

  // ── Terminal: extraction failed ───────────────────────────────────
  if (status.extractionStatus === 'extraction_failed') {
    return (
      <Layout>
        <FailedHeader title="Analysis couldn't complete" />
        <ErrorCard
          reason={status.failureReason ?? 'unknown'}
          subtitle="The clause-extraction step ran into a problem we can't recover from automatically."
        />
        <div className={styles.actions}>
          <Button variant="secondary" onClick={onUploadAnother}>
            Upload another
          </Button>
          <Button onClick={onBackToDashboard}>Back to dashboard</Button>
        </div>
      </Layout>
    );
  }

  // ── Terminal: OCR failed ──────────────────────────────────────────
  if (status.status === 'ocr_failed') {
    return (
      <Layout>
        <FailedHeader title="OCR couldn't complete" />
        <ErrorCard
          reason={status.failureReason ?? 'unknown'}
          subtitle="Something went wrong extracting text from your contract."
          retryCount={status.userRetryCount}
        />
        <div className={styles.actions}>
          {status.canRetry && (
            <Button onClick={onRetry} disabled={isRetrying}>
              {isRetrying ? 'Retrying…' : 'Retry OCR'}
            </Button>
          )}
          <Button variant="secondary" onClick={onUploadAnother}>
            Upload another
          </Button>
        </div>
      </Layout>
    );
  }

  // ── Active processing (OCR or extraction running) ─────────────────
  return (
    <Layout>
      <RunningHeader
        progressPercent={progressPercent}
        title="Analyzing your contract…"
        filename={filename ?? documentId}
      />
      <StepList displayedStep={displayedStep} />
      <Tip text={PROCESSING_TIPS[tipIndex]} />
    </Layout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className={styles.root}>
      <div className={styles.card}>{children}</div>
    </div>
  );
}

function RunningHeader({
  progressPercent,
  title,
  filename,
}: {
  progressPercent: number;
  title: string;
  filename: string | undefined;
}) {
  const clamped = Math.max(0, Math.min(100, progressPercent));
  return (
    <>
      <Spinner progressPercent={clamped} />
      <h1 className={styles.title}>{title}</h1>
      {filename && <p className={styles.filename}>{filename}</p>}
      <ProgressBar percent={clamped} />
    </>
  );
}

function SuccessHeader({
  title,
  filename,
}: {
  title: string;
  filename: string | undefined;
}) {
  return (
    <>
      <div className={styles.successIcon}>
        <CheckCircle2 size={32} strokeWidth={2} aria-hidden="true" />
      </div>
      <h1 className={styles.title}>{title}</h1>
      {filename && <p className={styles.filename}>{filename}</p>}
      <ProgressBar percent={100} success />
    </>
  );
}

function FailedHeader({ title }: { title: string }) {
  return (
    <>
      <div className={styles.failedIcon}>
        <AlertTriangle size={32} strokeWidth={2} aria-hidden="true" />
      </div>
      <h1 className={styles.title}>{title}</h1>
    </>
  );
}

function Spinner({ progressPercent }: { progressPercent: number }) {
  // Arc length is 2π·r where r=34 → circumference ≈ 213.6. We draw the
  // fraction we want via strokeDasharray; the rest is gap.
  const C = 213.6;
  const filled = (progressPercent / 100) * C;
  return (
    <div className={styles.spinnerWrap}>
      <svg
        className={styles.spinnerSvg}
        width="80"
        height="80"
        viewBox="0 0 80 80"
        role="presentation"
        aria-hidden="true"
      >
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="var(--color-border)"
          strokeWidth="5"
        />
        <circle
          cx="40"
          cy="40"
          r="34"
          fill="none"
          stroke="var(--color-blue)"
          strokeWidth="5"
          strokeDasharray={`${filled} ${C}`}
          strokeLinecap="round"
          strokeDashoffset="53.4"
          style={{ transition: 'stroke-dasharray 0.4s ease' }}
        />
      </svg>
      <div className={styles.spinnerPercent} aria-live="polite">
        {Math.round(progressPercent)}%
      </div>
    </div>
  );
}

function ProgressBar({ percent, success }: { percent: number; success?: boolean }) {
  return (
    <div
      className={styles.progressTrack}
      role="progressbar"
      aria-label="Contract analysis progress"
      aria-valuenow={Math.round(percent)}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={
          success
            ? `${styles.progressFill} ${styles.progressFillSuccess}`
            : styles.progressFill
        }
        style={{ width: `${percent}%` }}
      />
    </div>
  );
}

function StepList({
  displayedStep,
  allComplete,
}: {
  displayedStep: number;
  allComplete?: boolean;
}) {
  return (
    <ol className={styles.steps} aria-label="Processing steps">
      {PROCESSING_STEPS.map((s, i) => {
        const isDone = allComplete || i < displayedStep;
        const isActive = !allComplete && i === displayedStep;
        const isPending = !isDone && !isActive;
        return (
          <li
            key={s.label}
            className={`${styles.step} ${isPending ? styles.stepPending : ''}`}
            aria-current={isActive ? 'step' : undefined}
          >
            <span
              className={`${styles.stepIcon} ${
                isDone
                  ? styles.stepIconDone
                  : isActive
                    ? styles.stepIconActive
                    : ''
              }`}
              aria-hidden="true"
            >
              {isDone ? (
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path
                    d="M2 5l2.5 2.5 3.5-4"
                    stroke="#fff"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : isActive ? (
                <span className={styles.stepPulse} />
              ) : null}
            </span>
            <div className={styles.stepBody}>
              <div
                className={`${styles.stepLabel} ${
                  isDone || isActive ? styles.stepLabelReached : ''
                }`}
              >
                {s.label}
              </div>
              {isActive && <div className={styles.stepDesc}>{s.desc}</div>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

function Tip({ text }: { text: string }) {
  return (
    <div className={styles.tip} aria-live="polite">
      {text}
    </div>
  );
}

function ErrorCard({
  reason,
  subtitle,
  retryCount,
}: {
  reason: string;
  subtitle?: string;
  retryCount?: number;
}) {
  return (
    <div className={styles.errorCard} role="alert">
      {subtitle && (
        <p
          className={styles.stepDesc}
          style={{ marginBottom: 8, color: 'var(--color-ink-mid)' }}
        >
          {subtitle}
        </p>
      )}
      <p className={styles.errorHeading}>Reason</p>
      <p className={styles.errorReason}>{reason}</p>
      {typeof retryCount === 'number' && retryCount > 0 && (
        <p className={styles.retryCount}>{retryCount} of 3 retries used</p>
      )}
    </div>
  );
}
