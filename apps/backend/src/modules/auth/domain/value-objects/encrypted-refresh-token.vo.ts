import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface EncryptedRefreshTokenProps {
  ciphertext: string;
}

export class EncryptedRefreshToken extends ValueObject<EncryptedRefreshTokenProps> {
  private constructor(ciphertext: string) {
    super({ ciphertext });
  }

  static fromCiphertext(ciphertext: string): EncryptedRefreshToken {
    if (typeof ciphertext !== 'string' || ciphertext.length === 0) {
      throw new DomainException(
        'INVALID_ENCRYPTED_TOKEN',
        'Encrypted refresh token cannot be empty',
      );
    }
    return new EncryptedRefreshToken(ciphertext);
  }

  get ciphertext(): string {
    return this.props.ciphertext;
  }
}
