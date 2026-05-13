import { EncryptedRefreshToken } from './encrypted-refresh-token.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('EncryptedRefreshToken', () => {
  it('wraps a non-empty ciphertext', () => {
    expect(EncryptedRefreshToken.fromCiphertext('cipher').ciphertext).toBe('cipher');
  });

  it('rejects an empty string', () => {
    expect(() => EncryptedRefreshToken.fromCiphertext('')).toThrow(DomainException);
  });
});
