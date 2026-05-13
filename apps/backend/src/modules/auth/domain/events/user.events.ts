import { DomainEvent } from '../../../../shared/domain/domain-event';

export class UserCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly email: string,
    readonly auth0SubjectId: string,
    readonly role: string,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'auth.user.created';
  }
}

export class UserLoggedInEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly email: string,
    readonly ipAddress?: string,
    readonly userAgent?: string,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'auth.user.logged_in';
  }
}

export class UserLoggedOutEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly sessionId: string,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'auth.user.logged_out';
  }
}
