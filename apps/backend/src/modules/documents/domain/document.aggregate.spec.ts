import { Document, MAX_USER_RETRY_COUNT } from './document.aggregate';
import { DocumentId } from './value-objects/document-id.vo';
import { DocumentName } from './value-objects/document-name.vo';
import { DocumentType } from './value-objects/document-type.vo';
import { FileSize } from './value-objects/file-size.vo';
import { OrgId } from './value-objects/org-id.vo';
import { StorageKey } from './value-objects/storage-key.vo';
import { UploadedBy } from './value-objects/uploaded-by.vo';
import { ProcessingStatusValue } from './value-objects/processing-status.vo';
import { UploadStatusValue } from './value-objects/upload-status.vo';
import {
  DocumentOcrCompletedEvent,
  DocumentOcrFailedEvent,
  DocumentOcrStartedEvent,
  DocumentUploadCompletedEvent,
  DocumentUploadFailedEvent,
  DocumentUploadStartedEvent,
} from './events/document.events';
import { DomainException } from '../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function makeDoc(now = new Date('2026-05-14T10:00:00Z')) {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  return Document.create({
    id,
    name: DocumentName.create('acme-vendor-agreement.pdf'),
    type,
    size: FileSize.fromBytes(1_500_000),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
    now,
  });
}

