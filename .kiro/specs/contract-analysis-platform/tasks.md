# Implementation Plan: Contract Analysis Platform

## Overview

This implementation plan follows a **user story-driven approach** with Clean Architecture principles. Each user story includes:
1. **Domain Model** — aggregates, value objects, domain events
2. **Clean Architecture Layers** — domain → application → infrastructure
3. **UI Components** — React components for the feature

The plan starts with **scaffolding and cross-cutting concerns**, then proceeds through **Authentication → Home Page → Audit Service**.

---

## Phase 1: Scaffolding & Cross-Cutting Concerns

### Task 1.1: Project Structure Setup
**Goal**: Set up monorepo with NestJS backend and React frontend

**Backend Structure**:
```
apps/backend/
├── src/
│   ├── modules/          # Feature modules (vertical slices)
│   ├── shared/           # Shared kernel
│   │   ├── domain/       # Base classes, Result, ValueObject
│   │   ├── exceptions/   # AppError hierarchy
│   │   └── infrastructure/ # Prisma, ports
│   ├── config/           # Configuration service
│   ├── app.module.ts
│   └── main.ts
├── prisma/
│   └── schema.prisma
├── package.json
└── tsconfig.json
```

**Frontend Structure**:
```
apps/frontend/
├── src/
│   ├── pages/            # Page components
│   ├── components/       # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── api/              # API client layer
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── package.json
└── vite.config.ts
```

**Deliverables**:
- [x] Monorepo package.json with workspaces
- [ ] Backend: NestJS project with TypeScript, Prisma, Jest
- [ ] Frontend: Vite + React + TypeScript + TailwindCSS
- [ ] ESLint + Prettier configuration
- [ ] Git ignore files

**Requirements**: Foundation for all features

---

### Task 1.2: Shared Kernel (Domain Building Blocks)
**Goal**: Create base classes for Clean Architecture domain layer

**Deliverables**:
- [ ] `Result<T>` class for domain layer error handling
- [ ] `BaseEntity<T>` with identity equality and domain events
- [ ] `AggregateRoot<T>` extending BaseEntity
- [ ] `ValueObject<T>` with value equality
- [ ] `DomainEvent` interface and `BaseDomainEvent` class
- [ ] Unit tests for all base classes

**Files**:
```
shared/domain/
├── result.ts
├── base-entity.ts
├── aggregate-root.ts
├── value-object.ts
└── domain-event.ts
```

**Requirements**: Foundation for domain modeling

---

### Task 1.3: Exception Hierarchy
**Goal**: Three-layer exception system with global filter

**Deliverables**:
- [ ] `AppError` base class (message, code, httpStatus)
- [ ] `DomainException` for business rule violations (422, 409)
- [ ] `ApplicationException` for use case failures (404, 403, 409, 503)
- [ ] `InfrastructureException` for external failures (500)
- [ ] Common exceptions: `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`, `ValidationException`
- [ ] Global `HttpExceptionFilter` returning RFC 7807 Problem Details
- [ ] Unit tests for exception filter

**Files**:
```
shared/exceptions/
├── app-error.ts
└── http-exception.filter.ts
```

**Requirements**: 8.4 (403 Forbidden), error handling across all features

---

### Task 1.4: Prisma Schema & Database Setup
**Goal**: Define complete database schema with all domain models

**Deliverables**:
- [ ] Prisma schema with all models: User, Session, Tenant, Document, Clause, RiskFlag, Engagement, ReviewerAssignment, Annotation, Comment, AuditEvent
- [ ] SQLite configuration for local development
- [ ] Initial migration script
- [ ] PrismaService with connection lifecycle
- [ ] PrismaModule (global)

**Files**:
```
prisma/
├── schema.prisma
└── migrations/
    └── 001_initial_schema/
```

**Requirements**: 10.1, 10.2, 10.3 (multi-tenant data isolation)

---

### Task 1.5: Configuration Service
**Goal**: Centralized configuration with validation

**Deliverables**:
- [ ] `AppConfigService` with all config properties
- [ ] Environment-specific .env files (.env, .env.local, .env.test)
- [ ] Startup validation using class-validator
- [ ] Configuration module (global)

**Files**:
```
config/
├── app-config.service.ts
└── app-config.module.ts
```

