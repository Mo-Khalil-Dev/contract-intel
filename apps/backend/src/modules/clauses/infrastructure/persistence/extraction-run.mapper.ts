import type { ExtractionRun as ExtractionRunRow } from '@prisma/client';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
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
    };
  }
}
