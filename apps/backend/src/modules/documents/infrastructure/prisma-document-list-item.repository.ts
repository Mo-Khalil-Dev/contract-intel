import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import { InfrastructureException } from '../../../shared/exceptions/app-error';
import {
  DocumentListFilters,
  DocumentListPage,
  DocumentListSort,
  DocumentListSummary,
  DocumentListItemPatch,
  IDocumentListItemRepository,
  NewDocumentListItem,
} from '../application/projections/document-list-item/document-list-item.repository';
import {
  DocumentListItem,
  DocumentListItemStatus,
} from '../application/projections/document-list-item/document-list-item.read-model';
import { riskBandRange } from '../application/projections/document-list-item/risk-band';

@Injectable()
export class PrismaDocumentListItemRepository implements IDocumentListItemRepository {
  private readonly logger = new Logger(PrismaDocumentListItemRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  async insert(item: NewDocumentListItem): Promise<void> {
    try {
      await this.prisma.documentListItem.upsert({
        where: { id: item.id },
        create: {
          id: item.id,
          orgId: item.orgId,
          name: item.name,
          type: item.type,
          counterparty: item.counterparty ?? '',
          riskScore: item.riskScore ?? null,
          flagsRed: item.flagsRed ?? 0,
          flagsOrange: item.flagsOrange ?? 0,
          flagsBlue: item.flagsBlue ?? 0,
          terminationDate: item.terminationDate ?? null,
          status: item.status,
          uploadedAt: item.uploadedAt,
          hasUnlimitedLiability: item.hasUnlimitedLiability ?? false,
        },
        update: {
          // Idempotent — re-running the upload-completed handler must not
          // clobber risk/flag data populated by a later extraction event.
          orgId: item.orgId,
          name: item.name,
          type: item.type,
          status: item.status,
          uploadedAt: item.uploadedAt,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to insert DocumentListItem ${item.id}: ${(error as Error).message}`);
      throw new InfrastructureException(
        'DOCUMENT_LIST_ITEM_INSERT_FAILED',
        `Failed to insert DocumentListItem: ${(error as Error).message}`,
      );
    }
  }

  async update(id: string, patch: DocumentListItemPatch): Promise<void> {
    try {
      const result = await this.prisma.documentListItem.updateMany({
        where: { id },
        data: patch,
      });
      if (result.count === 0) {
        this.logger.warn(
          `DocumentListItem ${id} not found during update — projection may be stale`,
        );
      }
    } catch (error) {
      this.logger.error(`Failed to update DocumentListItem ${id}: ${(error as Error).message}`);
      throw new InfrastructureException(
        'DOCUMENT_LIST_ITEM_UPDATE_FAILED',
        `Failed to update DocumentListItem: ${(error as Error).message}`,
      );
    }
  }

  async remove(id: string): Promise<void> {
    try {
      await this.prisma.documentListItem.deleteMany({ where: { id } });
    } catch (error) {
      this.logger.error(`Failed to delete DocumentListItem ${id}: ${(error as Error).message}`);
      throw new InfrastructureException(
        'DOCUMENT_LIST_ITEM_DELETE_FAILED',
        `Failed to delete DocumentListItem: ${(error as Error).message}`,
      );
    }
  }

  async findById(id: string, orgId: string): Promise<DocumentListItem | null> {
    const row = await this.prisma.documentListItem.findFirst({ where: { id, orgId } });
    return row ? toDomain(row) : null;
  }

  async findAll(
    orgId: string,
    filters: DocumentListFilters,
    sort: DocumentListSort,
    page: number,
    pageSize: number,
  ): Promise<DocumentListPage> {
    try {
      const where = this.buildWhere(orgId, filters);
      const orderBy = this.buildOrderBy(sort);
      const skip = (page - 1) * pageSize;

      const [rows, total] = await Promise.all([
        this.prisma.documentListItem.findMany({ where, orderBy, skip, take: pageSize }),
        this.prisma.documentListItem.count({ where }),
      ]);

      return {
        items: rows.map(toDomain),
        total,
        page,
        pageSize,
        totalPages: Math.max(1, Math.ceil(total / pageSize)),
      };
    } catch (error) {
      this.logger.error(`Failed to query DocumentListItem: ${(error as Error).message}`);
      throw new InfrastructureException(
        'DOCUMENT_LIST_ITEM_QUERY_FAILED',
        `Failed to query DocumentListItem: ${(error as Error).message}`,
      );
    }
  }

  async summary(orgId: string): Promise<DocumentListSummary> {
    try {
      const [totalContracts, analysed, riskAgg, redAgg, unlimitedLiability] = await Promise.all([
        this.prisma.documentListItem.count({ where: { orgId } }),
        this.prisma.documentListItem.count({ where: { orgId, status: 'complete' } }),
        this.prisma.documentListItem.aggregate({
          where: { orgId, status: 'complete', riskScore: { not: null } },
          _avg: { riskScore: true },
        }),
        this.prisma.documentListItem.aggregate({
          where: { orgId, status: 'complete' },
          _sum: { flagsRed: true },
        }),
        this.prisma.documentListItem.count({
          where: { orgId, status: 'complete', hasUnlimitedLiability: true },
        }),
      ]);

      const avgRaw = riskAgg._avg.riskScore ?? 0;
      return {
        totalContracts,
        analysed,
        avgRisk: Math.round(avgRaw * 10) / 10,
        criticalFlags: redAgg._sum.flagsRed ?? 0,
        unlimitedLiability,
      };
    } catch (error) {
      this.logger.error(`Failed to compute DocumentListItem summary: ${(error as Error).message}`);
      throw new InfrastructureException(
        'DOCUMENT_LIST_ITEM_SUMMARY_FAILED',
        `Failed to compute summary: ${(error as Error).message}`,
      );
    }
  }

  private buildWhere(
    orgId: string,
    filters: DocumentListFilters,
  ): Prisma.DocumentListItemWhereInput {
    const where: Prisma.DocumentListItemWhereInput = { orgId };

    if (filters.q && filters.q.trim().length > 0) {
      where.name = { contains: filters.q.trim(), mode: 'insensitive' };
    }
    if (filters.type && filters.type !== 'all') {
      where.type = filters.type;
    }
    if (filters.status && filters.status !== 'all') {
      where.status = filters.status;
    }
    const band = riskBandRange(filters.risk ?? 'all');
    if (band) {
      where.riskScore = band;
    }
    return where;
  }

  private buildOrderBy(sort: DocumentListSort): Prisma.DocumentListItemOrderByWithRelationInput {
    switch (sort) {
      case 'date':
        return { uploadedAt: 'desc' };
      case 'name':
        return { name: 'asc' };
      case 'risk':
      default:
        // riskScore desc with nulls last so processing/failed rows drop to the bottom.
        return { riskScore: { sort: 'desc', nulls: 'last' } };
    }
  }
}

type Row = {
  id: string;
  orgId: string;
  name: string;
  type: string;
  counterparty: string;
  riskScore: number | null;
  flagsRed: number;
  flagsOrange: number;
  flagsBlue: number;
  terminationDate: Date | null;
  status: string;
  uploadedAt: Date;
  hasUnlimitedLiability: boolean;
  updatedAt: Date;
};

function toDomain(row: Row): DocumentListItem {
  return {
    id: row.id,
    orgId: row.orgId,
    name: row.name,
    type: row.type,
    counterparty: row.counterparty,
    riskScore: row.riskScore,
    flagsRed: row.flagsRed,
    flagsOrange: row.flagsOrange,
    flagsBlue: row.flagsBlue,
    terminationDate: row.terminationDate,
    status: row.status as DocumentListItemStatus,
    uploadedAt: row.uploadedAt,
    hasUnlimitedLiability: row.hasUnlimitedLiability,
    updatedAt: row.updatedAt,
  };
}
