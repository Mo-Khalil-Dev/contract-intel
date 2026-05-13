# Infrastructure Ports & Adapters

The application layer depends only on port interfaces. Concrete adapters are wired at startup via environment config.

## Port Interfaces

### StorageService

```typescript
interface StorageService {
  upload(key: string, buffer: Buffer, mimeType: string): Promise<string>;
  download(key: string): Promise<Buffer>;
  getSignedUrl(key: string, expiresInSeconds: number): Promise<string>;
  delete(key: string): Promise<void>;
}
```

| `STORAGE_DRIVER` | Adapter               | Environment   |
| ---------------- | --------------------- | ------------- |
| `gcs`            | `GCSStorageAdapter`   | GCP + Railway |
| `local`          | `LocalStorageAdapter` | Local dev     |

### OCRService

```typescript
interface OCRService {
  extractText(buffer: Buffer, mimeType: string): Promise<OCRResult>;
}
interface OCRResult {
  pages: OCRPage[];
  confidence: number;
}
interface OCRPage {
  pageNumber: number;
  text: string;
}
```

| `OCR_DRIVER`         | Adapter                      | Environment   |
| -------------------- | ---------------------------- | ------------- |
| `google-document-ai` | `GoogleDocumentAIOCRAdapter` | GCP + Railway |
| `mock`               | `MockOCRAdapter`             | Local dev     |

### SecretsService

```typescript
interface SecretsService {
  getSecret(name: string): Promise<string>;
}
```

| `SECRETS_DRIVER`     | Adapter                   | Environment         |
| -------------------- | ------------------------- | ------------------- |
| `gcp-secret-manager` | `GCPSecretManagerAdapter` | GCP production      |
| `env`                | `EnvSecretsAdapter`       | Local dev + Railway |

### QueueService

```typescript
interface QueueService {
  enqueue(jobName: string, payload: unknown): Promise<void>;
  process(jobName: string, handler: JobHandler): void;
}
```

| `QUEUE_DRIVER` | Adapter              | Environment    |
| -------------- | -------------------- | -------------- |
| `memory`       | `MemoryQueueAdapter` | Local dev      |
| `pg-boss`      | `PgBossQueueAdapter` | Railway demo   |
| `bullmq`       | `BullMQQueueAdapter` | GCP production |

### LoggerService

```typescript
interface LoggerService {
  debug(message: string, context?: LogContext): void;
  info(message: string, context?: LogContext): void;
  warn(message: string, context?: LogContext): void;
  error(message: string, error?: Error, context?: LogContext): void;
}
interface LogContext {
  requestId?: string;
  userId?: string;
  [key: string]: unknown;
}
```

| `LOGGER_DRIVER` | Adapter                | Environment             |
| --------------- | ---------------------- | ----------------------- |
| `console`       | `ConsoleLoggerAdapter` | Local dev (pino-pretty) |
| `pino`          | `PinoLoggerAdapter`    | Railway + GCP           |

---

## Environment Matrix

| Concern  | Local Dev        | Railway (Demo)       | GCP (Production)        |
| -------- | ---------------- | -------------------- | ----------------------- |
| Database | SQLite           | PostgreSQL (Railway) | Cloud SQL (PostgreSQL)  |
| Storage  | Local filesystem | GCS bucket           | GCS bucket              |
| OCR      | Mock adapter     | Google Document AI   | Google Document AI      |
| Queue    | In-memory        | pg-boss              | BullMQ + Memorystore    |
| Secrets  | `.env` file      | Railway env vars     | GCP Secret Manager      |
| Logging  | pino-pretty      | JSON logs            | JSON → Cloud Logging    |
| Auth     | Auth0 dev tenant | Auth0 dev tenant     | Auth0 production tenant |

---

## Adapter Wiring (NestJS DI)

```typescript
// src/shared/infrastructure/infrastructure.module.ts
@Module({})
export class InfrastructureModule {
  static forRoot(): DynamicModule {
    return {
      module: InfrastructureModule,
      providers: [
        {
          provide: STORAGE_SERVICE,
          useClass: process.env.STORAGE_DRIVER === 'gcs' ? GCSStorageAdapter : LocalStorageAdapter,
        },
        {
          provide: OCR_SERVICE,
          useClass:
            process.env.OCR_DRIVER === 'google-document-ai'
              ? GoogleDocumentAIOCRAdapter
              : MockOCRAdapter,
        },
        {
          provide: QUEUE_SERVICE,
          useClass:
            process.env.QUEUE_DRIVER === 'bullmq'
              ? BullMQQueueAdapter
              : process.env.QUEUE_DRIVER === 'pg-boss'
                ? PgBossQueueAdapter
                : MemoryQueueAdapter,
        },
        {
          provide: SECRETS_SERVICE,
          useClass:
            process.env.SECRETS_DRIVER === 'gcp-secret-manager'
              ? GCPSecretManagerAdapter
              : EnvSecretsAdapter,
        },
        {
          provide: LOGGER_SERVICE,
          useClass: process.env.LOGGER_DRIVER === 'pino' ? PinoLoggerAdapter : ConsoleLoggerAdapter,
        },
      ],
      exports: [STORAGE_SERVICE, OCR_SERVICE, QUEUE_SERVICE, SECRETS_SERVICE, LOGGER_SERVICE],
    };
  }
}
```
