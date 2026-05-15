import { EventBus } from '@nestjs/cqrs';
import { Readable } from 'stream';
import { StartOcrProcessingHandler } from './start-ocr-processing.handler';
import { StartOcrProcessingCommand } from './start-ocr-processing.command';
import { IDocumentRepository } from '../../domain/document.repository';
import { IDocumentTextRepository } from '../../domain/document-text.repository';
import { IOcrService, OcrOutput } from '../../domain/ports/ocr-service.port';
import { IStorageService } from '../../domain/ports/storage-service.port';
import { Document } from '../../domain/document.aggregate';
import { DocumentText } from '../../domain/document-text.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { ProcessingStatusValue } from '../../domain/value-objects/processing-status.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { OcrPermanentError, OcrTransientError } from '../ocr/ocr-errors';
import {
  DocumentOcrCompletedEvent,
  DocumentOcrFailedEvent,
  DocumentOcrStartedEvent,
} from '../../domain/events/document.events';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function uploadCompleteDoc(): Document {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  const doc = Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(1000),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
  doc.markComplete();
  doc.pullDomainEvents();
  return doc;
}

function fakeOcrOutput(driver: 'native_pdf' | 'mock' = 'native_pdf'): OcrOutput {
  return {
    text: 'Section 1. Indemnification.',
    pages: [
      {
        pageNumber: 1,
        text: 'Section 1. Indemnification.',
        confidence: 1,
        textQualityScore: 0.9,
        driver,
      },
    ],
    confidence: 1,
    minPageConfidence: 1,
    language: 'en',
    driver,
  };
}

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

function fakeStorage(): jest.Mocked<IStorageService> {
  return {
    generateUploadUrl: jest.fn(),
    writeStream: jest.fn(),
    openReadStream: jest.fn().mockResolvedValue(Readable.from(['pdf-bytes'])),
  };
}

