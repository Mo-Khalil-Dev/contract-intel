import { EncryptedAccessToken } from './encrypted-access-token.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('EncryptedAccessToken', () => {
  it('wraps a non-empty ciphertext', () => {
    const token = EncryptedAccessToken.fromCiphertext('base64-cipher-here');
    expect(token.ciphertext).toBe('base64-cipher-here');
  });

  it('rejects an empty string', () => {
    expect(() => EncryptedAccessToken.fromCiphertext('')).toThrow(DomainException);
  });

  it('does not expose the ciphertext via toString()', () => {
    const token = EncryptedAccessToken.fromCiphertext('cipher');
    // Default Object.prototype.toString — should not leak the ciphertext
    expect(String(token)).toBe('[object Object]');
  });

  it('equals another token with the same ciphertext', () => {
    expect(
      EncryptedAccessToken.fromCiphertext('cipher').equals(
        EncryptedAccessToken.fromCiphertext('cipher'),
      ),
    ).toBe(true);
  });
});
