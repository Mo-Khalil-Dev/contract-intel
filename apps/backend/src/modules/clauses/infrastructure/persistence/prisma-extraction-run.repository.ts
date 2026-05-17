import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { IExtractionRunRepository } from '../../domain/extraction-run.repository';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { ExtractionRunId } from '../../domain/value-objects/extraction-run-id.vo';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ExtractionRunMapper } from './extraction-run.mapper';

@Injectable()
export class PrismaExtractionRunRepository implements IExtractionRunRepository {
  constructor(private readonly prisma: PrismaService) {}

  async save(run: ExtractionRun): Promise<void> {
    const data = ExtractionRunMapper.toPersistence(run);
    // Prisma's `Json | null` accepts a JsonValue or the literal
    // `Prisma.DbNull`; map our `null` to `DbNull` so we can actually
    // clear the column when needed.
    const metadataValue =
      data.metadata === null
        ? Prisma.DbNull
        : (data.metadata as Prisma.InputJsonValue);
    await this.prisma.extractionRun.upsert({
      where: { id: data.id },
      // Identity (documentId, model versions, startedAt) is immutable post-
      // start. Only mutable fields appear in update.
      update: {
        status: data.status,
        failureReason: data.failureReason,
        clauseCount: data.clauseCount,
        droppedClauseCount: data.droppedClauseCount,
        completedAt: data.completedAt,
        metadata: metadataValue,
      },
      create: {
        ...data,
        metadata: metadataValue,
      },
    });
  }

  async findById(id: ExtractionRunId): Promise<ExtractionRun | null> {
    const row = await this.prisma.extractionRun.findUnique({
      where: { id: id.value },
    });
    return row ? ExtractionRunMapper.toDomain(row) : null;
  }

  // Returns the run referenced by Document.currentExtractionRunId. Falls
  // back to the latest run by startedAt for documents that had a run
  // started before the pointer was wired up (defensive — shouldn't
  // happen post-Phase 8, but cheap insurance).
  async findCurrentForDocument(documentId: DocumentId): Promise<ExtractionRun | null> {
    const doc = await this.prisma.document.findUnique({
      where: { id: documentId.value },
      select: { currentExtractionRunId: true },
    });
    if (doc?.currentExtractionRunId) {
      const row = await this.prisma.extractionRun.findUnique({
        where: { id: doc.currentExtractionRunId },
      });
      if (row) return ExtractionRunMapper.toDomain(row);
    }
    const latest = await this.prisma.extractionRun.findFirst({
      where: { documentId: documentId.value },
      orderBy: { startedAt: 'desc' },
    });
    return latest ? ExtractionRunMapper.toDomain(latest) : null;
  }
}
