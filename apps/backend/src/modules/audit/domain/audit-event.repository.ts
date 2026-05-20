import { AuditEvent } from './audit-event.aggregate';
import { AuditEventId } from './audit-event-id.vo';
import { AuditActionEnum } from './audit-action.vo';

export const AUDIT_EVENT_REPOSITORY = Symbol('AUDIT_EVENT_REPOSITORY');

export interface AuditEventFilters {
  actorId?: string;
  action?: AuditActionEnum;
  resourceId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
}

export interface PaginatedAuditEvents {
  events: AuditEvent[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Repository interface for AuditEvent.
 *
 * INSERT + SELECT only — no update or delete operations are permitted
 * to preserve the immutability and tamper-evidence of the audit trail.
 */
export interface IAuditEventRepository {
  /**
   * Persist a new AuditEvent.
   * Throws InfrastructureException on failure.
   */
  save(event: AuditEvent): Promise<void>;

  /**
   * Retrieve all audit events with optional filters and pagination,
   * ordered by sequenceNumber ascending.
   * Returns an empty array if none exist.
   * Throws InfrastructureException on failure.
   */
  findAll(filters?: AuditEventFilters, pagination?: PaginationOptions): Promise<PaginatedAuditEvents>;

  /**
   * Retrieve a single audit event by its ID.
   * Returns null if not found.
   * Throws InfrastructureException on failure.
   */
  findById(id: AuditEventId): Promise<AuditEvent | null>;

  /**
   * Get the next sequence number for a new audit event.
   * Implementations must ensure monotonically increasing values
   * (e.g. via a PostgreSQL sequence or advisory lock).
   * Throws InfrastructureException on failure.
   */
  getNextSequenceNumber(): Promise<number>;
}
