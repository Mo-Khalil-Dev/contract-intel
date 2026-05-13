import { EventBus } from '@nestjs/cqrs';
import { LogoutHandler } from './logout.handler';
import { LogoutCommand } from './logout.command';
import { InMemoryUserRepository } from '../../test/in-memory-user.repository';
import { InMemorySessionRepository } from '../../test/in-memory-session.repository';
import { FakeOAuthProvider } from '../../test/fake-oauth-provider';
import { FakeSessionEncryption } from '../../test/fake-session-encryption';
import { User } from '../../domain/user.aggregate';
import { Session } from '../../domain/session.aggregate';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { SessionId } from '../../domain/value-objects/session-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Auth0SubjectId } from '../../domain/value-objects/auth0-subject-id.vo';
import { EncryptedAccessToken } from '../../domain/value-objects/encrypted-access-token.vo';
import { EncryptedRefreshToken } from '../../domain/value-objects/encrypted-refresh-token.vo';
import { EncryptionSalt } from '../../domain/value-objects/encryption-salt.vo';
import { KeyName } from '../../domain/value-objects/key-name.vo';
import { SessionExpiry } from '../../domain/value-objects/session-expiry.vo';
import { NotFoundException } from '../../../../shared/exceptions/app-error';

const buildHandler = (
  opts: {
    oauthOptions?: ConstructorParameters<typeof FakeOAuthProvider>[0];
  } = {},
) => {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const oauth = new FakeOAuthProvider(opts.oauthOptions);
  const encryption = new FakeSessionEncryption();
  const eventBus = { publishAll: jest.fn() } as unknown as EventBus;
  const handler = new LogoutHandler(users, sessions, oauth, encryption, eventBus);
  return { handler, users, sessions, oauth, encryption, eventBus };
};

const seedUserAndSession = async (
  users: InMemoryUserRepository,
  sessions: InMemorySessionRepository,
) => {
  const user = User.create({
    id: UserId.create(),
    email: Email.create('alice@example.com'),
    auth0SubjectId: Auth0SubjectId.fromString('auth0|user-1'),
    displayName: 'Alice',
  });
  user.pullDomainEvents();
  await users.save(user);

  const session = Session.create({
    id: SessionId.create(),
    userId: user.id,
    encryptedAccessToken: EncryptedAccessToken.fromCiphertext('enc(access-1)'),
    encryptedRefreshToken: EncryptedRefreshToken.fromCiphertext('enc(refresh-1)'),
    encryptionSalt: EncryptionSalt.fromString('fake-salt-of-at-least-16-chars'),
    keyName: KeyName.fromString('fake-key'),
    expiry: SessionExpiry.fromTtlSeconds(3600),
  });
  session.pullDomainEvents();
  await sessions.save(session);

  return { user, session };
};

describe('LogoutHandler', () => {
  it('deletes the session and revokes the refresh token', async () => {
    const { handler, users, sessions, oauth } = buildHandler();
    const { session } = await seedUserAndSession(users, sessions);

    await handler.execute(new LogoutCommand(session.id.value));

    expect(sessions.size()).toBe(0);
    expect(oauth.revokeCalls).toEqual(['refresh-1']);
  });

  it('emits SessionInvalidatedEvent (reason logout) and UserLoggedOutEvent', async () => {
    const { handler, users, sessions, eventBus } = buildHandler();
    const { session } = await seedUserAndSession(users, sessions);

    await handler.execute(new LogoutCommand(session.id.value));

    const events = (eventBus.publishAll as jest.Mock).mock.calls[0][0];
    const types = events.map((e: { getEventType: () => string }) => e.getEventType());
    expect(types).toContain('auth.session.invalidated');
    expect(types).toContain('auth.user.logged_out');
    const invalidated = events.find(
      (e: { getEventType: () => string }) => e.getEventType() === 'auth.session.invalidated',
    );
    expect(invalidated.reason).toBe('logout');
  });

  it('throws NotFoundException when the session does not exist', async () => {
    const { handler } = buildHandler();
    await expect(handler.execute(new LogoutCommand(SessionId.create().value))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('still deletes the session if OAuth revocation fails', async () => {
    const { handler, users, sessions } = buildHandler({
      oauthOptions: { revokeError: new Error('auth0 down') },
    });
    const { session } = await seedUserAndSession(users, sessions);

    await expect(handler.execute(new LogoutCommand(session.id.value))).resolves.toBeUndefined();
    expect(sessions.size()).toBe(0);
  });

  it('still completes when the user record is gone (orphan session)', async () => {
    const { handler, users, sessions } = buildHandler();
    const { user, session } = await seedUserAndSession(users, sessions);
    // simulate an orphan session: user record removed from repo
    (users as unknown as { store: Map<string, unknown> }).store.delete(user.id.value);

    await expect(handler.execute(new LogoutCommand(session.id.value))).resolves.toBeUndefined();
    expect(sessions.size()).toBe(0);
  });
});
