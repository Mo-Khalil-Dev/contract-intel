import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum ProcessingStatusValue {
  NOT_STARTED = 'not_started',
  PROCESSING = 'processing',
  OCR_COMPLETE = 'ocr_complete',
  OCR_FAILED = 'ocr_failed',
}

interface ProcessingStatusProps {
  value: ProcessingStatusValue;
}

const TRANSITIONS: Record<ProcessingStatusValue, ProcessingStatusValue[]> = {
  [ProcessingStatusValue.NOT_STARTED]: [ProcessingStatusValue.PROCESSING],
  [ProcessingStatusValue.PROCESSING]: [
    ProcessingStatusValue.OCR_COMPLETE,
    ProcessingStatusValue.OCR_FAILED,
  ],
  [ProcessingStatusValue.OCR_COMPLETE]: [],
  [ProcessingStatusValue.OCR_FAILED]: [ProcessingStatusValue.PROCESSING],
};

export class ProcessingStatus extends ValueObject<ProcessingStatusProps> {
  private constructor(value: ProcessingStatusValue) {
    super({ value });
  }

  static notStarted(): ProcessingStatus {
    return new ProcessingStatus(ProcessingStatusValue.NOT_STARTED);
  }

  static fromValue(value: string): ProcessingStatus {
    const match = Object.values(ProcessingStatusValue).find((s) => (s as string) === value);
    if (!match) {
      throw new DomainException(
        'INVALID_PROCESSING_STATUS',
        `Processing status must be one of ${Object.values(ProcessingStatusValue).join(', ')} (got '${value}')`,
      );
    }
    return new ProcessingStatus(match);
  }

  get value(): ProcessingStatusValue {
    return this.props.value;
  }

  isTerminal(): boolean {
    return this.props.value === ProcessingStatusValue.OCR_COMPLETE;
  }

  canTransitionTo(next: ProcessingStatus): boolean {
    return TRANSITIONS[this.props.value].includes(next.props.value);
  }

  transitionTo(next: ProcessingStatus): ProcessingStatus {
    if (!this.canTransitionTo(next)) {
      throw new DomainException(
        'INVALID_PROCESSING_STATUS_TRANSITION',
        `Cannot transition from '${this.props.value}' to '${next.props.value}'`,
      );
    }
    return next;
  }
}
