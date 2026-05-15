import { EventBus } from '@nestjs/cqrs';
import { FailOcrProcessingHandler } from './fail-ocr-processing.handler';
import { FailOcrProcessingCommand } from './fail-ocr-processing.command';
import { IDocumentRepository } from '../../domain/document.repository';
import { Document } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { ProcessingStatusValue } from '../../domain/value-objects/processing-status.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { DocumentOcrFailedEvent } from '../../domain/events/document.events';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function inProcessingDoc(): Document {
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
  return doc;
}

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

describe('FailOcrProcessingHandler', () => {
  it('transitions to ocr_failed, saves, publishes failed event', async () => {
    const doc = inProcessingDoc();
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn(),
      findById: jest.fn().mockResolvedValue(doc),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const bus = fakeBus();
    const handler = new FailOcrProcessingHandler(repo, bus);

    await handler.execute(new FailOcrProcessingCommand(doc.id.value, 'admin_abort'));

    expect(doc.processingStatus.value).toBe(ProcessingStatusValue.OCR_FAILED);
    expect(doc.failureReason).toBe('admin_abort');
    expect(repo.save).toHaveBeenCalledTimes(1);
    const events = bus.publishAll.mock.calls.flatMap((c) => c[0] as unknown[]);
    expect(events.some((e) => e instanceof DocumentOcrFailedEvent)).toBe(true);
  });

  it('throws 404 when the document is missing', async () => {
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn(),
      findById: jest.fn().mockResolvedValue(null),
      save: jest.fn(),
    };
    const handler = new FailOcrProcessingHandler(repo, fakeBus());

    await expect(
      handler.execute(new FailOcrProcessingCommand(DocumentId.create().value, 'x')),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
