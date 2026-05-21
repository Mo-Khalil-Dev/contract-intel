/**
 * Response shape for GET /api/v1/clauses/:id/similar (US-CI-1).
 *
 * Mirrors the API contract in USER_STORIES/US-010_Similar_Clauses.md
 * §API Contract exactly — the frontend consumes this shape unchanged
 * via apps/frontend/src/services/similarClausesService.ts (Task 11.5).
 *
 * Two intentional differences from the internal SimilarClauseRow:
 *
 *   - `text` becomes `textSnippet`, capped at SNIPPET_MAX_LENGTH chars
 *     so we don't ship the entire clause body when the UI only renders
 *     two lines. Trim happens here (application layer) rather than in
 *     the repository so the storage adapter stays purely about IO.
 *
 *   - `document.uploadedAt` is serialised as an ISO string so the wire
 *     format is JSON-safe; the repository returns a Date object.
 */

export const SNIPPET_MAX_LENGTH = 240;

export interface SimilarClauseDto {
  id: string;
  type: string;
  textSnippet: string;
  /** Cosine similarity in [0, 1]; higher = closer. */
  similarity: number;
  document: {
    id: string;
    title: string;
    /** ISO 8601 timestamp. */
    uploadedAt: string;
  };
  pageNumber: number | null;
  sectionRef: string | null;
}

export interface SimilarClausesResponse {
  source: {
    id: string;
    type: string;
    textSnippet: string;
    documentId: string;
  };
  results: SimilarClauseDto[];
}

/** Trim a clause body to the configured snippet length, preserving a
 *  trailing ellipsis when truncated. Whitespace at the boundary is
 *  collapsed so the snippet doesn't end mid-newline. */
export function toSnippet(text: string): string {
  const collapsed = text.replace(/\s+/g, ' ').trim();
  if (collapsed.length <= SNIPPET_MAX_LENGTH) return collapsed;
  return collapsed.slice(0, SNIPPET_MAX_LENGTH).trimEnd() + '…';
}
