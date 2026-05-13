export interface IDomainEvent {
  occurredOn: Date;
  getAggregateId(): string;
  getEventType(): string;
}

export abstract class DomainEvent implements IDomainEvent {
  readonly occurredOn: Date;
  protected readonly aggregateId: string;

  constructor(aggregateId: string, occurredOn?: Date) {
    this.aggregateId = aggregateId;
    this.occurredOn = occurredOn || new Date();
  }

  getAggregateId(): string {
    return this.aggregateId;
  }

  abstract getEventType(): string;
}
