import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { AuthModule } from '../auth/auth.module';
import { AppConfigModule } from '../../config/app-config.module';
import { AppConfigService } from '../../config/app-config.service';
import {
  ContractReviewRuntime,
  OcrDriver as OcrDriverEnum,
  StorageDriver,
} from '../../config/environment-variables';
import { PrismaModule } from '../../shared/infrastructure/prisma/prisma.module';

// Application layer — Phase 5
import { InitiateUploadHandler } from './application/commands/initiate-upload.handler';
import { CompleteUploadHandler } from './application/commands/complete-upload.handler';
import { FailUploadHandler } from './application/commands/fail-upload.handler';
import { GetUploadStatusHandler } from './application/queries/get-upload-status.handler';

// Application layer — Phase 10 (Contracts View queries)
import { GetDocumentListHandler } from './application/queries/get-document-list.handler';
import { GetDocumentSummaryHandler } from './application/queries/get-document-summary.handler';

// Application layer — Phase 7 (OCR)
import { StartOcrProcessingHandler } from './application/commands/start-ocr-processing.handler';
import { FailOcrProcessingHandler } from './application/commands/fail-ocr-processing.handler';
import { RetryOcrProcessingHandler } from './application/commands/retry-ocr-processing.handler';
import { GetDocumentTextHandler } from './application/queries/get-document-text.handler';
import { GetProcessingStatusHandler } from './application/queries/get-processing-status.handler';
import { DocumentUploadCompletedHandler } from './application/event-handlers/document-upload-completed.handler';

// Application layer — Contract Review agent (Playbook-Driven Contract Review)
import { RunContractReviewHandler } from './application/commands/run-contract-review.handler';

// Contract Review — port + runtime adapters
import { CONTRACT_REVIEW_RUNNER } from './domain/ports/contract-review-runner.port';
import { AnthropicManagedAgentRunner } from './infrastructure/review/anthropic-managed-agent.runner';
import { AgentCoreRunner } from './infrastructure/review/agentcore.runner';

// Ports
import { DOCUMENT_REPOSITORY } from './domain/document.repository';
import { DOCUMENT_TEXT_REPOSITORY } from './domain/document-text.repository';
import { DOCUMENT_LIST_ITEM_REPOSITORY } from './application/projections/document-list-item/document-list-item.repository';
import { STORAGE_SERVICE, IStorageService } from './domain/ports/storage-service.port';
import { OCR_SERVICE, IOcrService } from './domain/ports/ocr-service.port';

// Infrastructure — Phase 5
import { DocumentController } from './infrastructure/document.controller';
import { PrismaDocumentRepository } from './infrastructure/prisma-document.repository';
import { LocalStorageDriver } from './infrastructure/storage/local-storage.driver';
import { GcsStorageDriver } from './infrastructure/storage/gcs-storage.driver';

// Infrastructure — Phase 7 (OCR)
import { MockOcrDriver } from './infrastructure/ocr/mock-ocr.driver';
import { LanguageDetector } from './infrastructure/ocr/language-detector';
import { NativePdfExtractor } from './infrastructure/ocr/native-pdf-extractor';
import { PdfClassifier } from './infrastructure/ocr/pdf-classifier';
import {
  ClassifierThenRouter,
  OCR_CLOUD_DRIVER,
  OCR_LANGUAGE_CONFIDENCE_THRESHOLD,
  OCR_PAGE_LIMIT,
  OCR_TEXT_QUALITY_THRESHOLD,
} from './infrastructure/ocr/classifier-then-router';
import {
  DOC_AI_CLIENT,
  DOC_AI_GCS_HELPERS,
  GoogleDocAiDriver,
} from './infrastructure/ocr/google-doc-ai.driver';
import {
  GoogleDocAiGcsHelpers,
  GoogleDocAiSdkClient,
} from './infrastructure/ocr/google-doc-ai.adapters';
import { PrismaDocumentTextRepository } from './infrastructure/prisma-document-text.repository';

// Infrastructure — Phase 10 (Contracts View read model)
import { PrismaDocumentListItemRepository } from './infrastructure/prisma-document-list-item.repository';

// Application — Phase 10 projection handlers
import { OnDocumentUploadStartedHandler } from './application/projections/document-list-item/handlers/on-document-upload-started.handler';
import { OnClauseExtractionCompletedHandler } from './application/projections/document-list-item/handlers/on-clause-extraction-completed.handler';
import { OnClauseExtractionFailedHandler } from './application/projections/document-list-item/handlers/on-clause-extraction-failed.handler';

/**
 * Documents module — Phase 5.
 *
 * Storage driver is chosen at boot based on AppConfigService.storageDriver
 * (env var STORAGE_DRIVER):
 *   - 'local' → LocalStorageDriver writes to LOCAL_STORAGE_PATH. The
 *     DocumentController.raw route streams body bytes to disk.
 *   - 'gcs'   → GcsStorageDriver mints V4 presigned URLs; browser PUTs
 *     directly to googleapis.com and the backend never sees the bytes.
 *
 * Both drivers are registered as providers; the factory picks one and
 * binds it to the IStorageService port. The DocumentController always
 * injects the concrete LocalStorageDriver for its raw PUT route, but
 * that route is never hit in gcs mode (browser PUTs elsewhere).
 */
