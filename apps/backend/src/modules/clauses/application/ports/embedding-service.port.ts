export const EMBEDDING_SERVICE = Symbol('EMBEDDING_SERVICE');

/**
 * Outbound port for vector embeddings. Voyage `voyage-law-2` in prod
 * (1024-dim, legal-tuned); deterministic hash-based mock for tests.
 *
 * Drivers must throw `EmbeddingTransientError` / `EmbeddingPermanentError`
 * (see `application/errors/clause-extraction-errors.ts`). The handler
 * isolates embedding failures from extraction success — a Voyage outage
 * results in clauses being persisted with `embedding=null` rather than
 * the whole extraction run failing.
 */
export interface IEmbeddingService {
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
  /** Stable identifier for the model + version. Surfaces on every Clause
   *  row so we can query mixed-version sets and trigger re-embed jobs. */
  getModelVersion(): string;
}

export interface EmbeddingResult {
  /** Dense float vector. Phase 8 expects exactly 1024 dims (Voyage). */
  vector: number[];
}
