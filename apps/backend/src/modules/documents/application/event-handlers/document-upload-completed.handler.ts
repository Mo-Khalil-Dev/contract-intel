import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DocumentUploadCompletedEvent } from '../../domain/events/document.events';
import { StartOcrProcessingCommand } from '../commands/start-ocr-processing.command';

/**
 * Phase-5 → Phase-7 bridge.
 *
 * Listens for the upload-complete event published by `CompleteUploadHandler`
 * and dispatches `StartOcrProcessingCommand`. This is the **only** wiring
 * between the upload module and the OCR module — Phase 5 doesn't import
 * anything from Phase 7. Adding new downstream consumers (audit, search
 * indexing, ...) means new event handlers, not new edits to the upload code.
 *
 * Fires in-process; if the pipeline takes minutes, this handler stays
 * awaiting that whole time. v1 accepts that — no queue yet, the design
 * doc commits to introducing one only when there's a second consumer.
 */
@EventsHandler(DocumentUploadCompletedEvent)
export class DocumentUploadCompletedHandler
  implements IEventHandler<DocumentUploadCompletedEvent>
{
  private readonly logger = new Logger(DocumentUploadCompletedHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: DocumentUploadCompletedEvent): Promise<void> {
    this.logger.log(
      `Upload complete for document ${event.getAggregateId()} — kicking off OCR`,
    );
    await this.commandBus.execute(
      new StartOcrProcessingCommand(event.getAggregateId()),
    );
  }
}
