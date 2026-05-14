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

  // AI
  @IsString()
  @IsOptional()
  CLAUDE_API_KEY?: string;

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
