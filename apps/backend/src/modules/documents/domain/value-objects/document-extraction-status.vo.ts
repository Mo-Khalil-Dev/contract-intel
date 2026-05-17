import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

// Document-level view of clause-extraction lifecycle. Distinct from the
// clauses-module ExtractionStatus VO (running|complete|failed) which lives
// on the ExtractionRun aggregate. Document needs `not_started` and a clear
// terminal-state vocabulary the frontend can branch on.
export enum DocumentExtractionStatusValue {
  NOT_STARTED = 'not_started',
  EXTRACTING = 'extracting',
  EXTRACTION_COMPLETE = 'extraction_complete',
  EXTRACTION_FAILED = 'extraction_failed',
}

interface DocumentExtractionStatusProps {
  value: DocumentExtractionStatusValue;
}

const TRANSITIONS: Record<
  DocumentExtractionStatusValue,
  DocumentExtractionStatusValue[]
> = {
  [DocumentExtractionStatusValue.NOT_STARTED]: [
    DocumentExtractionStatusValue.EXTRACTING,
  ],
  [DocumentExtractionStatusValue.EXTRACTING]: [
    DocumentExtractionStatusValue.EXTRACTION_COMPLETE,
    DocumentExtractionStatusValue.EXTRACTION_FAILED,
  ],
  [DocumentExtractionStatusValue.EXTRACTION_COMPLETE]: [
    // Re-extraction restarts the cycle.
    DocumentExtractionStatusValue.EXTRACTING,
  ],
  [DocumentExtractionStatusValue.EXTRACTION_FAILED]: [
    DocumentExtractionStatusValue.EXTRACTING,
  ],
};

export class DocumentExtractionStatus extends ValueObject<DocumentExtractionStatusProps> {
  private constructor(value: DocumentExtractionStatusValue) {
    super({ value });
  }

  static notStarted(): DocumentExtractionStatus {
    return new DocumentExtractionStatus(DocumentExtractionStatusValue.NOT_STARTED);
  }

  static fromValue(value: string): DocumentExtractionStatus {
    const match = Object.values(DocumentExtractionStatusValue).find(
      (v) => (v as string) === value,
    );
    if (!match) {
      throw new DomainException(
        'INVALID_DOCUMENT_EXTRACTION_STATUS',
        `Document extraction status must be one of ${Object.values(DocumentExtractionStatusValue).join(', ')} (got '${value}')`,
      );
    }
    return new DocumentExtractionStatus(match);
  }

  get value(): DocumentExtractionStatusValue {
    return this.props.value;
  }

  canTransitionTo(next: DocumentExtractionStatus): boolean {
    return TRANSITIONS[this.props.value].includes(next.props.value);
  }

  transitionTo(next: DocumentExtractionStatus): DocumentExtractionStatus {
    if (!this.canTransitionTo(next)) {
      throw new DomainException(
        'INVALID_DOCUMENT_EXTRACTION_STATUS_TRANSITION',
        `Cannot transition from '${this.props.value}' to '${next.props.value}'`,
      );
    }
    return next;
  }
}
