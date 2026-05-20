import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DomainException } from '../../../shared/exceptions/app-error';
import { AuditEventId } from './audit-event-id.vo';
import { AuditAction, AuditActionEnum } from './audit-action.vo';
import { ActorId } from './actor-id.vo';
import { ResourceId } from './resource-id.vo';
import { Checksum } from './checksum.vo';
import { SequenceNumber } from './sequence-number.vo';
import { AuditEventRecordedEvent } from './audit-event.events';

/**
 * Immutable audit event aggregate.
 * All fields are set at creation time and cannot be mutated afterwards.
 * The checksum is computed from the canonical fields to enable tamper detection.
 */
interface AuditEventProps {
  readonly actorId: ActorId;
  readonly action: AuditAction;
  readonly resourceId: ResourceId;
  readonly checksum: Checksum;
  readonly sequenceNumber: SequenceNumber;
  readonly timestamp: Date;
}

export interface CreateAuditEventParams {
  actorId: string;
  action: AuditActionEnum;
  resourceId: string;
  sequenceNumber: number;
  /** Defaults to now if not provided. Must not be in the future. */
  timestamp?: Date;
}

export class AuditEvent extends AggregateRoot<AuditEventId> {
  private readonly props: Readonly<AuditEventProps>;

  private constructor(id: AuditEventId, props: AuditEventProps) {
    super(id);
    // Deep-freeze props to enforce immutability
    this.props = Object.freeze({ ...props });
  }

  /**
   * Factory method — creates a new AuditEvent, computes the checksum,
   * and emits an AuditEventRecordedEvent.
   *
   * Invariants enforced:
   * - Timestamp must be in the past or present
   * - Checksum is computed from id|timestamp|actorId|action|resourceId
   * - SequenceNumber must be a non-negative integer
   */
  static create(params: CreateAuditEventParams, now: Date = new Date()): AuditEvent {
    const timestamp = params.timestamp ?? now;

    if (timestamp > now) {
      throw new DomainException(
        'AUDIT_EVENT_FUTURE_TIMESTAMP',
        'AuditEvent timestamp must be in the past or present',
      );
    }

    const id = AuditEventId.create();
    const actorId = ActorId.fromString(params.actorId);
    const action = AuditAction.of(params.action);
    const resourceId = ResourceId.fromString(params.resourceId);
    const sequenceNumber = SequenceNumber.fromNumber(params.sequenceNumber);

    const checksum = Checksum.compute({
      id: id.value,
      timestamp,
      actorId: actorId.value,
      action: action.value,
      resourceId: resourceId.value,
    });

    const auditEvent = new AuditEvent(id, {
      actorId,
      action,
      resourceId,
      checksum,
      sequenceNumber,
      timestamp,
    });

    auditEvent.addDomainEvent(
      new AuditEventRecordedEvent(
        id.value,
        actorId.value,
        action.value,
        resourceId.value,
        timestamp,
        sequenceNumber.value,
      ),
    );

    return auditEvent;
  }

  /**
   * Rehydrate an AuditEvent from persistence without emitting domain events.
   */
  static rehydrate(id: AuditEventId, props: AuditEventProps): AuditEvent {
    return new AuditEvent(id, props);
  }

  // ── Getters (read-only, no setters) ──────────────────────────────────────

  get actorId(): ActorId {
    return this.props.actorId;
  }

  get action(): AuditAction {
    return this.props.action;
  }

  get resourceId(): ResourceId {
    return this.props.resourceId;
  }

  get checksum(): Checksum {
    return this.props.checksum;
  }

  get sequenceNumber(): SequenceNumber {
    return this.props.sequenceNumber;
  }

  get timestamp(): Date {
    return this.props.timestamp;
  }

  /**
   * Verify the stored checksum against the event's own fields.
   * Returns false if the record has been tampered with.
   */
  verifyIntegrity(): boolean {
    return this.props.checksum.verify({
      id: this.id.value,
      timestamp: this.props.timestamp,
      actorId: this.props.actorId.value,
      action: this.props.action.value,
      resourceId: this.props.resourceId.value,
    });
  }
}
