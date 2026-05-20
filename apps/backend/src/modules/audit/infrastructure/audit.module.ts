import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

// Domain port
import { AUDIT_EVENT_REPOSITORY } from '../domain/audit-event.repository';

// Application — command handlers
import { RecordAuditEventHandler } from '../application/commands/record-audit-event.handler';

// Application — query handlers
import { QueryAuditEventsHandler } from '../application/queries/query-audit-events.handler';
import { ExportAuditLogHandler } from '../application/queries/export-audit-log.handler';

// Application — domain event handlers
import { UserLoggedInAuditHandler } from '../application/events/user-logged-in-audit.handler';
import { SessionInvalidatedAuditHandler } from '../application/events/session-invalidated-audit.handler';
import { DocumentUploadedAuditHandler } from '../application/events/document-uploaded-audit.handler';

// Infrastructure
import { PrismaAuditEventRepository } from './prisma-audit-event.repository';
import { AuditController } from './audit.controller';

const COMMAND_HANDLERS = [RecordAuditEventHandler];
const QUERY_HANDLERS = [QueryAuditEventsHandler, ExportAuditLogHandler];
const EVENT_HANDLERS = [
  UserLoggedInAuditHandler,
  SessionInvalidatedAuditHandler,
  DocumentUploadedAuditHandler,
];

/**
 * AuditModule — self-contained.
 *
 * Wires all CQRS handlers, binds PrismaAuditEventRepository to the
 * AUDIT_EVENT_REPOSITORY port, and registers the AuditController.
 *
 * PrismaService is provided globally via PrismaModule (@Global) so it
 * does not need to be imported here.
 *
 * The global SessionAuthGuard (registered in AuthModule as APP_GUARD)
 * protects all routes automatically.
 */
@Module({
  imports: [CqrsModule],
  controllers: [AuditController],
  providers: [
    // CQRS handlers
    ...COMMAND_HANDLERS,
    ...QUERY_HANDLERS,
    ...EVENT_HANDLERS,

    // Infrastructure adapter bound to the domain port
    {
      provide: AUDIT_EVENT_REPOSITORY,
      useClass: PrismaAuditEventRepository,
    },
  ],
})
export class AuditModule {}
