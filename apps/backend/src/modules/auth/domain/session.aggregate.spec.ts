import { Session } from './session.aggregate';
import { SessionId } from './value-objects/session-id.vo';
import { UserId } from './value-objects/user-id.vo';
import { EncryptedAccessToken } from './value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from './value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from './value-objects/encryption-salt.vo';
import { KeyName } from './value-objects/key-name.vo';
import { SessionExpiry } from './value-objects/session-expiry.vo';
import { DomainException } from '../../../shared/exceptions/app-error';
import {
  SessionCreatedEvent,
  SessionRefreshedEvent,
  SessionInvalidatedEvent,
} from './events/session.events';

const NOW = new Date('2026-05-13T12:00:00Z');

const buildSession = (overrides: { now?: Date } = {}) =>
  Session.create({
    id: SessionId.create(),
    userId: UserId.create(),
    encryptedAccessToken: EncryptedAccessToken.fromCiphertext('cipher-a'),
    encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('cipher-r'),
    encryptionSalt: EncryptionSalt.fromString('salt-of-at-least-16-chars'),
    keyName: KeyName.fromString('primary'),
    expiry: SessionExpiry.fromTtlSeconds(3600, overrides.now ?? NOW),
    now: overrides.now ?? NOW,
  });

describe('Session.create', () => {
  it('emits a SessionCreatedEvent', () => {
    const session = buildSession();
    const events = session.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SessionCreatedEvent);
    const created = events[0] as SessionCreatedEvent;
    expect(created.userId).toBe(session.userId.value);
    expect(created.expiresAt).toEqual(session.expiry.expiresAt);
  });

  it('stores all provided fields', () => {
    const session = buildSession();

    expect(session.encryptedAccessToken.ciphertext).toBe('cipher-a');
    expect(session.encryptedRefreshToken.ciphertext).toBe('cipher-r');
    expect(session.encryptionSalt.value).toBe('salt-of-at-least-16-chars');
    expect(session.keyName.value).toBe('primary');
  });
});

describe('Session.refresh', () => {
  it('rotates the access token and updates expiry', () => {
    const session = buildSession();
    session.pullDomainEvents();

    const newExpiry = SessionExpiry.fromTtlSeconds(7200, NOW);
    session.refresh({
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext('cipher-a-2'),
      expiry: newExpiry,
      now: NOW,
    });

    expect(session.encryptedAccessToken.ciphertext).toBe('cipher-a-2');
    expect(session.expiry.expiresAt).toEqual(newExpiry.expiresAt);
  });

  it('rotates the refresh token when provided', () => {
    const session = buildSession();
    session.pullDomainEvents();

    session.refresh({
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext('cipher-a-2'),
      encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('cipher-r-2'),
      expiry: SessionExpiry.fromTtlSeconds(7200, NOW),
      now: NOW,
    });

    expect(session.encryptedRefreshToken.ciphertext).toBe('cipher-r-2');
  });

  it('keeps the existing refresh token when not provided', () => {
    const session = buildSession();
    session.pullDomainEvents();

    session.refresh({
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext('cipher-a-2'),
      expiry: SessionExpiry.fromTtlSeconds(7200, NOW),
      now: NOW,
    });

    expect(session.encryptedRefreshToken.ciphertext).toBe('cipher-r');
  });

  it('emits a SessionRefreshedEvent', () => {
    const session = buildSession();
    session.pullDomainEvents();

    const newExpiry = SessionExpiry.fromTtlSeconds(7200, NOW);
    session.refresh({
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext('cipher-a-2'),
      expiry: newExpiry,
      now: NOW,
    });

    const events = session.pullDomainEvents();
    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SessionRefreshedEvent);
    expect((events[0] as SessionRefreshedEvent).newExpiresAt).toEqual(newExpiry.expiresAt);
  });

  it('rejects refresh on an already-expired session', () => {
    const session = buildSession({ now: NOW });
    const wayLater = new Date(NOW.getTime() + 7200 * 1000);

    expect(() =>
      session.refresh({
        encryptedAccessToken: EncryptedAccessToken.fromCiphertext('cipher-a-2'),
        expiry: SessionExpiry.fromTtlSeconds(3600, wayLater),
        now: wayLater,
      }),
    ).toThrow(DomainException);
  });
});

describe('Session.invalidate', () => {
  it('emits a SessionInvalidatedEvent with the reason', () => {
    const session = buildSession();
    session.pullDomainEvents();

    session.invalidate('logout');
    const events = session.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(SessionInvalidatedEvent);
    expect((events[0] as SessionInvalidatedEvent).reason).toBe('logout');
  });

  it.each(['logout', 'expired', 'revoked', 'replaced'] as const)(
    'accepts reason "%s"',
    (reason) => {
      const session = buildSession();
      session.pullDomainEvents();

      session.invalidate(reason);
      const events = session.pullDomainEvents();
      expect((events[0] as SessionInvalidatedEvent).reason).toBe(reason);
    },
  );
});

describe('Session.isExpired', () => {
  it('is false right after creation', () => {
    const session = buildSession();
    expect(session.isExpired(NOW)).toBe(false);
  });

  it('is true after the expiry passes', () => {
    const session = buildSession();
    const later = new Date(NOW.getTime() + 4000 * 1000);
    expect(session.isExpired(later)).toBe(true);
  });
});

describe('Session.belongsTo', () => {
  it('returns true for the owning user', () => {
    const userId = UserId.create();
    const session = Session.create({
      id: SessionId.create(),
      userId,
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext('a'),
      encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('r'),
      encryptionSalt: EncryptionSalt.fromString('salt-of-at-least-16-chars'),
      keyName: KeyName.fromString('primary'),
      expiry: SessionExpiry.fromTtlSeconds(3600, NOW),
      now: NOW,
    });

    expect(session.belongsTo(userId)).toBe(true);
  });

  it('returns false for a different user', () => {
    const session = buildSession();
    expect(session.belongsTo(UserId.create())).toBe(false);
  });
});
