import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface DocumentIdProps {
  value: string;
}

export class DocumentId extends ValueObject<DocumentIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): DocumentId {
    return new DocumentId(uuid());
  }

  static fromString(value: string): DocumentId {
    if (!isUuid(value)) {
      throw new DomainException('INVALID_DOCUMENT_ID', `Invalid DocumentId: ${value}`);
    }
    return new DocumentId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
