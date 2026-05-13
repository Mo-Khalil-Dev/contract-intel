import { ValueObject } from '../../../../shared/domain/value-object';
import { DomainException } from '../../../../shared/exceptions/app-error';

interface EncryptedAccessTokenProps {
  ciphertext: string;
}

export class EncryptedAccessToken extends ValueObject<EncryptedAccessTokenProps> {
  private constructor(ciphertext: string) {
    super({ ciphertext });
  }

  static fromCiphertext(ciphertext: string): EncryptedAccessToken {
    if (typeof ciphertext !== 'string' || ciphertext.length === 0) {
      throw new DomainException(
        'INVALID_ENCRYPTED_TOKEN',
        'Encrypted access token cannot be empty',
      );
    }
    return new EncryptedAccessToken(ciphertext);
  }

  get ciphertext(): string {
    return this.props.ciphertext;
  }
}
