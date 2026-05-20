import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { DocumentUploadCompletedEvent } from '../../../documents/domain/events/document.events';
import { RecordAuditEventCommand } from '../commands/record-audit-event.command';
import { AuditActionEnum } from '../../domain/audit-action.vo';

/**
 * Listens for DocumentUploadCompletedEvent from the documents module and
 * records an audit event for the completed document upload.
 */
@EventsHandler(DocumentUploadCompletedEvent)
export class DocumentUploadedAuditHandler implements IEventHandler<DocumentUploadCompletedEvent> {
  private readonly logger = new Logger(DocumentUploadedAuditHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: DocumentUploadCompletedEvent): Promise<void> {
    this.logger.log(
      `Recording audit event for document upload: documentId=${event.getAggregateId()} orgId=${event.orgId}`,
    );

    await this.commandBus.execute(
      new RecordAuditEventCommand(
        event.orgId,
        AuditActionEnum.DOCUMENT_UPLOADED,
        'document',
        event.getAggregateId(),
        {
          storageKey: event.storageKey,
          completedAt: event.completedAt.toISOString(),
        },
      ),
    );
  }
}
