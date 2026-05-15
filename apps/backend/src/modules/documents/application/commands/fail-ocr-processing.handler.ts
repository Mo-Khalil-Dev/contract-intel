import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { FailOcrProcessingCommand } from './fail-ocr-processing.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

@CommandHandler(FailOcrProcessingCommand)
export class FailOcrProcessingHandler
  implements ICommandHandler<FailOcrProcessingCommand, void>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: FailOcrProcessingCommand): Promise<void> {
    const documentId = DocumentId.fromString(command.documentId);
    const document = await this.documents.findById(documentId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${command.documentId} not found`,
        404,
      );
    }

    document.failProcessing(command.reason);
    await this.documents.save(document);
    this.eventBus.publishAll(document.pullDomainEvents());
  }
}
