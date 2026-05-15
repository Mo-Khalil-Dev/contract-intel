/**
 * documentService — real implementation (Task 5.4).
 *
 * Calls the backend's `/api/v1/documents/upload/*` endpoints:
 *   1. POST /upload/initiate       → returns { documentId, uploadUrl, method, expiresAt }
 *   2. PUT  uploadUrl              → browser sends file bytes (to backend in dev,
 *                                    directly to GCS in prod — same code path here)
 *   3. POST /upload/complete       → backend flips status to 'complete'
 *   4. GET  /:id/status            → polling endpoint
 *
 * The hook (useUpload) calls these in order. Progress is reported via
 * XHR's `upload.progress` event — fetch can't expose upload progress.
 */

import { httpService } from '@/api/httpService';
import { API_BASE_URL } from '@/api/client';
import { API } from '@/api/endpoints';
import type {
  DocumentId,
  InitiateUploadResponse,
  UploadStatusResponse,
} from '@/types/documents';
import {
  ACCEPTED_MIME_TYPES,
  MAX_FILE_SIZE_BYTES,
  UploadError,
} from '@/types/documents';

interface InitiateBackendResponse {
  documentId: string;
  uploadUrl: string;
  method: 'PUT';
  expiresAt: string;
}

interface StatusBackendResponse {
  documentId: string;
  status: 'pending' | 'uploading' | 'complete' | 'failed';
  uploadedAt: string | null;
  failureReason: string | null;
}

export interface UploadToStorageOptions {
  /** Called periodically with progress 0..100. */
  onProgress?: (percent: number) => void;
  /** AbortController signal — cancels the in-flight upload. */
  signal?: AbortSignal;
}

function classifyHttpError(error: unknown, fallbackMessage: string): UploadError {
  // httpService wraps axios errors into AppError with a `code`.
  // Map known codes back to UploadFailureReason for analytics.
  const err = error as { code?: string; message?: string; status?: number };
  if (err.code === 'FILE_TOO_LARGE') {
    return new UploadError('file_too_large', err.message || 'File is larger than 50 MB.');
  }
  if (err.code === 'INVALID_DOCUMENT_TYPE') {
    return new UploadError('invalid_type', err.message || 'Only PDF files are accepted.');
  }
  if (err.status === 0 || err.code === 'NETWORK_ERROR') {
    return new UploadError('network', err.message || 'Network connection failed.');
  }
  return new UploadError('backend', err.message || fallbackMessage);
}

export const documentService = {
  /**
   * Step 1: ask backend for a documentId + storage URL.
   * Defence-in-depth validation runs client-side too.
   */
  async initiateUpload(file: File): Promise<InitiateUploadResponse> {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      throw new UploadError('file_too_large', 'File is larger than 50 MB.');
    }
    if (!ACCEPTED_MIME_TYPES.includes(file.type as (typeof ACCEPTED_MIME_TYPES)[number])) {
      throw new UploadError('invalid_type', 'Only PDF files are accepted.');
    }

    try {
      const body = await httpService
        .post<InitiateBackendResponse>(API.INITIATE_UPLOAD, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
        .then((r) => r.data!);

      return { documentId: body.documentId, uploadUrl: body.uploadUrl };
    } catch (error) {
      throw classifyHttpError(error, 'Failed to start upload.');
    }
  },

  /**
   * Step 2: PUT the file bytes to the storage URL. Uses XHR (not fetch)
   * because fetch can't surface upload progress.
   */
  async uploadToStorage(
    url: string,
    file: File,
    options: UploadToStorageOptions = {},
  ): Promise<void> {
    const { onProgress, signal } = options;

    // Backend returns a relative path (e.g. /api/v1/documents/upload/raw/<key>)
    // because both storage drivers route bytes through the backend. On Railway
    // the frontend and backend are different origins, so a relative URL would
    // hit the SPA host (which 200s with index.html, fooling XHR into thinking
    // the upload succeeded). Always prepend the API origin for non-absolute URLs.
    const absoluteUrl = url.startsWith('http://') || url.startsWith('https://')
      ? url
      : `${API_BASE_URL}${url}`;

    await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', absoluteUrl, true);
      // Send the session cookie so SessionAuthGuard accepts the request.
      xhr.withCredentials = true;
      xhr.setRequestHeader('Content-Type', file.type);

      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100));
          }
        });
      }

      const onAbort = () => xhr.abort();
      if (signal) {
        if (signal.aborted) {
          reject(new UploadError('unknown', 'Upload cancelled.'));
          return;
        }
        signal.addEventListener('abort', onAbort, { once: true });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          onProgress?.(100);
          resolve();
        } else {
          reject(
            new UploadError(
              'backend',
              `Storage rejected the upload (HTTP ${xhr.status}).`,
            ),
          );
        }
      });

      xhr.addEventListener('error', () => {
        reject(new UploadError('network', 'Network error during upload.'));
      });

      xhr.addEventListener('abort', () => {
        reject(new UploadError('unknown', 'Upload cancelled.'));
      });

      xhr.send(file);
    });
  },

  /**
   * Step 3: tell backend the upload finished. Backend flips status to
   * `complete` and emits DocumentUploadCompletedEvent.
   */
  async completeUpload(documentId: DocumentId): Promise<void> {
    try {
      await httpService.post<void>(API.COMPLETE_UPLOAD, { documentId });
    } catch (error) {
      throw classifyHttpError(error, 'Backend rejected the upload.');
    }
  },

  /** Poll the document's current status. */
  async getUploadStatus(documentId: DocumentId): Promise<UploadStatusResponse> {
    const body = await httpService
      .get<StatusBackendResponse>(API.UPLOAD_STATUS(documentId))
      .then((r) => r.data!);

    return {
      documentId: body.documentId,
      status: body.status,
      uploadedAt: body.uploadedAt ?? undefined,
    };
  },
};
