/**
 * Frontend types for the Phase 7 OCR pipeline polling endpoint.
 *
 * Mirrors the backend's `GetProcessingStatusResult` DTO. `status` is the
 * ProcessingStatus VO value; `canRetry` reflects both the status and the
 * 3-cap on user-initiated retries.
 */

import type { DocumentId } from './documents';

export type ProcessingStatus =
  | 'not_started'
  | 'processing'
  | 'ocr_complete'
  | 'ocr_failed';

export interface ProcessingStatusResponse {
  documentId: DocumentId;
  status: ProcessingStatus;
  failureReason: string | null;
  userRetryCount: number;
  canRetry: boolean;
}

/** Statuses that stop the polling loop. */
export function isTerminalProcessingStatus(s: ProcessingStatus): boolean {
  return s === 'ocr_complete' || s === 'ocr_failed';
}
