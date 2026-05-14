import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { InitiateUploadCommand, InitiateUploadResult } from './initiate-upload.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import {
  STORAGE_SERVICE,
  IStorageService,
} from '../../domain/ports/storage-service.port';
import { Document } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { DocumentName } from '../../domain/value-objects/document-name.vo';
import { DocumentType } from '../../domain/value-objects/document-type.vo';
import { FileSize } from '../../domain/value-objects/file-size.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { StorageKey } from '../../domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';

@CommandHandler(InitiateUploadCommand)
export class InitiateUploadHandler
  implements ICommandHandler<InitiateUploadCommand, InitiateUploadResult>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: InitiateUploadCommand): Promise<InitiateUploadResult> {
    // 1. Build value objects. Each constructor enforces an invariant —
    //    too-large files, invalid types, etc. throw DomainException here.
    const uploadedBy = UploadedBy.fromUserId(command.requesterUserId);
    const orgId = OrgId.fromUploader(uploadedBy);
    const name = DocumentName.create(command.fileName);
    const type = DocumentType.fromMimeType(command.mimeType);
    const size = FileSize.fromBytes(command.fileSizeBytes);

    // 2. Mint the Document. Storage key is derived deterministically
    //    so the URL we hand back matches the row we persist.
    const documentId = DocumentId.create();
    const storageKey = StorageKey.forDocument(documentId, type);

    const document = Document.create({
      id: documentId,
      name,
      type,
      size,
      storageKey,
      uploadedBy,
      orgId,
    });

    // 3. Ask storage for the upload URL the browser should PUT to.
    const grant = await this.storage.generateUploadUrl(storageKey, type);

    // 4. Persist the aggregate, then publish events (after save so
    //    handlers can rely on the row existing).
    await this.documents.save(document);
    this.eventBus.publishAll(document.pullDomainEvents());

    return {
      documentId: document.id.value,
      uploadUrl: grant.url,
      expiresAt: grant.expiresAt,
      method: grant.method,
    };
  }
}
