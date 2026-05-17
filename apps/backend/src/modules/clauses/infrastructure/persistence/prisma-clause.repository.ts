import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { IClauseRepository } from '../../domain/clause.repository';
import { Clause } from '../../domain/entities/clause';
import { ClauseId } from '../../domain/value-objects/clause-id.vo';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ClauseMapper, ClauseRawRow } from './clause.mapper';

/**
 * pgvector-aware repository. Prisma 5 can't bind a `vector(N)` parameter
 * natively, so we use `$executeRaw` for inserts and `$queryRaw` for reads
 * with explicit `::vector` casts.
 *
 * Parent-FK ordering: the application handler builds the clauses array in
 * two passes (parents first, then children with resolved parentClauseId).
 * We insert in that order inside a single transaction. The child's FK
 * resolves against rows inserted earlier in the same transaction.
 */
@Injectable()
export class PrismaClauseRepository implements IClauseRepository {
  constructor(private readonly prisma: PrismaService) {}

  async saveForRun(runId: ExtractionRunId, clauses: Clause[]): Promise<void> {
    if (clauses.length === 0) return;
    // Sort: parents (parentClauseId == null) first. The handler already
    // produces this order, but resorting here makes the repository
    // contract robust to future callers.
    const ordered = [
      ...clauses.filter((c) => c.parentClauseId === null),
      ...clauses.filter((c) => c.parentClauseId !== null),
    ];

    await this.prisma.$transaction(async (tx) => {
      for (const c of ordered) {
        const embeddingLiteral = c.embedding
          ? ClauseMapper.encodeVector(c.embedding)
          : null;
        await tx.$executeRaw(insertClauseSql(c, runId, embeddingLiteral));
      }
    });
  }

  async findByDocumentId(documentId: DocumentId): Promise<Clause[]> {
    const rows = await this.prisma.$queryRaw<ClauseRawRow[]>(
      selectClausesByDocumentSql(documentId.value),
    );
    return rows.map((r) => ClauseMapper.toDomain(r));
  }

  async findById(id: ClauseId): Promise<Clause | null> {
    const rows = await this.prisma.$queryRaw<ClauseRawRow[]>(
      selectClauseByIdSql(id.value),
    );
    return rows.length > 0 ? ClauseMapper.toDomain(rows[0]) : null;
  }
}

// ── Raw SQL builders ────────────────────────────────────────────────────
//
// Hand-built `Prisma.sql` templates. Two reasons we can't use
// `prisma.clause.create`:
//   1. The `embedding` column type is `Unsupported(...)` — Prisma exposes
//      no typed binding for it.
//   2. We want one transactional path that handles the vector cast
//      consistently.
// The riskFlags array binds as text[] via `::text[]` cast.

function insertClauseSql(
  c: Clause,
  runId: ExtractionRunId,
  embeddingLiteral: string | null,
): Prisma.Sql {
  const risk = c.risk;
  return Prisma.sql`
    INSERT INTO "Clause" (
      "id", "extractionRunId", "documentId", "parentClauseId",
      "type", "confidence", "pageNumber", "startOffset", "endOffset",
      "text", "embedding", "embeddingModelVersion",
      "riskScore", "riskLevel", "riskFlags", "riskExplanation",
      "createdAt"
    ) VALUES (
      ${c.id.value},
      ${runId.value},
      ${c.documentId.value},
      ${c.parentClauseId?.value ?? null},
      ${c.type.value},
      ${c.confidence.value},
      ${c.position.pageNumber},
      ${c.position.startOffset},
      ${c.position.endOffset},
      ${c.text},
      ${embeddingLiteral}::vector,
      ${c.embeddingModelVersion?.value ?? null},
      ${risk?.score ?? null},
      ${risk?.level.value ?? null},
      ${risk?.flags ?? []}::text[],
      ${risk?.explanation ?? null},
      ${c.createdAt}
    )
  `;
}

function selectClausesByDocumentSql(documentId: string): Prisma.Sql {
  return Prisma.sql`
    SELECT
      "id", "extractionRunId", "documentId", "parentClauseId",
      "type", "confidence", "pageNumber", "startOffset", "endOffset",
      "text",
      "embedding"::text AS "embedding",
      "embeddingModelVersion",
      "riskScore", "riskLevel", "riskFlags", "riskExplanation",
      "createdAt"
    FROM "Clause"
    WHERE "documentId" = ${documentId}
    ORDER BY "startOffset" ASC
  `;
}

function selectClauseByIdSql(id: string): Prisma.Sql {
  return Prisma.sql`
    SELECT
      "id", "extractionRunId", "documentId", "parentClauseId",
      "type", "confidence", "pageNumber", "startOffset", "endOffset",
      "text",
      "embedding"::text AS "embedding",
      "embeddingModelVersion",
      "riskScore", "riskLevel", "riskFlags", "riskExplanation",
      "createdAt"
    FROM "Clause"
    WHERE "id" = ${id}
    LIMIT 1
  `;
}
