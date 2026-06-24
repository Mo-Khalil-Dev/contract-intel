import type { ContractReviewRuntime } from './contract-review-runner.port';

export const CONTRACT_REVIEW_STORE = Symbol('CONTRACT_REVIEW_STORE');

export type ContractReviewStatus =
  | 'not_started'
  | 'running'
  | 'complete'
  | 'failed';

export interface StoredContractReview {
  documentId: string;
  status: ContractReviewStatus;
  markdown: string | null;
  runtime: ContractReviewRuntime | null;
  error: string | null;
  reviewedAt: Date | null;
}

/**
 * Persists the asynchronous review lifecycle on the Document row. The
 * review can outlive the HTTP request, so its state lives here and the
 * frontend polls for it.
 */
export interface IContractReviewStore {
  /** Read the current review state, org-scoped. Null if the document
   *  isn't visible to this org. */
  get(documentId: string, orgId: string): Promise<StoredContractReview | null>;

  /** Mark a run as started. Org-scoped; returns false if the document
   *  isn't visible to this org (so the caller can 404). */
  markRunning(documentId: string, orgId: string): Promise<boolean>;

  /** Persist a finished report. */
  saveComplete(
    documentId: string,
    markdown: string,
    runtime: ContractReviewRuntime,
    reviewedAt: Date,
  ): Promise<void>;

  /** Persist a failure reason. */
  saveFailed(documentId: string, error: string): Promise<void>;
}