describe('Document aggregate', () => {
  describe('create()', () => {
    it('starts in `uploading` status', () => {
      const doc = makeDoc();
      expect(doc.status.value).toBe(UploadStatusValue.UPLOADING);
    });

    it('emits a DocumentUploadStartedEvent with the right payload', () => {
      const doc = makeDoc();
      const events = doc.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DocumentUploadStartedEvent);
      const event = events[0] as DocumentUploadStartedEvent;
      expect(event.getAggregateId()).toBe(doc.id.value);
      expect(event.orgId).toBe(doc.orgId.value);
      expect(event.uploadedBy).toBe(USER_ID);
      expect(event.fileName).toBe('acme-vendor-agreement.pdf');
      expect(event.fileSizeBytes).toBe(1_500_000);
      expect(event.storageKey).toBe(doc.storageKey.value);
    });

    it('orgId derives 1:1 from uploadedBy in v1', () => {
      const doc = makeDoc();
      expect(doc.orgId.value).toBe(USER_ID);
    });

    it('stamps createdAt + updatedAt to the same moment', () => {
      const now = new Date('2026-05-14T10:00:00Z');
      const doc = makeDoc(now);
      expect(doc.createdAt).toEqual(now);
      expect(doc.updatedAt).toEqual(now);
      expect(doc.completedAt).toBeNull();
      expect(doc.failureReason).toBeNull();
    });
  });

  describe('markComplete()', () => {
    it('transitions uploading → complete and emits the event', () => {
      const doc = makeDoc();
      doc.pullDomainEvents(); // drain the create event

      const completedAt = new Date('2026-05-14T10:00:02Z');
      doc.markComplete(completedAt);

      expect(doc.status.value).toBe(UploadStatusValue.COMPLETE);
      expect(doc.completedAt).toEqual(completedAt);
      expect(doc.updatedAt).toEqual(completedAt);

      const events = doc.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DocumentUploadCompletedEvent);
      const event = events[0] as DocumentUploadCompletedEvent;
      expect(event.getAggregateId()).toBe(doc.id.value);
      expect(event.storageKey).toBe(doc.storageKey.value);
      expect(event.completedAt).toEqual(completedAt);
    });

    it('throws when called twice (complete is terminal)', () => {
      const doc = makeDoc();
      doc.markComplete();
      expect(() => doc.markComplete()).toThrow(DomainException);
    });

    it('throws when called after markFailed (terminal already)', () => {
      const doc = makeDoc();
      doc.markFailed('network');
      expect(() => doc.markComplete()).toThrow(DomainException);
    });
  });

  describe('markFailed()', () => {
    it('transitions uploading → failed, records reason, emits event', () => {
      const doc = makeDoc();
      doc.pullDomainEvents();

      doc.markFailed('network');

      expect(doc.status.value).toBe(UploadStatusValue.FAILED);
      expect(doc.failureReason).toBe('network');
      expect(doc.completedAt).toBeNull();

      const events = doc.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DocumentUploadFailedEvent);
      expect((events[0] as DocumentUploadFailedEvent).reason).toBe('network');
    });

    it('throws when called after success (terminal)', () => {
      const doc = makeDoc();
      doc.markComplete();
      expect(() => doc.markFailed('network')).toThrow(DomainException);
    });
  });

  // ── OCR pipeline behaviour ────────────────────────────────────────

  describe('startProcessing()', () => {
    it('flips processingStatus to processing and emits started event', () => {
      const doc = makeDoc();
      doc.markComplete();
      doc.pullDomainEvents();

      doc.startProcessing();

      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.PROCESSING);
      const events = doc.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DocumentOcrStartedEvent);
    });

    it('rejects when upload is not complete', () => {
      const doc = makeDoc();
      expect(() => doc.startProcessing()).toThrow(/upload must be 'complete'/);
    });

    it('clears any stale failureReason on (re-)start', () => {
      const doc = makeDoc();
      doc.markComplete();
      doc.startProcessing();
      doc.failProcessing('invalid_pdf');
      expect(doc.failureReason).toBe('invalid_pdf');

      doc.retryProcessing();
      expect(doc.failureReason).toBeNull();
    });
  });

  describe('completeProcessing()', () => {
    it('flips processingStatus to ocr_complete and emits completed event', () => {
      const doc = makeDoc();
      doc.markComplete();
      doc.startProcessing();
      doc.pullDomainEvents();

      doc.completeProcessing({
        driver: 'native_pdf',
        language: 'en',
        confidence: 1,
        pageCount: 30,
      });

      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_COMPLETE);
      const events = doc.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DocumentOcrCompletedEvent);
    });

    it('rejects from not_started (must pass through processing)', () => {
      const doc = makeDoc();
      doc.markComplete();
      expect(() =>
        doc.completeProcessing({
          driver: 'native_pdf',
          language: 'en',
          confidence: 1,
          pageCount: 30,
        }),
      ).toThrow(DomainException);
    });
  });

  describe('failProcessing()', () => {
    it('flips to ocr_failed, sets reason, emits failed event with retry count', () => {
      const doc = makeDoc();
      doc.markComplete();
      doc.startProcessing();
      doc.pullDomainEvents();

      doc.failProcessing('invalid_pdf');

      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_FAILED);
      expect(doc.failureReason).toBe('invalid_pdf');
      const events = doc.pullDomainEvents();
      expect(events).toHaveLength(1);
      const ev = events[0] as DocumentOcrFailedEvent;
      expect(ev).toBeInstanceOf(DocumentOcrFailedEvent);
      expect(ev.reason).toBe('invalid_pdf');
      expect(ev.userRetryCount).toBe(0);
    });
  });

  describe('retryProcessing()', () => {
    function failedDoc() {
      const doc = makeDoc();
      doc.markComplete();
      doc.startProcessing();
      doc.failProcessing('transient_timeout');
      doc.pullDomainEvents();
      return doc;
    }

    it('flips ocr_failed → processing, increments counter, emits started event', () => {
      const doc = failedDoc();

      doc.retryProcessing();

      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.PROCESSING);
      expect(doc.userRetryCount).toBe(1);
      const events = doc.pullDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(DocumentOcrStartedEvent);
    });

    it('rejects when status is not ocr_failed', () => {
      const doc = makeDoc();
      doc.markComplete();
      doc.startProcessing();
      expect(() => doc.retryProcessing()).toThrow(/'ocr_failed'/);
    });

    it(`caps at ${MAX_USER_RETRY_COUNT} retries`, () => {
      const doc = failedDoc();
      for (let i = 0; i < MAX_USER_RETRY_COUNT; i++) {
        doc.retryProcessing();
        doc.failProcessing('transient_timeout');
      }
      expect(doc.userRetryCount).toBe(MAX_USER_RETRY_COUNT);
      expect(() => doc.retryProcessing()).toThrow(/cap.*already reached/);
    });
  });

  describe('extraction lifecycle', () => {
    function makeOcrCompleteDoc() {
      const doc = makeDoc();
      doc.markComplete();
      doc.startProcessing();
      doc.completeProcessing({
        driver: 'native_pdf',
        language: 'en',
        confidence: 1,
        pageCount: 5,
      });
      doc.pullDomainEvents();
      return doc;
    }

    it('startExtraction() requires processingStatus = ocr_complete', () => {
      const doc = makeDoc();
      expect(() => doc.startExtraction('run-1')).toThrow(DomainException);
    });

    it('startExtraction() flips status and records run id', () => {
      const doc = makeOcrCompleteDoc();
      doc.startExtraction('run-1');
      expect(doc.extractionStatus.value).toBe('extracting');
      expect(doc.currentExtractionRunId).toBe('run-1');
    });

    it('completeExtraction() flips extracting → extraction_complete', () => {
      const doc = makeOcrCompleteDoc();
      doc.startExtraction('run-1');
      doc.completeExtraction();
      expect(doc.extractionStatus.value).toBe('extraction_complete');
    });

    it('failExtraction() flips extracting → extraction_failed, sets reason', () => {
      const doc = makeOcrCompleteDoc();
      doc.startExtraction('run-1');
      doc.failExtraction('claude_unavailable');
      expect(doc.extractionStatus.value).toBe('extraction_failed');
      expect(doc.failureReason).toBe('claude_unavailable');
    });

    it('re-extraction (retry after failure) allowed', () => {
      const doc = makeOcrCompleteDoc();
      doc.startExtraction('run-1');
      doc.failExtraction('transient');
      doc.startExtraction('run-2');
      expect(doc.extractionStatus.value).toBe('extracting');
      expect(doc.currentExtractionRunId).toBe('run-2');
    });
  });

  describe('rehydrate()', () => {
    it('reloads without emitting events', () => {
      const original = makeDoc();
      original.markComplete();
      const events = original.pullDomainEvents();
      expect(events.length).toBeGreaterThan(0);

      const reloaded = Document.rehydrate(original.id, {
        name: original.name,
        type: original.type,
        size: original.size,
        status: original.status,
        processingStatus: original.processingStatus,
        extractionStatus: original.extractionStatus,
        currentExtractionRunId: original.currentExtractionRunId,
        storageKey: original.storageKey,
        uploadedBy: original.uploadedBy,
        orgId: original.orgId,
        createdAt: original.createdAt,
        updatedAt: original.updatedAt,
        completedAt: original.completedAt,
        failureReason: original.failureReason,
        userRetryCount: original.userRetryCount,
      });

      expect(reloaded.id.equals(original.id)).toBe(true);
      expect(reloaded.status.value).toBe(UploadStatusValue.COMPLETE);
      expect(reloaded.getDomainEvents()).toHaveLength(0);
    });
  });
});