**Requirements**: All features depend on configuration

---

### Task 1.6: Logging Infrastructure
**Goal**: Structured logging with request ID propagation

**Deliverables**:
- [ ] pino + nestjs-pino integration
- [ ] Request ID generation and propagation
- [ ] pino-pretty for local development
- [ ] JSON logging for production
- [ ] LoggerModule configuration

**Requirements**: Observability for all features

---

### Task 1.7: API Response Envelope
**Goal**: Uniform response structure across all endpoints

**Deliverables**:
- [ ] `ApiResponse<T>` interface (success, data, meta)
- [ ] `ResponseInterceptor` to wrap all success responses
- [ ] Error response format (RFC 7807)
- [ ] Pagination metadata structure

**Files**:
```
shared/infrastructure/
├── response.interceptor.ts
└── api-response.interface.ts
```

**Requirements**: Consistent API design

---

### Task 1.8: Testing Infrastructure
**Goal**: Jest + Supertest setup with test utilities

**Deliverables**:
- [ ] Jest configuration for unit tests
- [ ] Supertest configuration for integration tests
- [ ] Test database setup (SQLite in-memory)
- [ ] Test factories for domain models
- [ ] Coverage thresholds (domain ≥90%, application ≥80%)

**Requirements**: TDD approach for all features

---

## Phase 2: User Story — Authentication (Requirement 0)

### Task 2.1: Authentication Domain Model
**Goal**: Define User and Session aggregates with domain events

**Domain Model**:
```
Aggregate: User
├── Value Objects:
│   ├── UserId (UUID)
│   ├── Email
│   ├── UserRole (enum)
│   └── Auth0SubjectId
├── Domain Events:
│   ├── UserCreatedEvent
│   ├── UserLoggedInEvent
│   ├── UserLoggedOutEvent
│   └── UserPermissionChangedEvent
└── Invariants:
    ├── Email must be valid format
    ├── Role must be one of: platform_admin, tenant_admin, engagement_manager, lead_reviewer, reviewer
    └── Auth0SubjectId must be unique

Aggregate: Session
├── Value Objects:
│   ├── SessionId (UUID)
│   ├── EncryptedToken
│   └── SessionExpiry
├── Domain Events:
│   ├── SessionCreatedEvent
│   ├── SessionRefreshedEvent
│   └── SessionInvalidatedEvent
└── Invariants:
    ├── Session must have valid expiry (future date)
    ├── Tokens must be encrypted before storage
    └── Session belongs to exactly one User
```

**Deliverables**:
- [ ] User aggregate with factory
- [ ] Session aggregate with factory
- [ ] Value objects: UserId, Email, UserRole, Auth0SubjectId, SessionId, EncryptedToken, SessionExpiry
- [ ] Domain events: UserCreatedEvent, UserLoggedInEvent, UserLoggedOutEvent, SessionCreatedEvent, SessionRefreshedEvent, SessionInvalidatedEvent
- [ ] Repository interfaces: IUserRepository, ISessionRepository
- [ ] Unit tests for aggregates and value objects

**Files**:
```
modules/auth/domain/
├── user.aggregate.ts
├── session.aggregate.ts
├── user-id.vo.ts
├── email.vo.ts
├── user-role.vo.ts
├── auth0-subject-id.vo.ts
├── session-id.vo.ts
├── encrypted-token.vo.ts
├── session-expiry.vo.ts
├── user.events.ts
├── session.events.ts
├── user.factory.ts
├── session.factory.ts
├── user.repository.ts (interface)
└── session.repository.ts (interface)
```

**Requirements**: 0.1-0.12 (User Authentication and Login)

---

### Task 2.2: Authentication Application Layer
**Goal**: Commands, queries, and event handlers for auth flows

**CQRS Structure**:
```
Commands:
├── LoginCommand → LoginHandler
├── LogoutCommand → LogoutHandler
└── RefreshSessionCommand → RefreshSessionHandler

Queries:
├── GetCurrentUserQuery → GetCurrentUserHandler
└── ValidateSessionQuery → ValidateSessionHandler

Event Handlers:
├── UserLoggedInHandler → Log audit event
└── SessionInvalidatedHandler → Clean up resources
```

