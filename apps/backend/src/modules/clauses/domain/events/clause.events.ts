import { DomainEvent } from '../../../../shared/domain/domain-event';

export class ClauseExtractionStartedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly documentId: string,
    readonly classifierModelVersion: string,
    readonly embeddingModelVersion: string,
    readonly startedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'clauses.extraction.started';
  }
}

// Batched — one per run, not one per clause.
export class ClausesExtractedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly documentId: string,
    readonly clauseCount: number,
    readonly droppedClauseCount: number,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'clauses.extracted';
  }
}

export class ClauseExtractionCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly documentId: string,
    readonly clauseCount: number,
    readonly completedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'clauses.extraction.completed';
  }
}

export class ClauseExtractionFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly documentId: string,
    readonly reason: string,
    readonly failedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'clauses.extraction.failed';
  }
}
