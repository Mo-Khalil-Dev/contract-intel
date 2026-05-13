import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { UserId } from './value-objects/user-id.vo';
import { Email } from './value-objects/email.vo';
import { Auth0SubjectId } from './value-objects/auth0-subject-id.vo';
import { UserRole } from './value-objects/user-role.vo';
import { UserCreatedEvent, UserLoggedInEvent, UserLoggedOutEvent } from './events/user.events';

interface UserProps {
  email: Email;
  auth0SubjectId: Auth0SubjectId;
  displayName: string;
  role: UserRole;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export class User extends AggregateRoot<UserId> {
  private props: UserProps;

  constructor(id: UserId, props: UserProps) {
    super(id);
    this.props = props;
  }

  // Factory entry point used when a brand-new user record is created
  // following the first successful Auth0 login.
  static create(params: {
    id: UserId;
    email: Email;
    auth0SubjectId: Auth0SubjectId;
    displayName: string;
    role?: UserRole;
    now?: Date;
  }): User {
    const now = params.now ?? new Date();
    const role = params.role ?? UserRole.defaultRole();
    const user = new User(params.id, {
      email: params.email,
      auth0SubjectId: params.auth0SubjectId,
      displayName: params.displayName,
      role,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
    user.addDomainEvent(
      new UserCreatedEvent(
        user.id.value,
        user.props.email.value,
        user.props.auth0SubjectId.value,
        role.value,
      ),
    );
    return user;
  }

  // Rehydration constructor used by the repository when loading from
  // persistence. Does NOT emit a UserCreatedEvent.
  static rehydrate(id: UserId, props: UserProps): User {
    return new User(id, props);
  }

  recordLogin(params: { ipAddress?: string; userAgent?: string; now?: Date }): void {
    const now = params.now ?? new Date();
    this.props.lastLoginAt = now;
    this.props.updatedAt = now;
    this.addDomainEvent(
      new UserLoggedInEvent(
        this.id.value,
        this.props.email.value,
        params.ipAddress,
        params.userAgent,
      ),
    );
  }

  recordLogout(sessionId: string): void {
    this.addDomainEvent(new UserLoggedOutEvent(this.id.value, sessionId));
  }

  changeRole(newRole: UserRole, now: Date = new Date()): void {
    if (this.props.role.equals(newRole)) {
      return;
    }
    this.props.role = newRole;
    this.props.updatedAt = now;
  }

  get email(): Email {
    return this.props.email;
  }

  get auth0SubjectId(): Auth0SubjectId {
    return this.props.auth0SubjectId;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get lastLoginAt(): Date | null {
    return this.props.lastLoginAt;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }
}
