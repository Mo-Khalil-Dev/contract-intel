import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import {
  ClauseSimilarityRepository,
  FindSimilarClausesInput,
  SimilarClauseRow,
} from '../../application/ports/clause-similarity.repository';

/**
 * pgvector-backed implementation of {@link ClauseSimilarityRepository}.
 *
 * Uses the `<=>` cosine-distance operator (provided by pgvector). The
 * HNSW index created in migration `phase11_clause_embedding_hnsw_index`
 * accelerates the `ORDER BY embedding <=> source.embedding LIMIT k`
 * pattern — without that index this would be a sequential scan.
 *
 * Two things worth noting:
 *
 *   1. **No application-side embedding parameter.** The handler doesn't
 *      load the source clause's embedding (Prisma can't bind a
 *      `vector(1024)` argument anyway). Instead we resolve the source
 *      embedding *inside* the SQL via a subquery — one round trip, no
 *      vector marshalling at the application boundary.
 *
 *   2. **Distance vs similarity.** pgvector's `<=>` returns cosine
 *      *distance* (smaller = closer). The port contract returns
 *      cosine *similarity* in [0, 1] (larger = closer). We convert
 *      with `1 - distance` in the SELECT and filter by it in the
 *      HAVING-style condition (a wrapping subquery so the `WHERE` can
 *      reference the computed alias).
 *
 * If the source clause is missing or has a NULL embedding, the query
 * returns zero rows. The application handler is responsible for
 * checking those preconditions and raising the right error code — see
 * Task 11.3 (US-CI-1 AC4).
 */
@Injectable()
export class PgvectorClauseSimilarityRepository
  implements ClauseSimilarityRepository
{
  constructor(private readonly prisma: PrismaService) {}

  async findSimilar(
    input: FindSimilarClausesInput,
  ): Promise<SimilarClauseRow[]> {
    const minSimilarity = input.minSimilarity ?? 0.5;
    const rows = await this.prisma.$queryRaw<RawRow[]>(
      buildSimilaritySql({
        sourceClauseId: input.sourceClauseId,
        sourceDocumentId: input.sourceDocumentId,
        clauseType: input.clauseType,
        limit: input.limit,
        minSimilarity,
      }),
    );
    return rows.map(mapRow);
  }
}

// ── Raw SQL ─────────────────────────────────────────────────────────────
//
// Resolves the source embedding in a CTE, then ranks every other clause
// of the same type by cosine distance to it. The outer SELECT computes
// similarity (`1 - distance`) and applies the minSimilarity filter.
// HNSW participates in the ORDER BY; the WHERE clauses are cheap and
// keep the candidate set small.

interface RawRow {
  id: string;
  type: string;
  text: string;
  pageNumber: number | null;
  similarity: number;
  documentId: string;
  documentTitle: string;
  documentUploadedAt: Date;
}

function buildSimilaritySql(input: {
  sourceClauseId: string;
  sourceDocumentId: string;
  clauseType: string;
  limit: number;
  minSimilarity: number;
}): Prisma.Sql {
  return Prisma.sql`
    WITH src AS (
      SELECT "embedding"
      FROM "Clause"
      WHERE "id" = ${input.sourceClauseId}
        AND "embedding" IS NOT NULL
    )
    SELECT
      c."id"                        AS "id",
      c."type"                      AS "type",
      c."text"                      AS "text",
      c."pageNumber"                AS "pageNumber",
      1 - (c."embedding" <=> src."embedding")::float AS "similarity",
      d."id"                        AS "documentId",
      d."name"                      AS "documentTitle",
      d."createdAt"                 AS "documentUploadedAt"
    FROM "Clause" c
    CROSS JOIN src
    JOIN "Document" d ON d."id" = c."documentId"
    WHERE c."id" <> ${input.sourceClauseId}
      AND c."documentId" <> ${input.sourceDocumentId}
      AND c."type" = ${input.clauseType}
      AND c."embedding" IS NOT NULL
      AND (1 - (c."embedding" <=> src."embedding")) >= ${input.minSimilarity}
    ORDER BY c."embedding" <=> src."embedding" ASC
    LIMIT ${input.limit}
  `;
}

function mapRow(r: RawRow): SimilarClauseRow {
  return {
    id: r.id,
    type: r.type,
    text: r.text,
    pageNumber: r.pageNumber,
    sectionRef: null, // not in schema yet — see port comment
    similarity: r.similarity,
    document: {
      id: r.documentId,
      title: r.documentTitle,
      uploadedAt: r.documentUploadedAt,
    },
  };
}