**Deliverables**:
- [ ] LoginCommand + LoginHandler (Auth0 callback, create session)
- [ ] LogoutCommand + LogoutHandler (invalidate session, revoke refresh token)
- [ ] RefreshSessionCommand + RefreshSessionHandler (silent token refresh)
- [ ] GetCurrentUserQuery + GetCurrentUserHandler
- [ ] ValidateSessionQuery + ValidateSessionHandler
- [ ] Event handlers for audit logging
- [ ] Unit tests for all handlers (mock repositories)

**Files**:
```
modules/auth/application/
├── commands/
│   ├── login.command.ts
│   ├── login.handler.ts
│   ├── logout.command.ts
│   ├── logout.handler.ts
│   ├── refresh-session.command.ts
│   └── refresh-session.handler.ts
├── queries/
│   ├── get-current-user.query.ts
│   ├── get-current-user.handler.ts
│   ├── validate-session.query.ts
│   └── validate-session.handler.ts
└── events/
    ├── user-logged-in.handler.ts
    └── session-invalidated.handler.ts
```

**Requirements**: 0.1-0.12

---

### Task 2.3: Authentication Infrastructure Layer
**Goal**: Prisma repositories, Auth0 integration, session guard

**Deliverables**:
- [ ] PrismaUserRepository implementing IUserRepository
- [ ] PrismaSessionRepository implementing ISessionRepository
- [ ] Auth0Service (token exchange, validation, refresh)
- [ ] SessionEncryptionService (AES-256-CBC + PBKDF2)
- [ ] SessionAuthGuard (global guard, decrypt token, attach user to request)
- [ ] AuthController (login callback, logout endpoints)
- [ ] DTOs: LoginCallbackDto, CurrentUserResponseDto
- [ ] AuthMapper (User aggregate ↔ Prisma ↔ DTO)
- [ ] AuthModule wiring all components
- [ ] Integration tests (Supertest + in-memory DB)

**Files**:
```
modules/auth/infrastructure/
├── prisma-user.repository.ts
├── prisma-session.repository.ts
├── auth0.service.ts
├── session-encryption.service.ts
├── session-auth.guard.ts
├── auth.controller.ts
├── auth.mapper.ts
├── auth.module.ts
└── dtos/
    ├── login-callback.dto.ts
    └── current-user.response.dto.ts
```

**Requirements**: 0.1-0.12, 8.1-8.8

---

### Task 2.4: Authentication UI
**Goal**: Login redirect, logout button, session management

**Deliverables**:
- [ ] Auth0 redirect logic (no custom login UI)
- [ ] Logout button component
- [ ] useAuth hook (current user, logout function)
- [ ] Protected route wrapper
- [ ] Session expiry handling (silent refresh)

**Files**:
```
frontend/src/
├── hooks/
│   └── useAuth.ts
├── components/
│   ├── ProtectedRoute.tsx
│   └── LogoutButton.tsx
└── pages/
    └── LoginCallbackPage.tsx
```

**Requirements**: 0.1-0.12

---

## Phase 3: User Story — Home Page (US-008)

### Task 3.1: Home Page Domain Model
**Goal**: Define ReferenceData aggregate for dashboard view model

**Domain Model**:
```
Aggregate: ReferenceData (Read Model)
├── Value Objects:
│   ├── DashboardViewModel
│   ├── ContractSummary
│   ├── RenewalSummary
│   └── SystemStatus
└── Computed Properties:
    ├── activeContractCount
    ├── avgRiskScore
    ├── criticalFlagCount
    ├── urgentRenewalCount
    └── recentContracts[]
```

**Note**: This is a **read model** (query side of CQRS), not a traditional aggregate. No commands, only queries.

**Deliverables**:
- [ ] DashboardViewModel value object
- [ ] ContractSummary value object
- [ ] RenewalSummary value object
- [ ] SystemStatus value object
- [ ] Unit tests for view model construction

**Files**:
```
modules/reference-data/domain/
├── dashboard-view-model.vo.ts
├── contract-summary.vo.ts
├── renewal-summary.vo.ts
└── system-status.vo.ts
```

**Requirements**: US-008 (Home Screen)

---

### Task 3.2: Home Page Application Layer
**Goal**: Query handler to compute dashboard view model

