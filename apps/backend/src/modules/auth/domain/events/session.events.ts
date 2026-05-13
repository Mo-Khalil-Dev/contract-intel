import { DomainEvent } from '../../../../shared/domain/domain-event';

export class SessionCreatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly userId: string,
    readonly expiresAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'auth.session.created';
  }
}

export class SessionRefreshedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly userId: string,
    readonly newExpiresAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'auth.session.refreshed';
  }
}

export class SessionInvalidatedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly userId: string,
    readonly reason: 'logout' | 'expired' | 'revoked' | 'replaced',
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'auth.session.invalidated';
  }
}
