import { GetProcessingStatusHandler } from './get-processing-status.handler';
import { GetProcessingStatusQuery } from './get-processing-status.query';
import { IDocumentRepository } from '../../domain/document.repository';
import { Document, MAX_USER_RETRY_COUNT } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function makeDoc(): Document {
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
  return doc;
}

function repoReturning(doc: Document | null): jest.Mocked<IDocumentRepository> {
  return {
    findByIdForOrg: jest.fn().mockResolvedValue(doc),
    findById: jest.fn(),
    save: jest.fn(),
  };
}

describe('GetProcessingStatusHandler', () => {
  it('reports not_started for a fresh upload-complete doc', async () => {
    const doc = makeDoc();
    const handler = new GetProcessingStatusHandler(repoReturning(doc));

    const result = await handler.execute(new GetProcessingStatusQuery(doc.id.value, USER_ID));
    expect(result.status).toBe('not_started');
    expect(result.failureReason).toBeNull();
    expect(result.userRetryCount).toBe(0);
    expect(result.canRetry).toBe(false);
  });

  it('reports processing while the pipeline runs', async () => {
    const doc = makeDoc();
    doc.startProcessing();
    const handler = new GetProcessingStatusHandler(repoReturning(doc));

    const result = await handler.execute(new GetProcessingStatusQuery(doc.id.value, USER_ID));
    expect(result.status).toBe('processing');
    expect(result.canRetry).toBe(false);
  });

  it('reports ocr_failed with canRetry=true on first failure', async () => {
    const doc = makeDoc();
    doc.startProcessing();
    doc.failProcessing('transient_exhausted');
    const handler = new GetProcessingStatusHandler(repoReturning(doc));

    const result = await handler.execute(new GetProcessingStatusQuery(doc.id.value, USER_ID));
    expect(result.status).toBe('ocr_failed');
    expect(result.failureReason).toBe('transient_exhausted');
    expect(result.userRetryCount).toBe(0);
    expect(result.canRetry).toBe(true);
  });

  it(`reports canRetry=false once userRetryCount reaches ${MAX_USER_RETRY_COUNT}`, async () => {
    const doc = makeDoc();
    doc.startProcessing();
    doc.failProcessing('transient_exhausted');
    for (let i = 0; i < MAX_USER_RETRY_COUNT; i++) {
      doc.retryProcessing();
      doc.failProcessing('transient_exhausted');
    }
    const handler = new GetProcessingStatusHandler(repoReturning(doc));

    const result = await handler.execute(new GetProcessingStatusQuery(doc.id.value, USER_ID));
    expect(result.status).toBe('ocr_failed');
    expect(result.userRetryCount).toBe(MAX_USER_RETRY_COUNT);
    expect(result.canRetry).toBe(false);
  });

  it('reports ocr_complete on success', async () => {
    const doc = makeDoc();
    doc.startProcessing();
    doc.completeProcessing({
      driver: 'native_pdf',
      language: 'en',
      confidence: 1,
      pageCount: 30,
    });
    const handler = new GetProcessingStatusHandler(repoReturning(doc));

    const result = await handler.execute(new GetProcessingStatusQuery(doc.id.value, USER_ID));
    expect(result.status).toBe('ocr_complete');
    expect(result.canRetry).toBe(false);
  });

  it('404s when the document is missing in this org', async () => {
    const handler = new GetProcessingStatusHandler(repoReturning(null));
    await expect(
      handler.execute(new GetProcessingStatusQuery(DocumentId.create().value, USER_ID)),
    ).rejects.toBeInstanceOf(ApplicationException);
  });
});
