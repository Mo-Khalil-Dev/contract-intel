import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface ClauseIdProps {
  value: string;
}

export class ClauseId extends ValueObject<ClauseIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): ClauseId {
    return new ClauseId(uuid());
  }

  static fromString(value: string): ClauseId {
    if (!isUuid(value)) {
      throw new DomainException('INVALID_CLAUSE_ID', `Invalid ClauseId: ${value}`);
    }
    return new ClauseId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
