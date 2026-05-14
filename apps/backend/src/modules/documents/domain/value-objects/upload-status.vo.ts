import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

export enum UploadStatusValue {
  PENDING = 'pending',
  UPLOADING = 'uploading',
  COMPLETE = 'complete',
  FAILED = 'failed',
  // 'processing' deliberately absent in v1 — re-added when the
  // extraction pipeline ships in a later phase.
}

interface UploadStatusProps {
  value: UploadStatusValue;
}

/**
 * Allowed forward transitions. Anything not listed is rejected by
 * `canTransitionTo`. Terminal states (complete / failed) cannot move on.
 */
const TRANSITIONS: Record<UploadStatusValue, UploadStatusValue[]> = {
  [UploadStatusValue.PENDING]: [UploadStatusValue.UPLOADING, UploadStatusValue.FAILED],
  [UploadStatusValue.UPLOADING]: [UploadStatusValue.COMPLETE, UploadStatusValue.FAILED],
  [UploadStatusValue.COMPLETE]: [],
  [UploadStatusValue.FAILED]: [],
};

export class UploadStatus extends ValueObject<UploadStatusProps> {
  private constructor(value: UploadStatusValue) {
    super({ value });
  }

  static pending(): UploadStatus {
    return new UploadStatus(UploadStatusValue.PENDING);
  }

  static fromValue(value: string): UploadStatus {
    const match = Object.values(UploadStatusValue).find((s) => (s as string) === value);
    if (!match) {
      throw new DomainException(
        'INVALID_UPLOAD_STATUS',
        `Upload status must be one of ${Object.values(UploadStatusValue).join(', ')} (got '${value}')`,
      );
    }
    return new UploadStatus(match);
  }

  get value(): UploadStatusValue {
    return this.props.value;
  }

  isTerminal(): boolean {
    return TRANSITIONS[this.props.value].length === 0;
  }

  canTransitionTo(next: UploadStatus): boolean {
    return TRANSITIONS[this.props.value].includes(next.props.value);
  }

  /**
   * Move forward. Throws if the transition isn't allowed by the state
   * machine — the aggregate relies on this to enforce its invariants.
   */
  transitionTo(next: UploadStatus): UploadStatus {
    if (!this.canTransitionTo(next)) {
      throw new DomainException(
        'INVALID_STATUS_TRANSITION',
        `Cannot transition from '${this.props.value}' to '${next.props.value}'`,
      );
    }
    return next;
  }
}
