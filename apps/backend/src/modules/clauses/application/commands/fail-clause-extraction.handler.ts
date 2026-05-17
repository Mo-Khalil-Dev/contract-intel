import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FailClauseExtractionCommand } from './fail-clause-extraction.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../../documents/domain/document.repository';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { DocumentExtractionStatusValue } from '../../../documents/domain/value-objects/document-extraction-status.vo';
import {
  EXTRACTION_RUN_REPOSITORY,
  IExtractionRunRepository,
} from '../../domain/extraction-run.repository';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * Admin / system abort. Marks the in-flight extraction run failed
 * and flips the Document's extraction status to `extraction_failed`.
 * Idempotent: if the document is already in a terminal extraction
 * state, this is a no-op.
 */
@CommandHandler(FailClauseExtractionCommand)
export class FailClauseExtractionHandler
  implements ICommandHandler<FailClauseExtractionCommand, void>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    @Inject(EXTRACTION_RUN_REPOSITORY)
    private readonly runs: IExtractionRunRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FailClauseExtractionCommand): Promise<void> {
    const documentId = DocumentId.fromString(command.documentId);
    const document = await this.documents.findById(documentId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${command.documentId} not found`,
        404,
      );
    }

    const run = await this.runs.findCurrentForDocument(documentId);
    if (run && run.isRunning()) {
      run.fail(command.reason);
      await this.runs.save(run);
      this.eventBus.publishAll(run.pullDomainEvents());
    }

    if (
      document.extractionStatus.value === DocumentExtractionStatusValue.EXTRACTING
    ) {
      document.failExtraction(command.reason);
      await this.documents.save(document);
      this.eventBus.publishAll(document.pullDomainEvents());
    }
  }
}
