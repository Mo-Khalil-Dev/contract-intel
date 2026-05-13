import { Email } from './email.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('Email', () => {
  it('accepts a valid email', () => {
    expect(Email.create('alice@example.com').value).toBe('alice@example.com');
  });

  it('lower-cases the email', () => {
    expect(Email.create('Alice@EXAMPLE.com').value).toBe('alice@example.com');
  });

  it('trims surrounding whitespace', () => {
    expect(Email.create('  alice@example.com  ').value).toBe('alice@example.com');
  });

  it('exposes the domain portion', () => {
    expect(Email.create('alice@example.com').domain).toBe('example.com');
  });

  it('rejects an empty string', () => {
    expect(() => Email.create('')).toThrow(DomainException);
  });

  it('rejects whitespace-only', () => {
    expect(() => Email.create('   ')).toThrow(DomainException);
  });

  it('rejects strings without @', () => {
    expect(() => Email.create('not-an-email')).toThrow(DomainException);
  });

  it('rejects strings without a TLD', () => {
    expect(() => Email.create('alice@example')).toThrow(DomainException);
  });

  it('rejects strings with spaces', () => {
    expect(() => Email.create('al ice@example.com')).toThrow(DomainException);
  });

  it('equals another Email with the same value', () => {
    expect(Email.create('a@b.com').equals(Email.create('a@b.com'))).toBe(true);
  });

  it('treats case-equivalent emails as equal', () => {
    expect(Email.create('A@B.com').equals(Email.create('a@b.COM'))).toBe(true);
  });
});
