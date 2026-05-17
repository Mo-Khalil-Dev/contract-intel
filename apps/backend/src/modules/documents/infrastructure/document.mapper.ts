import type { Document as DocumentRow } from '@prisma/client';
import { Document } from '../domain/document.aggregate';
import { DocumentExtractionStatus } from '../domain/value-objects/document-extraction-status.vo';
import { DocumentId } from '../domain/value-objects/document-id.vo';
import { DocumentName } from '../domain/value-objects/document-name.vo';
import { DocumentType } from '../domain/value-objects/document-type.vo';
import { FileSize } from '../domain/value-objects/file-size.vo';
import { OrgId } from '../domain/value-objects/org-id.vo';
import { ProcessingStatus } from '../domain/value-objects/processing-status.vo';
import { StorageKey } from '../domain/value-objects/storage-key.vo';
import { UploadStatus } from '../domain/value-objects/upload-status.vo';
import { UploadedBy } from '../domain/value-objects/uploaded-by.vo';

/**
 * Translation between the Document aggregate (domain) and its Prisma row
 * (persistence). One direction at a time — the domain doesn't know that
 * Prisma exists.
 */
export class DocumentMapper {
  static toDomain(row: DocumentRow): Document {
    // Phase 8 fields (extractionStatus, currentExtractionRunId) are persisted
    // in Task 8.3's migration. Until then, rehydrate from row when present,
    // defaulting to not_started so existing rows keep loading cleanly.
    const rowWithExtraction = row as DocumentRow & {
      extractionStatus?: string | null;
      currentExtractionRunId?: string | null;
    };
    const extractionStatus = rowWithExtraction.extractionStatus
      ? DocumentExtractionStatus.fromValue(rowWithExtraction.extractionStatus)
      : DocumentExtractionStatus.notStarted();

    return Document.rehydrate(DocumentId.fromString(row.id), {
      name: DocumentName.create(row.name),
      type: DocumentType.fromValue(row.type),
      size: FileSize.fromBytes(row.sizeBytes),
      status: UploadStatus.fromValue(row.status),
      processingStatus: ProcessingStatus.fromValue(row.processingStatus),
      extractionStatus,
      currentExtractionRunId: rowWithExtraction.currentExtractionRunId ?? null,
      storageKey: StorageKey.fromString(row.storageKey),
      uploadedBy: UploadedBy.fromUserId(row.uploadedBy),
      orgId: OrgId.fromString(row.orgId),
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      completedAt: row.completedAt,
      failureReason: row.failureReason,
      userRetryCount: row.userRetryCount,
    });
  }

  static toPersistence(doc: Document): DocumentRow {
    return {
      id: doc.id.value,
      name: doc.name.value,
      type: doc.type.value,
      sizeBytes: doc.size.bytes,
      status: doc.status.value,
      processingStatus: doc.processingStatus.value,
      userRetryCount: doc.userRetryCount,
      storageKey: doc.storageKey.value,
      uploadedBy: doc.uploadedBy.userId,
      orgId: doc.orgId.value,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
      completedAt: doc.completedAt,
      failureReason: doc.failureReason,
    };
  }
}
