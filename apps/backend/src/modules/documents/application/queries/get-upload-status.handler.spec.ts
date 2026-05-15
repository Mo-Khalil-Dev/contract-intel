import { GetUploadStatusHandler } from './get-upload-status.handler';
import { GetUploadStatusQuery } from './get-upload-status.query';
import { IDocumentRepository } from '../../domain/document.repository';
import { Document } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';

function fakeDocument(): Document {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  return Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(1000),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
}

describe('GetUploadStatusHandler', () => {
  it('returns the current status for an in-flight upload', async () => {
    const doc = fakeDocument();
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new GetUploadStatusHandler(repo);

    const result = await handler.execute(new GetUploadStatusQuery(doc.id.value, USER_ID));

    expect(result.documentId).toBe(doc.id.value);
    expect(result.status).toBe('uploading');
    expect(result.uploadedAt).toBeNull();
    expect(result.failureReason).toBeNull();
  });

  it('returns the completedAt timestamp once the doc is complete', async () => {
    const doc = fakeDocument();
    doc.markComplete(new Date('2026-05-14T10:00:02Z'));
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new GetUploadStatusHandler(repo);

    const result = await handler.execute(new GetUploadStatusQuery(doc.id.value, USER_ID));

    expect(result.status).toBe('complete');
    expect(result.uploadedAt).toBe('2026-05-14T10:00:02.000Z');
  });

  it('returns the failure reason for failed uploads', async () => {
    const doc = fakeDocument();
    doc.markFailed('network');
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new GetUploadStatusHandler(repo);

    const result = await handler.execute(new GetUploadStatusQuery(doc.id.value, USER_ID));

    expect(result.status).toBe('failed');
    expect(result.failureReason).toBe('network');
  });

  it('throws DOCUMENT_NOT_FOUND when the doc does not exist in this org', async () => {
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new GetUploadStatusHandler(repo);

    await expect(
      handler.execute(new GetUploadStatusQuery(DocumentId.create().value, USER_ID)),
    ).rejects.toMatchObject({
      constructor: ApplicationException,
      code: 'DOCUMENT_NOT_FOUND',
    });
  });
});
