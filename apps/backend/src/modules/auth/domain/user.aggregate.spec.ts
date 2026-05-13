import { User } from './user.aggregate';
import { UserId } from './value-objects/user-id.vo';
import { Email } from './value-objects/email.vo';
import { Auth0SubjectId } from './value-objects/auth0-subject-id.vo';
import { UserRole, Role } from './value-objects/user-role.vo';
import { UserCreatedEvent, UserLoggedInEvent, UserLoggedOutEvent } from './events/user.events';

const baseParams = () => ({
  id: UserId.create(),
  email: Email.create('alice@example.com'),
  auth0SubjectId: Auth0SubjectId.fromString('auth0|abc123'),
  displayName: 'Alice Smith',
});

describe('User.create', () => {
  it('produces a user with the provided properties', () => {
    const params = baseParams();
    const user = User.create(params);

    expect(user.id.value).toBe(params.id.value);
    expect(user.email.value).toBe('alice@example.com');
    expect(user.auth0SubjectId.value).toBe('auth0|abc123');
    expect(user.displayName).toBe('Alice Smith');
  });

  it('defaults to the Reviewer role', () => {
    const user = User.create(baseParams());

    expect(user.role.value).toBe(Role.Reviewer);
  });

  it('accepts a custom role', () => {
    const user = User.create({ ...baseParams(), role: UserRole.fromString(Role.LeadReviewer) });

    expect(user.role.value).toBe(Role.LeadReviewer);
  });

  it('initialises lastLoginAt as null', () => {
    expect(User.create(baseParams()).lastLoginAt).toBeNull();
  });

  it('emits a UserCreatedEvent', () => {
    const user = User.create(baseParams());
    const events = user.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserCreatedEvent);
    const created = events[0] as UserCreatedEvent;
    expect(created.email).toBe('alice@example.com');
    expect(created.auth0SubjectId).toBe('auth0|abc123');
    expect(created.role).toBe(Role.Reviewer);
  });
});

describe('User.rehydrate', () => {
  it('reconstructs a user without emitting events', () => {
    const id = UserId.create();
    const user = User.rehydrate(id, {
      email: Email.create('bob@example.com'),
      auth0SubjectId: Auth0SubjectId.fromString('auth0|xyz'),
      displayName: 'Bob',
      role: UserRole.defaultRole(),
      lastLoginAt: new Date('2026-05-01T00:00:00Z'),
      createdAt: new Date('2026-04-01T00:00:00Z'),
      updatedAt: new Date('2026-05-01T00:00:00Z'),
    });

    expect(user.id.value).toBe(id.value);
    expect(user.pullDomainEvents()).toHaveLength(0);
  });
});

describe('User.recordLogin', () => {
  it('sets lastLoginAt to the provided "now"', () => {
    const user = User.create(baseParams());
    user.pullDomainEvents(); // clear creation event

    const now = new Date('2026-05-13T12:00:00Z');
    user.recordLogin({ now });

    expect(user.lastLoginAt).toEqual(now);
  });

  it('emits a UserLoggedInEvent with context', () => {
    const user = User.create(baseParams());
    user.pullDomainEvents();

    user.recordLogin({ ipAddress: '10.0.0.1', userAgent: 'Mozilla/5.0' });
    const events = user.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserLoggedInEvent);
    const loggedIn = events[0] as UserLoggedInEvent;
    expect(loggedIn.email).toBe('alice@example.com');
    expect(loggedIn.ipAddress).toBe('10.0.0.1');
    expect(loggedIn.userAgent).toBe('Mozilla/5.0');
  });

  it('updates updatedAt', () => {
    const user = User.create(baseParams());
    const before = user.updatedAt;
    user.recordLogin({ now: new Date(before.getTime() + 60_000) });

    expect(user.updatedAt.getTime()).toBeGreaterThan(before.getTime());
  });
});

describe('User.recordLogout', () => {
  it('emits a UserLoggedOutEvent carrying the session id', () => {
    const user = User.create(baseParams());
    user.pullDomainEvents();

    user.recordLogout('session-abc');
    const events = user.pullDomainEvents();

    expect(events).toHaveLength(1);
    expect(events[0]).toBeInstanceOf(UserLoggedOutEvent);
    expect((events[0] as UserLoggedOutEvent).sessionId).toBe('session-abc');
  });
});

describe('User.changeRole', () => {
  it('changes the role and bumps updatedAt', () => {
    const user = User.create(baseParams());
    const newRole = UserRole.fromString(Role.LeadReviewer);
    const later = new Date(user.updatedAt.getTime() + 60_000);

    user.changeRole(newRole, later);

    expect(user.role.value).toBe(Role.LeadReviewer);
    expect(user.updatedAt).toEqual(later);
  });

  it('is a no-op when the new role equals the current role', () => {
    const user = User.create(baseParams());
    const before = user.updatedAt;
    user.changeRole(UserRole.defaultRole(), new Date(before.getTime() + 60_000));

    // updatedAt should NOT have moved because role didn't change
    expect(user.updatedAt).toEqual(before);
  });
});
