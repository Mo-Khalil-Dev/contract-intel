import { EventBus } from '@nestjs/cqrs';
import { LoginHandler } from './login.handler';
import { LoginCommand } from './login.command';
import { InMemoryUserRepository } from '../../test/in-memory-user.repository';
import { InMemorySessionRepository } from '../../test/in-memory-session.repository';
import { FakeOAuthProvider } from '../../test/fake-oauth-provider';
import { FakeSessionEncryption } from '../../test/fake-session-encryption';
import { Auth0SubjectId } from '../../domain/value-objects/auth0-subject-id.vo';
import { User } from '../../domain/user.aggregate';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Role, UserRole } from '../../domain/value-objects/user-role.vo';

const buildHandler = (
  opts: {
    oauthOptions?: ConstructorParameters<typeof FakeOAuthProvider>[0];
    seedUser?: User;
  } = {},
) => {
  const users = new InMemoryUserRepository();
  const sessions = new InMemorySessionRepository();
  const oauth = new FakeOAuthProvider(opts.oauthOptions);
  const encryption = new FakeSessionEncryption();
  const eventBus = { publishAll: jest.fn() } as unknown as EventBus;

  if (opts.seedUser) {
    void users.save(opts.seedUser);
  }

  const handler = new LoginHandler(users, sessions, oauth, encryption, eventBus);
  return { handler, users, sessions, oauth, encryption, eventBus };
};

describe('LoginHandler', () => {
  it('creates a new user on first login', async () => {
    const { handler, users, sessions } = buildHandler();

    const result = await handler.execute(new LoginCommand('code-123', 'http://localhost/cb'));

    expect(users.size()).toBe(1);
    expect(sessions.size()).toBe(1);
    expect(result.email).toBe('alice@example.com');
    expect(result.displayName).toBe('Alice');
    expect(result.role).toBe(Role.Reviewer);
  });

  it('records login on an existing user without creating a duplicate', async () => {
    const existingUser = User.create({
      id: UserId.create(),
      email: Email.create('alice@example.com'),
      auth0SubjectId: Auth0SubjectId.fromString('auth0|user-1'),
      displayName: 'Alice',
      role: UserRole.fromString(Role.LeadReviewer),
    });
    existingUser.pullDomainEvents(); // clear creation event

    const { handler, users, sessions } = buildHandler({ seedUser: existingUser });
    const result = await handler.execute(new LoginCommand('code-123', 'http://localhost/cb'));

    expect(users.size()).toBe(1);
    expect(sessions.size()).toBe(1);
    expect(result.userId).toBe(existingUser.id.value);
    expect(result.role).toBe(Role.LeadReviewer);

    const reloaded = await users.findByAuth0SubjectId(Auth0SubjectId.fromString('auth0|user-1'));
    expect(reloaded?.lastLoginAt).toBeInstanceOf(Date);
  });

  it('encrypts the tokens before storing them in the session', async () => {
    const { handler, sessions, encryption } = buildHandler();

    await handler.execute(new LoginCommand('code-123', 'http://localhost/cb'));

    expect(encryption.encryptCalls).toContain('access-1');
    expect(encryption.encryptCalls).toContain('refresh-1');
    const saved = Array.from((sessions as any).store.values())[0] as {
      encryptedAccessToken: { ciphertext: string };
    };
    expect(saved.encryptedAccessToken.ciphertext).toBe('enc(access-1)');
  });

  it('exchanges the authorization code with the redirect URI provided', async () => {
    const { handler, oauth } = buildHandler();

    await handler.execute(new LoginCommand('abc', 'http://example.com/cb'));

    expect(oauth.exchangeCalls).toEqual([{ code: 'abc', redirectUri: 'http://example.com/cb' }]);
  });

  it('forwards request context to UserLoggedInEvent', async () => {
    const { handler, eventBus } = buildHandler();

    await handler.execute(
      new LoginCommand('code', 'http://localhost/cb', {
        ipAddress: '10.0.0.1',
        userAgent: 'Mozilla',
      }),
    );

    expect(eventBus.publishAll).toHaveBeenCalledTimes(1);
    const events = (eventBus.publishAll as jest.Mock).mock.calls[0][0];
    const loggedIn = events.find(
      (e: { getEventType: () => string }) => e.getEventType() === 'auth.user.logged_in',
    );
    expect(loggedIn.ipAddress).toBe('10.0.0.1');
    expect(loggedIn.userAgent).toBe('Mozilla');
  });

  it('propagates OAuth exchange errors', async () => {
    const { handler } = buildHandler({
      oauthOptions: { exchangeError: new Error('invalid_grant') },
    });

    await expect(handler.execute(new LoginCommand('bad-code', 'http://cb'))).rejects.toThrow(
      'invalid_grant',
    );
  });
});
