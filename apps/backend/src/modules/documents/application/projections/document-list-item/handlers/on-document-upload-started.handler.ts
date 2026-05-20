import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { DocumentUploadStartedEvent } from '../../../../domain/events/document.events';
import { DOCUMENT_REPOSITORY } from '../../../../domain/document.repository';
import type { IDocumentRepository } from '../../../../domain/document.repository';
import { DocumentId } from '../../../../domain/value-objects/document-id.vo';
import { DOCUMENT_LIST_ITEM_REPOSITORY } from '../document-list-item.repository';
import type { IDocumentListItemRepository } from '../document-list-item.repository';

function stripExtension(fileName: string): string {
  return fileName.replace(/\.[^/.]+$/, '');
}

@EventsHandler(DocumentUploadStartedEvent)
export class OnDocumentUploadStartedHandler
  implements IEventHandler<DocumentUploadStartedEvent>
{
  private readonly logger = new Logger(OnDocumentUploadStartedHandler.name);

  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY)
    private readonly listRepo: IDocumentListItemRepository,
    @Inject(DOCUMENT_REPOSITORY)
    private readonly documentRepo: IDocumentRepository,
  ) {}

  async handle(event: DocumentUploadStartedEvent): Promise<void> {
    const documentId = event.getAggregateId();
    try {
      const document = await this.documentRepo.findById(
        DocumentId.fromString(documentId),
      );
      if (!document) {
        this.logger.warn(
          `OnDocumentUploadStartedHandler: document ${documentId} not found — skipping projection`,
        );
        return;
      }

      await this.listRepo.insert({
        id: documentId,
        orgId: event.orgId,
        name: stripExtension(event.fileName),
        type: document.type.value,
        status: 'processing',
        uploadedAt: document.createdAt,
      });

      this.logger.log(`DocumentListItem created for document ${documentId}`);
    } catch (err) {
      this.logger.error(
        `OnDocumentUploadStartedHandler failed for ${documentId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
