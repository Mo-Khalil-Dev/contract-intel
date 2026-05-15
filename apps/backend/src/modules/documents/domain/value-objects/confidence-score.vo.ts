import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface ConfidenceScoreProps {
  value: number;
}

export class ConfidenceScore extends ValueObject<ConfidenceScoreProps> {
  private constructor(value: number) {
    super({ value });
  }

  static fromNumber(value: number): ConfidenceScore {
    if (!Number.isFinite(value)) {
      throw new DomainException(
        'INVALID_CONFIDENCE_SCORE',
        `Confidence score must be a finite number (got ${value})`,
      );
    }
    if (value < 0 || value > 1) {
      throw new DomainException(
        'INVALID_CONFIDENCE_SCORE',
        `Confidence score must be between 0 and 1 inclusive (got ${value})`,
      );
    }
    return new ConfidenceScore(value);
  }

  static certain(): ConfidenceScore {
    return new ConfidenceScore(1);
  }

  static zero(): ConfidenceScore {
    return new ConfidenceScore(0);
  }

  get value(): number {
    return this.props.value;
  }
}
