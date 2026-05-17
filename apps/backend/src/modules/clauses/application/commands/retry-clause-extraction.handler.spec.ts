import { CommandBus } from '@nestjs/cqrs';
import { RetryClauseExtractionHandler } from './retry-clause-extraction.handler';
import { RetryClauseExtractionCommand } from './retry-clause-extraction.command';
import { StartClauseExtractionCommand } from './start-clause-extraction.command';
import { IDocumentRepository } from '../../../documents/domain/document.repository';
import { Document } from '../../../documents/domain/document.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { DocumentName } from '../../../documents/domain/value-objects/document-name.vo';
import { DocumentType } from '../../../documents/domain/value-objects/document-type.vo';
import { FileSize } from '../../../documents/domain/value-objects/file-size.vo';
import { OrgId } from '../../../documents/domain/value-objects/org-id.vo';
import { StorageKey } from '../../../documents/domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../../documents/domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function makeDoc(stage: 'failed' | 'complete' | 'not_started' = 'failed'): Document {
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
  if (stage === 'not_started') return doc;

  doc.markComplete();
  doc.startProcessing();
  doc.completeProcessing({
    driver: 'native_pdf',
    language: 'en',
    confidence: 1,
    pageCount: 1,
  });
  if (stage === 'complete') {
    doc.startExtraction('run-1');
    doc.completeExtraction();
  } else if (stage === 'failed') {
    doc.startExtraction('run-1');
    doc.failExtraction('prior_failure');
  }
  doc.pullDomainEvents();
  return doc;
}

function fakeDocRepo(doc: Document | null): jest.Mocked<IDocumentRepository> {
  return {
    findByIdForOrg: jest.fn(),
    findById: jest.fn().mockResolvedValue(doc),
    save: jest.fn(),
  };
}
function fakeCommandBus(): jest.Mocked<CommandBus> {
  return { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CommandBus>;
}

describe('RetryClauseExtractionHandler', () => {
  it('delegates to StartClauseExtractionCommand when extraction_failed', async () => {
    const doc = makeDoc('failed');
    const bus = fakeCommandBus();
    const handler = new RetryClauseExtractionHandler(fakeDocRepo(doc), bus);

    await handler.execute(new RetryClauseExtractionCommand(doc.id.value));

    expect(bus.execute).toHaveBeenCalledTimes(1);
    const dispatched = bus.execute.mock.calls[0][0] as StartClauseExtractionCommand;
    expect(dispatched).toBeInstanceOf(StartClauseExtractionCommand);
    expect(dispatched.documentId).toBe(doc.id.value);
  });

  it('rejects when extraction_status is not extraction_failed', async () => {
    const doc = makeDoc('complete');
    const handler = new RetryClauseExtractionHandler(
      fakeDocRepo(doc),
      fakeCommandBus(),
    );
    await expect(
      handler.execute(new RetryClauseExtractionCommand(doc.id.value)),
    ).rejects.toBeInstanceOf(ApplicationException);
  });

  it('rejects when status is not_started', async () => {
    const doc = makeDoc('not_started');
    const handler = new RetryClauseExtractionHandler(
      fakeDocRepo(doc),
      fakeCommandBus(),
    );
    await expect(
      handler.execute(new RetryClauseExtractionCommand(doc.id.value)),
    ).rejects.toBeInstanceOf(ApplicationException);
  });

  it('throws 404 when document missing', async () => {
    const handler = new RetryClauseExtractionHandler(
      fakeDocRepo(null),
      fakeCommandBus(),
    );
    await expect(
      handler.execute(
        new RetryClauseExtractionCommand('00000000-0000-4000-8000-000000000000'),
      ),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
