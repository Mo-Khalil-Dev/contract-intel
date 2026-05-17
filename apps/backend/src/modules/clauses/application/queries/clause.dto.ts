/**
 * Read-side projection of a Clause. Surfaces verbatim text, position,
 * type, confidence, and (Phase 9-bound) risk fields. Embedding vector
 * is omitted — it's an internal index, not a UI concern.
 */
export interface ClauseDto {
  id: string;
  extractionRunId: string;
  documentId: string;
  parentClauseId: string | null;
  type: string;
  confidence: number;
  pageNumber: number;
  startOffset: number;
  endOffset: number;
  text: string;
  /** Whether the clause has an embedding attached. UI doesn't need the
   *  vector itself, but knowing it's indexed helps the search affordance. */
  hasEmbedding: boolean;
  // Phase 9 fields — present in Phase 8 so the API contract is stable;
  // frontend ignores them until Phase 9 lights up the risk UI.
  risk: {
    score: number;
    level: 'low' | 'medium' | 'high' | 'critical';
    flags: string[];
    explanation: string;
  } | null;
  createdAt: string;
}
