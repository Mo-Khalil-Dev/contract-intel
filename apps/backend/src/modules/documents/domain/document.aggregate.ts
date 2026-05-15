import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DomainException } from '../../../shared/exceptions/app-error';
import { DocumentId } from './value-objects/document-id.vo';
import { DocumentName } from './value-objects/document-name.vo';
import { DocumentType } from './value-objects/document-type.vo';
import { FileSize } from './value-objects/file-size.vo';
import { OrgId } from './value-objects/org-id.vo';
import {
  ProcessingStatus,
  ProcessingStatusValue,
} from './value-objects/processing-status.vo';
import { StorageKey } from './value-objects/storage-key.vo';
import { UploadStatus, UploadStatusValue } from './value-objects/upload-status.vo';
import { UploadedBy } from './value-objects/uploaded-by.vo';
import {
  DocumentOcrCompletedEvent,
  DocumentOcrFailedEvent,
  DocumentOcrStartedEvent,
  DocumentUploadCompletedEvent,
  DocumentUploadFailedEvent,
  DocumentUploadStartedEvent,
} from './events/document.events';

// Maximum number of user-initiated retries after `ocr_failed`. After this
// the UI must fall back to "Upload another" — see ocr-design.md §11.
export const MAX_USER_RETRY_COUNT = 3;

interface DocumentProps {
  name: DocumentName;
  type: DocumentType;
  size: FileSize;
  status: UploadStatus;
  processingStatus: ProcessingStatus;
  storageKey: StorageKey;
  uploadedBy: UploadedBy;
  orgId: OrgId;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
  userRetryCount: number;
}

export class Document extends AggregateRoot<DocumentId> {
  private props: DocumentProps;

  private constructor(id: DocumentId, props: DocumentProps) {
    super(id);
    this.props = props;
  }

  /**
   * Factory: a brand-new Document, mid-flight upload.
   *
   * Status starts at `uploading` (not `pending`) because by the time we
   * persist the aggregate the upload URL has already been issued — there
   * is no observable `pending` slice on the wire. Emits
   * `DocumentUploadStartedEvent`.
   */
  static create(params: {
    id: DocumentId;
    name: DocumentName;
    type: DocumentType;
    size: FileSize;
    storageKey: StorageKey;
    uploadedBy: UploadedBy;
    orgId: OrgId;
    now?: Date;
  }): Document {
    const now = params.now ?? new Date();
    const status = UploadStatus.pending().transitionTo(
      UploadStatus.fromValue('uploading'),
    );

    const doc = new Document(params.id, {
      name: params.name,
      type: params.type,
      size: params.size,
      status,
      processingStatus: ProcessingStatus.notStarted(),
      storageKey: params.storageKey,
      uploadedBy: params.uploadedBy,
      orgId: params.orgId,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      failureReason: null,
      userRetryCount: 0,
    });

    doc.addDomainEvent(
      new DocumentUploadStartedEvent(
        doc.id.value,
        doc.props.orgId.value,
        doc.props.uploadedBy.userId,
        doc.props.name.value,
        doc.props.size.bytes,
        doc.props.storageKey.value,
      ),
    );
    return doc;
  }

  /**
   * Rehydration: reload from persistence. Does NOT emit any events.
   */
  static rehydrate(id: DocumentId, props: DocumentProps): Document {
    return new Document(id, props);
  }

  // ── Behaviour ────────────────────────────────────────────────────

  /** Browser confirmed the bytes landed; flip to `complete`. */
  markComplete(now?: Date): void {
    const at = now ?? new Date();
    this.props.status = this.props.status.transitionTo(
      UploadStatus.fromValue('complete'),
    );
    this.props.completedAt = at;
    this.props.updatedAt = at;

    this.addDomainEvent(
      new DocumentUploadCompletedEvent(
        this.id.value,
        this.props.orgId.value,
        this.props.storageKey.value,
        at,
      ),
    );
  }

  /** Upload failed at any step — record reason, transition to terminal. */
  markFailed(reason: string, now?: Date): void {
    const at = now ?? new Date();
    this.props.status = this.props.status.transitionTo(
      UploadStatus.fromValue('failed'),
    );
    this.props.failureReason = reason;
    this.props.updatedAt = at;

    this.addDomainEvent(
      new DocumentUploadFailedEvent(this.id.value, this.props.orgId.value, reason),
    );
  }

