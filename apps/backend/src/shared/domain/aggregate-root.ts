import { BaseEntity } from './base-entity';
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<T> extends BaseEntity<T> {
  private domainEvents: DomainEvent[] = [];

  protected addDomainEvent(domainEvent: DomainEvent): void {
    this.domainEvents.push(domainEvent);
  }

  getDomainEvents(): DomainEvent[] {
    return this.domainEvents;
  }

  clearDomainEvents(): void {
    this.domainEvents = [];
  }

  pullDomainEvents(): DomainEvent[] {
    const domainEvents = this.domainEvents;
    this.clearDomainEvents();
    return domainEvents;
  }
}
