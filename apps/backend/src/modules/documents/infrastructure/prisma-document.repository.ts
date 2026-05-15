import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { IDocumentRepository } from '../domain/document.repository';
import { Document } from '../domain/document.aggregate';
import { DocumentId } from '../domain/value-objects/document-id.vo';
import { OrgId } from '../domain/value-objects/org-id.vo';
import { DocumentMapper } from './document.mapper';

@Injectable()
export class PrismaDocumentRepository implements IDocumentRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByIdForOrg(id: DocumentId, orgId: OrgId): Promise<Document | null> {
    const row = await this.prisma.document.findFirst({
      where: { id: id.value, orgId: orgId.value },
    });
    return row ? DocumentMapper.toDomain(row) : null;
  }

  async findById(id: DocumentId): Promise<Document | null> {
    const row = await this.prisma.document.findUnique({ where: { id: id.value } });
    return row ? DocumentMapper.toDomain(row) : null;
  }

  async save(document: Document): Promise<void> {
    const data = DocumentMapper.toPersistence(document);
    await this.prisma.document.upsert({
      where: { id: data.id },
      update: {
        status: data.status,
        processingStatus: data.processingStatus,
        userRetryCount: data.userRetryCount,
        completedAt: data.completedAt,
        failureReason: data.failureReason,
        updatedAt: data.updatedAt,
      },
      create: data,
    });
  }
}
