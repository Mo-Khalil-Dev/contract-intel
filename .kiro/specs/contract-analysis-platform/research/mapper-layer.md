# Mapper Layer

Translates between three representations. Protects the domain model from persistence and API concerns.

## Three Representations

```
Persistence (Prisma) ←→ Domain (Aggregate) ←→ DTO (API Response)
```

## Mapper Interface

```typescript
// src/shared/mapper.ts
export interface Mapper<Domain, Persistence, Response> {
  toDomain(persistence: Persistence): Domain
  toPersistence(domain: Domain): Persistence
  toResponse(domain: Domain): Response
}
```

## Example: DocumentMapper

```typescript
// src/modules/documents/infrastructure/document.mapper.ts
export class DocumentMapper implements Mapper<Document, PrismaDocument, DocumentResponseDto> {

  toDomain(record: PrismaDocument): Document {
    return Document.reconstitute({
      id: DocumentId.from(record.id),
      fileName: FileName.from(record.fileName),
      status: DocumentStatus.from(record.status),
      storageKey: record.storageKey,
      fileSizeBytes: record.fileSizeBytes,
      uploadedBy: record.uploadedBy,
      createdAt: record.createdAt,
    })
  }

  toPersistence(domain: Document): Omit<PrismaDocument, 'createdAt' | 'updatedAt'> {
    return {
      id: domain.id.value,
      fileName: domain.fileName.value,
      status: domain.status.value,
      storageKey: domain.storageKey,
      fileSizeBytes: domain.fileSizeBytes,
      uploadedBy: domain.uploadedBy,
    }
  }

  toResponse(domain: Document): DocumentResponseDto {
    return {
      id: domain.id.value,
      fileName: domain.fileName.value,
      status: domain.status.value,
      fileSizeBytes: domain.fileSizeBytes,
      uploadedBy: domain.uploadedBy,
      createdAt: domain.createdAt.toISOString(),
    }
  }
}
```

## Usage

**Repository (Persistence ↔ Domain):**
```typescript
async findById(id: DocumentId): Promise<Document | null> {
  const record = await this.prisma.document.findUnique({ where: { id: id.value } })
  return record ? this.mapper.toDomain(record) : null
}

async save(document: Document): Promise<void> {
  const data = this.mapper.toPersistence(document)
  await this.prisma.document.upsert({ where: { id: data.id }, create: data, update: data })
}
```

**Query handler (Domain → DTO):**
```typescript
async execute(query: GetDocumentQuery): Promise<DocumentResponseDto> {
  const document = await this.repo.findById(DocumentId.from(query.id))
  if (!document) throw new DocumentNotFoundException(query.id)
  return this.mapper.toResponse(document)
}
```

## Rules

- Domain models never import Prisma types
- Controllers never receive domain aggregates — only DTOs
- Repositories never return Prisma records — only domain aggregates
- Mappers are stateless — pure functions, easily unit tested
