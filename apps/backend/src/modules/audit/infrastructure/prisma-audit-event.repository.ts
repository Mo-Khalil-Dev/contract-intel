import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../shared/infrastructure/prisma/prisma.service';
import {
  IAuditEventRepository,
  AuditEventFilters,
  PaginationOptions,
  PaginatedAuditEvents,
} from '../domain/audit-event.repository';
import { AuditEvent } from '../domain/audit-event.aggregate';
import { AuditEventId } from '../domain/audit-event-id.vo';
import { AuditEventMapper } from './audit-event.mapper';
import { InfrastructureException } from '../../../shared/exceptions/app-error';

/**
 * Append-only Prisma implementation of IAuditEventRepository.
 *
 * INSERT + SELECT only — no update or delete operations are exposed.
 * Sequence numbers are assigned via a PostgreSQL advisory lock to ensure
 * monotonically increasing values under concurrent writes.
 */
@Injectable()
export class PrismaAuditEventRepository implements IAuditEventRepository {
  private readonly logger = new Logger(PrismaAuditEventRepository.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist a new AuditEvent. INSERT only — never updates or deletes.
   */
  async save(event: AuditEvent): Promise<void> {
    try {
      const data = AuditEventMapper.toPersistence(event);
      await this.prisma.auditEvent.create({ data });
    } catch (error) {
      this.logger.error(`Failed to save audit event ${event.id.value}: ${(error as Error).message}`);
      throw new InfrastructureException(
        'AUDIT_EVENT_SAVE_FAILED',
        `Failed to persist audit event: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Retrieve all audit events with optional filters and pagination,
   * ordered by sequenceNumber ascending.
   */
  async findAll(
    filters?: AuditEventFilters,
    pagination?: PaginationOptions,
  ): Promise<PaginatedAuditEvents> {
    try {
      const where = this.buildWhereClause(filters);
      const page = pagination?.page ?? 1;
      const pageSize = pagination?.pageSize ?? 20;
      const skip = (page - 1) * pageSize;

      const [rows, total] = await Promise.all([
        this.prisma.auditEvent.findMany({
          where,
          orderBy: { sequenceNumber: 'asc' },
          skip,
          take: pageSize,
        }),
        this.prisma.auditEvent.count({ where }),
      ]);

      return {
        events: rows.map((row) => AuditEventMapper.toDomain(row)),
        total,
        page,
        pageSize,
        totalPages: Math.ceil(total / pageSize),
      };
    } catch (error) {
      this.logger.error(`Failed to query audit events: ${(error as Error).message}`);
      throw new InfrastructureException(
        'AUDIT_EVENT_QUERY_FAILED',
        `Failed to query audit events: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Retrieve a single audit event by its ID.
   * Returns null if not found.
   */
  async findById(id: AuditEventId): Promise<AuditEvent | null> {
    try {
      const row = await this.prisma.auditEvent.findUnique({ where: { id: id.value } });
      return row ? AuditEventMapper.toDomain(row) : null;
    } catch (error) {
      this.logger.error(`Failed to find audit event ${id.value}: ${(error as Error).message}`);
      throw new InfrastructureException(
        'AUDIT_EVENT_FIND_FAILED',
        `Failed to find audit event: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Get the next sequence number using a PostgreSQL advisory lock to
   * prevent race conditions under concurrent writes.
   *
   * Uses `pg_advisory_xact_lock(hashtext('audit_seq'))` to serialise
   * concurrent callers within a transaction, then reads MAX(sequenceNumber)
   * and returns MAX + 1 (or 0 if the table is empty).
   */
  async getNextSequenceNumber(): Promise<number> {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        // Acquire an advisory lock scoped to this transaction.
        // All concurrent callers will queue here until the lock is released.
        await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext('audit_seq'))`;

        const rows = await tx.$queryRaw<[{ next: bigint }]>`
          SELECT COALESCE(MAX("sequenceNumber"), -1) + 1 AS next
          FROM "AuditEvent"
        `;

        return Number(rows[0].next);
      });

      return result;
    } catch (error) {
      this.logger.error(`Failed to get next sequence number: ${(error as Error).message}`);
      throw new InfrastructureException(
        'AUDIT_SEQ_FAILED',
        `Failed to get next audit sequence number: ${(error as Error).message}`,
      );
    }
  }

  // ── Private helpers ────────────────────────────────────────────────────────

  private buildWhereClause(filters?: AuditEventFilters): Prisma.AuditEventWhereInput {
    if (!filters) return {};

    const where: Prisma.AuditEventWhereInput = {};

    if (filters.actorId) {
      where.actorId = filters.actorId;
    }

    if (filters.action) {
      where.action = filters.action;
    }

    if (filters.resourceId) {
      // The domain stores "resourceType:resourceId" but the DB has separate columns.
      // We search the resourceId column for the raw value.
      where.resourceId = { contains: filters.resourceId };
    }

    if (filters.fromDate || filters.toDate) {
      where.timestamp = {};
      if (filters.fromDate) {
        (where.timestamp as Prisma.DateTimeFilter).gte = filters.fromDate;
      }
      if (filters.toDate) {
        (where.timestamp as Prisma.DateTimeFilter).lte = filters.toDate;
      }
    }

    return where;
  }
}
