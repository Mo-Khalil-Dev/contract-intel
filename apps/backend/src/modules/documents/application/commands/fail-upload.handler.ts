import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FailUploadCommand } from './fail-upload.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

@CommandHandler(FailUploadCommand)
export class FailUploadHandler implements ICommandHandler<FailUploadCommand, void> {
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FailUploadCommand): Promise<void> {
    const documentId = DocumentId.fromString(command.documentId);
    const orgId = OrgId.fromUploader(UploadedBy.fromUserId(command.requesterUserId));

    const document = await this.documents.findByIdForOrg(documentId, orgId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${command.documentId} not found in this org`,
        404,
      );
    }

    document.markFailed(command.reason);
    await this.documents.save(document);
    this.eventBus.publishAll(document.pullDomainEvents());
  }
}
