import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from '../../config/app-config.module';
import { ClausesModule } from '../clauses/clauses.module';
import { McpController } from './mcp.controller';
import { McpBearerGuard } from './mcp-bearer.guard';

/**
 * MCP module (Phase 12, build-order step 1) — the shared tool layer for the
 * Playbook-Driven Contract Review agent.
 *
 * Wraps the existing clause-read query handlers (registered in
 * {@link ClausesModule}) as MCP tools and serves them over Streamable HTTP.
 * Imports ClausesModule so the query handlers are registered on the shared
 * CQRS QueryBus this module injects; no new query logic is added here.
 */
@Module({
  imports: [CqrsModule, AppConfigModule, ClausesModule],
  controllers: [McpController],
  providers: [McpBearerGuard],
})
export class McpModule {}
