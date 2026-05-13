# TDD Approach

## Cycle Per Feature

```
1. Write failing domain test     → aggregate invariant or value object rule
2. Implement domain model        → make it pass
3. Write failing handler test    → command/query handler with mocked ports
4. Implement handler             → make it pass
5. Write failing integration test → real HTTP + DB via Supertest
6. Implement controller + repo   → make it pass
7. Refactor
```

## Test Layers

### Layer 1: Domain Unit Tests
Pure unit tests — zero framework dependencies, zero DB, milliseconds.

```typescript
describe('Document aggregate', () => {
  it('should reject files exceeding 50MB', () => {
    const result = DocumentFactory.create({ fileSizeBytes: 52_428_801 })
    expect(result.isFailure).toBe(true)
    expect(result.error).toBeInstanceOf(FileSizeLimitExceededException)
  })

  it('should emit DocumentUploadedEvent on creation', () => {
    const result = DocumentFactory.create({ fileName: 'agreement.pdf' })
    expect(result.isSuccess).toBe(true)
    expect(result.value.pullEvents()).toContainEqual(expect.any(DocumentUploadedEvent))
  })
})
```

### Layer 2: Application Unit Tests (mocked ports)
```typescript
describe('UploadDocumentHandler', () => {
  it('should save document and publish DocumentUploadedEvent', async () => {
    const repo = mock<DocumentRepository>()
    const eventBus = mock<EventBus>()
    const storage = mock<StorageService>()
    const handler = new UploadDocumentHandler(repo, eventBus, storage)

    await handler.execute(new UploadDocumentCommand({ ... }))

    expect(repo.save).toHaveBeenCalledOnce()
    expect(eventBus.publishAll).toHaveBeenCalledWith(
      expect.arrayContaining([expect.any(DocumentUploadedEvent)])
    )
  })
})
```

### Layer 3: Integration Tests
```typescript
describe('POST /api/v1/documents', () => {
  it('should return 201 with documentId', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/documents')
      .set('Authorization', `Bearer ${testToken}`)
      .attach('file', testPdfPath)
      .expect(201)

    expect(response.body.success).toBe(true)
    expect(response.body.data.documentId).toBeDefined()
  })
})
```

## Tooling

| Tool | Purpose |
|---|---|
| Jest | Test runner |
| Supertest | HTTP integration tests |
| `@faker-js/faker` | Realistic test data |
| `vitest-mock-extended` | Type-safe interface mocking |
| Test factories | One per aggregate, sensible defaults |

## Test Factories

```typescript
// __tests__/factories/document.factory.ts
export const buildDocument = (overrides?: Partial<CreateDocumentProps>): Document =>
  DocumentFactory.create({
    fileName: 'test-agreement.pdf',
    fileSizeBytes: 1_024_000,
    mimeType: 'application/pdf',
    uploadedBy: 'user-123',
    ...overrides,
  }).value
```

## Test Database

- Integration tests use SQLite in-memory via Prisma
- Each suite runs migrations fresh, tears down after
- No shared state between suites

## CI Pipeline

- Lint + unit + integration tests on every commit
- Coverage thresholds: domain ≥ 90%, application ≥ 80%
