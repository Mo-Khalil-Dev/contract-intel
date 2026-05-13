import { GetCurrentUserHandler } from './get-current-user.handler';
import { GetCurrentUserQuery } from './get-current-user.query';
import { InMemoryUserRepository } from '../../test/in-memory-user.repository';
import { User } from '../../domain/user.aggregate';
import { UserId } from '../../domain/value-objects/user-id.vo';
import { Email } from '../../domain/value-objects/email.vo';
import { Auth0SubjectId } from '../../domain/value-objects/auth0-subject-id.vo';
import { NotFoundException } from '../../../../shared/exceptions/app-error';

describe('GetCurrentUserHandler', () => {
  it('returns the current user view', async () => {
    const users = new InMemoryUserRepository();
    const user = User.create({
      id: UserId.create(),
      email: Email.create('alice@example.com'),
      auth0SubjectId: Auth0SubjectId.fromString('auth0|user-1'),
      displayName: 'Alice',
    });
    user.recordLogin({ now: new Date('2026-05-13T12:00:00Z') });
    await users.save(user);

    const handler = new GetCurrentUserHandler(users);
    const view = await handler.execute(new GetCurrentUserQuery(user.id.value));

    expect(view.userId).toBe(user.id.value);
    expect(view.email).toBe('alice@example.com');
    expect(view.displayName).toBe('Alice');
    expect(view.lastLoginAt).toEqual(new Date('2026-05-13T12:00:00Z'));
  });

  it('throws NotFoundException when the user is missing', async () => {
    const handler = new GetCurrentUserHandler(new InMemoryUserRepository());
    await expect(handler.execute(new GetCurrentUserQuery(UserId.create().value))).rejects.toThrow(
      NotFoundException,
    );
  });

  it('rejects a non-UUID user id', async () => {
    const handler = new GetCurrentUserHandler(new InMemoryUserRepository());
    await expect(handler.execute(new GetCurrentUserQuery('not-a-uuid'))).rejects.toThrow();
  });
});