  // ── OCR pipeline behaviour ───────────────────────────────────────

  /**
   * Pipeline begins. Upload must be `complete`; `processingStatus` flips
   * `not_started → processing`. Also clears any prior failure reason so the
   * aggregate doesn't carry stale state into a retry.
   */
  startProcessing(now?: Date): void {
    const at = now ?? new Date();
    if (this.props.status.value !== UploadStatusValue.COMPLETE) {
      throw new DomainException(
        'CANNOT_START_PROCESSING',
        `Document upload must be 'complete' to start OCR (got '${this.props.status.value}')`,
      );
    }
    this.props.processingStatus = this.props.processingStatus.transitionTo(
      ProcessingStatus.fromValue('processing'),
    );
    this.props.failureReason = null;
    this.props.updatedAt = at;

    this.addDomainEvent(
      new DocumentOcrStartedEvent(this.id.value, this.props.orgId.value, at),
    );
  }

  /** OCR succeeded — flip to `ocr_complete` terminal state. */
  completeProcessing(
    result: { driver: string; language: string; confidence: number; pageCount: number },
    now?: Date,
  ): void {
    const at = now ?? new Date();
    this.props.processingStatus = this.props.processingStatus.transitionTo(
      ProcessingStatus.fromValue('ocr_complete'),
    );
    this.props.updatedAt = at;

    this.addDomainEvent(
      new DocumentOcrCompletedEvent(
        this.id.value,
        this.props.orgId.value,
        result.driver,
        result.language,
        result.confidence,
        result.pageCount,
        at,
      ),
    );
  }

  /**
   * OCR failed — record reason, flip to `ocr_failed`. User can still
   * retry from here up to MAX_USER_RETRY_COUNT times via retryProcessing().
   */
  failProcessing(reason: string, now?: Date): void {
    const at = now ?? new Date();
    this.props.processingStatus = this.props.processingStatus.transitionTo(
      ProcessingStatus.fromValue('ocr_failed'),
    );
    this.props.failureReason = reason;
    this.props.updatedAt = at;

    this.addDomainEvent(
      new DocumentOcrFailedEvent(
        this.id.value,
        this.props.orgId.value,
        reason,
        this.props.userRetryCount,
        at,
      ),
    );
  }

  /**
   * User-initiated retry from `ocr_failed`. Increments the counter, flips
   * status back to `processing`. Throws if already at the cap — caller must
   * surface "Upload another" instead.
   */
  retryProcessing(now?: Date): void {
    const at = now ?? new Date();
    if (this.props.processingStatus.value !== ProcessingStatusValue.OCR_FAILED) {
      throw new DomainException(
        'CANNOT_RETRY_PROCESSING',
        `Retry requires processingStatus 'ocr_failed' (got '${this.props.processingStatus.value}')`,
      );
    }
    if (this.props.userRetryCount >= MAX_USER_RETRY_COUNT) {
      throw new DomainException(
        'RETRY_LIMIT_EXCEEDED',
        `User retry cap (${MAX_USER_RETRY_COUNT}) already reached`,
      );
    }
    this.props.userRetryCount += 1;
    this.props.processingStatus = this.props.processingStatus.transitionTo(
      ProcessingStatus.fromValue('processing'),
    );
    this.props.failureReason = null;
    this.props.updatedAt = at;

    this.addDomainEvent(
      new DocumentOcrStartedEvent(this.id.value, this.props.orgId.value, at),
    );
  }

  // ── Read accessors ───────────────────────────────────────────────

  get name(): DocumentName {
    return this.props.name;
  }
  get type(): DocumentType {
    return this.props.type;
  }
  get size(): FileSize {
    return this.props.size;
  }
  get status(): UploadStatus {
    return this.props.status;
  }
  get processingStatus(): ProcessingStatus {
    return this.props.processingStatus;
  }
  get userRetryCount(): number {
    return this.props.userRetryCount;
  }
  get storageKey(): StorageKey {
    return this.props.storageKey;
  }
  get uploadedBy(): UploadedBy {
    return this.props.uploadedBy;
  }
  get orgId(): OrgId {
    return this.props.orgId;
  }
  get createdAt(): Date {
    return this.props.createdAt;
  }
  get updatedAt(): Date {
    return this.props.updatedAt;
  }
  get completedAt(): Date | null {
    return this.props.completedAt;
  }
  get failureReason(): string | null {
    return this.props.failureReason;
  }
}
