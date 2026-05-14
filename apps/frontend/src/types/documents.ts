/**
 * Shared types for the document upload feature.
 *
 * The shapes here mirror what the backend will eventually return
 * (Task 5.4). Until then, `documentService.ts` returns fabricated
 * values matching these types so the swap from mock to real is a
 * single-file edit.
 */

/** Opaque UUID for a Document aggregate. */
export type DocumentId = string;

/** Document lifecycle. `processing` is intentionally absent in v1 — it
 *  comes back when the extraction pipeline ships. */
export type UploadStatus = 'pending' | 'uploading' | 'complete' | 'failed';

/** v1 file constraints. PDF only, ≤50 MB. */
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const ACCEPTED_MIME_TYPES = ['application/pdf'] as const;
export const ACCEPTED_EXTENSIONS = ['.pdf'] as const;

export interface InitiateUploadRequest {
  fileName: string;
  fileSize: number;
  fileType: string;
}

export interface InitiateUploadResponse {
  uploadUrl: string;
  documentId: DocumentId;
}

export interface UploadStatusResponse {
  documentId: DocumentId;
  status: UploadStatus;
  uploadedAt?: string;
}

/** Why an upload could fail — kept as a discriminated string so it can
 *  be sent straight to analytics as `reason`. */
export type UploadFailureReason =
  | 'file_too_large'
  | 'invalid_type'
  | 'network'
  | 'backend'
  | 'unknown';

/** Thrown by `documentService` (and surfaces in `useUpload`'s error)
 *  when an upload step fails. The `reason` is suitable for analytics. */
export class UploadError extends Error {
  readonly reason: UploadFailureReason;

  constructor(reason: UploadFailureReason, message: string) {
    super(message);
    this.name = 'UploadError';
    this.reason = reason;
  }
}
