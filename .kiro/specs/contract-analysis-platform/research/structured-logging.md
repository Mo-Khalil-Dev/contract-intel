# Structured Logging Research

## Overview

The platform uses **pino** for structured JSON logging with **nestjs-pino** integration. Logs are written to stdout in JSON format and ingested by GCP Cloud Logging in production. Request IDs propagate through the entire request lifecycle for distributed tracing.

---

## Core Principles

- **Structured JSON** — every log is a JSON object with consistent fields
- **Request ID propagation** — every log tied to a request includes `requestId`
- **No PII in logs** — user IDs and document IDs only, never names or content
- **Log levels** — trace, debug, info, warn, error, fatal
- **Context enrichment** — automatic injection of tenantId, userId, correlationId
- **Performance** — pino is the fastest Node.js logger (benchmarked)

---

## Pino Configuration

### Local Development

```typescript
// src/config/logger.config.ts
import { Params } from 'nestjs-pino';

export const getLoggerConfig = (env: string): Params => {
  const isDev = env === 'local';

  return {
    pinoHttp: {
      level: isDev ? 'debug' : 'info',

      // Pretty print in local dev, JSON in production
      transport: isDev
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'HH:MM:ss.l',
              ignore: 'pid,hostname',
              singleLine: false,
            },
          }
        : undefined,

      // Custom request ID generator
      genReqId: (req) => req.headers['x-request-id'] || crypto.randomUUID(),

      // Redact sensitive fields
      redact: {
        paths: [
          'req.headers.authorization',
          'req.headers.cookie',
          'req.body.password',
          'req.body.token',
          'res.headers["set-cookie"]',
        ],
        censor: '[REDACTED]',
      },

      // Custom serializers
      serializers: {
        req: (req) => ({
          id: req.id,
          method: req.method,
          url: req.url,
          query: req.query,
          params: req.params,
          // Do NOT log req.body by default (may contain PII)
        }),
        res: (res) => ({
          statusCode: res.statusCode,
        }),
        err: (err) => ({
          type: err.type || err.constructor.name,
          message: err.message,
          stack: err.stack,
          code: err.code,
          statusCode: err.statusCode,
        }),
      },

      // Auto-log all HTTP requests
      autoLogging: {
        ignore: (req) => req.url === '/health' || req.url === '/metrics',
      },

      // Custom log level based on response status
      customLogLevel: (req, res, err) => {
        if (res.statusCode >= 500 || err) return 'error';
        if (res.statusCode >= 400) return 'warn';
        if (res.statusCode >= 300) return 'info';
        return 'info';
      },

      // Custom success message
      customSuccessMessage: (req, res) => {
        return `${req.method} ${req.url} ${res.statusCode}`;
      },

      // Custom error message
      customErrorMessage: (req, res, err) => {
        return `${req.method} ${req.url} ${res.statusCode} - ${err.message}`;
      },
    },
  };
};
```

### Production (GCP Cloud Logging)

```typescript
// GCP Cloud Logging expects specific fields for proper indexing
export const getLoggerConfig = (env: string): Params => {
  const isProduction = env === 'production';

  return {
    pinoHttp: {
      level: 'info',

      // GCP-specific field mappings
      formatters: {
        level: (label) => ({ severity: label.toUpperCase() }),
        log: (object) => {
          const { req, res, err, ...rest } = object;

          return {
            ...rest,
            // GCP Cloud Logging fields
            'logging.googleapis.com/trace': object.requestId,
            'logging.googleapis.com/spanId': object.spanId,
            httpRequest: req
              ? {
                  requestMethod: req.method,
                  requestUrl: req.url,
                  status: res?.statusCode,
                  userAgent: req.headers['user-agent'],
                  remoteIp: req.headers['x-forwarded-for'] || req.socket?.remoteAddress,
                  latency: object.responseTime ? `${object.responseTime}ms` : undefined,
                }
              : undefined,
          };
        },
      },

      // Same redaction, serializers, etc. as above
      redact: {
        /* ... */
      },
      serializers: {
        /* ... */
      },
    },
  };
};
```

---

## Request ID Propagation

### HTTP Middleware

```typescript
// src/common/middleware/request-context.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  requestId: string;
  userId?: string;
  tenantId?: string;
  startTime: number;
}

export const requestContextStorage = new AsyncLocalStorage<RequestContext>();

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const requestId = req.id || crypto.randomUUID();
    const context: RequestContext = {
      requestId,
      startTime: Date.now(),
    };

    // Store in AsyncLocalStorage for access anywhere in the call stack
    requestContextStorage.run(context, () => {
      // Attach to request for easy access
      req.requestId = requestId;

      // Set response header for client-side correlation
      res.setHeader('X-Request-ID', requestId);

      next();
    });
  }
}
```

