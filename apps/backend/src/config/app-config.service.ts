import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
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

  // AI
  get claudeApiKey(): string | undefined {
    return this.configService.get('CLAUDE_API_KEY', { infer: true });
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
