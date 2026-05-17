import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum ExtractionStatusValue {
  RUNNING = 'running',
  COMPLETE = 'complete',
  FAILED = 'failed',
}

interface ExtractionStatusProps {
  value: ExtractionStatusValue;
}

// `failed` is terminal — retry creates a new ExtractionRun rather than reviving this one.
const TRANSITIONS: Record<ExtractionStatusValue, ExtractionStatusValue[]> = {
  [ExtractionStatusValue.RUNNING]: [
    ExtractionStatusValue.COMPLETE,
    ExtractionStatusValue.FAILED,
  ],
  [ExtractionStatusValue.COMPLETE]: [],
  [ExtractionStatusValue.FAILED]: [],
};

export class ExtractionStatus extends ValueObject<ExtractionStatusProps> {
  private constructor(value: ExtractionStatusValue) {
    super({ value });
  }

  static running(): ExtractionStatus {
    return new ExtractionStatus(ExtractionStatusValue.RUNNING);
  }

  static fromValue(value: string): ExtractionStatus {
    const match = Object.values(ExtractionStatusValue).find(
      (v) => (v as string) === value,
    );
    if (!match) {
      throw new DomainException(
        'INVALID_EXTRACTION_STATUS',
        `Extraction status must be one of ${Object.values(ExtractionStatusValue).join(', ')} (got '${value}')`,
      );
    }
    return new ExtractionStatus(match);
  }

  get value(): ExtractionStatusValue {
    return this.props.value;
  }

  isTerminal(): boolean {
    return this.props.value !== ExtractionStatusValue.RUNNING;
  }

  canTransitionTo(next: ExtractionStatus): boolean {
    return TRANSITIONS[this.props.value].includes(next.props.value);
  }

  transitionTo(next: ExtractionStatus): ExtractionStatus {
    if (!this.canTransitionTo(next)) {
      throw new DomainException(
        'INVALID_EXTRACTION_STATUS_TRANSITION',
        `Cannot transition from '${this.props.value}' to '${next.props.value}'`,
      );
    }
    return next;
  }
}
