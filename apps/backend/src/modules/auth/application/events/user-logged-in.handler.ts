import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { UserLoggedInEvent } from '../../domain/events/user.events';

// Phase 3 stub. When the Audit service ships (Phase 6) this handler will
// dispatch a RecordAuditEventCommand. For now it just logs.
@EventsHandler(UserLoggedInEvent)
export class UserLoggedInHandler implements IEventHandler<UserLoggedInEvent> {
  private readonly logger = new Logger(UserLoggedInHandler.name);

  handle(event: UserLoggedInEvent): void {
    this.logger.log(
      `User logged in: userId=${event.getAggregateId()} email=${event.email} ip=${event.ipAddress ?? 'n/a'}`,
    );
  }
}
