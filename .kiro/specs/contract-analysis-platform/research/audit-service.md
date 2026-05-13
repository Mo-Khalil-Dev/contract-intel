# Audit Service

## Overview

The audit service records every significant platform action to a tamper-evident, append-only log. It is a cross-cutting concern — every module depends on it. Records are stored indefinitely.

---

## Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Storage | PostgreSQL, same DB, INSERT-only role | No extra infrastructure, sufficient for phase 1 |
| Invocation pattern | Domain event handlers | Decoupled from business logic, consistent coverage |
| Token storage | Metadata as JSON | Flexible per-action context without schema changes |
| Sequence numbers | None | Multi-tenancy out of scope for phase 1 |
| Retention | Indefinite | Simplest approach; retention policies deferred |
| Tamper detection | SHA-256 checksum per record | Proves records haven't been modified after writing |

---

## Data Model

```prisma
model AuditEvent {
  id           String      @id @default(uuid())
  timestamp    DateTime    @default(now())
  actorId      String      // userId or "system" for automated actions
  actorIp      String?     // IPv4 or IPv6, null for background jobs
  actorAgent   String?     // User-Agent header, null for background jobs
  action       AuditAction
  resourceType String      // "document" | "clause" | "engagement" | "user" | "report"
  resourceId   String      // UUID of the affected resource
  metadata     Json?       // flexible per-action context (see examples below)
  checksum     String      // SHA-256(id + timestamp + actorId + action + resourceId)

  @@index([actorId])
  @@index([resourceId])
  @@index([action])
  @@index([timestamp])
}

enum AuditAction {
  USER_LOGIN
  USER_LOGOUT
  DOCUMENT_UPLOADED
  DOCUMENT_DELETED
  DOCUMENT_ACCESSED
  CLAUSES_EXTRACTED
  RISK_SCORED
  ANNOTATION_ADDED
  CLAUSE_REVIEWED
  ENGAGEMENT_CREATED
  ENGAGEMENT_CLOSED
  REPORT_EXPORTED
  USER_PERMISSION_CHANGED
}
```

### Metadata Examples Per Action

```typescript
// USER_LOGIN
{ ipAddress: "203.0.113.42", userAgent: "Mozilla/5.0...", method: "auth0" }

// DOCUMENT_UPLOADED
{ fileName: "acquisition-agreement.pdf", fileSizeBytes: 2048576, engagementId: "eng-uuid" }

// DOCUMENT_ACCESSED
{ engagementId: "eng-uuid", accessType: "view" }

// CLAUSES_EXTRACTED
{ clauseCount: 47, modelVersion: "claude-3-5-sonnet-20241022", durationMs: 3400 }

// RISK_SCORED
{ overallRiskScore: 78, riskLevel: "high", highRiskClauseCount: 5 }

// CLAUSE_REVIEWED
{ clauseType: "indemnification", previousStatus: "pending", newStatus: "flagged" }

// ANNOTATION_ADDED
{ clauseId: "clause-uuid", annotationType: "issue" }

// ENGAGEMENT_CREATED
{ engagementType: "ma_due_diligence", name: "Acme Acquisition" }

// ENGAGEMENT_CLOSED
{ documentCount: 23, totalClauses: 412, reviewProgress: 1.0 }

// REPORT_EXPORTED
{ format: "pdf", engagementId: "eng-uuid", clauseCount: 412 }

// USER_PERMISSION_CHANGED
{ previousRole: "reviewer", newRole: "lead_reviewer", changedBy: "admin-uuid" }
```

---

## Tamper Detection

Each audit event gets a SHA-256 checksum computed at write time:

```typescript
// src/modules/audit/domain/audit-event.factory.ts
import { createHash } from 'crypto'

export function computeChecksum(event: {
  id: string
  timestamp: Date
  actorId: string
  action: string
  resourceId: string
}): string {
  const payload = [
    event.id,
    event.timestamp.toISOString(),
    event.actorId,
    event.action,
    event.resourceId,
  ].join('|')

  return createHash('sha256').update(payload).digest('hex')
}
```

**Verification** — a scheduled job (or on-demand) recomputes checksums and flags mismatches:

```typescript
// src/modules/audit/application/verify-audit-integrity.usecase.ts
export class VerifyAuditIntegrityUseCase {
  async execute(): Promise<IntegrityReport> {
    const events = await this.auditRepo.findAll()
    const tampered: string[] = []

    for (const event of events) {
      const expected = computeChecksum(event)
      if (expected !== event.checksum) {
        tampered.push(event.id)
        this.logger.error('Audit event tampered', undefined, {
          eventId: event.id,
          action: event.action,
          actorId: event.actorId,
        })
      }
    }

    return { total: events.length, tampered }
  }
}
```

---

## Invocation Pattern: Domain Event Handlers

Audit logging is a side effect of domain events — not called directly from command handlers. This keeps business logic clean and ensures consistent coverage.

