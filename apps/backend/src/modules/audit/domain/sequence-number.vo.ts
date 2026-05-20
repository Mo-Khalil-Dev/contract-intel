import { ValueObject } from '../../../shared/domain/value-object';
import { DomainException } from '../../../shared/exceptions/app-error';

interface SequenceNumberProps {
  value: number;
}

/**
 * Monotonically increasing sequence number per tenant.
 * Must be a non-negative integer.
 */
export class SequenceNumber extends ValueObject<SequenceNumberProps> {
  private constructor(value: number) {
    super({ value });
  }

  static fromNumber(value: number): SequenceNumber {
    if (!Number.isInteger(value) || value < 0) {
      throw new DomainException(
        'INVALID_SEQUENCE_NUMBER',
        `SequenceNumber must be a non-negative integer, got: ${value}`,
      );
    }
    return new SequenceNumber(value);
  }

  /**
   * Returns true if this sequence number is strictly greater than the other,
   * satisfying the monotonic-increase invariant.
   */
  isAfter(other: SequenceNumber): boolean {
    return this.props.value > other.props.value;
  }

  get value(): number {
    return this.props.value;
  }

  toString(): string {
    return String(this.props.value);
  }
}
