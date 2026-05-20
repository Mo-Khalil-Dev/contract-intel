import { ValueObject } from '../../../shared/domain/value-object';
import { DomainException } from '../../../shared/exceptions/app-error';

interface ActorIdProps {
  value: string;
}

export class ActorId extends ValueObject<ActorIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(value: string): ActorId {
    const trimmed = value?.trim();
    if (!trimmed) {
      throw new DomainException('INVALID_ACTOR_ID', 'ActorId must not be empty');
    }
    return new ActorId(trimmed);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
