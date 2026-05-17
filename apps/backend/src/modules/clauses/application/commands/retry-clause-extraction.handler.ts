import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RetryClauseExtractionCommand } from './retry-clause-extraction.command';
import { StartClauseExtractionCommand } from './start-clause-extraction.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../../documents/domain/document.repository';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { DocumentExtractionStatusValue } from '../../../documents/domain/value-objects/document-extraction-status.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * Admin/system retry after `extraction_failed`. Creates a brand-new
 * ExtractionRun by delegating to `StartClauseExtractionCommand` — the
 * old failed run is retained for audit.
 *
 * Phase 8 does not expose this through the UI (per design.md §15);
 * Phase 9 will add the user-facing "Retry extraction" button once the
 * risk-rubric SME validation is locked.
 */
@CommandHandler(RetryClauseExtractionCommand)
export class RetryClauseExtractionHandler
  implements ICommandHandler<RetryClauseExtractionCommand, void>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async execute(command: RetryClauseExtractionCommand): Promise<void> {
    const documentId = DocumentId.fromString(command.documentId);
    const document = await this.documents.findById(documentId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${command.documentId} not found`,
        404,
      );
    }
    if (
      document.extractionStatus.value !==
      DocumentExtractionStatusValue.EXTRACTION_FAILED
    ) {
      throw new ApplicationException(
        'INVALID_RETRY_STATE',
        `Retry requires extractionStatus 'extraction_failed' (got '${document.extractionStatus.value}')`,
        409,
      );
    }

    await this.commandBus.execute(
      new StartClauseExtractionCommand(command.documentId),
    );
  }
}