**CQRS Structure**:
```
Queries:
└── GetReferenceDataQuery → GetReferenceDataHandler
    ├── Fetch contracts from DB
    ├── Fetch renewals from DB
    ├── Compute KPIs (active count, avg risk, critical flags, urgent renewals)
    ├── Sort and slice (recent contracts, urgent renewals)
    └── Return DashboardViewModel
```

**Deliverables**:
- [ ] GetReferenceDataQuery + GetReferenceDataHandler
- [ ] Business logic for KPI calculations
- [ ] Sorting and filtering logic
- [ ] Unit tests with mock data

**Files**:
```
modules/reference-data/application/
└── queries/
    ├── get-reference-data.query.ts
    └── get-reference-data.handler.ts
```

**Requirements**: US-008

---

### Task 3.3: Home Page Infrastructure Layer
**Goal**: Controller and DTOs for reference data endpoint

**Deliverables**:
- [ ] ReferenceDataController with GET /reference-data endpoint
- [ ] Response DTOs: ReferenceDataResponseDto, DashboardViewModelDto, UserDto, ActionsDto, UiDto
- [ ] ReferenceDataModule wiring
- [ ] Integration tests

**Files**:
```
modules/reference-data/infrastructure/
├── reference-data.controller.ts
├── reference-data.module.ts
└── dtos/
    └── reference-data.response.dto.ts
```

**Requirements**: US-008

---

### Task 3.4: Home Page UI
**Goal**: React components for home screen

**Deliverables**:
- [ ] HomePage (main page component)
- [ ] OrgBanner component
- [ ] GreetingSection component
- [ ] KPICards component (4 cards)
- [ ] WhereToStart component (upload CTA + resume/sample cards)
- [ ] HowItWorks component (4-step process)
- [ ] RecentContracts component (table)
- [ ] UrgentRenewals component (table)
- [ ] RiskBadge component (reusable)
- [ ] TypePill component (reusable)
- [ ] useReferenceData hook (React Query)
- [ ] API client for /reference-data

**Files**:
```
frontend/src/
├── pages/
│   └── HomePage.tsx
├── components/
│   ├── OrgBanner.tsx
│   ├── GreetingSection.tsx
│   ├── KPICards.tsx
│   ├── WhereToStart.tsx
│   ├── HowItWorks.tsx
│   ├── RecentContracts.tsx
│   ├── UrgentRenewals.tsx
│   ├── RiskBadge.tsx
│   └── TypePill.tsx
├── hooks/
│   └── useReferenceData.ts
└── api/
    └── reference-data.ts
```

**Requirements**: US-008 (all acceptance criteria)

---

## Phase 4: User Story — Audit Service (Requirement 7)

### Task 4.1: Audit Domain Model
**Goal**: Define AuditEvent aggregate with tamper detection

**Domain Model**:
```
Aggregate: AuditEvent
├── Value Objects:
│   ├── AuditEventId (UUID)
│   ├── AuditAction (enum)
│   ├── ActorId
│   ├── ResourceId
│   ├── Checksum (SHA-256)
│   └── SequenceNumber (per-tenant monotonic)
├── Domain Events:
│   └── AuditEventRecordedEvent
└── Invariants:
    ├── Checksum = SHA256(id|timestamp|actorId|action|resourceId)
    ├── SequenceNumber must be strictly increasing per tenant
    ├── Timestamp must be in the past or present
    └── AuditEvent is immutable after creation
```

**Deliverables**:
- [ ] AuditEvent aggregate with factory
- [ ] Value objects: AuditEventId, AuditAction, ActorId, ResourceId, Checksum, SequenceNumber
- [ ] Domain event: AuditEventRecordedEvent
- [ ] Repository interface: IAuditEventRepository
- [ ] Unit tests for aggregate and value objects
- [ ] Property test: Checksum verification

**Files**:
```
modules/audit/domain/
├── audit-event.aggregate.ts
├── audit-event-id.vo.ts
├── audit-action.vo.ts
├── actor-id.vo.ts
├── resource-id.vo.ts
├── checksum.vo.ts
├── sequence-number.vo.ts
├── audit-event.events.ts
├── audit-event.factory.ts
└── audit-event.repository.ts (interface)
```

**Requirements**: 7.1-7.8 (Audit Trail and Compliance)

---

### Task 4.2: Audit Application Layer
**Goal**: Command handler and query handler for audit events

