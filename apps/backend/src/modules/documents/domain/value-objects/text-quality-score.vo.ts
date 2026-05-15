import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface TextQualityScoreProps {
  value: number;
}

export class TextQualityScore extends ValueObject<TextQualityScoreProps> {
  private constructor(value: number) {
    super({ value });
  }

  static fromNumber(value: number): TextQualityScore {
    if (!Number.isFinite(value)) {
      throw new DomainException(
        'INVALID_TEXT_QUALITY_SCORE',
        `Text quality score must be a finite number (got ${value})`,
      );
    }
    if (value < 0 || value > 1) {
      throw new DomainException(
        'INVALID_TEXT_QUALITY_SCORE',
        `Text quality score must be between 0 and 1 inclusive (got ${value})`,
      );
    }
    return new TextQualityScore(value);
  }

  get value(): number {
    return this.props.value;
  }

  // Pages below this threshold get demoted from native extraction to cloud OCR.
  // Default matches OCR_TEXT_QUALITY_THRESHOLD env (0.5).
  isBelow(threshold: number): boolean {
    return this.props.value < threshold;
  }
}
