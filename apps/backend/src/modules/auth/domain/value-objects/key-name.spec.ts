import { KeyName } from './key-name.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('KeyName', () => {
  it('accepts simple identifiers', () => {
    expect(KeyName.fromString('primary').value).toBe('primary');
    expect(KeyName.fromString('rotated-key-2026').value).toBe('rotated-key-2026');
    expect(KeyName.fromString('v1.0').value).toBe('v1.0');
    expect(KeyName.fromString('key_42').value).toBe('key_42');
  });

  it('trims surrounding whitespace', () => {
    expect(KeyName.fromString('  primary  ').value).toBe('primary');
  });

  it('rejects empty', () => {
    expect(() => KeyName.fromString('')).toThrow(DomainException);
    expect(() => KeyName.fromString('   ')).toThrow(DomainException);
  });

  it('rejects strings with disallowed characters', () => {
    expect(() => KeyName.fromString('key with space')).toThrow(DomainException);
    expect(() => KeyName.fromString('key$secret')).toThrow(DomainException);
    expect(() => KeyName.fromString('key/secret')).toThrow(DomainException);
  });
});