**CQRS Structure**:
```
Commands:
└── RecordAuditEventCommand → RecordAuditEventHandler
    ├── Generate sequence number (PostgreSQL sequence + advisory lock)
    ├── Compute checksum
    ├── Create AuditEvent aggregate
    └── Save to append-only table

Queries:
├── QueryAuditEventsQuery → QueryAuditEventsHandler (with filters)
└── ExportAuditLogQuery → ExportAuditLogHandler (JSON, CSV, PDF)

Event Handlers:
├── UserLoggedInHandler → RecordAuditEventCommand
├── DocumentUploadedHandler → RecordAuditEventCommand
├── ClauseReviewedHandler → RecordAuditEventCommand
└── (All domain events trigger audit logging)
```

**Deliverables**:
- [ ] RecordAuditEventCommand + RecordAuditEventHandler
- [ ] QueryAuditEventsQuery + QueryAuditEventsHandler (pagination, filters)
- [ ] ExportAuditLogQuery + ExportAuditLogHandler (JSON, CSV, PDF)
- [ ] Event handlers for all domain events (user login, document upload, etc.)
- [ ] Unit tests for all handlers
- [ ] Property test: Sequence number monotonicity

**Files**:
```
modules/audit/application/
├── commands/
│   ├── record-audit-event.command.ts
│   └── record-audit-event.handler.ts
├── queries/
│   ├── query-audit-events.query.ts
│   ├── query-audit-events.handler.ts
│   ├── export-audit-log.query.ts
│   └── export-audit-log.handler.ts
└── events/
    ├── user-logged-in.handler.ts
    ├── document-uploaded.handler.ts
    └── clause-reviewed.handler.ts
```

**Requirements**: 7.1-7.8

---

### Task 4.3: Audit Infrastructure Layer
**Goal**: Append-only Prisma repository and audit controller

**Deliverables**:
- [ ] PrismaAuditEventRepository (INSERT + SELECT only, no UPDATE/DELETE)
- [ ] Database role configuration (no UPDATE/DELETE permissions)
- [ ] AuditController (query endpoint, export endpoint)
- [ ] DTOs: QueryAuditEventsDto, AuditEventResponseDto, ExportAuditLogDto
- [ ] AuditMapper (AuditEvent aggregate ↔ Prisma ↔ DTO)
- [ ] AuditModule wiring
- [ ] Integration tests (verify immutability, sequence numbers)
- [ ] Property test: Immutable audit log (attempt UPDATE/DELETE, verify rejection)

**Files**:
```
modules/audit/infrastructure/
├── prisma-audit-event.repository.ts
├── audit.controller.ts
├── audit.mapper.ts
├── audit.module.ts
└── dtos/
    ├── query-audit-events.dto.ts
    ├── audit-event.response.dto.ts
    └── export-audit-log.dto.ts
```

**Requirements**: 7.1-7.8

---

### Task 4.4: Audit UI (Optional)
**Goal**: Admin screen to view audit log

**Deliverables**:
- [ ] AuditLogPage (admin only)
- [ ] AuditLogTable component (filterable, paginated)
- [ ] AuditEventDetail component (modal)
- [ ] ExportAuditLogButton component
- [ ] useAuditLog hook (React Query)
- [ ] API client for /audit endpoints

**Files**:
```
frontend/src/
├── pages/
│   └── AuditLogPage.tsx
├── components/
│   ├── AuditLogTable.tsx
│   ├── AuditEventDetail.tsx
│   └── ExportAuditLogButton.tsx
├── hooks/
│   └── useAuditLog.ts
└── api/
    └── audit.ts
```

**Requirements**: 7.5, 7.6 (query and export)

---

## Summary

**Phase 1**: Scaffolding (8 tasks) — Foundation for all features
**Phase 2**: Authentication (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 3**: Home Page (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 4**: Audit Service (4 tasks) — Domain → Application → Infrastructure → UI

**Total**: 20 tasks organized by user story

---

## Notes

- Each user story follows Clean Architecture: Domain → Application → Infrastructure → UI
- Domain models are defined upfront before implementation
- TDD approach: write tests alongside implementation
- Integration tests verify end-to-end flows
- Property tests validate invariants (checksums, sequence numbers, immutability)
