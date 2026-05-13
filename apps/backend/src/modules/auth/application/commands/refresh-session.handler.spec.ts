import { EventBus } from '@nestjs/cqrs';
import { RefreshSessionHandler } from './refresh-session.handler';
import { RefreshSessionCommand } from './refresh-session.command';
import { InMemorySessionRepository } from '../../test/in-memory-session.repository';
import { FakeOAuthProvider } from '../../test/fake-oauth-provider';
import { FakeSessionEncryption } from '../../test/fake-session-encryption';
import { Session } from '../../domain/session.aggregate';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { EncryptedAccessToken } from '../../domain/value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from '../../domain/value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from '../../domain/value-objects/encryption-salt.vo';
import { KeyName } from '../../domain/value-objects/key-name.vo';
import { SessionExpiry } from '../../domain/value-objects/session-expiry.vo';
import { NotFoundException, UnauthorizedException } from '../../../../shared/exceptions/app-error';

const buildHandler = (
  opts: {
    oauthOptions?: ConstructorParameters<typeof FakeOAuthProvider>[0];
  } = {},
) => {
  const sessions = new InMemorySessionRepository();
  const oauth = new FakeOAuthProvider(opts.oauthOptions);
  const encryption = new FakeSessionEncryption();
  const eventBus = { publishAll: jest.fn() } as unknown as EventBus;
  const handler = new RefreshSessionHandler(sessions, oauth, encryption, eventBus);
  return { handler, sessions, oauth, encryption, eventBus };
};

const seedSession = async (sessions: InMemorySessionRepository, expiry?: SessionExpiry) => {
  // Seed relative to real now so the session is genuinely valid when the
  // handler calls session.isExpired() with its own clock.
  const session = Session.create({
    id: SessionId.create(),
    userId: UserId.create(),
    encryptedAccessToken: EncryptedAccessToken.fromCiphertext('enc(access-1)'),
    encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('enc(refresh-1)'),
    encryptionSalt: EncryptionSalt.fromString('fake-salt-of-at-least-16-chars'),
    keyName: KeyName.fromString('fake-key'),
    expiry: expiry ?? SessionExpiry.fromTtlSeconds(3600),
  });
  session.pullDomainEvents();
  await sessions.save(session);
  return session;
};

describe('RefreshSessionHandler', () => {
  it('rotates the access token and expiry', async () => {
    const { handler, sessions } = buildHandler();
    const session = await seedSession(sessions);
    const before = Date.now();

    const result = await handler.execute(new RefreshSessionCommand(session.id.value));

    expect(result.sessionId).toBe(session.id.value);
    expect(result.expiresAt.getTime()).toBeGreaterThan(before);

    const reloaded = await sessions.findById(session.id);
    expect(reloaded?.encryptedAccessToken.ciphertext).toBe('enc(access-2)');
  });

  it('rotates the refresh token when the provider returns a new one', async () => {
    const { handler, sessions } = buildHandler();
    const session = await seedSession(sessions);

    await handler.execute(new RefreshSessionCommand(session.id.value));

    const reloaded = await sessions.findById(session.id);
    expect(reloaded?.encryptedRefreshToken.ciphertext).toBe('enc(refresh-2)');
  });

  it('keeps the original refresh token if the provider does not rotate it', async () => {
    const { handler, sessions } = buildHandler({
      oauthOptions: {
        refresh: { accessToken: 'access-2', expiresInSeconds: 3600 },
      },
    });
    const session = await seedSession(sessions);

    await handler.execute(new RefreshSessionCommand(session.id.value));

    const reloaded = await sessions.findById(session.id);
    expect(reloaded?.encryptedRefreshToken.ciphertext).toBe('enc(refresh-1)');
  });

  it('emits a SessionRefreshedEvent', async () => {
    const { handler, sessions, eventBus } = buildHandler();
    const session = await seedSession(sessions);

    await handler.execute(new RefreshSessionCommand(session.id.value));

    const events = (eventBus.publishAll as jest.Mock).mock.calls[0][0];
    const types = events.map((e: { getEventType: () => string }) => e.getEventType());
    expect(types).toContain('auth.session.refreshed');
  });

  it('throws NotFoundException when the session does not exist', async () => {
    const { handler } = buildHandler();

    await expect(
      handler.execute(new RefreshSessionCommand(SessionId.create().value)),
    ).rejects.toThrow(NotFoundException);
  });

  it('throws UnauthorizedException when the session is already expired', async () => {
    const { handler, sessions } = buildHandler();
    const session = Session.create({
      id: SessionId.create(),
      userId: UserId.create(),
      encryptedAccessToken: EncryptedAccessToken.fromCiphertext('enc(a)'),
      encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('enc(r)'),
      encryptionSalt: EncryptionSalt.fromString('fake-salt-of-at-least-16-chars'),
      keyName: KeyName.fromString('fake-key'),
      expiry: SessionExpiry.fromTtlSeconds(60, new Date('2000-01-01T00:00:00Z')),
      now: new Date('2000-01-01T00:00:00Z'),
    });
    session.pullDomainEvents();
    await sessions.save(session);

    await expect(handler.execute(new RefreshSessionCommand(session.id.value))).rejects.toThrow(
      UnauthorizedException,
    );
  });

  it('propagates OAuth refresh errors', async () => {
    const { handler, sessions } = buildHandler({
      oauthOptions: { refreshError: new Error('invalid_refresh_token') },
    });
    const session = await seedSession(sessions);

    await expect(handler.execute(new RefreshSessionCommand(session.id.value))).rejects.toThrow(
      'invalid_refresh_token',
    );
  });
});
