import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface UserIdProps {
  value: string;
}

export class UserId extends ValueObject<UserIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): UserId {
    return new UserId(uuid());
  }

  static fromString(value: string): UserId {
    if (!isUuid(value)) {
      throw new DomainException('INVALID_USER_ID', `Invalid UserId: ${value}`);
    }
    return new UserId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
