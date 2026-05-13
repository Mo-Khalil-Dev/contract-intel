import { ValidateSessionHandler } from './validate-session.handler';
import { ValidateSessionQuery } from './validate-session.query';
import { InMemorySessionRepository } from '../../test/in-memory-session.repository';
import { Session } from '../../domain/session.aggregate';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { EncryptedAccessToken } from '../../domain/value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from '../../domain/value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from '../../domain/value-objects/encryption-salt.vo';
import { KeyName } from '../../domain/value-objects/key-name.vo';
import { SessionExpiry } from '../../domain/value-objects/session-expiry.vo';

const buildSession = (opts: { ttlSeconds?: number; now?: Date } = {}) => {
  const now = opts.now ?? new Date();
  return Session.create({
    id: SessionId.create(),
    userId: UserId.create(),
    encryptedAccessToken: EncryptedAccessToken.fromCiphertext('enc(access)'),
    encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('enc(refresh)'),
    encryptionSalt: EncryptionSalt.fromString('fake-salt-of-at-least-16-chars'),
    keyName: KeyName.fromString('fake-key'),
    expiry: SessionExpiry.fromTtlSeconds(opts.ttlSeconds ?? 3600, now),
    now,
  });
};

describe('ValidateSessionHandler', () => {
  it('returns valid for an active session', async () => {
    const sessions = new InMemorySessionRepository();
    const session = buildSession();
    await sessions.save(session);

    const handler = new ValidateSessionHandler(sessions);
    const result = await handler.execute(new ValidateSessionQuery(session.id.value));

    expect(result.status).toBe('valid');
    expect(result.userId).toBe(session.userId.value);
    expect(result.expiresAt).toEqual(session.expiry.expiresAt);
  });

  it('returns expired for a session past its expiry', async () => {
    const sessions = new InMemorySessionRepository();
    const session = buildSession({ now: new Date('2000-01-01T00:00:00Z'), ttlSeconds: 60 });
    await sessions.save(session);

    const handler = new ValidateSessionHandler(sessions);
    const result = await handler.execute(new ValidateSessionQuery(session.id.value));

    expect(result.status).toBe('expired');
    expect(result.userId).toBe(session.userId.value);
  });

  it('returns not_found for an unknown session id', async () => {
    const handler = new ValidateSessionHandler(new InMemorySessionRepository());
    const result = await handler.execute(new ValidateSessionQuery(SessionId.create().value));

    expect(result.status).toBe('not_found');
    expect(result.userId).toBeUndefined();
  });

  it('returns not_found for a malformed session id rather than throwing', async () => {
    const handler = new ValidateSessionHandler(new InMemorySessionRepository());
    const result = await handler.execute(new ValidateSessionQuery('not-a-uuid'));

    expect(result.status).toBe('not_found');
  });
});
