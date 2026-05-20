import { AuditEvent, CreateAuditEventParams } from './audit-event.aggregate';
import { AuditActionEnum } from './audit-action.vo';

export interface CreateAuditEventFactoryParams {
  actorId: string;
  action: AuditActionEnum;
  resourceId: string;
  sequenceNumber: number;
  /** Defaults to now if not provided. Must not be in the future. */
  timestamp?: Date;
}

export class AuditEventFactory {
  /**
   * Create a new AuditEvent aggregate.
   *
   * Delegates to AuditEvent.create() which enforces all invariants:
   * - Timestamp must be in the past or present
   * - Checksum is computed from id|timestamp|actorId|action|resourceId
   * - SequenceNumber must be a non-negative integer
   */
  static create(params: CreateAuditEventFactoryParams, now: Date = new Date()): AuditEvent {
    const createParams: CreateAuditEventParams = {
      actorId: params.actorId,
      action: params.action,
      resourceId: params.resourceId,
      sequenceNumber: params.sequenceNumber,
      timestamp: params.timestamp,
    };
    return AuditEvent.create(createParams, now);
  }
}
