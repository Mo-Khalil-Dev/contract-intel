import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface EncryptionSaltProps {
  value: string;
}

// PBKDF2 salts should be at least 16 bytes. When base64-encoded that is
// at least 22 chars. We accept any non-empty string and enforce the
// minimum at the adapter layer (SessionEncryptionService) — the domain
// just requires non-empty.
const MIN_SALT_LENGTH = 16;

export class EncryptionSalt extends ValueObject<EncryptionSaltProps> {
  private constructor(value: string) {
    super({ value });
  }

  static fromString(value: string): EncryptionSalt {
    if (typeof value !== 'string' || value.length === 0) {
      throw new DomainException('INVALID_ENCRYPTION_SALT', 'Encryption salt cannot be empty');
    }
    if (value.length < MIN_SALT_LENGTH) {
      throw new DomainException(
        'INVALID_ENCRYPTION_SALT',
        `Encryption salt must be at least ${MIN_SALT_LENGTH} characters (got ${value.length})`,
      );
    }
    return new EncryptionSalt(value);
  }

  get value(): string {
    return this.props.value;
  }
}
