/**
 * Vector-search read port for the Clause aggregate (Phase 11, US-CI-1).
 *
 * Returns a **read-model row**, not a Clause domain entity. The Similar
 * Clauses feature is a query-side concern: callers want a denormalised
 * row joined with Document metadata, not the full Clause aggregate with
 * its risk + position value objects rehydrated.
 *
 * The port lives in `application/ports/` (like `embedding-service.port`
 * and `clause-extractor.port`) rather than in `domain/` because it does
 * not return Domain entities. The Prisma adapter holds the pgvector raw
 * SQL (`<=>` cosine-distance operator); an in-memory adapter computes
 * cosine in TypeScript for handler unit tests.
 *
 * Lives behind a DI token so tests can swap implementations without
 * touching production code.
 */

export const CLAUSE_SIMILARITY_REPOSITORY = Symbol(
  'CLAUSE_SIMILARITY_REPOSITORY',
);

export interface FindSimilarClausesInput {
  /** The clause we're searching from. Excluded from results. */
  sourceClauseId: string;
  /**
   * Document the source clause belongs to. All clauses from this
   * document are excluded — we want cross-contract precedent, not
   * sibling clauses from the same paper.
   */
  sourceDocumentId: string;
  /**
   * Clause type filter. V1 only returns matches of the same type
   * (US-CI-1 Resolved scope decisions): cross-type matches are noisy.
   */
  clauseType: string;
  /** Max rows to return. Caller validates the range. */
  limit: number;
  /**
   * Server-side cosine-similarity floor. Rows scoring below this are
   * not returned. Defaults to 0.5 (US-CI-1 Still-open recommendation).
   */
  minSimilarity?: number;
}

/**
 * One row of the read model. The full `text` is returned; snippet
 * trimming is the handler/mapper's concern (see Task 11.3).
 */
export interface SimilarClauseRow {
  id: string;
  type: string;
  text: string;
  pageNumber: number | null;
  /**
   * Section reference (e.g. "9.2"). The Clause schema doesn't carry this
   * column in v1 — always `null` today. Kept on the row shape so the
   * field is reserved for the day the extractor emits it; the UI already
   * has the slot.
   */
  sectionRef: string | null;
  /** Cosine similarity in [0, 1]; higher = closer. */
  similarity: number;
  document: {
    id: string;
    /**
     * The contract title shown in the UI. Maps to `Document.name` in the
     * schema (the user-facing label is "title" / "name" depending on
     * screen; we standardise on `title` at this seam).
     */
    title: string;
    uploadedAt: Date;
  };
}

export interface ClauseSimilarityRepository {
  findSimilar(input: FindSimilarClausesInput): Promise<SimilarClauseRow[]>;
}
