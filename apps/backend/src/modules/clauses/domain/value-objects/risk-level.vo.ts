import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum RiskLevelValue {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

interface RiskLevelProps {
  value: RiskLevelValue;
}

export class RiskLevel extends ValueObject<RiskLevelProps> {
  private constructor(value: RiskLevelValue) {
    super({ value });
  }

  // Bands per clause-extraction-design.md §6.2 (DRAFT — SME validation in Phase 9):
  //   0–25 LOW · 26–50 MEDIUM · 51–75 HIGH · 76–100 CRITICAL
  static fromScore(score: number): RiskLevel {
    if (!Number.isInteger(score) || score < 0 || score > 100) {
      throw new DomainException(
        'INVALID_RISK_SCORE',
        `Risk score must be an integer 0..100 (got ${score})`,
      );
    }
    if (score <= 25) return new RiskLevel(RiskLevelValue.LOW);
    if (score <= 50) return new RiskLevel(RiskLevelValue.MEDIUM);
    if (score <= 75) return new RiskLevel(RiskLevelValue.HIGH);
    return new RiskLevel(RiskLevelValue.CRITICAL);
  }

  static fromValue(value: string): RiskLevel {
    const match = Object.values(RiskLevelValue).find((v) => (v as string) === value);
    if (!match) {
      throw new DomainException(
        'INVALID_RISK_LEVEL',
        `Risk level must be one of ${Object.values(RiskLevelValue).join(', ')} (got '${value}')`,
      );
    }
    return new RiskLevel(match);
  }

  get value(): RiskLevelValue {
    return this.props.value;
  }
}
