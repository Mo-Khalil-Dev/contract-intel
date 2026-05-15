/**
 * processingService — Phase 7 OCR polling + retry.
 *
 * Two endpoints back this:
 *   - GET  /api/v1/documents/:id/processing-status  → ProcessingStatusResponse
 *   - POST /api/v1/documents/:id/retry-ocr          → 204
 *
 * Same 3-tier shape as documentService: httpService handles HTTP/auth,
 * this layer maps the envelope to the frontend DTO, the hooks consume.
 */

import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import type { DocumentId } from '@/types/documents';
import type {
  ProcessingStatus,
  ProcessingStatusResponse,
} from '@/types/processing';

interface ProcessingStatusBackendResponse {
  documentId: string;
  status: ProcessingStatus;
  failureReason: string | null;
  userRetryCount: number;
  canRetry: boolean;
}

export const processingService = {
  async getProcessingStatus(documentId: DocumentId): Promise<ProcessingStatusResponse> {
    const body = await httpService
      .get<ProcessingStatusBackendResponse>(API.PROCESSING_STATUS(documentId))
      .then((r) => r.data!);

    return {
      documentId: body.documentId,
      status: body.status,
      failureReason: body.failureReason,
      userRetryCount: body.userRetryCount,
      canRetry: body.canRetry,
    };
  },

  async retryOcr(documentId: DocumentId): Promise<void> {
    await httpService.post<void>(API.RETRY_OCR(documentId), {});
  },
};
