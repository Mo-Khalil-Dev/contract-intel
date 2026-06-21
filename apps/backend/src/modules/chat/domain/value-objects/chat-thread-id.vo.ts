import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface ChatThreadIdProps {
  value: string;
}

export class ChatThreadId extends ValueObject<ChatThreadIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): ChatThreadId {
    return new ChatThreadId(uuid());
  }

  static fromString(value: string): ChatThreadId {
    if (!isUuid(value)) {
      throw new DomainException(
        'INVALID_CHAT_THREAD_ID',
        `Invalid ChatThreadId: ${value}`,
      );
    }
    return new ChatThreadId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