### Logger Service Wrapper

```typescript
// src/common/logging/logger.service.ts
import { Injectable, Inject } from '@nestjs/common';
import { Logger } from 'nestjs-pino';
import { requestContextStorage } from '../middleware/request-context.middleware';

@Injectable()
export class AppLogger {
  constructor(@Inject(Logger) private readonly logger: Logger) {}

  private enrichContext(context?: Record<string, any>) {
    const requestContext = requestContextStorage.getStore();

    return {
      ...context,
      requestId: requestContext?.requestId,
      userId: requestContext?.userId,
      tenantId: requestContext?.tenantId,
    };
  }

  debug(message: string, context?: Record<string, any>) {
    this.logger.debug(this.enrichContext(context), message);
  }

  info(message: string, context?: Record<string, any>) {
    this.logger.info(this.enrichContext(context), message);
  }

  warn(message: string, context?: Record<string, any>) {
    this.logger.warn(this.enrichContext(context), message);
  }

  error(message: string, error?: Error, context?: Record<string, any>) {
    this.logger.error(this.enrichContext({ ...context, err: error }), message);
  }

  fatal(message: string, error?: Error, context?: Record<string, any>) {
    this.logger.fatal(this.enrichContext({ ...context, err: error }), message);
  }
}
```

### Usage in Application Code

```typescript
// Command handler example
@CommandHandler(UploadDocumentCommand)
export class UploadDocumentHandler {
  constructor(private readonly logger: AppLogger) {}

  async execute(command: UploadDocumentCommand): Promise<Result<DocumentId>> {
    this.logger.info('Starting document upload', {
      fileName: command.fileName,
      fileSize: command.fileSizeBytes,
      engagementId: command.engagementId,
    });

    try {
      // ... business logic ...

      this.logger.info('Document uploaded successfully', {
        documentId: document.id.value,
        storageKey: document.storageKey.value,
      });

      return Result.ok(document.id);
    } catch (error) {
      this.logger.error('Document upload failed', error, {
        fileName: command.fileName,
      });

      return Result.fail(error.message);
    }
  }
}
```

---

## Log Fields Reference

### Standard Fields (Every Log)

```json
{
  "level": 30,
  "time": 1704067200000,
  "pid": 12345,
  "hostname": "api-abc123",
  "requestId": "req-550e8400-e29b-41d4-a716-446655440000",
  "msg": "Document uploaded successfully"
}
```

### HTTP Request Logs

```json
{
  "level": 30,
  "time": 1704067200000,
  "requestId": "req-550e8400-e29b-41d4-a716-446655440000",
  "req": {
    "id": "req-550e8400-e29b-41d4-a716-446655440000",
    "method": "POST",
    "url": "/api/v1/documents",
    "query": {},
    "params": {}
  },
  "res": {
    "statusCode": 201
  },
  "responseTime": 245,
  "msg": "POST /api/v1/documents 201"
}
```

### Application Logs with Context

```json
{
  "level": 30,
  "time": 1704067200000,
  "requestId": "req-550e8400-e29b-41d4-a716-446655440000",
  "userId": "auth0|abc123",
  "tenantId": "tenant-xyz",
  "documentId": "doc-123",
  "fileName": "contract.pdf",
  "fileSize": 2048576,
  "msg": "Document uploaded successfully"
}
```

### Error Logs

```json
{
  "level": 50,
  "time": 1704067200000,
  "requestId": "req-550e8400-e29b-41d4-a716-446655440000",
  "userId": "auth0|abc123",
  "err": {
    "type": "DocumentTooLargeException",
    "message": "File size exceeds 50MB limit",
    "stack": "DocumentTooLargeException: File size exceeds 50MB limit\n    at ...",
    "code": "DOCUMENT_TOO_LARGE",
    "statusCode": 422
  },
  "fileName": "huge-contract.pdf",
  "fileSize": 104857600,
  "msg": "Document upload failed"
}
```

---

## GCP Cloud Logging Integration

### Automatic Ingestion

Cloud Run automatically sends stdout/stderr to Cloud Logging. No additional configuration needed.

### Log-Based Metrics

Create metrics from log patterns:

