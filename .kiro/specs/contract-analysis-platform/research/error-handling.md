# Error Handling

## Exception Hierarchy

All exceptions extend a common `AppError` base class.

```typescript
// src/shared/exceptions/app.error.ts
export abstract class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = this.constructor.name;
  }
}

// Domain Layer — business rule violations
export abstract class DomainException extends AppError {}
export class FileSizeLimitExceededException extends DomainException {
  constructor(sizeBytes: number) {
    super(`File size ${sizeBytes} exceeds 50MB limit`, 'FILE_SIZE_EXCEEDED', 422);
  }
}
export class InvalidStatusTransitionException extends DomainException {
  constructor(from: string, to: string) {
    super(`Cannot transition from ${from} to ${to}`, 'INVALID_STATUS_TRANSITION', 409);
  }
}
export class ClauseTextEmptyException extends DomainException {
  constructor() {
    super('Clause text must not be empty', 'CLAUSE_TEXT_EMPTY', 422);
  }
}

// Application Layer — use case / orchestration failures
export abstract class ApplicationException extends AppError {}
export class DocumentNotFoundException extends ApplicationException {
  constructor(id: string) {
    super(`Document ${id} not found`, 'DOCUMENT_NOT_FOUND', 404);
  }
}
export class EngagementNotFoundException extends ApplicationException {
  constructor(id: string) {
    super(`Engagement ${id} not found`, 'ENGAGEMENT_NOT_FOUND', 404);
  }
}
export class UnauthorizedOperationException extends ApplicationException {
  constructor() {
    super('You are not authorized to perform this operation', 'UNAUTHORIZED_OPERATION', 403);
  }
}
export class DocumentAlreadyProcessingException extends ApplicationException {
  constructor(id: string) {
    super(`Document ${id} is already being processed`, 'DOCUMENT_ALREADY_PROCESSING', 409);
  }
}
export class ExternalServiceUnavailableException extends ApplicationException {
  constructor(service: string) {
    super(`${service} is currently unavailable`, 'EXTERNAL_SERVICE_UNAVAILABLE', 503);
  }
}

// Infrastructure Layer — unexpected technical failures
export abstract class InfrastructureException extends AppError {}
export class DatabaseException extends InfrastructureException {
  constructor(message: string) {
    super(message, 'DATABASE_ERROR', 500);
  }
}
export class StorageException extends InfrastructureException {
  constructor(message: string) {
    super(message, 'STORAGE_ERROR', 500);
  }
}
```

---

## HTTP Status Code Conventions

| Status                      | When to use                                    |
| --------------------------- | ---------------------------------------------- |
| `200 OK`                    | Successful GET, PATCH returning resource       |
| `201 Created`               | Successful POST that creates a resource        |
| `204 No Content`            | Successful DELETE or PATCH returning nothing   |
| `400 Bad Request`           | Malformed request syntax                       |
| `401 Unauthorized`          | Not authenticated (no/invalid session)         |
| `403 Forbidden`             | Authenticated but not allowed                  |
| `404 Not Found`             | Resource does not exist                        |
| `409 Conflict`              | State conflict (duplicate, invalid transition) |
| `422 Unprocessable`         | Validation failed, business rule violated      |
| `429 Too Many Requests`     | Rate limit exceeded                            |
| `500 Internal Server Error` | Unexpected error                               |
| `503 Service Unavailable`   | External dependency down                       |

Key: `401` = unauthenticated, `403` = unauthorized, `409` = conflict, `422` = validation/business rule.

---

## Result Pattern

Used in the domain layer for expected business failures.

```typescript
// src/shared/result.ts
export class Result<T, E extends AppError = DomainException> {
  private constructor(
    private readonly _isSuccess: boolean,
    private readonly _value?: T,
    private readonly _error?: E,
  ) {}

  static ok<T>(value: T): Result<T, never> {
    return new Result(true, value);
  }
  static fail<E extends AppError>(error: E): Result<never, E> {
    return new Result(false, undefined, error);
  }

  get isSuccess(): boolean {
    return this._isSuccess;
  }
  get isFailure(): boolean {
    return !this._isSuccess;
  }
  get value(): T {
    if (!this._isSuccess) throw new Error('Cannot get value of failed result');
    return this._value!;
  }
  get error(): E {
    if (this._isSuccess) throw new Error('Cannot get error of successful result');
    return this._error!;
  }
}
```

**Domain aggregate usage:**

```typescript
static create(props: CreateDocumentProps): Result<Document> {
  if (props.fileSizeBytes > 50_000_000)
    return Result.fail(new FileSizeLimitExceededException(props.fileSizeBytes))
  return Result.ok(new Document(props))
}

// Application boundary — convert to exception
const result = Document.create(props)
if (result.isFailure) throw result.error
const document = result.value
```

---

## Repository Convention

```typescript
interface DocumentRepository {
  findById(id: DocumentId): Promise<Document | null>; // null = not found
  findByEngagementId(id: EngagementId): Promise<Document[]>;
  save(document: Document): Promise<void>; // throws InfrastructureException
  delete(id: DocumentId): Promise<void>; // throws InfrastructureException
}

// Application layer converts null → exception
const document = await this.repo.findById(DocumentId.from(command.id));
if (!document) throw new DocumentNotFoundException(command.id);
```

---

## Global Exception Filter

```typescript
@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost): void {
    const { status, code, message } = this.resolve(exception);

    // Full details logged server-side only
    this.logger.error(`Exception: ${message}`, exception instanceof Error ? exception : undefined, {
      requestId,
      userId,
      code,
      status,
    });

    // Safe response — no stack traces
    response.status(status).json({
      success: false,
      error: {
        type: `https://api.contractintel.io/errors/${code.toLowerCase().replace(/_/g, '-')}`,
        title: this.toTitle(code),
        status,
        detail: message,
        correlationId: requestId,
        errors: [],
      },
    });
  }

  private resolve(exception: unknown) {
    if (exception instanceof AppError)
      return { status: exception.httpStatus, code: exception.code, message: exception.message };
    if (exception instanceof HttpException)
      return { status: exception.getStatus(), code: 'HTTP_ERROR', message: exception.message };
    return { status: 500, code: 'INTERNAL_SERVER_ERROR', message: 'An unexpected error occurred' };
  }
}
```
