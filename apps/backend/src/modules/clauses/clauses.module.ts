import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import {
  ClauseExtractorDriver,
  EmbeddingDriver,
} from '../../config/environment-variables';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';
import { DocumentsModule } from '../documents/documents.module';

// Application — commands
import { StartClauseExtractionHandler } from './application/commands/start-clause-extraction.handler';
import { FailClauseExtractionHandler } from './application/commands/fail-clause-extraction.handler';
import { RetryClauseExtractionHandler } from './application/commands/retry-clause-extraction.handler';

// Application — queries
import { GetClausesForDocumentHandler } from './application/queries/get-clauses-for-document.handler';
import { GetClauseByIdHandler } from './application/queries/get-clause-by-id.handler';
import { GetExtractionRunStatusHandler } from './application/queries/get-extraction-run-status.handler';

// Application — event handlers
import { DocumentOcrCompletedHandler } from './application/event-handlers/document-ocr-completed.handler';

// Ports
import { CLAUSE_EXTRACTOR, IClauseExtractor } from './application/ports/clause-extractor.port';
import { EMBEDDING_SERVICE, IEmbeddingService } from './application/ports/embedding-service.port';
import { CLAUSE_SIMILARITY_REPOSITORY } from './application/ports/clause-similarity.repository';
import { CLAUSE_REPOSITORY } from './domain/clause.repository';
import { EXTRACTION_RUN_REPOSITORY } from './domain/extraction-run.repository';

// Infrastructure — drivers
import { MockClauseExtractor } from './infrastructure/extraction/mock-clause-extractor';
import { MockEmbeddingService } from './infrastructure/embeddings/mock-embedding-service';
import Anthropic from '@anthropic-ai/sdk';
import {
  ANTHROPIC_CLIENT,
  CLAUDE_MODEL,
  ClaudeClauseExtractor,
} from './infrastructure/extraction/claude-clause-extractor';
import { VoyageAIClient } from 'voyageai';
import {
  VOYAGE_CLIENT,
  VOYAGE_MODEL,
  VoyageEmbeddingService,
} from './infrastructure/embeddings/voyage-embedding-service';

// Infrastructure — persistence
import { PrismaClauseRepository } from './infrastructure/persistence/prisma-clause.repository';
import { PrismaExtractionRunRepository } from './infrastructure/persistence/prisma-extraction-run.repository';
import { PgvectorClauseSimilarityRepository } from './infrastructure/persistence/pgvector-clause-similarity.repository';

/**
 * Clauses module — Phase 8.
 *
 * Subscribes to `DocumentOcrCompletedEvent` from the documents module and
 * runs the extract → classify → embed → persist pipeline. Production
 * drivers (Anthropic, Voyage) land in Tasks 8.4 / 8.5; until then both
 * driver slots default to deterministic mocks and the whole pipeline
 * runs locally with no external API calls.
 */
@Module({
  imports: [CqrsModule, AppConfigModule, PrismaModule, DocumentsModule],
  providers: [
    // Application
    StartClauseExtractionHandler,
    FailClauseExtractionHandler,
    RetryClauseExtractionHandler,
    GetClausesForDocumentHandler,
    GetClauseByIdHandler,
    GetExtractionRunStatusHandler,
    DocumentOcrCompletedHandler,

    // Persistence
    { provide: CLAUSE_REPOSITORY, useClass: PrismaClauseRepository },
    { provide: EXTRACTION_RUN_REPOSITORY, useClass: PrismaExtractionRunRepository },
    { provide: CLAUSE_SIMILARITY_REPOSITORY, useClass: PgvectorClauseSimilarityRepository },

    // Driver candidates — both registered so they can be DI-overridden in
    // tests. The factories below select one at boot based on env.
    MockClauseExtractor,
    MockEmbeddingService,
    ClaudeClauseExtractor,
    VoyageEmbeddingService,

    // Anthropic SDK client — instantiated once, shared across calls.
    // Lives behind ANTHROPIC_CLIENT so tests can override with a stub.
    {
      provide: ANTHROPIC_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): Anthropic =>
        new Anthropic({ apiKey: config.claudeApiKey ?? '' }),
    },
    {
      provide: CLAUDE_MODEL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => config.claudeModel,
    },

    {
      provide: CLAUSE_EXTRACTOR,
      inject: [AppConfigService, MockClauseExtractor, ClaudeClauseExtractor],
      useFactory: (
        config: AppConfigService,
        mock: MockClauseExtractor,
        claude: ClaudeClauseExtractor,
      ): IClauseExtractor => {
        switch (config.clauseExtractor) {
          case ClauseExtractorDriver.Anthropic:
            return claude;
          case ClauseExtractorDriver.Mock:
          default:
            return mock;
        }
      },
    },

    // Voyage SDK client — shared across calls. Behind VOYAGE_CLIENT so
    // tests can override with a stub.
    {
      provide: VOYAGE_CLIENT,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService): VoyageAIClient =>
        new VoyageAIClient({ apiKey: config.voyageApiKey ?? '' }),
    },
    {
      provide: VOYAGE_MODEL,
      inject: [AppConfigService],
      useFactory: (config: AppConfigService) => config.voyageModel,
    },

    {
      provide: EMBEDDING_SERVICE,
      inject: [AppConfigService, MockEmbeddingService, VoyageEmbeddingService],
      useFactory: (
        config: AppConfigService,
        mock: MockEmbeddingService,
        voyage: VoyageEmbeddingService,
      ): IEmbeddingService => {
        switch (config.embeddingDriver) {
          case EmbeddingDriver.Voyage:
            return voyage;
          case EmbeddingDriver.Mock:
          default:
            return mock;
        }
      },
    },
  ],
})
export class ClausesModule {}