function fakeRepo(doc: Document | null): jest.Mocked<IDocumentRepository> {
  return {
    findByIdForOrg: jest.fn(),
    findById: jest.fn().mockResolvedValue(doc),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function fakeTextRepo(): jest.Mocked<IDocumentTextRepository> {
  return {
    findByDocumentId: jest.fn(),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function fakeOcr(impl: jest.Mock | OcrOutput): jest.Mocked<IOcrService> {
  return {
    extractText:
      typeof impl === 'function' ? (impl) : jest.fn().mockResolvedValue(impl),
  };
}

/** Subclass to make sleep() a no-op so retry tests don't take 21 seconds. */
class TestableHandler extends StartOcrProcessingHandler {
  protected sleep(): Promise<void> {
    return Promise.resolve();
  }
}

function buildHandler(deps: {
  repo: jest.Mocked<IDocumentRepository>;
  textRepo?: jest.Mocked<IDocumentTextRepository>;
  ocr?: jest.Mocked<IOcrService>;
  storage?: jest.Mocked<IStorageService>;
  bus?: jest.Mocked<EventBus>;
}) {
  return new TestableHandler(
    deps.repo,
    deps.textRepo ?? fakeTextRepo(),
    deps.ocr ?? fakeOcr(fakeOcrOutput()),
    deps.storage ?? fakeStorage(),
    deps.bus ?? fakeBus(),
  );
}

describe('StartOcrProcessingHandler', () => {
  it('happy path: transitions, persists DocumentText, flips to ocr_complete', async () => {
    const doc = uploadCompleteDoc();
    const repo = fakeRepo(doc);
    const textRepo = fakeTextRepo();
    const bus = fakeBus();
    const handler = buildHandler({ repo, textRepo, bus });

    await handler.execute(new StartOcrProcessingCommand(doc.id.value));

    expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_COMPLETE);
    expect(textRepo.save).toHaveBeenCalledTimes(1);
    expect(textRepo.save.mock.calls[0][0]).toBeInstanceOf(DocumentText);
    expect(repo.save).toHaveBeenCalledTimes(2); // startProcessing + completeProcessing

    const publishedEvents = bus.publishAll.mock.calls.flatMap((c) => c[0] as unknown[]);
    expect(publishedEvents.some((e) => e instanceof DocumentOcrStartedEvent)).toBe(true);
    expect(publishedEvents.some((e) => e instanceof DocumentOcrCompletedEvent)).toBe(true);
  });

  it('idempotent on transition when called for a retry (status already processing)', async () => {
    const doc = uploadCompleteDoc();
    doc.startProcessing(); // upstream already moved us into processing
    doc.failProcessing('transient_timeout');
    doc.retryProcessing(); // ocr_failed → processing again
    doc.pullDomainEvents();

    const repo = fakeRepo(doc);
    const bus = fakeBus();
    const handler = buildHandler({ repo, bus });

    await handler.execute(new StartOcrProcessingCommand(doc.id.value));

    expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_COMPLETE);
    // Only the completeProcessing save — no startProcessing call this time.
    expect(repo.save).toHaveBeenCalledTimes(1);
  });

  it('rejects from invalid states (e.g. ocr_complete)', async () => {
    const doc = uploadCompleteDoc();
    doc.startProcessing();
    doc.completeProcessing({
      driver: 'native_pdf',
      language: 'en',
      confidence: 1,
      pageCount: 1,
    });
    doc.pullDomainEvents();

    const repo = fakeRepo(doc);
    const handler = buildHandler({ repo });

    await expect(
      handler.execute(new StartOcrProcessingCommand(doc.id.value)),
    ).rejects.toBeInstanceOf(ApplicationException);
  });

  it('document not found → ApplicationException 404', async () => {
    const repo = fakeRepo(null);
    const handler = buildHandler({ repo });

    await expect(
      handler.execute(new StartOcrProcessingCommand(DocumentId.create().value)),
    ).rejects.toThrow(/not found/);
  });

  describe('retry policy', () => {
    it('transient fail then success on attempt 2', async () => {
      const doc = uploadCompleteDoc();
      const ocr = fakeOcr(
        jest
          .fn()
          .mockRejectedValueOnce(new OcrTransientError('429 rate limit'))
          .mockResolvedValueOnce(fakeOcrOutput()),
      );
      const repo = fakeRepo(doc);
      const handler = buildHandler({ repo, ocr });

      await handler.execute(new StartOcrProcessingCommand(doc.id.value));

      expect(ocr.extractText).toHaveBeenCalledTimes(2);
      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_COMPLETE);
    });

    it('permanent failure short-circuits to ocr_failed (no retry)', async () => {
      const doc = uploadCompleteDoc();
      const ocr = fakeOcr(
        jest
          .fn()
          .mockRejectedValue(new OcrPermanentError('invalid_pdf', 'pdfjs threw')),
      );
      const repo = fakeRepo(doc);
      const bus = fakeBus();
      const handler = buildHandler({ repo, ocr, bus });

      await handler.execute(new StartOcrProcessingCommand(doc.id.value));

      expect(ocr.extractText).toHaveBeenCalledTimes(1);
      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_FAILED);
      expect(doc.failureReason).toBe('invalid_pdf');

      const publishedEvents = bus.publishAll.mock.calls.flatMap((c) => c[0] as unknown[]);
      expect(publishedEvents.some((e) => e instanceof DocumentOcrFailedEvent)).toBe(true);
    });

    it('retries exhausted (4 transient failures) → ocr_failed with reason transient_exhausted', async () => {
      const doc = uploadCompleteDoc();
      const ocr = fakeOcr(
        jest.fn().mockRejectedValue(new OcrTransientError('upstream timeout')),
      );
      const repo = fakeRepo(doc);
      const handler = buildHandler({ repo, ocr });

      await handler.execute(new StartOcrProcessingCommand(doc.id.value));

      expect(ocr.extractText).toHaveBeenCalledTimes(4); // 1 + 3 retries
      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_FAILED);
      expect(doc.failureReason).toBe('transient_exhausted');
    });

    it('unknown error is treated as permanent (internal_error reason)', async () => {
      const doc = uploadCompleteDoc();
      const ocr = fakeOcr(jest.fn().mockRejectedValue(new Error('boom')));
      const repo = fakeRepo(doc);
      const handler = buildHandler({ repo, ocr });

      await handler.execute(new StartOcrProcessingCommand(doc.id.value));

      expect(ocr.extractText).toHaveBeenCalledTimes(1);
      expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_FAILED);
      expect(doc.failureReason).toBe('internal_error');
    });
  });
});
