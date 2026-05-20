import { EventsHandler, IEventHandler, CommandBus } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserLoggedInEvent } from '../../../auth/domain/events/user.events';
import { RecordAuditEventCommand } from '../commands/record-audit-event.command';
import { AuditActionEnum } from '../../domain/audit-action.vo';

/**
 * Listens for UserLoggedInEvent from the auth module and records an audit
 * event. This is the Phase 6 implementation of the Phase 3 stub in
 * auth/application/events/user-logged-in.handler.ts.
 *
 * Note: The auth module's UserLoggedInHandler stub remains registered to
 * avoid breaking the auth module's event wiring. This handler is registered
 * in the AuditModule and dispatches via CommandBus.
 */
@EventsHandler(UserLoggedInEvent)
export class UserLoggedInAuditHandler implements IEventHandler<UserLoggedInEvent> {
  private readonly logger = new Logger(UserLoggedInAuditHandler.name);

  constructor(private readonly commandBus: CommandBus) {}

  async handle(event: UserLoggedInEvent): Promise<void> {
    this.logger.log(`Recording audit event for user login: userId=${event.getAggregateId()}`);

    await this.commandBus.execute(
      new RecordAuditEventCommand(
        event.getAggregateId(),
        AuditActionEnum.USER_LOGGED_IN,
        'user',
        event.getAggregateId(),
        {
          email: event.email,
          ipAddress: event.ipAddress,
          userAgent: event.userAgent,
        },
      ),
    );
  }
}
