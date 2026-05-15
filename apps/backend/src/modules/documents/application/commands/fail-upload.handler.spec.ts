import { EventBus } from '@nestjs/cqrs';
import { FailUploadHandler } from './fail-upload.handler';
import { FailUploadCommand } from './fail-upload.command';
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

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

describe('FailUploadHandler', () => {
  it('marks the document failed with the supplied reason and publishes the event', async () => {
    const doc = fakeDocument();
    doc.pullDomainEvents();

    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(doc),
      findById: jest.fn(),
      save: jest.fn().mockResolvedValue(undefined),
    };
    const bus = fakeBus();
    const handler = new FailUploadHandler(repo, bus);

    await handler.execute(new FailUploadCommand(doc.id.value, 'network', USER_ID));

    expect(doc.status.value).toBe(UploadStatusValue.FAILED);
    expect(doc.failureReason).toBe('network');
    expect(repo.save).toHaveBeenCalledWith(doc);
    expect(bus.publishAll).toHaveBeenCalledTimes(1);
  });

  it('throws DOCUMENT_NOT_FOUND when the document does not exist in this org', async () => {
    const repo: jest.Mocked<IDocumentRepository> = {
      findByIdForOrg: jest.fn().mockResolvedValue(null),
      findById: jest.fn(),
      save: jest.fn(),
    };
    const handler = new FailUploadHandler(repo, fakeBus());

    await expect(
      handler.execute(new FailUploadCommand(DocumentId.create().value, 'network', USER_ID)),
    ).rejects.toMatchObject({
      constructor: ApplicationException,
      code: 'DOCUMENT_NOT_FOUND',
    });

    expect(repo.save).not.toHaveBeenCalled();
  });
});
