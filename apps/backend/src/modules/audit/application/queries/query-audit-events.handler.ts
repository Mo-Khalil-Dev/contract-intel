import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  QueryAuditEventsQuery,
  PaginatedAuditEventsView,
  AuditEventView,
} from './query-audit-events.query';
import { AUDIT_EVENT_REPOSITORY, IAuditEventRepository } from '../../domain/audit-event.repository';
import { AuditEvent } from '../../domain/audit-event.aggregate';

@QueryHandler(QueryAuditEventsQuery)
export class QueryAuditEventsHandler
  implements IQueryHandler<QueryAuditEventsQuery, PaginatedAuditEventsView>
{
  constructor(
    @Inject(AUDIT_EVENT_REPOSITORY)
    private readonly repository: IAuditEventRepository,
  ) {}

  async execute(query: QueryAuditEventsQuery): Promise<PaginatedAuditEventsView> {
    const result = await this.repository.findAll(
      {
        actorId: query.actorId,
        action: query.action,
        resourceId: query.resourceId,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      {
        page: query.page,
        pageSize: query.pageSize,
      },
    );

    return {
      events: result.events.map((e) => this.toView(e)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
      totalPages: result.totalPages,
    };
  }

  private toView(event: AuditEvent): AuditEventView {
    return {
      id: event.id.value,
      actorId: event.actorId.value,
      action: event.action.value,
      resourceId: event.resourceId.value,
      checksum: event.checksum.value,
      sequenceNumber: event.sequenceNumber.value,
      timestamp: event.timestamp,
    };
  }
}
