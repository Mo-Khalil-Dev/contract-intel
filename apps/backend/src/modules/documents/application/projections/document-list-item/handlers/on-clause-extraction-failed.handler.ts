import { Inject, Logger } from '@nestjs/common';
import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { ClauseExtractionFailedEvent } from '../../../../../clauses/domain/events/clause.events';
import { DOCUMENT_LIST_ITEM_REPOSITORY } from '../document-list-item.repository';
import type { IDocumentListItemRepository } from '../document-list-item.repository';

@EventsHandler(ClauseExtractionFailedEvent)
export class OnClauseExtractionFailedHandler
  implements IEventHandler<ClauseExtractionFailedEvent>
{
  private readonly logger = new Logger(OnClauseExtractionFailedHandler.name);

  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY)
    private readonly listRepo: IDocumentListItemRepository,
  ) {}

  async handle(event: ClauseExtractionFailedEvent): Promise<void> {
    const { documentId } = event;
    try {
      await this.listRepo.update(documentId, { status: 'failed' });
      this.logger.log(`DocumentListItem set to 'failed' for document ${documentId}`);
    } catch (err) {
      this.logger.error(
        `OnClauseExtractionFailedHandler failed for ${documentId}: ${(err as Error).message}`,
      );
      throw err;
    }
  }
}
