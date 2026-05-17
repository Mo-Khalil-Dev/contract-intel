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
import { CLAUSE_REPOSITORY } from './domain/clause.repository';
import { EXTRACTION_RUN_REPOSITORY } from './domain/extraction-run.repository';

// Infrastructure — drivers
import { MockClauseExtractor } from './infrastructure/extraction/mock-clause-extractor';
import { MockEmbeddingService } from './infrastructure/embeddings/mock-embedding-service';

// Infrastructure — persistence
import { PrismaClauseRepository } from './infrastructure/persistence/prisma-clause.repository';
import { PrismaExtractionRunRepository } from './infrastructure/persistence/prisma-extraction-run.repository';

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

    // Driver candidates — both registered so they can be DI-overridden in
    // tests. The factories below select one at boot based on env.
    MockClauseExtractor,
    MockEmbeddingService,

    {
      provide: CLAUSE_EXTRACTOR,
      inject: [AppConfigService, MockClauseExtractor],
      useFactory: (
        config: AppConfigService,
        mock: MockClauseExtractor,
      ): IClauseExtractor => {
        switch (config.clauseExtractor) {
          case ClauseExtractorDriver.Anthropic:
            // Wired in Task 8.4. Until then, fall through to mock so a
            // mis-set env never crashes the boot.
            return mock;
          case ClauseExtractorDriver.Mock:
          default:
            return mock;
        }
      },
    },

    {
      provide: EMBEDDING_SERVICE,
      inject: [AppConfigService, MockEmbeddingService],
      useFactory: (
        config: AppConfigService,
        mock: MockEmbeddingService,
      ): IEmbeddingService => {
        switch (config.embeddingDriver) {
          case EmbeddingDriver.Voyage:
            // Wired in Task 8.5.
            return mock;
          case EmbeddingDriver.Mock:
          default:
            return mock;
        }
      },
    },
  ],
})
export class ClausesModule {}
