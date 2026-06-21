import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import Anthropic from '@anthropic-ai/sdk';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';

// Application
import { ContextBuilder } from './application/context/context-builder';
import { QueryHandlerRegistry } from './application/handlers/query-handler.registry';
import { RiskAnalysisHandler } from './application/handlers/risk-analysis.handler';
import { GeneralHandler } from './application/handlers/general.handler';
import { AskPortfolioHandler } from './application/commands/ask-portfolio.handler';

// Ports
import { CLAUDE_ANSWER_SERVICE } from './application/ports/claude-answer.service';
import { CHAT_REPOSITORY } from './domain/chat.repository';

// Infrastructure
import { ChatController } from './infrastructure/chat.controller';
import { PrismaChatRepository } from './infrastructure/persistence/prisma-chat.repository';
import { StubClaudeAnswerService } from './infrastructure/answer/stub-claude-answer.service';
import {
  AnthropicClaudeAnswerService,
  CHAT_ANTHROPIC_CLIENT,
  CHAT_CLAUDE_MODEL,
} from './infrastructure/answer/anthropic-claude-answer.service';

/**
 * Chat module — Phase 12, "Ask Your Portfolio".
 *
 * Reads the portfolio projection from DocumentsModule (no re-extraction),
 * classifies questions, grounds an answer through Claude behind a port,
 * and persists threads/messages. The answer driver defaults to a
 * deterministic stub and only swaps to the live Anthropic driver when a
 * Claude API key is configured — so the feature runs locally with zero
 * external calls out of the box.
 */
@Module({
  imports: [CqrsModule, AppConfigModule, PrismaModule, DocumentsModule],
  controllers: [ChatController],
  providers: [
    // Application
    ContextBuilder,
    RiskAnalysisHandler,
    GeneralHandler,
    QueryHandlerRegistry,
    AskPortfolioHandler,

    // Persistence
    { provide: CHAT_REPOSITORY, useClass: PrismaChatRepository },

    // Answer driver candidates — both registered so tests can DI-override.
    StubClaudeAnswerService,
    AnthropicClaudeAnswerService,
    {
      provide: CHAT_ANTHROPIC_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Anthropic =>
        new Anthropic({ apiKey: config.claudeApiKey ?? '' }),
    },
    {
      provide: CHAT_CLAUDE_MODEL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => config.claudeModel,
    },
    {
      provide: CLAUDE_ANSWER_SERVICE,
      inject: [AppConfigService, StubClaudeAnswerService, AnthropicClaudeAnswerService],
      useFactory: (
        config: AppConfigService,
        stub: StubClaudeAnswerService,
        anthropic: AnthropicClaudeAnswerService,
      ) => (config.claudeApiKey ? anthropic : stub),
    },
  ],
})
export class ChatModule {}
