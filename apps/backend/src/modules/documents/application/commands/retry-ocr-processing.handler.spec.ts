import { CommandBus, EventBus } from '@nestjs/cqrs';
import { RetryOcrProcessingHandler } from './retry-ocr-processing.handler';
import { RetryOcrProcessingCommand } from './retry-ocr-processing.command';
import { StartOcrProcessingCommand } from './start-ocr-processing.command';
import { IDocumentRepository } from '../../domain/document.repository';
import { Document, MAX_USER_RETRY_COUNT } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { ProcessingStatusValue } from '../../domain/value-objects/processing-status.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { DocumentOcrStartedEvent } from '../../domain/events/document.events';
import {
  ApplicationException,
  DomainException,
} from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function failedDoc(): Document {
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
  doc.startProcessing();
  doc.failProcessing('transient_exhausted');
  doc.pullDomainEvents();
  return doc;
}

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

function fakeCommandBus(): jest.Mocked<CommandBus> {
  return { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CommandBus>;
}

describe('RetryOcrProcessingHandler', () => {
  it('flips ocr_failed → processing, increments counter, dispatches StartOcrProcessingCommand', async () => {
    const doc = failedDoc();
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const bus = fakeBus();
    const cmdBus = fakeCommandBus();
    const handler = new RetryOcrProcessingHandler(repo, bus, cmdBus);

    await handler.execute(new RetryOcrProcessingCommand(doc.id.value, USER_ID));

    expect(doc.processingStatus.value).toBe(ProcessingStatusValue.PROCESSING);
    expect(doc.userRetryCount).toBe(1);

    const events = bus.publishAll.mock.calls.flatMap((c) => c[0] as unknown[]);
    expect(events.some((e) => e instanceof DocumentOcrStartedEvent)).toBe(true);

    expect(cmdBus.execute).toHaveBeenCalledTimes(1);
    expect(cmdBus.execute.mock.calls[0][0]).toBeInstanceOf(StartOcrProcessingCommand);
  });

  it(`refuses past ${MAX_USER_RETRY_COUNT} retries (aggregate throws DomainException)`, async () => {
    const doc = failedDoc();
    // Exhaust the cap.
    for (let i = 0; i < MAX_USER_RETRY_COUNT; i++) {
      doc.retryProcessing();
      doc.failProcessing('transient_exhausted');
    }
    doc.pullDomainEvents();
    expect(doc.userRetryCount).toBe(MAX_USER_RETRY_COUNT);

    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const cmdBus = fakeCommandBus();
    const handler = new RetryOcrProcessingHandler(repo, fakeBus(), cmdBus);

    await expect(
      handler.execute(new RetryOcrProcessingCommand(doc.id.value, USER_ID)),
    ).rejects.toBeInstanceOf(DomainException);

    expect(cmdBus.execute).not.toHaveBeenCalled();
  });

  it('refuses when current state is not ocr_failed', async () => {
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
    doc.startProcessing();
    doc.pullDomainEvents();

    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const cmdBus = fakeCommandBus();
    const handler = new RetryOcrProcessingHandler(repo, fakeBus(), cmdBus);

    await expect(
      handler.execute(new RetryOcrProcessingCommand(doc.id.value, USER_ID)),
    ).rejects.toBeInstanceOf(DomainException);
    expect(cmdBus.execute).not.toHaveBeenCalled();
  });

  it('throws 404 when the document is missing in this org', async () => {
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new RetryOcrProcessingHandler(repo, fakeBus(), fakeCommandBus());

    await expect(
      handler.execute(new RetryOcrProcessingCommand(DocumentId.create().value, USER_ID)),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