@Module({
  imports: [CqrsModule, AuthModule, AppConfigModule, PrismaModule],
  controllers: [DocumentController],
  providers: [
    // ── Phase 5 application
    InitiateUploadHandler,
    CompleteUploadHandler,
    FailUploadHandler,
    GetUploadStatusHandler,

    // ── Phase 5 infrastructure
    LocalStorageDriver,
    GcsStorageDriver,
    { provide: DOCUMENT_REPOSITORY, useClass: PrismaDocumentRepository },
    {
      provide: STORAGE_SERVICE,
      inject: [AppConfigService, LocalStorageDriver, GcsStorageDriver],
      useFactory: (
        config: AppConfigService,
        local: LocalStorageDriver,
        gcs: GcsStorageDriver,
      ): IStorageService =>
        config.storageDriver === StorageDriver.Gcs ? gcs : local,
    },

    // ── Phase 7 application (OCR)
    StartOcrProcessingHandler,
    FailOcrProcessingHandler,
    RetryOcrProcessingHandler,
    GetDocumentTextHandler,
    GetProcessingStatusHandler,
    DocumentUploadCompletedHandler,

    // ── Phase 7 infrastructure (OCR)
    PdfClassifier,
    LanguageDetector,
    NativePdfExtractor,
    MockOcrDriver,

    // Document AI driver + its SDK adapters. Adapters are registered
    // unconditionally so they can be DI-overridden in tests; the cloud
    // factory below decides which driver is actually used at boot.
    { provide: DOC_AI_CLIENT, useClass: GoogleDocAiSdkClient },
    { provide: DOC_AI_GCS_HELPERS, useClass: GoogleDocAiGcsHelpers },
    GoogleDocAiDriver,

    ClassifierThenRouter,
    { provide: DOCUMENT_TEXT_REPOSITORY, useClass: PrismaDocumentTextRepository },
    { provide: DOCUMENT_LIST_ITEM_REPOSITORY, useClass: PrismaDocumentListItemRepository },
    GetDocumentListHandler,
    GetDocumentSummaryHandler,
    OnDocumentUploadStartedHandler,
    OnClauseExtractionCompletedHandler,
    OnClauseExtractionFailedHandler,
    { provide: OCR_SERVICE, useExisting: ClassifierThenRouter },

    // ── Contract Review agent — one tool layer (MCP), two runtimes.
    // The active runner is chosen at boot from CONTRACT_REVIEW_RUNTIME,
    // exactly like the OCR_CLOUD_DRIVER factory above. Swapping runtimes
    // is a one-line .env change with zero app-code change.
    RunContractReviewHandler,
    AnthropicManagedAgentRunner,
    AgentCoreRunner,
    {
      provide: CONTRACT_REVIEW_RUNNER,
      inject: [AppConfigService, AnthropicManagedAgentRunner, AgentCoreRunner],
      useFactory: (
        config: AppConfigService,
        anthropic: AnthropicManagedAgentRunner,
        agentcore: AgentCoreRunner,
      ) =>
        config.contractReviewRuntime === ContractReviewRuntime.AgentCore
          ? agentcore
          : anthropic,
    },

    // Cloud-track driver — env-driven. `mock` for tests/local-dev,
    // `google-document-ai` for prod. Adding a third driver later means
    // registering it as a provider and adding a case below.
    {
      provide: OCR_CLOUD_DRIVER,
      inject: [AppConfigService, MockOcrDriver, GoogleDocAiDriver],
      useFactory: (
        config: AppConfigService,
        mock: MockOcrDriver,
        docAi: GoogleDocAiDriver,
      ): IOcrService => {
        switch (config.ocrDriver) {
          case OcrDriverEnum.GoogleDocumentAi:
            return docAi;
          case OcrDriverEnum.Mock:
          default:
            return mock;
        }
      },
    },

    // Pipeline tuning knobs.
    {
      provide: OCR_PAGE_LIMIT,
      inject: [AppConfigService],
      useFactory: (c: AppConfigService) => c.ocrPageLimit,
    },
    {
      provide: OCR_TEXT_QUALITY_THRESHOLD,
      inject: [AppConfigService],
      useFactory: (c: AppConfigService) => c.ocrTextQualityThreshold,
    },
    {
      provide: OCR_LANGUAGE_CONFIDENCE_THRESHOLD,
      inject: [AppConfigService],
      useFactory: (c: AppConfigService) => c.ocrLanguageConfidenceThreshold,
    },
  ],
  // ClausesModule (Phase 8) subscribes to DocumentOcrCompletedEvent and
  // reads documents + document texts through the application-layer ports.
  // Re-exporting CqrsModule lets the events propagate; exporting the two
  // repository symbols gives the clauses application layer a typed handle.
  exports: [
    CqrsModule,
    DOCUMENT_REPOSITORY,
    DOCUMENT_TEXT_REPOSITORY,
    // Phase 12: the chat ContextBuilder reads the portfolio projection to
    // ground risk answers without re-running extraction.
    DOCUMENT_LIST_ITEM_REPOSITORY,
  ],
})
export class DocumentsModule {}
