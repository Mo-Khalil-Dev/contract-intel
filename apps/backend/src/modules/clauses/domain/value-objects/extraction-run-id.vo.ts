import { v4 as uuid, validate as isUuid } from 'uuid';
import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface ExtractionRunIdProps {
  value: string;
}

export class ExtractionRunId extends ValueObject<ExtractionRunIdProps> {
  private constructor(value: string) {
    super({ value });
  }

  static create(): ExtractionRunId {
    return new ExtractionRunId(uuid());
  }

  static fromString(value: string): ExtractionRunId {
    if (!isUuid(value)) {
      throw new DomainException(
        'INVALID_EXTRACTION_RUN_ID',
        `Invalid ExtractionRunId: ${value}`,
      );
    }
    return new ExtractionRunId(value);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
