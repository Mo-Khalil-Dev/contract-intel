import { createHash } from 'crypto';
import { ValueObject } from '../../../shared/domain/value-object';
import { DomainException } from '../../../shared/exceptions/app-error';

interface ChecksumProps {
  value: string;
}

/**
 * SHA-256 checksum value object.
 * Computed as: SHA256(`${id}|${timestamp.toISOString()}|${actorId}|${action}|${resourceId}`)
 */
export class Checksum extends ValueObject<ChecksumProps> {
  private constructor(value: string) {
    super({ value });
  }

  /**
   * Compute a new checksum from the canonical audit event fields.
   */
  static compute(params: {
    id: string;
    timestamp: Date;
    actorId: string;
    action: string;
    resourceId: string;
  }): Checksum {
    const payload = `${params.id}|${params.timestamp.toISOString()}|${params.actorId}|${params.action}|${params.resourceId}`;
    const hash = createHash('sha256').update(payload).digest('hex');
    return new Checksum(hash);
  }

  /**
   * Reconstruct a Checksum from a stored hex string (e.g. from persistence).
   */
  static fromString(value: string): Checksum {
    if (!/^[a-f0-9]{64}$/.test(value)) {
      throw new DomainException(
        'INVALID_CHECKSUM',
        'Checksum must be a 64-character lowercase hex string (SHA-256)',
      );
    }
    return new Checksum(value);
  }

  /**
   * Verify that this checksum matches the expected value for the given fields.
   */
  verify(params: {
    id: string;
    timestamp: Date;
    actorId: string;
    action: string;
    resourceId: string;
  }): boolean {
    const expected = Checksum.compute(params);
    return this.equals(expected);
  }

  get value(): string {
    return this.props.value;
  }

  toString(): string {
    return this.props.value;
  }
}
