/**
 * documentService — mock implementation (Task 5.1).
 *
 * Shape and signatures match the eventual real implementation so the
 * mock → real swap in Task 5.4 is a single-file edit. The caller
 * (useUpload hook) shouldn't care which mode it's running in.
 *
 * Failure modes are toggleable via a URL query param to keep the demo
 * easy without polluting the UI:
 *   ?mock_upload_fail=file_too_large  → fails at initiate (oversize)
 *   ?mock_upload_fail=invalid_type    → fails at initiate (wrong type)
 *   ?mock_upload_fail=network         → fails at uploadToStorage
 *   ?mock_upload_fail=backend         → fails at completeUpload
 */

import type {
  DocumentId,
  InitiateUploadResponse,
  UploadFailureReason,
  UploadStatus,
  UploadStatusResponse,
} from '@/types/documents';
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UploadError,
} from '@/types/documents';

const MOCK_INITIATE_DELAY_MS = 300;
const MOCK_UPLOAD_DURATION_MS = 2000;
const MOCK_COMPLETE_DELAY_MS = 200;

function forcedFailure(): UploadFailureReason | null {
  if (typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('mock_upload_fail');
  if (
    param === 'file_too_large' ||
    param === 'invalid_type' ||
    param === 'network' ||
    param === 'backend'
  ) {
    return param;
  }
  return null;
}

function wait(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

function uuid(): string {
  // RFC4122-ish — good enough for mock ids
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export interface UploadToStorageOptions {
  /** Called periodically with progress 0..100. */
  onProgress?: (percent: number) => void;
  /** AbortController signal — cancels the in-flight upload. */
  signal?: AbortSignal;
}

export const documentService = {
  /**
   * Step 1: ask backend for a documentId + storage URL.
   * Validates type/size client-side first.
   */
  async initiateUpload(file: File): Promise<InitiateUploadResponse> {
    const failure = forcedFailure();
    if (failure === 'file_too_large') {
      throw new UploadError('file_too_large', `File is larger than 50 MB.`);
    }
    if (failure === 'invalid_type') {
      throw new UploadError('invalid_type', 'Only PDF files are accepted.');
    }

    // Real validation (also runs in the dropzone, but defence in depth).
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new UploadError('file_too_large', `File is larger than 50 MB.`);
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      throw new UploadError('invalid_type', 'Only PDF files are accepted.');
    }

    await wait(MOCK_INITIATE_DELAY_MS);

    const documentId = uuid();
    return {
      uploadUrl: `mock://storage/${documentId}`,
      documentId,
    };
  },

  /**
   * Step 2: PUT the file bytes to the storage URL.
   * In real mode this is a fetch PUT to GCS (or our local-dev proxy);
   * in mock mode it just simulates progress.
   */
  async uploadToStorage(
    _url: string,
    _file: File,
    options: UploadToStorageOptions = {},
  ): Promise<void> {
    const { onProgress, signal } = options;

    if (forcedFailure() === 'network') {
      await wait(400);
      throw new UploadError('network', 'Network connection lost during upload.');
    }

    // Tick progress from 0 → 100 over MOCK_UPLOAD_DURATION_MS.
    const tickIntervalMs = 80;
    const ticks = Math.ceil(MOCK_UPLOAD_DURATION_MS / tickIntervalMs);
    for (let i = 1; i <= ticks; i++) {
      if (signal?.aborted) {
        throw new UploadError('unknown', 'Upload cancelled.');
      }
      await wait(tickIntervalMs);
      const percent = Math.min(100, Math.round((i / ticks) * 100));
      onProgress?.(percent);
    }
  },

  /**
   * Step 3: tell backend the upload finished. Backend flips status to
   * `complete` and emits DocumentUploadCompletedEvent.
   */
  async completeUpload(_documentId: DocumentId): Promise<void> {
    if (forcedFailure() === 'backend') {
      await wait(MOCK_COMPLETE_DELAY_MS);
      throw new UploadError('backend', 'Backend rejected the upload.');
    }
    await wait(MOCK_COMPLETE_DELAY_MS);
  },

  /** Poll the document's current status. */
  async getUploadStatus(documentId: DocumentId): Promise<UploadStatusResponse> {
    await wait(150);
    return {
      documentId,
      status: 'complete' satisfies UploadStatus,
      uploadedAt: new Date().toISOString(),
    };
  },
};
