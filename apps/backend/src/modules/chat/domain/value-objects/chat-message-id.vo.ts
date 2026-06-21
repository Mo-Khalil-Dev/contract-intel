import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface ChatMessageIdProps {
  value: string;
}

export class ChatMessageId extends ValueObject<ChatMessageIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): ChatMessageId {
    return new ChatMessageId(uuid());
  }

  static fromString(value: string): ChatMessageId {
    if (!isUuid(value)) {
      throw new DomainException(
        'INVALID_CHAT_MESSAGE_ID',
        `Invalid ChatMessageId: ${value}`,
      );
    }
    return new ChatMessageId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
