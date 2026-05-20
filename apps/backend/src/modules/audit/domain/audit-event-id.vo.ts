import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../shared/domain/value-object';
import { DomainException } from '../../../shared/exceptions/app-error';

interface AuditEventIdProps {
  value: string;
}

export class AuditEventId extends ValueObject<AuditEventIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): AuditEventId {
    return new AuditEventId(uuid());
  }

  static fromString(value: string): AuditEventId {
    if (!isUuid(value)) {
      throw new DomainException('INVALID_AUDIT_EVENT_ID', `Invalid AuditEventId: ${value}`);
    }
    return new AuditEventId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
