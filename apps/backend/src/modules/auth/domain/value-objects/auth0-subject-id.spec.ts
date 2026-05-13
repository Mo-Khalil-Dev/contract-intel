import { Auth0SubjectId } from './auth0-subject-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('Auth0SubjectId', () => {
  it('accepts auth0 native ids', () => {
    expect(Auth0SubjectId.fromString('auth0|abc123').value).toBe('auth0|abc123');
  });

  it('accepts social provider ids', () => {
    expect(Auth0SubjectId.fromString('google-oauth2|123456789').value).toBe(
      'google-oauth2|123456789',
    );
  });

  it('accepts enterprise provider ids', () => {
    expect(Auth0SubjectId.fromString('samlp|connection-name|user@org').value).toBe(
      'samlp|connection-name|user@org',
    );
  });

  it('exposes the provider portion', () => {
    expect(Auth0SubjectId.fromString('auth0|abc').provider).toBe('auth0');
    expect(Auth0SubjectId.fromString('google-oauth2|123').provider).toBe('google-oauth2');
  });

  it('rejects empty strings', () => {
    expect(() => Auth0SubjectId.fromString('')).toThrow(DomainException);
    expect(() => Auth0SubjectId.fromString('   ')).toThrow(DomainException);
  });

  it('rejects strings without a provider separator', () => {
    expect(() => Auth0SubjectId.fromString('abc123')).toThrow(DomainException);
  });

  it('rejects strings with empty provider', () => {
    expect(() => Auth0SubjectId.fromString('|abc123')).toThrow(DomainException);
  });
});
