import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { ExportAuditLogQuery, ExportAuditLogResult } from './export-audit-log.query';
import { AUDIT_EVENT_REPOSITORY, IAuditEventRepository } from '../../domain/audit-event.repository';
import { AuditEvent } from '../../domain/audit-event.aggregate';

const CSV_HEADERS = ['id', 'timestamp', 'actorId', 'action', 'resourceId', 'sequenceNumber', 'checksum'];

@QueryHandler(ExportAuditLogQuery)
export class ExportAuditLogHandler
  implements IQueryHandler<ExportAuditLogQuery, ExportAuditLogResult>
{
  constructor(
    @Inject(AUDIT_EVENT_REPOSITORY)
    private readonly repository: IAuditEventRepository,
  ) {}

  async execute(query: ExportAuditLogQuery): Promise<ExportAuditLogResult> {
    // Fetch all matching events (no pagination for export)
    const result = await this.repository.findAll(
      {
        actorId: query.actorId,
        action: query.action,
        resourceId: query.resourceId,
        fromDate: query.fromDate,
        toDate: query.toDate,
      },
      { page: 1, pageSize: 100_000 },
    );

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);

    if (query.format === 'csv') {
      return {
        content: this.toCsv(result.events),
        filename: `audit-log-${timestamp}.csv`,
        mimeType: 'text/csv',
      };
    }

    return {
      content: this.toJson(result.events),
      filename: `audit-log-${timestamp}.json`,
      mimeType: 'application/json',
    };
  }

  private toCsv(events: AuditEvent[]): string {
    const rows = events.map((e) => [
      this.escapeCsv(e.id.value),
      this.escapeCsv(e.timestamp.toISOString()),
      this.escapeCsv(e.actorId.value),
      this.escapeCsv(e.action.value),
      this.escapeCsv(e.resourceId.value),
      String(e.sequenceNumber.value),
      this.escapeCsv(e.checksum.value),
    ]);

    return [CSV_HEADERS.join(','), ...rows.map((r) => r.join(','))].join('\n');
  }

  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }

  private toJson(events: AuditEvent[]): string {
    const data = events.map((e) => ({
      id: e.id.value,
      timestamp: e.timestamp.toISOString(),
      actorId: e.actorId.value,
      action: e.action.value,
      resourceId: e.resourceId.value,
      sequenceNumber: e.sequenceNumber.value,
      checksum: e.checksum.value,
    }));

    return JSON.stringify(data, null, 2);
  }
}
