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

// ── OCR pipeline events (Phase 7) ─────────────────────────────────────

export class DocumentOcrStartedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly orgId: string,
    readonly startedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'documents.ocr.started';
  }
}

export class DocumentOcrCompletedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly orgId: string,
    readonly driver: string,
    readonly language: string,
    readonly confidence: number,
    readonly pageCount: number,
    readonly completedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'documents.ocr.completed';
  }
}

export class DocumentOcrFailedEvent extends DomainEvent {
  constructor(
    aggregateId: string,
    readonly orgId: string,
    /**
     * Short reason — single colon-separated token (e.g. 'unsupported_language:fr',
     * 'too_many_pages', 'invalid_pdf'). Stable vocabulary the frontend can branch on.
     */
    readonly reason: string,
    readonly userRetryCount: number,
    readonly failedAt: Date,
  ) {
    super(aggregateId);
  }

  getEventType(): string {
    return 'documents.ocr.failed';
  }
}
