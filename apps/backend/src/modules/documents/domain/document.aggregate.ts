import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DocumentId } from './value-objects/document-id.vo';
import { DocumentName } from './value-objects/document-name.vo';
import { DocumentType } from './value-objects/document-type.vo';
import { FileSize } from './value-objects/file-size.vo';
import { OrgId } from './value-objects/org-id.vo';
import { StorageKey } from './value-objects/storage-key.vo';
import { UploadStatus } from './value-objects/upload-status.vo';
import { UploadedBy } from './value-objects/uploaded-by.vo';
import {
  DocumentUploadCompletedEvent,
  DocumentUploadFailedEvent,
  DocumentUploadStartedEvent,
} from './events/document.events';

interface DocumentProps {
  name: DocumentName;
  type: DocumentType;
  size: FileSize;
  status: UploadStatus;
  storageKey: StorageKey;
  uploadedBy: UploadedBy;
  orgId: OrgId;
  createdAt: Date;
  updatedAt: Date;
  completedAt: Date | null;
  failureReason: string | null;
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
      storageKey: params.storageKey,
      uploadedBy: params.uploadedBy,
      orgId: params.orgId,
      createdAt: now,
      updatedAt: now,
      completedAt: null,
      failureReason: null,
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
