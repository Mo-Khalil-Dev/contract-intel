import { DomainEvent } from '../../../shared/domain/domain-event';
import { AuditActionEnum } from './audit-action.vo';

export class AuditEventRecordedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly actorId: string,
    readonly action: AuditActionEnum,
    readonly resourceId: string,
    readonly timestamp: Date,
    readonly sequenceNumber: number,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'audit.event.recorded';
  }
}
