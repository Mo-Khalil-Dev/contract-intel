import { EncryptionSalt } from './encryption-salt.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('EncryptionSalt', () => {
  it('accepts a salt of >= 16 chars', () => {
    const salt = 'a'.repeat(16);
    expect(EncryptionSalt.fromString(salt).value).toBe(salt);
  });

  it('rejects empty', () => {
    expect(() => EncryptionSalt.fromString('')).toThrow(DomainException);
  });

  it('rejects too-short salt', () => {
    expect(() => EncryptionSalt.fromString('short')).toThrow(/at least 16/);
  });

  it('rejects exactly 15 chars (just under threshold)', () => {
    expect(() => EncryptionSalt.fromString('a'.repeat(15))).toThrow(DomainException);
  });
});
