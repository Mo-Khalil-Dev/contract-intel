import type { ExtractionRun as ExtractionRunRow, Prisma } from '@prisma/client';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ContractMetadata } from '../../domain/value-objects/contract-metadata.vo';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { ExtractionStatus } from '../../domain/value-objects/extraction-status.vo';
import { ModelVersion } from '../../domain/value-objects/model-version.vo';

export class ExtractionRunMapper {
  static toDomain(row: ExtractionRunRow): ExtractionRun {
    return ExtractionRun.rehydrate(ExtractionRunId.fromString(row.id), {
      documentId: DocumentId.fromString(row.documentId),
      classifierModelVersion: ModelVersion.parse(row.classifierModelVersion),
      embeddingModelVersion: ModelVersion.parse(row.embeddingModelVersion),
      status: ExtractionStatus.fromValue(row.status),
      startedAt: row.startedAt,
      completedAt: row.completedAt,
      failureReason: row.failureReason,
      clauseCount: row.clauseCount,
      droppedClauseCount: row.droppedClauseCount,
      // JSON column → VO. Defensive: a malformed payload shouldn't kill
      // rehydration; we fall back to empty metadata in that case.
      metadata: row.metadata
        ? safeMetadataFromJson(row.metadata as Prisma.JsonValue)
        : null,
    });
  }

  static toPersistence(run: ExtractionRun): Omit<ExtractionRunRow, 'createdAt'> {
    return {
      id: run.id.value,
      documentId: run.documentId.value,
      classifierModelVersion: run.classifierModelVersion.value,
      embeddingModelVersion: run.embeddingModelVersion.value,
      status: run.status.value,
      failureReason: run.failureReason,
      clauseCount: run.clauseCount,
      droppedClauseCount: run.droppedClauseCount,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      metadata: run.metadata
        ? (JSON.parse(JSON.stringify(run.metadata.toJSON())) as Prisma.JsonValue)
        : null,
    };
  }
}

function safeMetadataFromJson(raw: Prisma.JsonValue): ContractMetadata | null {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  try {
    return ContractMetadata.create(raw as Record<string, unknown>);
  } catch {
    return null;
  }
}
