import { CommandBus, CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RetryOcrProcessingCommand } from './retry-ocr-processing.command';
import { StartOcrProcessingCommand } from './start-ocr-processing.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * User clicked "Retry OCR" on /processing/:id.
 *
 * Flow:
 *   1. Org-scoped lookup (this is user-triggered, unlike the upload-event
 *      path).
 *   2. Aggregate's `retryProcessing()` flips ocr_failed → processing,
 *      increments the user-retry counter, and throws if the 3-cap is hit.
 *   3. Persist + publish the `DocumentOcrStartedEvent` it emitted.
 *   4. Hand off to `StartOcrProcessingCommand` to actually run the
 *      pipeline. That handler sees the doc already in `processing` and
 *      skips its own transition.
 */
@CommandHandler(RetryOcrProcessingCommand)
export class RetryOcrProcessingHandler
  implements ICommandHandler<RetryOcrProcessingCommand, void>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    private readonly eventBus: EventBus,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RetryOcrProcessingCommand): Promise<void> {
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

    // Domain enforces the retry cap and the ocr_failed → processing
    // transition. Errors here surface as DomainException (HTTP 422).
    document.retryProcessing();
    await this.documents.save(document);
    this.eventBus.publishAll(document.pullDomainEvents());

    await this.commandBus.execute(new StartOcrProcessingCommand(command.documentId));
  }
}
