/**
 * Mirrors the backend's GetDocumentTextResult DTO. Surfaced via
 * GET /api/v1/documents/:id/text. Powers the Phase 8 Document tab.
 */

import type { DocumentId } from './documents';

export interface PageText {
  pageNumber: number;
  text: string;
  confidence: number;
  textQualityScore: number;
  driver: string;
}

export interface DocumentTextResponse {
  documentId: DocumentId;
  text: string;
  pages: PageText[];
  confidence: number;
  minPageConfidence: number;
  language: string;
  driver: string;
  pageCount: number;
  extractedAt: string;
}
