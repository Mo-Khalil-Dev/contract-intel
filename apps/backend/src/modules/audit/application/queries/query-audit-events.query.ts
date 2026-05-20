import { AuditActionEnum } from '../../domain/audit-action.vo';

export class QueryAuditEventsQuery {
  constructor(
    readonly actorId?: string,
    readonly action?: AuditActionEnum,
    readonly resourceId?: string,
    readonly fromDate?: Date,
    readonly toDate?: Date,
    readonly page?: number,
    readonly pageSize?: number,
  ) {}
}

export interface AuditEventView {
  id: string;
  actorId: string;
  action: AuditActionEnum;
  resourceId: string;
  checksum: string;
  sequenceNumber: number;
  timestamp: Date;
}

export interface PaginatedAuditEventsView {
  events: AuditEventView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
