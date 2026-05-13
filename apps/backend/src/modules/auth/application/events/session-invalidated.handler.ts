import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { Logger } from '@nestjs/common';
import { SessionInvalidatedEvent } from '../../domain/events/session.events';

// Phase 3 stub. When the Audit service ships (Phase 6) this handler will
// dispatch a RecordAuditEventCommand. For now it just logs.
@EventsHandler(SessionInvalidatedEvent)
export class SessionInvalidatedHandler implements IEventHandler<SessionInvalidatedEvent> {
  private readonly logger = new Logger(SessionInvalidatedHandler.name);

  handle(event: SessionInvalidatedEvent): void {
    this.logger.log(
      `Session invalidated: sessionId=${event.getAggregateId()} userId=${event.userId} reason=${event.reason}`,
    );
  }
}
