import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DocumentOcrCompletedEvent } from '../../../documents/domain/events/document.events';
import { StartClauseExtractionCommand } from '../commands/start-clause-extraction.command';

/**
 * Phase 7 → Phase 8 bridge.
 *
 * Listens for `DocumentOcrCompletedEvent` (published by Phase 7's
 * StartOcrProcessingHandler) and dispatches StartClauseExtractionCommand.
 * This is the only wiring point between the documents and clauses
 * modules — adding new downstream consumers means new event handlers,
 * not edits to Phase 7 code.
 *
 * In-process. Same trade-off as DocumentUploadCompletedHandler: no
 * queue in v1; introduced when there's a second consumer (Phase 9 risk
 * scoring).
 */
@EventsHandler(DocumentOcrCompletedEvent)
export class DocumentOcrCompletedHandler
  implements IEventHandler<DocumentOcrCompletedEvent>
{
  private readonly logger = new Logger(DocumentOcrCompletedHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: DocumentOcrCompletedEvent): Promise<void> {
    this.logger.log(
      `OCR complete for document ${event.getAggregateId()} — kicking off clause extraction`,
    );
    try {
      await this.commandBus.execute(
        new StartClauseExtractionCommand(event.getAggregateId()),
      );
    } catch (err) {
      // CQRS swallows event-handler throws by default; explicit logging
      // here surfaces extraction failures during diagnostics.
      this.logger.error(
        `Clause extraction failed for document ${event.getAggregateId()}: ${
          err instanceof Error ? err.stack ?? err.message : String(err)
        }`,
      );
      throw err;
    }
  }
}
