import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Min,
  MinLength,
  validateSync,
} from 'class-validator';

export enum NodeEnv {
  Development = 'development',
  Test = 'test',
  Production = 'production',
}

export enum StorageDriver {
  Local = 'local',
  Gcs = 'gcs',
}

export enum OcrDriver {
  Mock = 'mock',
  GoogleDocumentAi = 'google-document-ai',
}

export enum ClauseExtractorDriver {
  Mock = 'mock',
  Anthropic = 'anthropic',
}

export enum EmbeddingDriver {
  Mock = 'mock',
  Voyage = 'voyage',
}

export enum QueueDriver {
  Memory = 'memory',
  PgBoss = 'pg-boss',
  Bullmq = 'bullmq',
}

export enum LogLevel {
  Trace = 'trace',
  Debug = 'debug',
  Info = 'info',
  Warn = 'warn',
  Error = 'error',
  Fatal = 'fatal',
}

export class EnvironmentVariables {
  // Server
  @IsEnum(NodeEnv)
  NODE_ENV: NodeEnv = NodeEnv.Development;

  @IsInt()
  @Min(1)
  @Max(65535)
  PORT: number = 3000;

  @IsString()
  API_PREFIX: string = 'api/v1';

  @IsString()
  @MinLength(32, { message: 'SESSION_SECRET must be at least 32 characters' })
  SESSION_SECRET!: string;

  // Database (Prisma)
  @IsString()
  DATABASE_URL: string = 'file:./dev.db';

  // Encryption (AES-256-CBC + PBKDF2 — used by SessionEncryptionService)
  @IsString()
  @MinLength(32, { message: 'ENCRYPTION_KEY must be at least 32 characters' })
  ENCRYPTION_KEY!: string;

  @IsString()
  ENCRYPTION_KEY_NAME: string = 'primary';

  // Auth0
  @IsString()
  @IsOptional()
  AUTH0_DOMAIN?: string;

  @IsString()
  @IsOptional()
  AUTH0_CLIENT_ID?: string;

  @IsString()
  @IsOptional()
  AUTH0_CLIENT_SECRET?: string;

  @IsUrl({ require_tld: false })
  @IsOptional()
  AUTH0_CALLBACK_URL?: string;

  // Frontend
  @IsUrl({ require_tld: false })
  FRONTEND_URL: string = 'http://localhost:5173';

  // Storage
  @IsEnum(StorageDriver)
  STORAGE_DRIVER: StorageDriver = StorageDriver.Local;

  @IsString()
  LOCAL_STORAGE_PATH: string = './uploads';

  // GCS — only required when STORAGE_DRIVER=gcs. Validation that they're
  // present is enforced at boot time by AppConfigService (see warnGcsIfNeeded).
  @IsString()
  @IsOptional()
  GCS_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  GCS_BUCKET_NAME?: string;

  /**
   * Either a base64-encoded service account JSON (preferred for env-var
   * deployment to Railway/Cloud) or a filesystem path to the JSON key.
   * If unset, the GCS SDK falls back to Application Default Credentials
   * (gcloud auth on dev machines).
   */
  @IsString()
  @IsOptional()
  GCS_SERVICE_ACCOUNT_KEY?: string;

  // OCR
  @IsEnum(OcrDriver)
  OCR_DRIVER: OcrDriver = OcrDriver.Mock;

  // Pipeline guards — values from ocr-design.md §6 + §11 locked decisions.
  @IsInt()
  @Min(1)
  OCR_PAGE_LIMIT: number = 200;

  /** Per-page native textQualityScore below which we demote to cloud OCR. */
  OCR_TEXT_QUALITY_THRESHOLD: number = 0.5;

  /** Gap (top vs second franc score) above which we trust a language verdict. */
  OCR_LANGUAGE_CONFIDENCE_THRESHOLD: number = 0.1;

  // Document AI — required when OCR_DRIVER=google-document-ai.
  @IsString()
  @IsOptional()
  OCR_GCP_PROJECT_ID?: string;

  @IsString()
  @IsOptional()
  OCR_GCP_LOCATION?: string;

  @IsString()
  @IsOptional()
  OCR_GCP_PROCESSOR_ID?: string;

  /** Bucket prefix where the batch API writes per-shard JSON results. */
  @IsString()
  @IsOptional()
  OCR_GCP_BATCH_OUTPUT_PREFIX?: string;

  // Clause extraction (Phase 8) — driver chosen at boot. `mock` for tests
  // and local dev; `anthropic` swaps in the real Claude driver (Task 8.4).
  @IsEnum(ClauseExtractorDriver)
  CLAUSE_EXTRACTOR: ClauseExtractorDriver = ClauseExtractorDriver.Mock;

  // Embedding driver (Phase 8). `mock` produces deterministic hash-based
  // vectors; `voyage` swaps in voyage-law-2 (Task 8.5). Vector dim is
  // locked at 1024 in the schema — switching providers requires migration.
  @IsEnum(EmbeddingDriver)
  EMBEDDING_DRIVER: EmbeddingDriver = EmbeddingDriver.Mock;

  // AI
  @IsString()
  @IsOptional()
  CLAUDE_API_KEY?: string;

  /**
   * Claude model id used by the clause extractor (Phase 8, Task 8.4).
   * Defaults to claude-opus-4-7 — the design baseline. Switching to
   * Sonnet for cost reduction is a one-env-flip operation.
   */
  @IsString()
  CLAUDE_MODEL: string = 'claude-opus-4-7';

  // Queue
  @IsEnum(QueueDriver)
  QUEUE_DRIVER: QueueDriver = QueueDriver.Memory;

  // Logging
  @IsEnum(LogLevel)
  LOG_LEVEL: LogLevel = LogLevel.Debug;

  // CORS
  @IsUrl({ require_tld: false })
  CORS_ORIGIN: string = 'http://localhost:5173';
}

export function validateEnvironment(config: Record<string, unknown>): EnvironmentVariables {
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const errorMessages = errors
      .map((error) => {
        const constraints = error.constraints
          ? Object.values(error.constraints).join(', ')
          : 'unknown error';
        return `  - ${error.property}: ${constraints}`;
      })
      .join('\n');

    throw new Error(`Environment validation failed:\n${errorMessages}`);
  }

  if (validatedConfig.NODE_ENV === NodeEnv.Production) {
    const requiredInProduction: Array<keyof EnvironmentVariables> = [
      'AUTH0_DOMAIN',
      'AUTH0_CLIENT_ID',
      'AUTH0_CLIENT_SECRET',
      'AUTH0_CALLBACK_URL',
      'CLAUDE_API_KEY',
    ];

    const missing = requiredInProduction.filter((key) => !validatedConfig[key]);

    if (missing.length > 0) {
      throw new Error(`Missing required production environment variables: ${missing.join(', ')}`);
    }
  }

  return validatedConfig;
}
