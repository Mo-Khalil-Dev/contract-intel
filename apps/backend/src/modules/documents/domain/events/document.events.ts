import { DomainEvent } from '../../../../shared/domain/domain-event';

export class DocumentUploadStartedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly orgId: string,
    readonly uploadedBy: string,
    readonly fileName: string,
    readonly fileSizeBytes: number,
    readonly storageKey: string,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'documents.upload.started';
  }
}

export class DocumentUploadCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly orgId: string,
    readonly storageKey: string,
    readonly completedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'documents.upload.completed';
  }
}

export class DocumentUploadFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly orgId: string,
    /** Short reason — same vocabulary as the frontend's UploadFailureReason. */
    readonly reason: string,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'documents.upload.failed';
  }
}
