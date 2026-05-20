import { AuditActionEnum } from '../../domain/audit-action.vo';

export class ExportAuditLogQuery {
  constructor(
    readonly format: 'json' | 'csv',
    readonly actorId?: string,
    readonly action?: AuditActionEnum,
    readonly resourceId?: string,
    readonly fromDate?: Date,
    readonly toDate?: Date,
  ) {}
}

export interface ExportAuditLogResult {
  content: string;
  filename: string;
  mimeType: string;
}