```
# Count 5xx errors
resource.type="cloud_run_revision"
severity>=ERROR
jsonPayload.res.statusCode>=500

# Track document processing time
resource.type="cloud_run_revision"
jsonPayload.msg="Document processing completed"
jsonPayload.processingTimeMs
```

### Log-Based Alerts

```
# Alert on high error rate
resource.type="cloud_run_revision"
severity=ERROR
jsonPayload.err.type!="ValidationException"

Condition: Count > 10 in 5 minutes
```

### Querying Logs

```
# Find all logs for a specific request
resource.type="cloud_run_revision"
jsonPayload.requestId="req-550e8400-e29b-41d4-a716-446655440000"

# Find all document upload failures
resource.type="cloud_run_revision"
jsonPayload.msg:"Document upload failed"

# Find slow requests
resource.type="cloud_run_revision"
jsonPayload.responseTime>1000
```

---

## Log Retention

| Environment                 | Retention         | Storage              |
| --------------------------- | ----------------- | -------------------- |
| Local dev                   | Not persisted     | stdout only          |
| Railway demo                | 7 days            | Railway logs         |
| GCP production              | 30 days (default) | Cloud Logging        |
| GCP production (audit logs) | 7 years           | Cloud Storage bucket |

Audit logs are exported to a separate Cloud Storage bucket with lifecycle policies for long-term retention.

---

## Performance Considerations

- **Pino is fast** — 10x faster than Winston, minimal overhead
- **Async logging** — logs are written asynchronously, never block request processing
- **Sampling** — in high-traffic scenarios, sample debug logs (not implemented in phase 1)
- **Redaction** — redact sensitive fields at log time, not at query time
- **Structured data** — avoid string concatenation, use structured fields for efficient querying

---

## Testing

### Unit Tests

```typescript
describe('AppLogger', () => {
  let logger: AppLogger;
  let pinoLogger: jest.Mocked<Logger>;

  beforeEach(() => {
    pinoLogger = {
      info: jest.fn(),
      error: jest.fn(),
    } as any;

    logger = new AppLogger(pinoLogger);
  });

  it('should enrich logs with request context', () => {
    const context = { requestId: 'req-123', userId: 'user-456' };

    requestContextStorage.run(context, () => {
      logger.info('Test message', { customField: 'value' });

      expect(pinoLogger.info).toHaveBeenCalledWith(
        {
          requestId: 'req-123',
          userId: 'user-456',
          customField: 'value',
        },
        'Test message',
      );
    });
  });
});
```

### Integration Tests

```typescript
describe('Request ID propagation', () => {
  it('should propagate request ID through entire request lifecycle', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .attach('file', 'test.pdf')
      .expect(201);

    const requestId = response.headers['x-request-id'];
    expect(requestId).toBeDefined();

    // Verify all logs for this request include the same requestId
    const logs = await getLogsForRequest(requestId);
    expect(logs.every((log) => log.requestId === requestId)).toBe(true);
  });
});
```

---

## Best Practices

1. **Use structured fields** — `logger.info('User logged in', { userId })` not `logger.info(\`User \${userId} logged in\`)`
2. **Log at boundaries** — log at entry/exit of commands, queries, external API calls
3. **Don't log PII** — user IDs yes, names/emails no
4. **Use appropriate levels** — debug for dev, info for business events, warn for recoverable errors, error for failures
5. **Include context** — always include relevant IDs (documentId, engagementId, userId)
6. **Log errors with stack traces** — `logger.error('Failed', error)` not `logger.error(error.message)`
7. **Avoid logging in loops** — aggregate and log summary instead
8. **Use correlation IDs** — propagate requestId to external API calls for distributed tracing

---

## Example: Full Request Lifecycle Logs

```json
// 1. Request received
{"level":30,"requestId":"req-abc","msg":"POST /api/v1/documents"}

// 2. Command handler started
{"level":30,"requestId":"req-abc","userId":"user-123","msg":"Starting document upload","fileName":"contract.pdf"}

// 3. External API call
{"level":30,"requestId":"req-abc","msg":"Uploading to Cloud Storage","storageKey":"docs/abc.pdf"}

// 4. Domain event published
{"level":30,"requestId":"req-abc","msg":"DocumentUploadedEvent published","documentId":"doc-456"}

// 5. Job enqueued
{"level":30,"requestId":"req-abc","msg":"Enqueued process-document job","jobId":"job-789"}

// 6. Response sent
{"level":30,"requestId":"req-abc","res":{"statusCode":201},"responseTime":245,"msg":"POST /api/v1/documents 201"}
```

All logs share the same `requestId`, enabling end-to-end tracing of the request.
