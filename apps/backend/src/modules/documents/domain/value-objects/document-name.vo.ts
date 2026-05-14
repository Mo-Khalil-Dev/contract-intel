import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface DocumentNameProps {
  value: string;
}

const MAX_LENGTH = 255;

export class DocumentName extends ValueObject<DocumentNameProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(raw: string): DocumentName {
    const value = raw.trim();
    if (value.length === 0) {
      throw new DomainException('INVALID_DOCUMENT_NAME', 'Document name cannot be empty');
    }
    if (value.length > MAX_LENGTH) {
      throw new DomainException(
        'INVALID_DOCUMENT_NAME',
        `Document name cannot exceed ${MAX_LENGTH} characters (got ${value.length})`,
      );
    }
    return new DocumentName(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
