import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface SessionIdProps {
  value: string;
}

export class SessionId extends ValueObject<SessionIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): SessionId {
    return new SessionId(uuid());
  }

  static fromString(value: string): SessionId {
    if (!isUuid(value)) {
      throw new DomainException('INVALID_SESSION_ID', `Invalid SessionId: ${value}`);
    }
    return new SessionId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
