import { Injectable } from '@nestjs/common';
import {
  ClauseSimilarityRepository,
  FindSimilarClausesInput,
  SimilarClauseRow,
} from '../../application/ports/clause-similarity.repository';

/**
 * In-memory adapter for {@link ClauseSimilarityRepository}.
 *
 * Used by handler unit tests so they don't need a live Postgres +
 * pgvector. Cosine similarity is computed in TypeScript; the ordering,
 * filtering, and minSimilarity semantics mirror the pgvector adapter
 * exactly so that handler behaviour observed against this fake is
 * indistinguishable from production.
 *
 * Test setup typically:
 *
 *   const repo = new InMemoryClauseSimilarityRepository();
 *   repo.seed([
 *     { id: 'src',  type: 'lol', text: '...', embedding: [...] , document: { ... } },
 *     { id: 'near', type: 'lol', text: '...', embedding: [...] , document: { ... } },
 *     // ...
 *   ]);
 *   const handler = new GetSimilarClausesHandler(repo, clauseRepo);
 */
@Injectable()
export class InMemoryClauseSimilarityRepository
  implements ClauseSimilarityRepository
{
  private clauses: SeedClause[] = [];

  /** Replace the seeded dataset. Idempotent. */
  seed(clauses: SeedClause[]): void {
    this.clauses = [...clauses];
  }

  async findSimilar(
    input: FindSimilarClausesInput,
  ): Promise<SimilarClauseRow[]> {
    const source = this.clauses.find((c) => c.id === input.sourceClauseId);
    if (!source || source.embedding == null) {
      // Match pgvector adapter: no source / null embedding → no results.
      // The handler is responsible for raising the right error before
      // calling us (US-CI-1 AC4).
      return [];
    }

    const minSimilarity = input.minSimilarity ?? 0.5;

    return this.clauses
      .filter(
        (c) =>
          c.id !== input.sourceClauseId &&
          c.document.id !== input.sourceDocumentId &&
          c.type === input.clauseType &&
          c.embedding != null,
      )
      .map((c) => ({
        clause: c,
        similarity: cosineSimilarity(
          source.embedding as number[],
          c.embedding as number[],
        ),
      }))
      .filter((r) => r.similarity >= minSimilarity)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, input.limit)
      .map(({ clause, similarity }) => ({
        id: clause.id,
        type: clause.type,
        text: clause.text,
        pageNumber: clause.pageNumber,
        sectionRef: null,
        similarity,
        document: { ...clause.document },
      }));
  }
}

export interface SeedClause {
  id: string;
  type: string;
  text: string;
  pageNumber: number | null;
  embedding: number[] | null;
  document: {
    id: string;
    title: string;
    uploadedAt: Date;
  };
}

/**
 * Cosine similarity in [-1, 1]; clamped to [0, 1] to match the pgvector
 * adapter's `1 - cosine_distance` output domain (pgvector's
 * `vector_cosine_ops` operates on normalised vectors in [0, 1] for
 * non-negative embeddings, but defensively clamp here too).
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error(
      `cosineSimilarity: dimension mismatch (${a.length} vs ${b.length})`,
    );
  }
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  const sim = dot / (Math.sqrt(normA) * Math.sqrt(normB));
  return Math.max(0, Math.min(1, sim));
}
