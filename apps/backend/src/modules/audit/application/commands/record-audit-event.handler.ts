import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { RecordAuditEventCommand } from './record-audit-event.command';
import { AUDIT_EVENT_REPOSITORY, IAuditEventRepository } from '../../domain/audit-event.repository';
import { AuditEventFactory } from '../../domain/audit-event.factory';

@CommandHandler(RecordAuditEventCommand)
export class RecordAuditEventHandler implements ICommandHandler<RecordAuditEventCommand, void> {
  constructor(
    @Inject(AUDIT_EVENT_REPOSITORY)
    private readonly repository: IAuditEventRepository,
  ) {}

  async execute(command: RecordAuditEventCommand): Promise<void> {
    const sequenceNumber = await this.repository.getNextSequenceNumber();

    // Combine resourceType and resourceId into a single resourceId string
    // to fit the domain model (resourceId is a single value object)
    const resourceId = `${command.resourceType}:${command.resourceId}`;

    const auditEvent = AuditEventFactory.create({
      actorId: command.actorId,
      action: command.action,
      resourceId,
      sequenceNumber,
    });

    await this.repository.save(auditEvent);
  }
}
