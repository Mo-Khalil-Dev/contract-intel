import { EventBus } from '@nestjs/cqrs';
import { CompleteUploadHandler } from './complete-upload.handler';
import { CompleteUploadCommand } from './complete-upload.command';
import { IDocumentRepository } from '../../domain/document.repository';
import { Document } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { UploadStatusValue } from '../../domain/value-objects/upload-status.vo';
import {
  ApplicationException,
  DomainException,
} from '../../../../shared/exceptions/app-error';

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

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

describe('CompleteUploadHandler', () => {
  it('marks the document complete and publishes events', async () => {
    const doc = fakeDocument();
    doc.pullDomainEvents(); // drain create event so we only assert on the complete one

    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const bus = fakeBus();
    const handler = new CompleteUploadHandler(repo, bus);

    await handler.execute(new CompleteUploadCommand(doc.id.value, USER_ID));

    expect(doc.status.value).toBe(UploadStatusValue.COMPLETE);
    expect(repo.save).toHaveBeenCalledWith(doc);
    expect(bus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws DOCUMENT_NOT_FOUND when the document does not exist in this org', async () => {
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new CompleteUploadHandler(repo, fakeBus());

    await expect(
      handler.execute(new CompleteUploadCommand(DocumentId.create().value, USER_ID)),
    ).rejects.toMatchObject({
      constructor: ApplicationException,
      code: 'DOCUMENT_NOT_FOUND',
    });

    expect(repo.save).not.toHaveBeenCalled();
  });

  it('passes orgId scoping to the repository', async () => {
    const doc = fakeDocument();
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const handler = new CompleteUploadHandler(repo, fakeBus());

    await handler.execute(new CompleteUploadCommand(doc.id.value, USER_ID));

    const [, passedOrgId] = repo.findByIdForOrg.mock.calls[0];
    expect(passedOrgId.value).toBe(USER_ID);
  });

  it('rejects invalid documentId before touching the repo', async () => {
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn(),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new CompleteUploadHandler(repo, fakeBus());

    await expect(
      handler.execute(new CompleteUploadCommand('not-a-uuid', USER_ID)),
    ).rejects.toBeInstanceOf(DomainException);

    expect(repo.findByIdForOrg).not.toHaveBeenCalled();
  });
});
