import { AuditActionEnum } from '../../domain/audit-action.vo';

export class RecordAuditEventCommand {
  constructor(
    readonly actorId: string,
    readonly action: AuditActionEnum,
    readonly resourceType: string,
    readonly resourceId: string,
    readonly metadata?: Record<string, unknown>,
  ) {}
}
