/**
 * clausesService — Phase 8 clause-extraction read endpoints.
 *
 *   - GET /api/v1/documents/:id/clauses             → ClauseResponse[]
 *   - GET /api/v1/documents/:id/extraction-status   → ExtractionStatusResponse
 *
 * Same 3-tier pattern as processingService: httpService for HTTP/auth,
 * this layer maps envelope → frontend DTO, hooks consume.
 */

import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import type { DocumentId } from '@/types/documents';
import type {
  ClauseResponse,
  ExtractionStatusResponse,
} from '@/types/clauses';
import type { DocumentTextResponse } from '@/types/documentText';

export const clausesService = {
  async getClauses(documentId: DocumentId): Promise<ClauseResponse[]> {
    return httpService
      .get<ClauseResponse[]>(API.CLAUSES(documentId))
      .then((r) => r.data ?? []);
  },

  async getExtractionStatus(
    documentId: DocumentId,
  ): Promise<ExtractionStatusResponse> {
    return httpService
      .get<ExtractionStatusResponse>(API.EXTRACTION_STATUS(documentId))
      .then((r) => r.data!);
  },

  async getDocumentText(
    documentId: DocumentId,
  ): Promise<DocumentTextResponse> {
    return httpService
      .get<DocumentTextResponse>(API.DOCUMENT_TEXT(documentId))
      .then((r) => r.data!);
  },
};
