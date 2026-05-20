import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { SessionInvalidatedEvent } from '../../../auth/domain/events/session.events';
import { RecordAuditEventCommand } from '../commands/record-audit-event.command';
import { AuditActionEnum } from '../../domain/audit-action.vo';

/**
 * Listens for SessionInvalidatedEvent from the auth module and records an
 * audit event for user logout / session expiry.
 */
@EventsHandler(SessionInvalidatedEvent)
export class SessionInvalidatedAuditHandler implements IEventHandler<SessionInvalidatedEvent> {
  private readonly logger = new Logger(SessionInvalidatedAuditHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: SessionInvalidatedEvent): Promise<void> {
    this.logger.log(
      `Recording audit event for session invalidation: sessionId=${event.getAggregateId()} reason=${event.reason}`,
    );

    await this.commandBus.execute(
      new RecordAuditEventCommand(
        event.userId,
        AuditActionEnum.USER_LOGGED_OUT,
        'session',
        event.getAggregateId(),
        {
          reason: event.reason,
        },
      ),
    );
  }
}
