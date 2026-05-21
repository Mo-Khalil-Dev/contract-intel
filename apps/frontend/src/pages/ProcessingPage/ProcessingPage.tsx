import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  useProcessingStatus,
  useRetryOcr,
} from '@/hooks/useProcessingStatus';
import { ProcessingPageView, PROCESSING_TIPS } from './ProcessingPage.view';
import type { ProcessingStatusResponse } from '@/types/processing';

// ── Timing constants (UX-only — tune freely) ────────────────────────
/** Minimum dwell on each step before the next one may light up.
 *  Trimmed from 3000ms to keep the demo flow snappy — the 6-step
 *  animation now caps at ~5s end-to-end instead of 18s. */
const STEP_DWELL_MS = 800;
/** How long we hold the "Analysis complete!" page before redirecting.
 *  Trimmed from 5000ms for the same reason — enough to see the green
 *  card, not enough to twiddle thumbs. */
const SUCCESS_DWELL_MS = 1500;
/** How often the tip banner rotates. */
const TIP_ROTATE_MS = 4000;
/** Tick rate for the progress-bar fill — purely aesthetic, independent
 *  of the step machine. */
const PROGRESS_TICK_MS = 400;

const TOTAL_STEPS = 6; // mirrors PROCESSING_STEPS.length

/**
 * Container — polls /processing-status, runs the simulated step
 * progression with backend-clamped reality, rotates tips, and holds the
 * success state for SUCCESS_DWELL_MS before redirecting to /results so
 * the user has time to see what just happened.
 */
export function ProcessingPage() {
  const { documentId } = useParams<{ documentId: string }>();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useProcessingStatus(documentId);
  const retry = useRetryOcr(documentId);

  const [displayedStep, setDisplayedStep] = useState(0);
  const [tipIndex, setTipIndex] = useState(0);
  const [progressPercent, setProgressPercent] = useState(8);
  const successTimer = useRef<number | null>(null);

  const maxAllowedStep = computeMaxAllowedStep(data);
  const isExtractionComplete = data?.extractionStatus === 'extraction_complete';
  const isTerminalFail =
    data?.status === 'ocr_failed' ||
    data?.extractionStatus === 'extraction_failed';

  // ── Step advancement ─────────────────────────────────────────────
  // Every STEP_DWELL_MS we advance the displayed step toward
  // maxAllowedStep. Backend-clamped: if the backend is still on OCR,
  // displayedStep stops at 0 no matter how many ticks have passed.
  useEffect(() => {
    if (isTerminalFail) return;
    if (isExtractionComplete) {
      // Snap to last step on completion so the StepList shows all
      // checkmarks even if a tick was mid-flight.
      setDisplayedStep(TOTAL_STEPS - 1);
      return;
    }
    const id = window.setInterval(() => {
      setDisplayedStep((cur) => {
        if (cur >= TOTAL_STEPS - 1) return cur;
        if (cur >= maxAllowedStep) return cur; // wait for backend
        return cur + 1;
      });
    }, STEP_DWELL_MS);
    return () => window.clearInterval(id);
  }, [maxAllowedStep, isExtractionComplete, isTerminalFail]);

  // ── Progress bar ─────────────────────────────────────────────────
  // Drifts smoothly toward a target derived from displayedStep so the
  // bar doesn't jerk on backend transitions. Caps at 96% until extraction
  // completes; flips to 100% in the success-dwell phase.
  useEffect(() => {
    if (isTerminalFail) return;
    if (isExtractionComplete) {
      setProgressPercent(100);
      return;
    }
    const target = Math.min(96, ((displayedStep + 1) / TOTAL_STEPS) * 100);
    const id = window.setInterval(() => {
      setProgressPercent((cur) => {
        if (cur >= target) return cur;
        return Math.min(target, cur + 1.5);
      });
    }, PROGRESS_TICK_MS);
    return () => window.clearInterval(id);
  }, [displayedStep, isExtractionComplete, isTerminalFail]);

  // ── Tip rotation ─────────────────────────────────────────────────
  useEffect(() => {
    const id = window.setInterval(() => {
      setTipIndex((i) => (i + 1) % PROCESSING_TIPS.length);
    }, TIP_ROTATE_MS);
    return () => window.clearInterval(id);
  }, []);

  // ── Auto-redirect after success dwell ────────────────────────────
  // Wait SUCCESS_DWELL_MS once the backend confirms extraction complete.
  // The user sees the green success card + all checkmarks before nav.
  useEffect(() => {
    if (!isExtractionComplete) return;
    if (!documentId) return;
    if (successTimer.current !== null) return;
    successTimer.current = window.setTimeout(() => {
      navigate(`/results/${documentId}`);
    }, SUCCESS_DWELL_MS);
    return () => {
      if (successTimer.current !== null) {
        window.clearTimeout(successTimer.current);
        successTimer.current = null;
      }
    };
  }, [isExtractionComplete, documentId, navigate]);

  return (
    <ProcessingPageView
      documentId={documentId}
      status={data}
      isLoading={isLoading}
      isError={isError}
      isRetrying={retry.isLoading}
      displayedStep={displayedStep}
      tipIndex={tipIndex}
      progressPercent={progressPercent}
      onRetry={() => retry.mutate()}
      onUploadAnother={() => navigate('/upload')}
      onBackToDashboard={() => navigate('/')}
    />
  );
}

/**
 * Maps the backend's two status fields into the highest step index the
 * UI is allowed to display. The clamping matters: we never let the UI
 * claim "Analyzing risk clauses" while the backend is still on OCR.
 *
 *   Step 0  Reading document        — always (initial load + OCR running)
 *   Step 1  Identifying parties     — OCR done
 *   Step 2  Extracting key terms    — extraction started
 *   Step 3  Analyzing risk clauses  — extraction started
 *   Step 4  Scoring and ranking     — extraction started
 *   Step 5  Building your report    — extraction complete
 */
function computeMaxAllowedStep(
  data: ProcessingStatusResponse | undefined,
): number {
  if (!data) return 0;
  if (data.extractionStatus === 'extraction_complete') return 5;
  if (data.extractionStatus === 'extracting') return 4;
  if (data.status === 'ocr_complete') return 1;
  return 0;
}
