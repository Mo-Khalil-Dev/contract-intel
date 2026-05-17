/**
 * Frontend types for the Phase 7 OCR pipeline + Phase 8 clause-extraction
 * polling endpoint.
 *
 * Mirrors the backend's `GetProcessingStatusResult` DTO. Two parallel
 * status fields live on the same response:
 *   - `status`           : OCR pipeline (ProcessingStatus VO)
 *   - `extractionStatus` : Clause extraction lifecycle (DocumentExtractionStatus VO)
 *
 * The /processing/:id screen rolls forward through both stages so the
 * user sees one continuous experience.
 */

import type { DocumentId } from './documents';

export type ProcessingStatus =
  | 'not_started'
  | 'processing'
  | 'ocr_complete'
  | 'ocr_failed';

export type DocumentExtractionStatus =
  | 'not_started'
  | 'extracting'
  | 'extraction_complete'
  | 'extraction_failed';

export interface ProcessingStatusResponse {
  documentId: DocumentId;
  status: ProcessingStatus;
  failureReason: string | null;
  userRetryCount: number;
  canRetry: boolean;
  // Phase 8 — clause extraction lifecycle.
  extractionStatus: DocumentExtractionStatus;
  currentExtractionRunId: string | null;
}

/**
 * Stops the processing-status polling loop. We stop when EITHER:
 *   - OCR has failed (terminal — user sees retry CTA), OR
 *   - extraction has reached a terminal state (complete redirects to
 *     /results, failed shows error card).
 * We do NOT stop at `ocr_complete` alone — extraction is still pending.
 */
export function isTerminalProcessingStatus(r: ProcessingStatusResponse): boolean {
  if (r.status === 'ocr_failed') return true;
  return (
    r.extractionStatus === 'extraction_complete' ||
    r.extractionStatus === 'extraction_failed'
  );
}
