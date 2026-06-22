import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AuthDriver,
  ClauseExtractorDriver,
  EmbeddingDriver,
  EnvironmentVariables,
  LogLevel,
  NodeEnv,
  OcrDriver,
  QueueDriver,
  StorageDriver,
} from './environment-variables';

@Injectable()
export class AppConfigService {
  constructor(private configService: ConfigService<EnvironmentVariables, true>) {}

  // Server
  get nodeEnv(): NodeEnv {
    return this.configService.get('NODE_ENV', { infer: true });
  }

  get isDevelopment(): boolean {
    return this.nodeEnv === NodeEnv.Development;
  }

  get isProduction(): boolean {
    return this.nodeEnv === NodeEnv.Production;
  }

  get isTest(): boolean {
    return this.nodeEnv === NodeEnv.Test;
  }

  get port(): number {
    return this.configService.get('PORT', { infer: true });
  }

  get apiPrefix(): string {
    return this.configService.get('API_PREFIX', { infer: true });
  }

  get sessionSecret(): string {
    return this.configService.get('SESSION_SECRET', { infer: true });
  }

  // Database
  get databaseUrl(): string {
    return this.configService.get('DATABASE_URL', { infer: true });
  }

  // Encryption
  get encryptionKey(): string {
    return this.configService.get('ENCRYPTION_KEY', { infer: true });
  }

  get encryptionKeyName(): string {
    return this.configService.get('ENCRYPTION_KEY_NAME', { infer: true });
  }

  // Auth
  get authDriver(): AuthDriver {
    return this.configService.get('AUTH_DRIVER', { infer: true });
  }

  // Auth0
  get auth0Domain(): string | undefined {
    return this.configService.get('AUTH0_DOMAIN', { infer: true });
  }

  get auth0ClientId(): string | undefined {
    return this.configService.get('AUTH0_CLIENT_ID', { infer: true });
  }

  get auth0ClientSecret(): string | undefined {
    return this.configService.get('AUTH0_CLIENT_SECRET', { infer: true });
  }

  get auth0CallbackUrl(): string | undefined {
    return this.configService.get('AUTH0_CALLBACK_URL', { infer: true });
  }

  // Frontend
  get frontendUrl(): string {
    return this.configService.get('FRONTEND_URL', { infer: true });
  }

  // Storage
  get storageDriver(): StorageDriver {
    return this.configService.get('STORAGE_DRIVER', { infer: true });
  }

  get localStoragePath(): string {
    return this.configService.get('LOCAL_STORAGE_PATH', { infer: true });
  }

  // GCS — only present when STORAGE_DRIVER=gcs.
  get gcsProjectId(): string | undefined {
    return this.configService.get('GCS_PROJECT_ID', { infer: true });
  }

  get gcsBucketName(): string | undefined {
    return this.configService.get('GCS_BUCKET_NAME', { infer: true });
  }

  get gcsServiceAccountKey(): string | undefined {
    return this.configService.get('GCS_SERVICE_ACCOUNT_KEY', { infer: true });
  }

  // OCR
  get ocrDriver(): OcrDriver {
    return this.configService.get('OCR_DRIVER', { infer: true });
  }

  get ocrPageLimit(): number {
    return this.configService.get('OCR_PAGE_LIMIT', { infer: true });
  }

  get ocrTextQualityThreshold(): number {
    return this.configService.get('OCR_TEXT_QUALITY_THRESHOLD', { infer: true });
  }

  get ocrLanguageConfidenceThreshold(): number {
    return this.configService.get('OCR_LANGUAGE_CONFIDENCE_THRESHOLD', { infer: true });
  }

  get ocrGcpProjectId(): string | undefined {
    return this.configService.get('OCR_GCP_PROJECT_ID', { infer: true });
  }

  get ocrGcpLocation(): string | undefined {
    return this.configService.get('OCR_GCP_LOCATION', { infer: true });
  }

  get ocrGcpProcessorId(): string | undefined {
    return this.configService.get('OCR_GCP_PROCESSOR_ID', { infer: true });
  }

  get ocrGcpBatchOutputPrefix(): string | undefined {
    return this.configService.get('OCR_GCP_BATCH_OUTPUT_PREFIX', { infer: true });
  }

  // Clause extraction (Phase 8)
  get clauseExtractor(): ClauseExtractorDriver {
    return this.configService.get('CLAUSE_EXTRACTOR', { infer: true });
  }

  get embeddingDriver(): EmbeddingDriver {
    return this.configService.get('EMBEDDING_DRIVER', { infer: true });
  }

  // AI
  get claudeApiKey(): string | undefined {
    return this.configService.get('CLAUDE_API_KEY', { infer: true });
  }

  get claudeModel(): string {
    return this.configService.get('CLAUDE_MODEL', { infer: true });
  }

  // Voyage embeddings (Phase 8, Task 8.5)
  get voyageApiKey(): string | undefined {
    return this.configService.get('VOYAGE_API_KEY', { infer: true });
  }

  get voyageModel(): string {
    return this.configService.get('VOYAGE_MODEL', { infer: true });
  }

  // MCP server (Phase 12) — static bearer guarding the tool endpoint.
  get mcpBearerToken(): string | undefined {
    return this.configService.get('MCP_BEARER_TOKEN', { infer: true });
  }

  // Queue
  get queueDriver(): QueueDriver {
    return this.configService.get('QUEUE_DRIVER', { infer: true });
  }

  // Logging
  get logLevel(): LogLevel {
    return this.configService.get('LOG_LEVEL', { infer: true });
  }

  // CORS
  get corsOrigin(): string {
    return this.configService.get('CORS_ORIGIN', { infer: true });
  }
}