```typescript
// src/modules/audit/application/events/

// document-uploaded.audit.handler.ts
@EventsHandler(DocumentUploadedEvent)
export class AuditDocumentUploadedHandler {
  constructor(private readonly auditService: AuditService) {}

  async handle(event: DocumentUploadedEvent): Promise<void> {
    await this.auditService.log({
      actorId: event.uploadedBy,
      action: AuditAction.DOCUMENT_UPLOADED,
      resourceType: 'document',
      resourceId: event.documentId,
      metadata: {
        fileName: event.fileName,
        fileSizeBytes: event.fileSizeBytes,
        engagementId: event.engagementId,
      },
    })
  }
}

// user-login.audit.handler.ts
@EventsHandler(UserLoggedInEvent)
export class AuditUserLoginHandler {
  constructor(private readonly auditService: AuditService) {}

  async handle(event: UserLoggedInEvent): Promise<void> {
    await this.auditService.log({
      actorId: event.userId,
      actorIp: event.ipAddress,
      actorAgent: event.userAgent,
      action: AuditAction.USER_LOGIN,
      resourceType: 'user',
      resourceId: event.userId,
      metadata: { method: 'auth0' },
    })
  }
}
```

---

## AuditService Interface

```typescript
// src/modules/audit/domain/audit.service.ts
export interface AuditService {
  log(event: CreateAuditEventDto): Promise<void>
  query(filter: AuditQueryFilter): Promise<PaginatedResult<AuditEvent>>
  export(filter: AuditQueryFilter, format: 'json' | 'csv'): Promise<Buffer>
  verifyIntegrity(): Promise<IntegrityReport>
}

export interface CreateAuditEventDto {
  actorId: string
  actorIp?: string
  actorAgent?: string
  action: AuditAction
  resourceType: string
  resourceId: string
  metadata?: Record<string, unknown>
}

export interface AuditQueryFilter {
  actorId?: string
  action?: AuditAction
  resourceType?: string
  resourceId?: string
  from?: Date
  to?: Date
  page?: number
  pageSize?: number
}
```

---

## Database Permission Enforcement

The application database role has INSERT-only on the `AuditEvent` table:

```sql
-- Run once during DB setup
REVOKE UPDATE, DELETE ON "AuditEvent" FROM app_role;
GRANT INSERT, SELECT ON "AuditEvent" TO app_role;
```

This means even if application code attempts to update or delete an audit record, the database will reject it at the permission level — not just the application level.

---

## Module Structure

```
src/modules/audit/
  domain/
    audit-event.entity.ts
    audit.repository.ts          ← interface
    audit-event.factory.ts       ← checksum computation
  application/
    audit.service.impl.ts        ← implements AuditService
    verify-audit-integrity.usecase.ts
    events/
      user-login.audit.handler.ts
      user-logout.audit.handler.ts
      document-uploaded.audit.handler.ts
      document-deleted.audit.handler.ts
      document-accessed.audit.handler.ts
      clauses-extracted.audit.handler.ts
      risk-scored.audit.handler.ts
      annotation-added.audit.handler.ts
      clause-reviewed.audit.handler.ts
      engagement-created.audit.handler.ts
      engagement-closed.audit.handler.ts
      report-exported.audit.handler.ts
      user-permission-changed.audit.handler.ts
  infrastructure/
    prisma-audit.repository.ts
    audit.controller.ts          ← GET /api/v1/audit (admin only)
    audit.module.ts
```

---

## API Endpoints

```
GET  /api/v1/audit              ← query audit log (Tenant_Admin only)
GET  /api/v1/audit/export       ← export as JSON or CSV (Tenant_Admin only)
POST /api/v1/audit/verify       ← trigger integrity check (platform_admin only)
```

---

## TDD Approach

### Domain Unit Tests
```typescript
describe('computeChecksum', () => {
  it('should produce consistent checksums for the same input', () => {
    const event = { id: 'uuid', timestamp: new Date('2026-01-01'), actorId: 'user-1', action: 'USER_LOGIN', resourceId: 'user-1' }
    expect(computeChecksum(event)).toBe(computeChecksum(event))
  })

  it('should produce different checksums when any field changes', () => {
    const base = { id: 'uuid', timestamp: new Date('2026-01-01'), actorId: 'user-1', action: 'USER_LOGIN', resourceId: 'user-1' }
    const modified = { ...base, actorId: 'user-2' }
    expect(computeChecksum(base)).not.toBe(computeChecksum(modified))
  })
})
```

### Application Unit Tests
```typescript
describe('AuditDocumentUploadedHandler', () => {
  it('should log DOCUMENT_UPLOADED event with correct metadata', async () => {
    const auditService = mock<AuditService>()
    const handler = new AuditDocumentUploadedHandler(auditService)

    await handler.handle(new DocumentUploadedEvent({
      documentId: 'doc-123',
      uploadedBy: 'user-456',
      fileName: 'contract.pdf',
      fileSizeBytes: 1024,
      engagementId: 'eng-789',
    }))

    expect(auditService.log).toHaveBeenCalledWith(expect.objectContaining({
      action: AuditAction.DOCUMENT_UPLOADED,
      actorId: 'user-456',
      resourceId: 'doc-123',
      metadata: expect.objectContaining({ fileName: 'contract.pdf' }),
    }))
  })
})
```
