/**
 * Frontend types mirroring the backend SimilarClausesResponse DTO
 * (apps/backend/src/modules/clauses/application/queries/similar-clauses.dto.ts).
 *
 * Keep this file in lock-step with the backend DTO — the API contract
 * in USER_STORIES/US-010_Similar_Clauses.md §API Contract is the
 * single source of truth for both.
 */

import type { DocumentId } from './documents';

/** Clause identifier (UUID string). No nominal type in v1 — kept simple. */
export type ClauseId = string;

export interface SimilarClauseDto {
  id: ClauseId;
  type: string;
  textSnippet: string;
  /** Cosine similarity in [0, 1]; higher = closer. */
  similarity: number;
  document: {
    id: DocumentId;
    title: string;
    /** ISO 8601 timestamp. */
    uploadedAt: string;
  };
  pageNumber: number | null;
  /**
   * Section reference like "9.2". Always null in v1 — reserved for when
   * the extractor begins emitting it.
   */
  sectionRef: string | null;
}

export interface SimilarClausesResponse {
  source: {
    id: ClauseId;
    type: string;
    textSnippet: string;
    documentId: DocumentId;
  };
  results: SimilarClauseDto[];
}
