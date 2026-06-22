# Implementation Plan: Contract Analysis Platform

## Progress Summary

**Phase 1: Scaffolding & Cross-Cutting Concerns** — ✅ **COMPLETE** (7/7 tasks)

- ✅ Task 1.1: Project Structure Setup (Commit: aec01ef)
- ✅ Task 1.2: Shared Kernel Tests (Commit: 6d4383f)
- ✅ Task 1.3: Exception Hierarchy Tests (Commit: 896cbe8)
- ❌ Task 1.4: Prisma Schema & Database Setup — REMOVED (data models introduced incrementally per feature, Commit: bf39149)
- ✅ Task 1.5: Configuration Service (with class-validator, Commit: 52ef904)
- ✅ Task 1.6: Logging Infrastructure (pino + request id propagation, Commit: b67cbae)
- ✅ Task 1.7: API Response Envelope (ApiResponse<T> + PaginationMeta, Commit: e36bbea)
- ✅ Task 1.8: Testing Infrastructure (Jest + Supertest + factories + coverage thresholds, Commit: 55726cf)
- 🛠️ Tooling: lint + prettier + dependency alignment across full codebase (Commit: 772e1bc)

**Phase 2: Design System** — ✅ **COMPLETE** (5/5 tasks)

- ✅ Task 2.1: Design Tokens (Commit: 81c7fc8)
- ✅ Task 2.2: Shadcn UI Bootstrap (Commit: 0b9f9f3)
- ✅ Task 2.3: Domain Components (RiskBadge, RiskBar, FlagsSummary, TypePill, KPICard) (Commit: 09807c4)
- ✅ Task 2.4: Layout Components (TopNav, OrgBanner, PageShell) (Commit: verified in codebase)
- ✅ Task 2.5: Centralised Icons (icons.tsx with 23 Lucide icons + tests) (Commit: verified in codebase)

**Phase 3: Authentication** — ✅ **COMPLETE** (4/4 tasks)

- ✅ Task 3.1: Authentication Domain Model (User + Session aggregates, 10 VOs, 6 events) (Commits: 01e1d35, 97dbd90, d0c5dfd)
- ✅ Task 3.2: Authentication Application Layer (Login/Logout/Refresh commands, GetCurrentUser/ValidateSession queries) (Commit: 01a028b)
- ✅ Task 3.3: Authentication Infrastructure Layer (Prisma repos, Auth0Service, SessionEncryption, SessionAuthGuard, AuthController) (Commit: 2f26822)
- ✅ Task 3.4: Authentication UI (useAuth hook, authService, LoginCallbackPage, ProtectedRoute, LogoutButton) (Commit: 6927e8d)

**Phase 4: Home Screen** — ✅ **COMPLETE** (5/5 tasks)

- ✅ Task 4.1: Reference Data Module — Domain & Application Layer (Commit: 57cfc83)
- ✅ Task 4.2: Reference Data Module — Infrastructure Layer (Commit: 01cb747)
- ✅ Task 4.3: Frontend API Infrastructure (Commit: 70f372f)
- ✅ Task 4.4: Home Screen UI — Pixel-Sharp Layout (Commit: a7f05ea)
- ✅ Task 4.5: Home Screen UI — Routing, Edge Cases & Accessibility Audit (Commit: a7f05ea)
- 🧪 Experimental: HomePageV2 with fully custom components (no Shadcn) on branch `feature/home-page-custom-components` — user preferred; v2-style is template for future UI work

**Phase 4.5: Product Analytics (PostHog)** — ✅ **COMPLETE** (3/3 tasks)

- ✅ Task 4.5.1: PostHog SDK install + initialization (env vars, EU host, provider wiring) (Commit: 98177b3)
- ✅ Task 4.5.2: User identification lifecycle (identify on login, reset on logout, privacy defaults) (Commit: 2f3154b — bundled with the typed-pattern migration)
- ✅ Task 4.5.3: Typed analytics service + starter events (analytics.ts with strong types, useHoverTracker, 8 starter events) (Commits: 8f9e19e + 2f3154b)
- ✅ Bonus: ErrorBoundary → posthog.captureException for unhandled React errors (Commit: ff162f4)

**Phase 5: Upload Screen** — ✅ **COMPLETE** (4/4 tasks + full deployment pipeline)

- ✅ Task 5.1: Upload Screen UI — Pixel-Sharp Layout with mock service (Commit: 380ed01)
- ✅ Task 5.2: Upload Screen UI — Routing, Edge Cases & Accessibility Audit (Commit: 9077f15)
- ✅ Task 5.3: Document Upload Backend — Domain & Application Layer (Commit: b6e63d8)
- ✅ Task 5.4a: Local FS end-to-end upload + frontend service swap (Commit: 2f84eec)
- ✅ Task 5.4 bonus: E2E test against running backend (Commit: 85dc4bb)
- ✅ Task 5.4b: Real GcsStorageDriver + setup-gcs.sh + deployment docs (Commit: 2f0ec16)
- ✅ Task 5.4b bonus: GCS driver unit tests with mocked SDK (Commit: 69eddbe)
- ✅ Task 5.4c (architecture pivot): All uploads backend-proxied — bytes flow through our perimeter, not browser→GCS direct (Commit: 608341e)

**Specification Updates**:

- Commit 01e1d35: Separate access/refresh token storage
- Commit 97dbd90: Add login initiation flow
- Commit d0c5dfd: Automatic redirect with returnUrl preservation

**Completed Work** (Phases 1-3):

**Phase 1: Foundation**

- Monorepo scaffold (backend + frontend) — apps/backend (NestJS 11) and apps/frontend (React 18 + Vite)
- Shared kernel: Result, BaseEntity, ValueObject, AggregateRoot, DomainEvent
- Exception hierarchy: AppError → Domain/Application/Infrastructure + 5 common exceptions + global HttpExceptionFilter (RFC 7807)
- Configuration: AppConfigService with class-validator startup validation, typed enums, env-specific files
- Logging: dedicated LoggerModule, request ID propagation via x-request-id, sensitive field redaction
- API response envelope: ApiResponse<T>, PaginationMeta, isPaginatedPayload, buildPaginationMeta + ResponseInterceptor
- Testing infrastructure: Jest unit + Jest e2e (Supertest), TestFactory base class, coverage thresholds (global ≥80%, domain ≥90%)
- Lint clean (0 errors / 0 warnings), Prettier formatted across whole repo
- All following Clean Architecture + DDD + CQRS + Vertical Slicing patterns

**Phase 2: Design System**

- Design tokens: Single source of truth in `designTokens.ts` with risk/severity helpers, wired into Tailwind v4
- Shadcn UI: 12 primitives installed (button, badge, input, card, dialog, tabs, checkbox, dropdown-menu, sonner, avatar, tooltip, skeleton)
- Domain components: RiskBadge, RiskBar, FlagsSummary, TypePill, KPICard (35 tests)
- Layout components: TopNav, OrgBanner, PageShell (23 tests)
- Centralized icons: 23 Lucide icons in `icons.tsx` (4 tests)
- Tailwind v4 migration: CSS-first theme via `@theme {}` block, `@tailwindcss/vite` plugin
- DM Sans + DM Mono fonts replacing Geist
- Total: 62 component tests, all passing

**Phase 3: Authentication**

- Domain model: User + Session aggregates, 10 value objects, 6 domain events (89 tests)
- Application layer: Login/Logout/Refresh commands, GetCurrentUser/ValidateSession queries, event handlers (25 tests)
- Infrastructure: Prisma repositories, Auth0Service (code exchange, refresh, revoke), SessionEncryptionService (AES-256-CBC + PBKDF2), SessionAuthGuard (auto-refresh), AuthController (4 endpoints), StateTokenService (HMAC-signed state with CSRF + returnUrl), SessionCookieService (signed httpOnly cookie) (51 tests)
- Frontend UI: useAuth hook (React Query), authService (3-tier architecture), httpService with 401 interceptor, LoginCallbackPage, ProtectedRoute, LogoutButton (full test coverage)
- End-to-end flow: Automatic redirect → Auth0 → callback → session cookie → protected routes
- Total: 165 auth tests (89 domain + 25 application + 51 infrastructure), all passing

**Overall Test Count**: 400+ tests across all phases

---

## Next Steps: Phase 4 — Home Screen

**Status**: 📋 Ready to start  
**Estimated effort**: 5–7 days  
**User Story**: US-008 (Home Screen / Dashboard)  
**Scope decision (2026-05-14)**: Phase 4 is **UI-only**. No backend work. The `useReferenceData` hook returns hardcoded fixture data that exactly matches the US-008 wireframe sample. The goal is a pixel-sharp, fully interactive home screen. Real API wiring moves to Phase 5 when the backend reference-data endpoint is built.

**What's being built**:

1. **Mock Data Layer** (Task 4.1) — TypeScript types for `DashboardViewModel`, a `MOCK_DASHBOARD` fixture matching the US-008 wireframe sample data, and `useReferenceData` returning it via React Query (no HTTP call)
2. **Pixel-Sharp UI** (Task 4.2) — Every section of the home screen built to exact wireframe measurements: OrgBanner, Greeting, KPI cards, "Where to Start", "How It Works", Recent Contracts table, Urgent Renewals table
3. **Routing, Edge Cases & Accessibility** (Task 4.3) — Wire into React Router, handle empty states, run axe audit, add Storybook stories for all states

**Architecture decisions**:

- `useReferenceData` uses React Query (`queryKey: ['reference-data']`, `refetchOnWindowFocus: false`) — same hook signature as the real implementation. Swapping mock → real API in Phase 5 requires changing only `referenceDataService.ts`, nothing else.
- Frontend follows the **3-tier API call stack** even with mock data: `useReferenceData` → `referenceDataService` → (mock, no HTTP). This keeps the architecture honest.
- All pixel values, colors, font sizes, spacing, and border radii come directly from US-008 wireframe spec — no approximations.

**Dependencies**: All Phase 1-3 work complete ✅

---

## Phase Plan (Post-Phase 1)

| Phase     | Theme                                                    | Tasks   | Status                  |
| --------- | -------------------------------------------------------- | ------- | ----------------------- |
| Phase 2   | Design System (Shadcn UI base + domain components)       | 5 tasks | ✅ **COMPLETE (100%)**  |
| Phase 3   | Authentication (Auth0 + Session encryption + Guard + UI) | 4 tasks | ✅ **COMPLETE (100%)**  |
| Phase 4   | Home Screen (Backend reference data + UI + a11y)         | 5 tasks | ✅ **COMPLETE (100%)**  |
| Phase 4.5 | Product Analytics (PostHog frontend integration)         | 3 tasks | ✅ **COMPLETE (100%)**  |
| Phase 5   | Upload Screen (UI-first: mock → real backend swap)       | 4 tasks | ✅ **COMPLETE (100%)**  |
| Phase 6   | Audit Service (append-only event log + admin UI)         | 4 tasks | 📋 **NEXT (0%)**        |
| Phase 7   | OCR Pipeline (classify → native / Document AI → DocumentText) | 6 tasks | ✅ **COMPLETE (100%)**  |

**Phase 2 design decision (2026-05-13)**: We use Shadcn UI as the base for all standard primitives (Button, Badge, Input, Card, Dialog, Tabs, etc.). We only build components for contract-domain concepts (RiskBadge, RiskBar, FlagsSummary, TypePill, KPICard) and application layout (TopNav, OrgBanner, PageShell). This cuts Phase 2 from the originally-planned 30+ sub-tasks down to 5 focused tasks.

**Phase 2 tooling decision (2026-05-13)**: Shadcn CLI v4.7 generates output for Tailwind v4. Project upgraded from Tailwind v3.4 → v4.3. Theme moved from `tailwind.config.ts` to CSS-first `@theme {}` block in `src/index.css`. `@tailwindcss/vite` plugin replaces the PostCSS pipeline. `src/config/designTokens.ts` retained for JS-side risk/severity helpers.

**Phase 2 completion**: 🎉 **5/5 tasks complete (100%)**

- ✅ Task 2.1: Design Tokens (Commit: 81c7fc8)
- ✅ Task 2.2: Shadcn UI Bootstrap (Commit: 0b9f9f3)
- ✅ Task 2.3: Domain Components (RiskBadge, RiskBar, FlagsSummary, TypePill, KPICard) (Commit: 09807c4)
- ✅ Task 2.4: Layout Components (TopNav, OrgBanner, PageShell)
- ✅ Task 2.5: Centralised Icons (icons.tsx with 23 Lucide icons + tests)

**Phase 3 architectural decision (2026-05-13)**: Auth0 redirects to a **frontend** callback page (`http://localhost:5173/auth/callback`) which then POSTs `{ code, state }` to the backend. Backend mints/verifies the OAuth state (HMAC-signed, carries CSRF token + returnUrl) and owns the session cookie. End-to-end smoke-tested against the real Auth0 dev tenant — login → exchange → cookie → /me → logout → 401 all verified.

**Phase 3 UI implementation (2026-05-14)**: Frontend auth layer follows 3-tier API architecture:

- **Layer 1 (UI)**: `useAuth` React Query hook — returns `{ user, isLoading, isAuthenticated, logout }`
- **Layer 2 (Service)**: `authService` — `getCurrentUser()`, `logout()` methods (no HTTP calls)
- **Layer 3 (HTTP)**: `httpService` + axios with 401 interceptor → auto-redirects to login
- **Components**: `ProtectedRoute` (loading state + auto-redirect), `LogoutButton` (44px touch target, ARIA labels), `LoginCallbackPage` (spinner during callback)
- **Session cookie**: Renamed from `cisid` to `ContractIntel`, HMAC-signed, HttpOnly, SameSite=Strict
- **Tests**: httpService, authService, and component unit tests with full coverage

**Phase 3 completion**: 🎉 **4/4 tasks complete (100%)**

- ✅ Task 3.1: Authentication Domain Model (User + Session aggregates, 10 VOs, 6 events) (Commit: 32e2067)
- ✅ Task 3.2: Authentication Application Layer (Login/Logout/Refresh commands, GetCurrentUser/ValidateSession queries) (Commit: 01a028b)
- ✅ Task 3.3: Authentication Infrastructure Layer (Prisma repos, Auth0Service, SessionEncryption, SessionAuthGuard, AuthController) (Commit: 2f26822)
- ✅ Task 3.4: Authentication UI (useAuth hook, authService, LoginCallbackPage, ProtectedRoute, LogoutButton) (Commit: 6927e8d)

**Phase 4 completion** (2026-05-14): 🎉 **5/5 tasks complete (100%)**

- ✅ Task 4.1: Reference Data Module — Domain & Application Layer (Commit: 57cfc83)
- ✅ Task 4.2: Reference Data Module — Infrastructure Layer (Commit: 01cb747)
- ✅ Task 4.3: Frontend API Infrastructure — `referenceDataService` + `useReferenceData` (Commit: 70f372f)
- ✅ Task 4.4: Home Screen UI — Pixel-Sharp Layout (Commit: a7f05ea)
- ✅ Task 4.5: Routing, Edge Cases & Accessibility Audit (Commit: a7f05ea)

**Phase 4 UX iteration (2026-05-14)**: After completing the Shadcn-based Home Screen, the user found visual hierarchy lacking and Shadcn primitives constraining. An experimental v2 was built on `feature/home-page-custom-components` using **fully custom components** (no Shadcn) at `apps/frontend/src/pages/HomePageV2/`, served at `/v2`. User preferred v2. **Going forward, new UI work uses the v2 pattern** (plain React + CSS modules + Lucide, no Shadcn primitives).

**Phase 5 completion** (2026-05-14): 🎉 **4/4 tasks complete (100%)** + deployment pipeline ready

The full upload feature is feature-complete and verified end-to-end against real infrastructure (local FS today; one env-var flip to GCS).

**What landed**:

- ✅ Task 5.1: Pixel-sharp `/upload` screen with mock service (Commit: 380ed01)
- ✅ Task 5.2: Routing + edge cases + 9 axe-clean a11y tests + 10 Storybook stories (Commit: 9077f15)
- ✅ Task 5.3: Document aggregate + 8 VOs + 3 events + CQRS handlers + 72 unit tests (Commit: b6e63d8)
- ✅ Task 5.4a: Local FS end-to-end — Prisma model + migration + repo + `LocalStorageDriver` + `DocumentController` + frontend swap from mock to real HTTP (Commit: 2f84eec)
- ✅ Task 5.4 bonus: 8-case e2e test that hits a real backend + writes real bytes to a tmpdir (Commit: 85dc4bb)
- ✅ Task 5.4b: Real `GcsStorageDriver` (V4 presigned URLs) + driver factory + `scripts/setup-gcs.sh` + `docs/deployment/{gcp-setup,railway}.md` (Commit: 2f0ec16)
- ✅ Task 5.4b bonus: 11-case `GcsStorageDriver` unit test with mocked SDK (Commit: 69eddbe)
- ✅ Task 5.4c (architecture pivot, 2026-05-14): all uploads backend-proxied — `IStorageService` gains `writeStream`, `GcsStorageDriver` now streams body bytes through the backend to GCS via the SDK rather than minting presigned URLs the browser uses directly. Every byte flows through our perimeter (scannable/auditable). Raw PUT route is now auth-guarded (no more `@Public` capability-by-URL). Tests updated + spec records the rationale + trade-off. (Commit: 608341e)

**Verified end-to-end** (real Auth0 session, real browser, real Prisma write, real disk write — example documentId `b47a490b-fb31-4031-b740-82f8d568dd18`):

1. POST `/api/v1/documents/upload/initiate` → backend mints `documentId`, persists Document row in `uploading` state
2. PUT `/api/v1/documents/upload/raw/<key>` → `LocalStorageDriver.writeStream` pipes 151,330 bytes to `apps/backend/uploads/<key>.pdf`
3. POST `/api/v1/documents/upload/complete` → `markComplete()` transitions to `complete`, sets `completedAt`
4. Browser navigates `/processing/<documentId>` showing the success stub

**Switching to GCS**: change one env var (`STORAGE_DRIVER=gcs` + paste credentials from `setup-gcs.sh` output) and restart the backend. **No frontend, controller, handler, or domain code changes** — the `IStorageService` port absorbs the difference.

**Test totals on `feature/upload-screen`**:

- Backend: 51 suites, **498 unit tests** + **8 e2e tests** — all green
- Frontend: lint exit 0 across 34 Storybook stories + a11y tests + integration tests

**Deferred to later phases** (intentional Phase 5 scope discipline):

- Bulk upload (1 file → N files)
- DOCX / PPTX (extraction pipeline isn't ready yet)
- `processing` state in the state machine (re-added when OCR ships)
- Real `Org` aggregate (currently OrgId is derived 1:1 from UserId)
- Idempotency on `InitiateUpload` (orphan-doc cleanup deferred)
- Hard delete (soft delete via status flag for now)
- GCS upload-complete webhook (rely on frontend `/complete` call)
- Rate limiting on upload endpoints
- Content-hash dedup

---

## Overview

This implementation plan follows a **user story-driven approach** with Clean Architecture principles, aligned with the **high-fidelity wireframes** from Claude Design.

Each user story includes:

1. **Domain Model** — aggregates, value objects, domain events
2. **Clean Architecture Layers** — domain → application → infrastructure
3. **UI Components** — React components matching the wireframe designs

The plan starts with **scaffolding and cross-cutting concerns**, then proceeds through **Design System → Authentication → Core Screens**.

## Architecture & Frontend Rules — see the playbook

All architecture guidance — Clean Architecture, DDD/CQRS, frontend
patterns (component structure, 3-tier API stack, Shadcn integration,
accessibility, mobile-first, centralised icons), the file-structure
reference for backend + frontend, and the PR-review enforcement
checklist — lives in the Architecture Playbook at
[`.kiro/steering/architecture.md`](../../steering/architecture.md).
This document does not duplicate those rules; every task in this file
assumes the playbook applies.

## Wireframe Screens Available

Based on the Claude Design handoff, we have pixel-perfect designs for:

1. **Home Screen** — Dashboard with KPIs, recent contracts, renewals, process explanation
2. **Upload Screen** — Drag-and-drop file upload with consent checkbox
3. **Processing Screen** — Animated spinner with progress indicators
4. **Results Screen** — Contract detail with tabs (Overview, Risk Flags, Document, History)
5. **DeepDive Screen** — Individual risk flag investigation
6. **Compare Screen** — Side-by-side contract comparison (up to 5 contracts)
7. **Portfolio Screen** — Contract list with filters and search
8. **Renewals Screen** — Upcoming renewals with urgency indicators
9. **Settings Screen** — Team management, billing, audit log
10. **Export Screen** — Report generation and sharing

All screens include:

- **Design tokens** (colors, typography, spacing) in `tokens.js`
- **Reusable components** (Button, Badge, RiskBadge, TypePill, Modal, Tabs, etc.)
- **Responsive breakpoints** (mobile, tablet, desktop)
- **Accessibility considerations** (ARIA labels, keyboard navigation)

---

## Phase 1: Scaffolding & Cross-Cutting Concerns

### Task 1.1: Project Structure Setup ✅ COMPLETED

**Goal**: Set up monorepo with NestJS backend and React frontend
**Status**: Completed (Commit: aec01ef)

**Backend Structure**:

```
apps/backend/
├── src/
│   ├── modules/          # Feature modules (vertical slices)
│   ├── shared/           # Shared kernel
│   │   ├── domain/       # Base classes, Result, ValueObject, AggregateRoot, DomainEvent
│   │   ├── exceptions/   # AppError hierarchy + HttpExceptionFilter
│   │   ├── infrastructure/ # Ports, ResponseInterceptor, LoggerModule
│   │   └── test/         # TestFactory base class
│   ├── config/           # Configuration service (class-validator schema)
│   ├── app.module.ts
│   └── main.ts
├── test/                 # E2E tests (Supertest)
├── package.json
├── tsconfig.json
└── tsconfig.eslint.json
```

> Per-feature persistence is added inside each feature module when it ships. No workspace-level `prisma/` folder.

**Frontend Structure**:

```
apps/frontend/
├── src/
│   ├── pages/            # Page components
│   ├── components/
│   │   ├── ui/           # Shadcn primitives (npx shadcn add)
│   │   ├── core/         # Custom shared components (RiskBadge, TypePill, icons)
│   │   ├── layout/       # TopNav, OrgBanner, PageShell
│   │   └── features/     # Feature-specific composites
│   ├── hooks/            # Custom React hooks
│   ├── api/              # HTTP client layer (client, httpService, endpoints, unwrap)
│   ├── lib/              # Shadcn `cn()` utility
│   ├── config/           # Design tokens (single source of truth)
│   ├── types/            # TypeScript types
│   └── utils/            # Utility functions
├── package.json
└── vite.config.ts
```

**Deliverables**:

- [x] Monorepo package.json with workspaces
- [x] Backend: NestJS 11 project with TypeScript + Jest (persistence introduced per-feature)
- [x] Frontend: Vite + React + TypeScript + TailwindCSS
- [x] ESLint + Prettier configuration
- [x] Git ignore files

**Requirements**: Foundation for all features ✅

---

### Task 1.2: Shared Kernel (Domain Building Blocks) ✅ COMPLETED

**Goal**: Create base classes for Clean Architecture domain layer
**Status**: Completed (Commit: 6d4383f)

**Deliverables**:

- [x] `Result<T>` class for domain layer error handling
- [x] `BaseEntity<T>` with identity equality and domain events
- [x] `AggregateRoot<T>` extending BaseEntity
- [x] `ValueObject<T>` with value equality
- [x] `DomainEvent` interface and base class
- [x] Unit tests for all base classes (5 test files, 102+ assertions)

**Files**:

```
shared/domain/
├── result.ts + result.spec.ts (16 tests)
├── base-entity.ts + base-entity.spec.ts (20 tests)
├── aggregate-root.ts + aggregate-root.spec.ts (28 tests)
├── value-object.ts + value-object.spec.ts (20 tests)
└── domain-event.ts + domain-event.spec.ts (18 tests)
```

**Coverage**:

- Result: ok/fail/combine/getValueOrThrow
- BaseEntity: identity equality, reflexivity, symmetry, transitivity
- ValueObject: value equality, immutability, complex objects
- DomainEvent: aggregate id, event type, sequencing
- AggregateRoot: event sourcing patterns, pull/clear/get events

**Requirements**: Foundation for domain modeling ✅

---

### Task 1.3: Exception Hierarchy ✅ COMPLETED

**Goal**: Three-layer exception system with global filter
**Status**: Completed (Commit: 896cbe8)

**Deliverables**:

- [x] `AppError` base class (message, code, httpStatus)
- [x] `DomainException` for business rule violations (422)
- [x] `ApplicationException` for use case failures (400/401/403/404/409/503)
- [x] `InfrastructureException` for external failures (500)
- [x] Common exceptions: `NotFoundException`, `UnauthorizedException`, `ForbiddenException`, `ConflictException`, `ValidationException`
- [x] Global `HttpExceptionFilter` returning RFC 7807 Problem Details
- [x] Unit tests for AppError hierarchy (40+ tests)
- [x] Unit tests for HttpExceptionFilter (38+ tests)

**Files**:

```
shared/exceptions/
├── app-error.ts + app-error.spec.ts
└── http-exception.filter.ts + http-exception.filter.spec.ts
```

**Requirements**: 8.4 (403 Forbidden), error handling across all features ✅

---

### Task 1.4: Prisma Schema & Database Setup ❌ REMOVED

**Decision**: Skipped — persistence layer will be introduced incrementally as features need it.

**Rationale**:

- Avoids upfront commitment to a full schema (premature design)
- Conflicts existed across spec docs (design.md said multi-tenancy out of scope, tasks.md required Tenant model)
- Each feature module will define its own data model when implementing its persistence adapter
- Aligns with vertical slicing — features own their full stack including persistence

**What this means going forward**:

- No `prisma/` folder in backend
- No ORM dependencies installed yet
- Repository interfaces defined in domain layer (per feature)
- Persistence adapter chosen per feature (could be Prisma, TypeORM, raw SQL, or in-memory)

---

### Task 1.5: Configuration Service ✅ COMPLETED

**Goal**: Centralized configuration with validation

**Deliverables**:

- [x] `AppConfigService` with all config properties (typed getters)
- [x] Environment files (`.env.example` template, `.env.test` for tests)
- [x] Startup validation using class-validator
- [x] Configuration module (global)
- [x] Unit tests for service and validation

**Files**:

```
config/
├── app-config.module.ts            (global, wires validation into ConfigModule)
├── app-config.service.ts           (typed getters via ConfigService<EnvironmentVariables, true>)
├── app-config.service.spec.ts      (service tests)
├── environment-variables.ts        (validation schema + enums)
└── environment-variables.spec.ts   (validation rules tests)
```

**Validation rules enforced**:

- `NODE_ENV` ∈ {development, test, production}
- `PORT` integer in [1, 65535]
- `SESSION_SECRET` minimum 32 characters
- `STORAGE_DRIVER` ∈ {local, gcs}
- `OCR_DRIVER` ∈ {mock, google-document-ai}
- `QUEUE_DRIVER` ∈ {memory, pg-boss, bullmq}
- `LOG_LEVEL` ∈ {trace, debug, info, warn, error, fatal}
- All URL fields validated as URLs
- Production environment requires: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_CALLBACK_URL, CLAUDE_API_KEY

**Requirements**: All features depend on configuration ✅

---

### Task 1.6: Logging Infrastructure ✅ COMPLETED

**Goal**: Structured logging with request ID propagation

**Deliverables**:

- [x] pino + nestjs-pino integration via dedicated `LoggerModule`
- [x] Request ID generation (uuid) and propagation via `x-request-id` header
- [x] pino-pretty for local development (colorized, single-line off, time translated)
- [x] JSON logging for production (default pino output)
- [x] `LoggerModule` configured with `forRootAsync` to read `logLevel` from `AppConfigService`
- [x] Redaction of sensitive fields (Authorization, Cookie, password, token, sessionSecret)

**Files**:

```
shared/infrastructure/logging/
├── logger.module.ts
└── logger.module.spec.ts
```

**Requirements**: Observability for all features ✅

---

### Task 1.7: API Response Envelope ✅ COMPLETED

**Goal**: Uniform response structure across all endpoints

**Deliverables**:

- [x] `ApiResponse<T>` interface (success, data, meta)
- [x] `PaginationMeta` interface (total, page, pageSize, totalPages)
- [x] `PaginatedPayload<T>` type for controllers returning paginated data
- [x] `isPaginatedPayload` type guard
- [x] `buildPaginationMeta` helper (with input validation)
- [x] `ResponseInterceptor` wraps non-paginated and paginated responses
- [x] Error response format (RFC 7807) — already handled by HttpExceptionFilter
- [x] Unit tests for interface helpers and interceptor

**Files**:

```
shared/infrastructure/api/
├── api-response.interface.ts
└── api-response.interface.spec.ts
shared/infrastructure/interceptors/
├── response.interceptor.ts
└── response.interceptor.spec.ts
```

**Requirements**: Consistent API design ✅

---

### Task 1.8: Testing Infrastructure ✅ COMPLETED

**Goal**: Jest + Supertest setup with test utilities

**Deliverables**:

- [x] Jest configuration for unit tests (in package.json)
- [x] Supertest installed + dedicated e2e config (`test/jest-e2e.json`)
- [x] `test:e2e` script added
- [x] Test setup file loads `.env.test` (`test/setup.ts`)
- [x] Test factory base class (`shared/test/test-factory.ts`)
- [x] Sample E2E test demonstrating Supertest pattern
- [x] Coverage thresholds enforced:
  - Global: branches/functions/lines/statements ≥ 80%
  - `shared/domain/**`: ≥ 90%
- ➖ SQLite in-memory test database — N/A (Prisma removed in Task 1.4 decision)

**Files**:

```
test/
├── setup.ts                  (loads .env.test, defaults SESSION_SECRET)
├── jest-e2e.json             (e2e Jest config with module aliases)
└── app.e2e-spec.ts           (sample e2e test: success envelope, paginated, error)
src/shared/test/
├── test-factory.ts           (TestFactory<T> base class with build/buildMany/buildList)
└── test-factory.spec.ts      (factory base tests)
```

**Requirements**: TDD approach for all features ✅

---

## Phase 2: Design System Implementation

### Strategy: Shadcn UI Base + Domain-Specific Customizations

We do **not** build standard UI primitives from scratch. Shadcn UI provides them, and `npx shadcn add <name>` copies the source into `src/components/ui/` where we own and customize it. We only build components that don't exist in Shadcn because they encode contract-domain concepts.

**What Shadcn provides (we just install and theme):**

| Primitive      | Shadcn Component | Source location after install         |
| -------------- | ---------------- | ------------------------------------- |
| Button         | `button`         | `src/components/ui/button.tsx`        |
| Badge          | `badge`          | `src/components/ui/badge.tsx`         |
| Input          | `input`          | `src/components/ui/input.tsx`         |
| Card           | `card`           | `src/components/ui/card.tsx`          |
| Dialog (Modal) | `dialog`         | `src/components/ui/dialog.tsx`        |
| Tabs           | `tabs`           | `src/components/ui/tabs.tsx`          |
| Checkbox       | `checkbox`       | `src/components/ui/checkbox.tsx`      |
| Dropdown       | `dropdown-menu`  | `src/components/ui/dropdown-menu.tsx` |
| Toast          | `sonner`         | `src/components/ui/sonner.tsx`        |
| Avatar         | `avatar`         | `src/components/ui/avatar.tsx`        |
| Tooltip        | `tooltip`        | `src/components/ui/tooltip.tsx`       |
| Skeleton       | `skeleton`       | `src/components/ui/skeleton.tsx`      |

**What we build (domain-specific components):**

| Component      | Why custom                                                                                          |
| -------------- | --------------------------------------------------------------------------------------------------- |
| `RiskBadge`    | Score (0-100) + threshold-driven color/label + DM Mono numeric. No Shadcn equivalent.               |
| `RiskBar`      | Horizontal progress bar colored by risk threshold. Domain-specific viz.                             |
| `FlagsSummary` | Inline red/orange/green dot counts. Bespoke summary.                                                |
| `TypePill`     | Maps contract-type enum (vendor / license / lease / nda / partnership / customer) to colour scheme. |
| `KPICard`      | Dashboard metric card. Wraps Shadcn `Card`, adds metric / delta / sparkline slot.                   |
| `OrgBanner`    | Top banner: org name, workspace tag, system status dot. Custom layout.                              |
| `TopNav`       | Application nav: logo, primary links, profile menu. Custom layout.                                  |
| `PageShell`    | Page wrapper: max-width, padding, scroll behaviour. Custom layout.                                  |
| Icons          | Centralised `src/components/core/icons.tsx`. Codebase convention.                                   |

---

### Folder Conventions

```
apps/frontend/src/
├── components/
│   ├── ui/             # Shadcn primitives (managed via `npx shadcn add`)
│   ├── core/           # Custom shared components (RiskBadge, TypePill, icons, etc.)
│   ├── layout/         # TopNav, PageShell, OrgBanner
│   └── features/       # Feature-specific composites (e.g. HomeKpiCards, UploadDropzone)
├── config/
│   └── designTokens.ts # Source of truth for colours, spacing, type, breakpoints
└── lib/
    └── utils.ts        # Shadcn's `cn()` class-name helper
```

**Rules**:

- Only `src/components/ui/*` is owned by Shadcn CLI. Other folders are hand-authored.
- All SVG icons live in `src/components/core/icons.tsx`. No inline SVG elsewhere.
- Tailwind reads design tokens from `designTokens.ts`. No literal hex / px in components.
- Each custom component follows the structure rule: JSX file ≤ 15 lines, hook file owns logic, co-located test + story.

---

### Task 2.1: Design Tokens & Tailwind Wiring ✅ COMPLETED

**Goal**: Single source of truth for colours, type, spacing, breakpoints; wired into Tailwind so every component (Shadcn or custom) inherits them.

**Deliverables**:

- [x] `apps/frontend/src/config/designTokens.ts` exporting:
  - Colour palette: bg, surface, ink (+ mid/soft/mute), border, blue, green, orange, red, nav
  - Risk helpers: `riskLevel`, `riskColor`, `riskBg`, `riskLabel`, `riskShort` (each accepts optional `max` parameter — defaults to 0-100 scale, supports custom scales like wireframe's 0-10)
  - Severity helpers: `sevColor`, `sevBg`
  - Typography: DM Sans / DM Mono families, sizes, weights, letter-spacing
  - Spacing scale (xs … xxl)
  - Border-radius scale (none, sm, md, lg, xl, full)
  - Shadow scale (sm, md, lg, xl)
  - Breakpoints (mobile 420, sm 640, md 860, lg 1100, xl 1280)
- [x] `tailwind.config.ts` (renamed from .js) imports from `designTokens.ts` — Tailwind 3.3+ native TS config
- [x] Unit tests (22 tests, all passing): threshold edges, custom scales, palette completeness, hex format validation
- [x] Vite + Vitest test infrastructure (`vite.config.ts` test block, `src/test/setup.ts`, `jsdom` for DOM env)
- [x] Updated `src/index.css` and `App.tsx` to use new token-driven Tailwind classes (`bg-bg`, `text-ink`, `text-blue-dark`)

**Design decision**: Risk thresholds use 0-100 scale by default to match `RiskScore (0–100)` in design.md. Helper functions accept an optional `max` parameter for compatibility with the wireframes' 0-10 scale.

**Files**:

```
apps/frontend/src/config/designTokens.ts
apps/frontend/src/config/designTokens.spec.ts
apps/frontend/src/test/setup.ts
apps/frontend/tailwind.config.ts          (was .js)
apps/frontend/vite.config.ts              (added test block)
apps/frontend/src/index.css               (updated class names)
apps/frontend/src/App.tsx                 (updated class names)
```

**Requirements**: Foundation for every UI component (Shadcn theming and custom components alike). ✅

---

### Task 2.2: Shadcn UI Bootstrap ✅ COMPLETED

**Goal**: Initialise Shadcn UI in the frontend workspace and install the primitives we'll use.

**Deliverables**:

- [x] Tailwind upgraded from v3.4 → v4.3 (required by current Shadcn CLI)
  - Removed `tailwindcss@3`, `autoprefixer`, `postcss`, `tailwind.config.ts`, `postcss.config.js`
  - Added `@tailwindcss/vite` plugin (replaces PostCSS pipeline)
  - CSS-first config via `@theme {}` block in `src/index.css` (single source of truth)
- [x] Run `npx shadcn@latest init -t vite -b radix -p nova`
  - Created `components.json` (style: radix-nova, base: neutral, css vars: true)
  - Created `src/lib/utils.ts` with `cn()` helper (clsx + tailwind-merge)
- [x] Reconciled Shadcn's CSS variables with our design tokens:
  - `:root` defines semantic tokens (`--primary`, `--foreground`, `--card`, etc.) as references to our palette (`var(--color-blue)`, `var(--color-ink)`, etc.)
  - `.dark` overrides for dark-mode (deferred future feature; structure in place)
  - `@theme inline {}` block exposes the semantic tokens to Tailwind as utility classes (`bg-primary`, `text-foreground`, etc.)
- [x] Installed 12 primitives via `npx shadcn add ...`:
  - `button`, `badge`, `input`, `card`
  - `dialog`, `tabs`, `checkbox`, `dropdown-menu`
  - `sonner` (toast), `avatar`, `tooltip`, `skeleton`
- [x] ESLint override for `components/ui/**` (Shadcn primitives export component + variants together)
- [x] Replaced Geist font (Shadcn default) with **DM Sans + DM Mono** (`@fontsource/dm-sans`, `@fontsource/dm-mono`)
- [x] Verified by smoke-test page in `App.tsx` rendering Button (5 variants), Badge (4 variants), Card, Input
- [x] Verified build, lint, tests all pass

**Files**:

```
apps/frontend/components.json               # Shadcn CLI config
apps/frontend/src/lib/utils.ts              # cn() helper
apps/frontend/src/components/ui/            # 12 Shadcn primitives
├── avatar.tsx
├── badge.tsx
├── button.tsx
├── card.tsx
├── checkbox.tsx
├── dialog.tsx
├── dropdown-menu.tsx
├── input.tsx
├── skeleton.tsx
├── sonner.tsx
├── tabs.tsx
└── tooltip.tsx
apps/frontend/src/index.css                 # @theme block + Shadcn semantic var mapping + base layer
apps/frontend/vite.config.ts                # @tailwindcss/vite plugin
apps/frontend/.eslintrc.cjs                 # override for components/ui/
```

**Tailwind v4 migration notes**:

- No more `tailwind.config.ts` — theme lives entirely in CSS via `@theme {}` (preserves CSS-first ergonomics)
- No more `postcss.config.js` — `@tailwindcss/vite` plugin handles everything
- `@import 'tailwindcss'` replaces `@tailwind base/components/utilities`
- Dark-mode opt-in via `@custom-variant dark (&:is(.dark *));` (class-based, not media-based)
- Source of truth: CSS `@theme` block + `:root`. `src/config/designTokens.ts` mirrors values for JS-side risk helpers (kept in sync manually for now).

**Requirements**: Provides the primitives consumed by every domain and layout component. ✅

---

### Task 2.3: Domain Components ✅ COMPLETED

**Goal**: Build the contract-domain components Shadcn doesn't ship.

**Deliverables** (each component follows the project structure: `ComponentName.tsx` + `useComponentName.ts` + `index.ts` + co-located `.test.tsx`):

- [x] `RiskBadge` — score + dot + DM Mono numeric, threshold-driven colour, sizes sm/lg, accessible `role="status"` (10 tests)
- [x] `RiskBar` — horizontal progress (72×5px), fill colour by threshold, score label, `role="progressbar"` with aria-valuenow/min/max (7 tests)
- [x] `FlagsSummary` — inline red/orange/green dot+count display, renders `—` when no urgent flags, screen-reader summary (7 tests)
- [x] `TypePill` — 6 contract-type mappings (vendor / license / partnership / customer / lease / nda), each with distinct colour scheme (4 tests)
- [x] `KPICard` — wraps Shadcn `Card`, slots for label / value / delta (up/down/flat) / hint, ReactNode-friendly value slot (7 tests)
- [x] Each component uses Tailwind classes referencing tokens (no inline hex), pulls colour helpers from `designTokens.ts`
- [x] Accessibility: ARIA roles, descriptive aria-labels, decorative elements marked aria-hidden
- [x] Smoke-test page in `App.tsx` renders all components together

**Files**:

```
apps/frontend/src/components/core/
├── RiskBadge/      (RiskBadge.tsx + useRiskBadge.ts + RiskBadge.test.tsx + index.ts)
├── RiskBar/        (same structure)
├── FlagsSummary/   (same structure)
├── TypePill/       (same structure)
└── KPICard/        (same structure)
```

**Total tests**: 35 component tests + 22 token tests = 57/57 passing.

**Storybook stories**: deferred — Storybook is not yet installed. Visual smoke testing is done via `App.tsx` for now.

**Requirements**: Used by Home, Results, Compare, Portfolio screens. ✅

---

### Task 2.4: Layout Components ✅ COMPLETED

**Goal**: Application chrome shared by every screen.

**Deliverables**:

- [x] `TopNav` (9 tests) — logo, primary nav links with aria-current, profile dropdown (Shadcn `dropdown-menu` + `avatar`), initials fallback, sign-out action
- [x] `OrgBanner` (8 tests) — org name + optional workspace tag + status dot (operational / degraded / outage)
- [x] `PageShell` (6 tests) — page wrapper (max-width: md/lg/xl/full, default xl=1120px), optional header slot rendered outside `<main>`, mobile-first padding (`px-md md:px-lg lg:px-xl`)
- [x] Responsive: nav links hidden below `md` breakpoint, avatar/dropdown remains accessible at all sizes
- [x] All three use Tailwind classes referencing tokens — no inline hex

**Files**:

```
apps/frontend/src/components/layout/
├── TopNav/       (TopNav.tsx + useTopNav.ts + TopNav.test.tsx + index.ts)
├── OrgBanner/    (same structure)
└── PageShell/    (same structure)
```

**Note**: hamburger menu for narrow viewports deferred — wireframes only specify primary nav at md+ sizes. Add when a screen genuinely needs mobile nav.

**Requirements**: Used by every authenticated screen. ✅

---

### Task 2.5: Centralised Icons ✅ COMPLETED

**Goal**: All SVG icons in one tree-shakeable module; lint rule prevents inline SVG.

**Deliverables**:

- [x] `apps/frontend/src/components/core/icons.tsx` re-exports 23 curated Lucide icons under semantic names:
  - Status / feedback: AlertIcon, CheckIcon, CheckCircleIcon, InfoIcon
  - Navigation: ArrowRightIcon, ChevronDownIcon, ChevronRightIcon, ExternalLinkIcon
  - Actions: PlusIcon, EditIcon, TrashIcon, DownloadIcon, UploadIcon
  - UI: SearchIcon, FilterIcon, MenuIcon, MoreIcon, CloseIcon, EyeIcon
  - User: UserIcon, LogoutIcon, SettingsIcon
  - Content: FileIcon
- [x] Icons inherit text colour via Lucide's built-in `currentColor` stroke
- [x] Tests (4 tests) verify re-export surface, render as `<svg>`, accept `className`, use `currentColor`
- [x] Storybook catalogue deferred (Storybook not yet installed in workspace)

**Files**:

```
apps/frontend/src/components/core/icons.tsx
apps/frontend/src/components/core/icons.test.tsx
```

**Convention**: lint rule for inline `<svg>` not added yet — convention enforced through code review for now. Can be wired up via `eslint-plugin-jsx-a11y` or a custom rule later.

**Requirements**: Used everywhere a glyph is needed. ✅

---

### Phase 2 Summary

**Five focused tasks** instead of 30+ subtasks. The lean scope deliberately excludes:

- ❌ Custom Button / Badge / Input / Card / Modal / Tabs / Checkbox — Shadcn ships these
- ❌ Separate "responsive CSS" task — handled inline by Tailwind utilities in each component
- ❌ Separate "Tailwind config" task — folded into Task 2.1 (tokens + Tailwind go together)

**Exit criteria**: All wireframe screens (Home, Upload, Results, Compare, Portfolio, Renewals, Settings, Export) can be assembled from `components/ui/*` (Shadcn) + `components/core/*` (domain) + `components/layout/*` without inventing new primitives.

## Phase 3: User Story — Authentication (Requirement 0)

**Status**: 🎯 Ready for implementation  
**Estimated effort**: 8-12 days

**Overview**: Implement Auth0 Universal Login with Authorization Code Flow, server-side token encryption, and seamless automatic redirect flow. Users accessing protected routes without authentication are automatically redirected to Auth0, then returned to their original destination after login.

**Key Architecture Decisions**:

- ✅ Tokens stored server-side only (never in browser)
- ✅ Access and refresh tokens encrypted separately (AES-256-CBC)
- ✅ httpOnly session cookie with signed reference
- ✅ Automatic redirect on 401 with returnUrl preservation
- ✅ No intermediate login page (seamless UX)

---

### Task 3.1: Authentication Domain Model ✅ COMPLETED

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
│   ├── EncryptedAccessToken (AES-256-CBC encrypted)
│   ├── EncryptedRefreshToken (AES-256-CBC encrypted)
│   ├── EncryptionSalt (PBKDF2 salt)
│   ├── KeyName (rotating key identifier)
│   └── SessionExpiry
├── Domain Events:
│   ├── SessionCreatedEvent
│   ├── SessionRefreshedEvent
│   └── SessionInvalidatedEvent
└── Invariants:
    ├── Session must have valid expiry (future date)
    ├── Access token and refresh token must be encrypted separately before storage
    ├── Each session must have its own salt for encryption
    └── Session belongs to exactly one User
```

**Deliverables**:

- [x] User aggregate with `User.create()` / `User.rehydrate()` factories, plus `recordLogin`, `recordLogout`, `changeRole`
- [x] Session aggregate with `Session.create()` / `Session.rehydrate()` factories, plus `refresh`, `invalidate`, `isExpired`, `belongsTo`
- [x] Value objects (10): UserId, SessionId, Email, UserRole, Auth0SubjectId, EncryptedAccessToken, EncryptedRefreshToken, EncryptionSalt, KeyName, SessionExpiry
- [x] Domain events (6): UserCreatedEvent, UserLoggedInEvent, UserLoggedOutEvent, SessionCreatedEvent, SessionRefreshedEvent, SessionInvalidatedEvent
- [x] Repository interfaces (2) with `Symbol` DI tokens: IUserRepository, ISessionRepository
- [x] Unit tests for aggregates and value objects — 89 new tests, all passing

**Test count**: 235 → 324 (+89 tests, +12 suites)

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
├── encrypted-access-token.vo.ts
├── encrypted-refresh-token.vo.ts
├── encryption-salt.vo.ts
├── key-name.vo.ts
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

### Task 3.2: Authentication Application Layer ✅ COMPLETED

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

- [x] LoginCommand + LoginHandler — Auth0 code exchange → find-or-create user → encrypt tokens → create Session, emit lifecycle events
- [x] LogoutCommand + LogoutHandler — invalidate session, decrypt refresh token, revoke at OAuth provider (best-effort, swallows failures), delete session
- [x] RefreshSessionCommand + RefreshSessionHandler — silent token refresh, rotates access token (and refresh token if provider rotates it), throws Unauthorized on expired session
- [x] GetCurrentUserQuery + GetCurrentUserHandler — user view DTO
- [x] ValidateSessionQuery + ValidateSessionHandler — returns `valid` / `expired` / `not_found` (malformed session id treated as not_found)
- [x] Event handlers (Phase 3 stubs that log; will dispatch RecordAuditEventCommand in Phase 6): UserLoggedInHandler, SessionInvalidatedHandler
- [x] Two new ports in domain layer: IOAuthProvider, ISessionEncryption (with Symbol DI tokens)
- [x] Test helpers (in-memory repos + fake adapters) under `src/modules/auth/test/`
- [x] 25 new handler tests, all passing

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

### Task 3.3: Authentication Infrastructure Layer ✅ COMPLETED

**Goal**: Prisma repositories, Auth0 integration, session guard

**Complete Authentication Flow**:

```
1. User visits app → not authenticated → automatic redirect to Auth0

   a. User navigates to protected route (e.g., /dashboard)
   b. ProtectedRoute component checks authentication via useAuth hook
   c. useAuth calls GET /api/v1/auth/me
   d. Backend SessionAuthGuard finds no session cookie → throws 401
   e. Frontend axios interceptor catches 401 → redirects to:
      /api/v1/auth/login?returnUrl=/dashboard

2. Backend GET /api/v1/auth/login endpoint:
   → Stores returnUrl in state parameter (encrypted/signed)
   → Builds Auth0 authorize URL with state (CSRF token + returnUrl)
   → Redirects browser to Auth0 Universal Login
   → https://{AUTH0_DOMAIN}/authorize?response_type=code&client_id=...&state=...

3. User authenticates on Auth0 hosted page

4. Auth0 redirects back to backend:
   → GET /api/v1/auth/callback?code=xxx&state=yyy

5. Backend /api/v1/auth/callback endpoint:
   → Validates state (CSRF protection)
   → Extracts returnUrl from state
   → Exchanges code for tokens (POST to Auth0 /oauth/token)
   → Encrypts access token and refresh token separately
   → Stores Session in database
   → Sets httpOnly session cookie
   → Redirects browser to returnUrl (or /dashboard if not provided)

6. Every subsequent request:
   → SessionAuthGuard reads cookie
   → Decrypts tokens from database
   → Validates access token
   → If expired: silently refreshes using refresh token
   → Attaches user to request context

7. Logout:
   → POST /api/v1/auth/logout
   → Deletes Session from database
   → Revokes refresh token at Auth0
   → Clears session cookie
   → Redirects to /
```

**Key UX Improvement**: No intermediate login page. User goes directly from protected route → Auth0 → back to original route.

**Deliverables**:

- [x] `PrismaUserRepository` implementing IUserRepository (upsert by id)
- [x] `PrismaSessionRepository` implementing ISessionRepository
- [x] `Auth0Service` (implements IOAuthProvider) — token exchange, refresh, revoke, `/userinfo`, plus `buildAuthorizeUrl()`. Uses `fetch` directly (no SDK).
- [x] `SessionEncryptionService` (implements ISessionEncryption) — AES-256-CBC + PBKDF2 (100k iterations, SHA-256, 16-byte salt, 16-byte IV)
- [x] `SessionAuthGuard` (registered as `APP_GUARD`) — reads signed cookie, loads session, auto-refreshes near expiry or when expired, attaches `RequestUser` to request
- [x] `AuthController` with 4 endpoints (note: per design discussion, callback is **POST** so the frontend `/auth/callback` page calls into the backend):
  - [x] **GET /api/v1/auth/login?returnUrl=** → builds signed state, 302s to Auth0
  - [x] **POST /api/v1/auth/callback** → accepts `{ code, state }`, exchanges code, encrypts tokens, creates session, sets cookie, returns `{ returnUrl }`
  - [x] **POST /api/v1/auth/logout** → revokes refresh token at Auth0, deletes session, clears cookie
  - [x] **GET /api/v1/auth/me** → returns current user
- [x] DTOs: `CallbackRequestDto` (class-validator), `CallbackResponse`, `CurrentUserResponseDto`
- [x] `UserMapper`, `SessionMapper` (aggregate ↔ Prisma row); `Session.fromDate` invariant relaxed via `SessionExpiry.rehydrate()` so already-expired sessions can be loaded
- [x] `StateTokenService` — HMAC-SHA256 signed state with CSRF + returnUrl + TTL; rejects open-redirect attempts (external URLs, protocol-relative URLs)
- [x] `SessionCookieService` — signed httpOnly cookie (`cisid`), Secure in production, SameSite=Strict
- [x] `@Public()` decorator + `@CurrentUser()` parameter decorator
- [x] `AuthModule` wires everything; registers SessionAuthGuard as `APP_GUARD`
- [x] `cookie-parser` middleware + global `ValidationPipe` wired in `main.ts`
- [x] Integration tests (Supertest) covering all four endpoints, the cookie roundtrip, state CSRF rejection, missing-body validation, and 401 paths

**Test count**: 349 → 400 (+51 tests across 5 new suites: state-token, session-cookie, session-encryption, auth0, auth.controller integration)

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

### Task 3.4: Authentication UI

**Goal**: Login redirect, logout button, session management with 3-tier API architecture

**3-Tier API Call Stack**:

```
UI Hook (useAuth.ts)
  → Service (authService.ts)
    → httpService (httpService.ts)
      → Axios (client.ts)
```

**Component Structure** (applies to ALL components):

- **ComponentName.tsx**: JSX only, max 15 lines, no logic
- **useComponentName.ts**: All UI logic (hooks, state, handlers)
- **ComponentName.module.css**: All styles
- **ComponentName.test.tsx**: Unit tests
- **ComponentName.stories.tsx**: Storybook story

**API Layer**:

- [~] Add to **src/api/endpoints.ts**:

  ```typescript
  export const API = {
    // ... existing endpoints
    AUTH_LOGIN: '/api/v1/auth/login', // Initiates Auth0 login flow (with optional returnUrl)
    AUTH_CALLBACK: '/api/v1/auth/callback', // Auth0 redirects here (backend only)
    AUTH_LOGOUT: '/api/v1/auth/logout', // Logout endpoint
    AUTH_ME: '/api/v1/auth/me', // Get current user
  };
  ```

- [~] Add **axios response interceptor** to handle 401:
  ```typescript
  // src/api/client.ts
  apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Preserve current URL for post-login redirect
        const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
        window.location.href = `${API.AUTH_LOGIN}?returnUrl=${returnUrl}`;
      }
      return Promise.reject(error);
    },
  );
  ```

**Service Layer**:

- [~] **src/services/authService.ts**
  - Calls httpService for auth endpoints
  - Unwraps ApiResponse<T>
  - No axios imports
  - **Note**: Login redirect is handled by axios interceptor on 401, not called directly

  ```typescript
  export const authService = {
    getCurrentUser: async (): Promise<User> => {
      return httpService.get<User>(API.AUTH_ME).then(unwrap);
    },

    logout: async (): Promise<void> => {
      return httpService.post<void>(API.AUTH_LOGOUT, {}).then(unwrap);
    },
  };
  ```

**Hook Layer**:

- [~] **useAuth.ts**: React Query hook
  - Calls authService methods
  - No httpService or axios imports
  - Returns { user, isLoading, isAuthenticated, logout }
  - **Note**: Login redirect handled automatically by axios interceptor on 401

  ```typescript
  export function useAuth() {
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
      queryKey: ['current-user'],
      queryFn: authService.getCurrentUser,
      retry: false, // Don't retry 401s (will trigger redirect)
    });

    const logoutMutation = useMutation({
      mutationFn: authService.logout,
      onSuccess: () => {
        queryClient.clear();
        window.location.href = '/';
      },
    });

    return {
      user,
      isLoading,
      isAuthenticated: !!user,
      logout: logoutMutation.mutate,
    };
  }
  ```

**UI Components**:

- [~] **ProtectedRoute** component
  - Wraps routes requiring authentication
  - Uses useAuth hook
  - Shows loading state while checking authentication
  - If not authenticated, axios interceptor handles redirect automatically
  - No manual redirect needed (401 triggers interceptor)
- [~] **LogoutButton** component
  - Button.tsx (JSX only, max 15 lines)
  - useLogoutButton.ts (calls useAuth hook)
  - LogoutButton.module.css
  - LogoutButton.test.tsx
  - LogoutButton.stories.tsx
  - Touch target ≥44px
  - Focus indicator visible
  - ARIA label
- [~] **LoginCallbackPage** component (optional, for loading state)
  - Shows loading spinner while backend processes callback
  - Backend does all the work (exchange tokens, set cookie, redirect)
  - This page is only shown briefly during redirect
- [~] **SessionRefresh** component
  - Silent token refresh before expiry (handled by backend SessionAuthGuard)
  - No UI (background process)
  - Backend automatically refreshes tokens on expired access token

**Note**: No LoginPage needed! Users are automatically redirected to Auth0 when they access a protected route without authentication.

**Files**:

```
frontend/src/
├── api/
│   ├── client.ts              # Axios instance + 401 interceptor
│   ├── endpoints.ts           # Add auth endpoints
│   └── httpService.ts
├── services/
│   └── authService.ts         # Auth domain logic, calls httpService
├── hooks/
│   └── useAuth.ts             # React Query hook, calls authService
├── components/auth/
│   ├── LogoutButton/
│   │   ├── LogoutButton.tsx
│   │   ├── useLogoutButton.ts
│   │   ├── LogoutButton.module.css
│   │   ├── LogoutButton.test.tsx
│   │   └── LogoutButton.stories.tsx
│   ├── ProtectedRoute/
│   │   ├── ProtectedRoute.tsx
│   │   ├── useProtectedRoute.ts
│   │   ├── ProtectedRoute.module.css
│   │   ├── ProtectedRoute.test.tsx
│   │   └── ProtectedRoute.stories.tsx
│   └── SessionRefresh/
│       ├── SessionRefresh.tsx
│       ├── useSessionRefresh.ts
│       └── SessionRefresh.test.tsx
└── pages/
    └── LoginCallbackPage/      # Optional loading page
        ├── LoginCallbackPage.tsx
        ├── useLoginCallbackPage.ts
        ├── LoginCallbackPage.module.css
        └── LoginCallbackPage.test.tsx
```

**Accessibility Requirements**:

- [~] Focus indicators visible on logout button
- [~] Touch target ≥44px
- [~] ARIA label on logout button
- [~] Keyboard navigation (Tab, Enter)
- [~] Screen reader announces logout action

**Testing Requirements**:

- [~] Mock at service boundary (not axios)
- [~] Test hooks against mocked authService
- [~] Test components with mocked useAuth hook
- [~] Integration test: full auth flow

**Requirements**: 0.1-0.12

---

### Phase 3 Summary

**Status**: ✅ Specification complete, ready for implementation

**What's Been Specified**:

1. **Task 3.1 - Domain Model** (1-2 days)
   - User and Session aggregates with separate encrypted token fields
   - 12 value objects including EncryptedAccessToken, EncryptedRefreshToken
   - 6 domain events for user and session lifecycle
   - Repository interfaces (ports)

2. **Task 3.2 - Application Layer** (2-3 days)
   - 3 commands: Login, Logout, RefreshSession
   - 2 queries: GetCurrentUser, ValidateSession
   - 2 event handlers for audit logging

3. **Task 3.3 - Infrastructure Layer** (3-4 days)
   - Prisma repositories (adapters)
   - Auth0Service for token exchange and validation
   - SessionEncryptionService (AES-256-CBC + PBKDF2)
   - SessionAuthGuard (global, automatic token refresh)
   - AuthController with 4 endpoints (login, callback, logout, me)
   - **Key feature**: returnUrl preservation through Auth0 flow

4. **Task 3.4 - UI Layer** (2-3 days)
   - Axios 401 interceptor for automatic redirect
   - useAuth hook with React Query
   - authService (3-tier architecture)
   - ProtectedRoute, LogoutButton, SessionRefresh components
   - **No LoginPage needed** - automatic redirect to Auth0

**Key Architecture Decisions**:

- ✅ Tokens never touch browser (server-side only)
- ✅ Access and refresh tokens encrypted separately
- ✅ Automatic redirect on 401 with returnUrl preservation
- ✅ Seamless UX (no intermediate login page)
- ✅ Backend handles all Auth0 communication

**Authentication Flow**:

```
Protected route → 401 → Axios interceptor → /api/v1/auth/login?returnUrl=...
→ Auth0 Universal Login → /api/v1/auth/callback → Original route
```

**Total Estimated Effort**: 8-12 days

---

## Phase 4: User Story — Home Screen (US-008, Wireframe Screen 1)

### Task 4.1: Home Screen Data Layer

**Goal**: Backend API for home screen dashboard data

**Domain Model**:

```
Read Model: DashboardViewModel
├── User info (name, email, role, orgName)
├── KPIs:
│   ├── activeContractCount
│   ├── inProgressCount
│   ├── avgRiskScore
│   ├── criticalFlagCount
│   └── urgentRenewalCount
├── Recent contracts (4 most recent)
├── Urgent renewals (3 most urgent)
└── Last opened contract
```

**Deliverables**:

- [~] GET /api/v1/reference-data endpoint
- [~] Query handler to compute dashboard metrics
- [~] Business logic for KPI calculations:
  - Active contracts = status 'complete'
  - Avg risk score = mean of complete contracts
  - Critical flags = sum of red flags across portfolio
  - Urgent renewals = renewals with daysRemaining < 60
- [~] Sorting logic:
  - Recent contracts: sort by uploadDate DESC, take 4
  - Urgent renewals: sort by daysRemaining ASC, take 3
- [~] Response DTO matching wireframe data structure
- [~] **Backend-Driven UI**: Include `actions` and `ui` fields in response
  ```typescript
  {
    data: { /* dashboard data */ },
    actions: {
      canUploadDocument: { allowed: true },
      canViewContracts: { allowed: true },
      canViewRenewals: { allowed: true }
    },
    ui: {
      orgBannerText: "Northwind Holdings Ltd",
      systemStatus: "operational",
      systemStatusColor: "green"
    }
  }
  ```
- [~] Unit tests for calculations
- [~] Integration tests

**Files**:

```
backend/src/modules/reference-data/
├── application/queries/
│   ├── get-reference-data.query.ts
│   └── get-reference-data.handler.ts
├── infrastructure/
│   ├── reference-data.controller.ts
│   ├── reference-data.module.ts
│   └── dtos/reference-data.response.dto.ts
```

**Requirements**: US-008 (Home Screen), backend-driven UI

---

### Task 4.1.5: Frontend API Infrastructure Setup

**Goal**: Set up 3-tier API call stack infrastructure

**3-Tier Architecture**:

```
Layer 1: UI Hooks (useX.ts)
  ↓ calls
Layer 2: Services (src/services/)
  ↓ calls
Layer 3: httpService (src/api/httpService.ts)
  ↓ calls
Axios (src/api/client.ts)
```

**Deliverables**:

- [~] **src/api/client.ts**: Axios instance configuration

  ```typescript
  import axios from 'axios';

  export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // For session cookies
  });
  ```

- [~] **src/api/httpService.ts**: HTTP wrapper (ONLY file that imports axios)

  ```typescript
  import { apiClient } from './client';

  export const httpService = {
    get: <T>(url: string) => apiClient.get<ApiResponse<T>>(url),
    post: <T>(url: string, data: any) => apiClient.post<ApiResponse<T>>(url, data),
    put: <T>(url: string, data: any) => apiClient.put<ApiResponse<T>>(url, data),
    patch: <T>(url: string, data: any) => apiClient.patch<ApiResponse<T>>(url, data),
    delete: <T>(url: string) => apiClient.delete<ApiResponse<T>>(url),
  };
  ```

- [~] **src/api/endpoints.ts**: All API URL constants

  ```typescript
  export const API = {
    REFERENCE_DATA: '/api/v1/reference-data',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    CURRENT_USER: '/api/v1/auth/me',
    // ... all other endpoints
  };
  ```

- [~] **src/api/unwrap.ts**: ApiResponse<T> unwrapper utility

  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
  }

  export function unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success || !response.data) {
      throw new Error(response.error || 'Unknown error');
    }
    return response.data;
  }
  ```

- [~] **src/types/api.ts**: Shared API types

  ```typescript
  export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    error?: string;
    meta?: PaginationMeta;
  }

  export interface PaginationMeta {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  }
  ```

**Files**:

```
frontend/src/
├── api/
│   ├── client.ts              # Axios instance only
│   ├── httpService.ts         # HTTP layer (only axios imports here)
│   ├── endpoints.ts           # All API URLs as constants
│   └── unwrap.ts              # ApiResponse unwrapper utility
└── types/
    └── api.ts                 # Shared API types
```

**Rules**:

- [~] ONLY httpService.ts imports axios
- [~] Services call httpService, never axios directly
- [~] Hooks call services, never httpService or axios
- [~] All API URLs defined in endpoints.ts
- [~] Every service method calls .then(unwrap)
- [~] No URL string literals outside endpoints.ts

**Testing**:

- [ ] Mock at service boundary (not axios)
- [~] Test services with mocked httpService
- [~] Test hooks with mocked services

**Requirements**: Frontend architecture guidelines

---

### Task 4.2: Home Screen UI Components

**Goal**: Implement all home screen sections matching wireframe with 3-tier API architecture

**3-Tier API Call Stack**:

```
UI Hook (useHomePage.ts)
  → Service (referenceDataService.ts)
    → httpService (httpService.ts)
      → Axios (client.ts)
```

**Component Structure** (applies to ALL components):

- **ComponentName.tsx**: JSX only, max 15 lines, no logic
- **useComponentName.ts**: All UI logic (hooks, state, handlers)
- **ComponentName.module.css**: All styles
- **ComponentName.test.tsx**: Unit tests
- **ComponentName.stories.tsx**: Storybook story

**API Layer Setup**:

- [~] **src/api/client.ts**: Axios instance only
- [~] **src/api/httpService.ts**: HTTP wrapper (only file that imports axios)
- [ ] **src/api/endpoints.ts**: All API URL constants
  ```typescript
  export const API = {
    REFERENCE_DATA: '/api/v1/reference-data',
    // ... other endpoints
  };
  ```
- [ ] **src/api/unwrap.ts**: ApiResponse<T> unwrapper utility
  ```typescript
  export function unwrap<T>(response: ApiResponse<T>): T {
    if (!response.success) {
      throw new Error(response.error || 'Unknown error');
    }
    return response.data!;
  }
  ```

**Service Layer**:

- [~] **src/services/referenceDataService.ts**
  - Calls httpService.get(API.REFERENCE_DATA)
  - Unwraps ApiResponse<ReferenceDataResponse>
  - Returns typed domain data
  - No axios imports
  ```typescript
  export const referenceDataService = {
    getReferenceData: async (): Promise<ReferenceDataResponse> => {
      return httpService.get<ReferenceDataResponse>(API.REFERENCE_DATA).then(unwrap);
    },
  };
  ```

**Hook Layer**:

- [~] **useReferenceData.ts**: React Query hook
  - Calls referenceDataService.getReferenceData()
  - No httpService or axios imports
  - Returns { data, isLoading, error, refetch }
  ```typescript
  export function useReferenceData() {
    return useQuery({
      queryKey: ['reference-data'],
      queryFn: referenceDataService.getReferenceData,
      refetchOnWindowFocus: false,
    });
  }
  ```

**UI Components**:

- [~] **HomePage** component (main container)
  - Uses useReferenceData hook
  - Passes data to child components
  - No API calls directly
- [~] **OrgBanner** component
  - Background: white, border-bottom
  - Padding: 14px 32px
  - Left: Icon + "Northwind Holdings Ltd" + description
  - Right: Status dot + "All systems operational"
  - Responsive: stack on mobile
- [~] **GreetingSection** component
  - Heading: "Good morning, [name]" (32px weight 800)
  - Context paragraph with critical flags + urgent renewals
  - Action buttons: "View all contracts" + "+ Upload contract"
  - Responsive: stack buttons on mobile
- [~] **KPICards** component
  - Grid: 4 columns (responsive: 2 cols on tablet, 1 col on mobile)
  - 4 cards: Active contracts, Avg risk score, Critical flags, Renewals <60d
  - StatCard component with dynamic colors
  - Mobile-first: 1 col → 2 col → 4 col
- [~] **WhereToStart** component
  - Grid: 1.4fr 1fr (responsive: 1 col on mobile)
  - Left: Upload CTA card (dark background, blue accent circle)
  - Right column: Resume card + Browse register + Review renewals
  - Mobile-first: stack vertically
- [~] **RecentContracts** component
  - Card with header + "See all →" button
  - 4 rows: TypePill, contract name, party, flags, risk badge
  - Hover state: background change
  - Click: navigate to portfolio
  - Responsive: horizontal scroll on mobile
- [~] **UrgentRenewals** component
  - Card with header + "All →" button
  - 3 rows with left border colored by urgency (red/orange/green)
  - Days remaining display with color coding
  - Click: navigate to renewals
  - Responsive: horizontal scroll on mobile
- [~] **HowItWorks** component
  - Section title + description
  - 4-step grid: numbered circles, labels, descriptions, owners
  - Arrow connectors between steps
  - Responsive: 2 cols on tablet, 1 col on mobile
- [~] **PlaybookExamples** component
  - 2-column grid (responsive: 1 col on mobile)
  - Left: Playbook rules with severity indicators
  - Right: Team contacts with avatars
  - Mobile-first: stack vertically

**Files**:

```
frontend/src/
├── api/
│   ├── client.ts              # Axios instance only
│   ├── httpService.ts         # HTTP layer (only axios imports here)
│   ├── endpoints.ts           # All API URLs as constants
│   └── unwrap.ts              # ApiResponse unwrapper utility
├── services/
│   └── referenceDataService.ts # Domain logic, calls httpService
├── hooks/
│   └── useReferenceData.ts    # React Query hook, calls service
├── pages/HomePage/
│   ├── HomePage.tsx           # JSX only, max 15 lines
│   ├── useHomePage.ts         # All logic (uses useReferenceData)
│   ├── HomePage.module.css    # Styles
│   ├── HomePage.test.tsx      # Tests
│   └── HomePage.stories.tsx   # Storybook
└── components/home/
    ├── OrgBanner/
    │   ├── OrgBanner.tsx
    │   ├── useOrgBanner.ts
    │   ├── OrgBanner.module.css
    │   ├── OrgBanner.test.tsx
    │   └── OrgBanner.stories.tsx
    ├── GreetingSection/
    │   ├── GreetingSection.tsx
    │   ├── useGreetingSection.ts
    │   ├── GreetingSection.module.css
    │   ├── GreetingSection.test.tsx
    │   └── GreetingSection.stories.tsx
    ├── KPICards/
    │   ├── KPICards.tsx
    │   ├── useKPICards.ts
    │   ├── KPICards.module.css
    │   ├── KPICards.test.tsx
    │   └── KPICards.stories.tsx
    ├── WhereToStart/
    │   ├── WhereToStart.tsx
    │   ├── useWhereToStart.ts
    │   ├── WhereToStart.module.css
    │   ├── WhereToStart.test.tsx
    │   └── WhereToStart.stories.tsx
    ├── RecentContracts/
    │   ├── RecentContracts.tsx
    │   ├── useRecentContracts.ts
    │   ├── RecentContracts.module.css
    │   ├── RecentContracts.test.tsx
    │   └── RecentContracts.stories.tsx
    ├── UrgentRenewals/
    │   ├── UrgentRenewals.tsx
    │   ├── useUrgentRenewals.ts
    │   ├── UrgentRenewals.module.css
    │   ├── UrgentRenewals.test.tsx
    │   └── UrgentRenewals.stories.tsx
    ├── HowItWorks/
    │   ├── HowItWorks.tsx
    │   ├── useHowItWorks.ts
    │   ├── HowItWorks.module.css
    │   ├── HowItWorks.test.tsx
    │   └── HowItWorks.stories.tsx
    └── PlaybookExamples/
        ├── PlaybookExamples.tsx
        ├── usePlaybookExamples.ts
        ├── PlaybookExamples.module.css
        ├── PlaybookExamples.test.tsx
        └── PlaybookExamples.stories.tsx
```

**Accessibility Requirements** (ALL components):

- [~] Focus indicators visible (3px outline)
- [~] Touch targets ≥44px on mobile
- [~] ARIA labels where needed
- [ ] Keyboard navigation (Tab, Enter)
- [~] Color contrast ≥4.5:1
- [~] Semantic HTML
- [~] Screen reader tested

**Testing Requirements**:

- [ ] Mock at service boundary (not axios)
- [~] Test hooks against mocked services
- [~] Test components with mocked hooks
- [~] Integration test: full API flow

**Requirements**: US-008 (all acceptance criteria), wireframe pixel-perfect match

---

## Phase 4.5: Product Analytics (PostHog)

**Goal**: Wire PostHog into the frontend so we can measure feature adoption, user journeys, and drop-off points starting now (rather than retrofitting later when sample size matters).

**Why now, not later**: Analytics is cheapest to instrument as features are built. Adding it before Phase 5 (Upload) means upload events get tracked from day one rather than backfilled.

**Decisions (2026-05-14)**:

- **Region**: PostHog EU Cloud (`https://eu.i.posthog.com`) — UK/EU data residency, matches the Auth0 `.uk` tenant.
- **SDK**: `posthog-js` vanilla SDK + PostHog's React provider wrapper (no third-party React libs).
- **Config**: Public Project API Key (`phc_…`) only — safe to ship to browser. Comes from `VITE_POSTHOG_KEY` in `apps/frontend/.env.local` (gitignored).
- **Identification**: Auto-identify on login using Auth0 `userId` (stable, opaque). `email` attached as a property. `posthog.reset()` on logout.
- **Privacy defaults**: Respect Do Not Track. No PII inside custom event payloads (only ids + non-sensitive metadata). Auto-capture stays ON for pageviews/clicks/forms — PostHog's defaults are reasonable for an internal tool at this stage.
- **No Shadcn**: No UI components needed for this phase; pure plumbing.

---

### Task 4.5.1: PostHog SDK Install + Initialization

**Goal**: Get PostHog loaded in the app with the correct EU host and project key, no errors in console, no events fired yet.

**Deliverables**:

- [~] Install `posthog-js` (single dep, vanilla SDK is enough — we'll write a thin provider ourselves)
- [~] Add `VITE_POSTHOG_KEY` and `VITE_POSTHOG_HOST` to `apps/frontend/.env.example` (committed) with placeholder values + a comment explaining each
- [~] Add the real key + host to `apps/frontend/.env.local` (gitignored)
- [~] Create `apps/frontend/src/analytics/posthog.ts`:
  - Exports `initPostHog()` — idempotent init wired to env vars
  - No-ops if `VITE_POSTHOG_KEY` is missing (so dev can run without it)
  - Calls `posthog.init(...)` with `api_host: VITE_POSTHOG_HOST`, `capture_pageview: true`, `respect_dnt: true`
- [~] Call `initPostHog()` in `main.tsx` before React mounts
- [~] Verify in browser: PostHog network request to `https://eu.i.posthog.com/e/` succeeds on page load (pageview event)
- [~] Verify in PostHog dashboard: live events show up under "Activity"

**Files**:

```
apps/frontend/
├── .env.example                       # Add VITE_POSTHOG_KEY + VITE_POSTHOG_HOST placeholders
├── .env.local                         # (gitignored) real values
└── src/
    ├── main.tsx                       # Add initPostHog() call
    └── analytics/
        └── posthog.ts                 # init function
```

**Definition of Done**:

- [~] Page loads without PostHog-related console errors
- [~] A pageview event appears in the PostHog EU dashboard for `/` within ~30s
- [~] App still runs cleanly when `VITE_POSTHOG_KEY` is unset (no init, no errors)

---

### Task 4.5.2: User Identification Lifecycle

**Goal**: Tie pageviews and events to a real user once they log in, and disassociate cleanly on logout. No PII leaks into event names.

**Deliverables**:

- [~] Create `useAnalyticsIdentity` hook (or inline into `useAuth`) that:
  - Calls `posthog.identify(user.userId, { email: user.email })` when `useAuth()` user transitions from null → defined
  - Calls `posthog.reset()` on logout
  - Idempotent — doesn't re-identify on every render
- [~] Wire it in `App.tsx` (or wherever `useAuth` is consumed at the top of the tree)
- [~] Update `HomePageContainer.handleSignOut` to call `posthog.reset()` before redirecting
- [~] Privacy review:
  - Confirm `respect_dnt: true` works (test by enabling DNT in browser)
  - Confirm only `userId` + `email` are attached (no name, no roles unless added intentionally)
  - Auto-capture remains ON but verify it isn't capturing input field values (`sanitize_input: true` if needed)

**Files**:

```
apps/frontend/src/
├── analytics/
│   ├── posthog.ts
│   └── useAnalyticsIdentity.ts        # new — identify/reset lifecycle
├── App.tsx                            # wire hook
└── pages/HomePage/HomePageContainer.tsx   # posthog.reset() in handleSignOut
```

**Definition of Done**:

- [~] After login, events in PostHog show the logged-in user's `distinct_id = userId`
- [~] After logout, subsequent events have a fresh anonymous `distinct_id`
- [~] With DNT enabled in browser, no events fire (verify in network tab)

---

### Task 4.5.3: Typed Analytics Service + Starter Events

**Goal**: Don't sprinkle `posthog.capture('foo', { ... })` calls across the codebase. Channel all custom tracking through one typed module so events are discoverable, types are enforced, and renaming an event is a single-file change.

**Deliverables**:

- [~] Create `apps/frontend/src/analytics/analytics.ts`:
  - Defines a union type of all event names (`AnalyticsEventName`)
  - Defines a typed payload map (`AnalyticsEventPayloads`) — strong types per event
  - Exports `track<E extends AnalyticsEventName>(event: E, payload: AnalyticsEventPayloads[E])` — typed wrapper around `posthog.capture`
  - No-ops if PostHog isn't initialized
- [~] Implement starter event set:
  - `auth_login_success` → `{}`
  - `auth_logout` → `{}`
  - `dashboard_viewed` → `{ kpis_critical_flag_count: number; kpis_urgent_renewal_count: number }`
  - `dashboard_kpi_clicked` → `{ kpi: 'active' | 'risk' | 'flags' | 'renewals' }` (groundwork — not all wired yet)
  - `dashboard_upload_cta_clicked` → `{ source: 'greeting' | 'where_to_start' }`
- [~] Wire the first three:
  - `LoginCallbackPage` after successful exchange → `track('auth_login_success')`
  - `HomePageContainer.handleSignOut` → `track('auth_logout')` before reset
  - `HomePageV2Container` / `HomePageContainer` on mount with data → `track('dashboard_viewed', { ... })`
- [~] Add unit tests for `analytics.ts`:
  - `track` calls `posthog.capture` with the right args
  - `track` is a no-op when PostHog isn't initialized
- [~] Update `ACCESSIBILITY_AUDIT.md` or add `ANALYTICS.md` documenting the event taxonomy

**Files**:

```
apps/frontend/src/analytics/
├── posthog.ts
├── useAnalyticsIdentity.ts
├── analytics.ts                       # typed event API
├── analytics.test.ts                  # unit tests
└── events.ts                          # (optional split) event names + payload types

apps/frontend/ANALYTICS.md             # event taxonomy reference
```

**Definition of Done**:

- [~] All 5 starter events have typed signatures
- [~] 3 events fire in real flows and appear in PostHog
- [~] Tests pass
- [~] `track('some_event', { wrong: 'payload' })` is a TypeScript error
- [~] `ANALYTICS.md` lists every event, who fires it, and the payload schema

---

**Phase 4.5 Exit Criteria**:

- [x] Live PostHog dashboard shows pageviews + custom events with correctly-identified users
- [x] Phase 5 (Upload Screen) can fire `upload_started` / `upload_completed` / `upload_failed` events by just adding them to `events.ts` and calling `track(...)` — no SDK wiring needed
- [x] Privacy: DNT respected (`respect_dnt: true`), `identified_only` person profiles, no PII in custom event names or top-level payload keys

**Phase 4.5 completion** (2026-05-14): 🎉 **3/3 tasks complete (100%)** plus ErrorBoundary exception wiring as a bonus.

**What landed**:

- `analytics/` module with single import surface: `track`, `useHoverTracker`, `identify`, `reset`, `initPostHog`, `isPostHogEnabled`
- 8 typed events in `events.ts` covering auth lifecycle, top-nav, dashboard interactions, upload CTA hover/click, KPI hover, resume contract
- All previously-direct `posthog.capture` / `posthog.identify` calls migrated to the typed pattern (one consolidated event taxonomy)
- `ErrorBoundary` wired to `posthog.captureException` for runtime React errors (separate channel from analytics events)
- Demo instrumentation on `/v2` dashboard (KPI hovers + Upload CTA click/hover) — ready to expand from there

**Commits**: 412f5bc (tasks doc) → 98177b3 (SDK init) → 8f9e19e (typed service + hover hook + demo) → 2f3154b (migrate parallel calls + identify/reset) → ff162f4 (ErrorBoundary exception capture)

**Dependencies**: Phase 3 (auth wired and live, since we identify on login). ✅

---

## Phase 5: User Story — Upload Screen (Wireframe Screen 2)

**Approach**: UI-first (same pattern as Phase 4). Build the screen against a mock `documentService`, then build the backend, then swap mock → real in one service-layer edit.

**Wireframe source**: `wirframes/version_02/design_handoff_ci_redesign/screens/upload.html` + `screens-a.jsx`

**Component approach**: Custom components (plain React + CSS modules + Lucide). NOT Shadcn. Follow the `HomePageV2/components/` pattern.

### Locked design decisions (2026-05-14)

- **Single-file v1**: One file per upload. No bulk. Wireframe's "up to 20 at once" is deferred.
- **File types: PDF only**. Wireframe shows PDF/DOCX/PPTX; we ship PDF first and add the others when the extraction pipeline is ready for them.
- **Post-submit flow: 3-screen** (matches wireframe). Upload submits → navigate to `/processing/:documentId` → on completion navigate to `/results/:documentId`. `/processing` and `/results` are stubs in Phase 5; full pages land in later phases.
- **Consent copy**: kept literal — names "Claude AI" as the analyser. Transparent, easy to revisit if the AI vendor ever changes.
- **Page copy**: stays "contract" / "Analyze contract" (matches current product brand). Don't parameterise the noun in v1.
- **State machine**: dropped the `processing` state for v1. Document lifecycle is `pending → uploading → complete/failed`. Add `processing` back when OCR/extraction lands.
- **Multi-tenancy**: `Document` carries `OrgId`. All repository queries filter by it. For v1, **`OrgId` is derived 1:1 from the session's `userId`** (no separate `Org` aggregate yet) — the field exists, the query plumbing works, real `Org` / `UserOrgMembership` models land in a later phase when actual multi-tenancy ships. This way Phase 5 doesn't snowball.
- **Storage architecture (updated 2026-05-14)**: **all uploads are backend-proxied**, not just local. The browser PUTs to `/api/v1/documents/upload/raw/:storageKey` regardless of `STORAGE_DRIVER`; the controller streams the body through `IStorageService.writeStream` to the active driver (disk or GCS). Rationale: every byte flows through our perimeter — scannable, auditable, encryptable under our own key. Trade-off: backend bears the streaming cost (~50 MB streaming through Node per upload). Direct-to-GCS (presigned URL) capability is retained in `GcsStorageDriver` as a private utility for a possible future opt-in.
- **Idempotency on `InitiateUpload`**: not enforced in v1. Accept that a double-click can produce an orphan Document; cleanup is a later concern.
- **Delete-anytime trust badge**: kept in UI copy, backed by a soft-delete in v1 (status flag, file stays on disk). Real cleanup is a later concern.

---

### Task 5.1: Upload Screen UI — Pixel-Sharp Layout (with mock service)

**Goal**: Build the upload screen exactly matching the wireframe, wired to a mock `documentService` that simulates the full upload flow (initiate → upload → complete → status). No backend work yet.

**Mock Service Behaviour**:

```
documentService (mock):
├── initiateUpload(file) → { uploadUrl: 'mock://...', documentId: 'doc-<uuid>' } after 300ms
├── uploadToStorage(url, file) → resolves with simulated 0%→100% progress over ~2s
├── completeUpload(documentId) → resolves after 200ms
└── getUploadStatus(id) → cycles 'pending' → 'uploading' → 'complete'

Failure modes (toggleable via dev-mode flag for testing):
├── 'file-too-large' → throw at initiateUpload
├── 'invalid-type' → throw at initiateUpload
└── 'network-error' → throw at uploadToStorage
```

**3-Tier API Call Stack** (same architecture as Phase 4):

```
UI Hook (useUpload.ts)
  → Service (documentService.ts — mock for now)
    → httpService (httpService.ts)
      → Axios (client.ts)
```

In Phase 5.1, `documentService.ts` returns mocked data directly. In Phase 5.4, only this file changes.

**API Layer**:

- [ ] Add to **src/api/endpoints.ts**:
  ```typescript
  export const API = {
    // ... existing endpoints
    INITIATE_UPLOAD: '/api/v1/documents/upload/initiate',
    COMPLETE_UPLOAD: '/api/v1/documents/upload/complete',
    UPLOAD_STATUS: (id: string) => `/api/v1/documents/${id}/status`,
  };
  ```

**Service Layer (mock)**:

- [~] **src/services/documentService.ts** — returns mock data in dev mode
  - Same shape as the eventual real service
  - Simulated network delays
  - Simulated progress events
  - Dev-toggle for forcing failure modes

**Hook Layer**:

- [~] **useUpload.ts** — React Query mutation hook
  - Orchestrates initiate → upload → complete
  - Tracks progress (0-100%)
  - Returns `{ upload, isUploading, progress, error, documentId }`

**UI Components** (all custom, inside `pages/UploadPage/components/`):

- [~] **UploadPage** — page shell, uses `useUpload`
- [~] **UploadDropzone** — drag-and-drop area
  - Dashed border, blue active state on drag-over
  - File input (hidden, click to open)
  - File validation feedback (size, type)
  - Shows selected file name + formatted size
- [~] **FileSelectedCard** — shows the chosen file with remove button
- [~] **ConsentCheckbox** — custom checkbox + label, required before upload
- [~] **UploadButton** — primary CTA, disabled until file + consent
- [~] **UploadProgress** — progress bar 0–100% with status text
- [~] **UploadStatusToast** (or inline panel) — success/error feedback
- [~] **HelperText** — "PDF · up to 50 MB · 60s analysis"

**Files**:

```
apps/frontend/src/
├── api/
│   └── endpoints.ts                       # Add upload endpoints
├── services/
│   └── documentService.ts                 # Mock implementation (returns fake data)
├── hooks/
│   └── useUpload.ts                       # React Query mutation
└── pages/UploadPage/
    ├── UploadPage.tsx
    ├── UploadPageContainer.tsx
    ├── UploadPage.module.css
    ├── UploadPage.stories.tsx
    └── components/
        ├── UploadDropzone/
        │   ├── UploadDropzone.tsx
        │   └── UploadDropzone.module.css
        ├── FileSelectedCard/
        ├── ConsentCheckbox/
        ├── UploadButton/
        ├── UploadProgress/
        ├── UploadStatusToast/
        └── HelperText/
```

**Definition of Done**:

- [~] `/upload` route renders the page
- [~] Drag-and-drop accepts PDF only, rejects everything else with a clear error
- [~] File size validation (≤50MB) with clear error
- [~] Consent checkbox blocks upload until checked
- [~] Mock upload flow completes end-to-end in ~3s
- [~] Progress bar animates 0→100%
- [~] Success state shows the document id (or navigates to results — TBD)
- [~] Failure states render appropriate error UI
- [~] Visually matches the wireframe pixel-for-pixel (verified by side-by-side)

**Requirements**: US-009 (Upload Screen), 1.1-1.5

---

### Task 5.2: Upload Screen UI — Routing, Edge Cases & Accessibility Audit

**Goal**: Wire the screen into the app, handle all edge cases, complete WCAG 2.1 AA audit.

**Routing**:

- [~] `/upload` route in `App.tsx` (protected via `ProtectedRoute`)
- [~] Navigation from Home screen "+ Upload contract" button now routes to `/upload`
- [~] Successful upload navigates to `/results/:documentId` (placeholder for Phase 6/7)
- [~] Cancel button returns to `/`

**Edge Cases**:

- [~] File too large (>50MB) — inline error + helpful message
- [~] Invalid file type — inline error listing supported types
- [~] Network failure mid-upload — retry button + error toast
- [~] User navigates away during upload — confirm dialog
- [~] Consent unchecked — upload button disabled with explanation
- [~] No file selected — upload button disabled
- [~] Successful upload — clear success state with next-action CTA

**Storybook Stories** (all states, like HomePage):

- [~] Empty / initial state
- [~] FileSelected (PDF, small) / FileSelected (PDF, near 50MB limit)
- [~] FileSelected with consent checked
- [~] Uploading at 25% / 50% / 75% / 100%
- [~] Processing state
- [~] Success state
- [~] Error: file too large
- [~] Error: invalid type
- [~] Error: network failure

**Accessibility Audit** (WCAG 2.1 AA):

- [~] Focus indicators visible on all interactive elements
- [~] Touch targets ≥44px
- [~] ARIA labels on icon-only buttons
- [~] Dropzone keyboard-accessible (Enter/Space to open file picker)
- [~] Progress announced via `aria-live="polite"`
- [~] Errors announced via `aria-live="assertive"` (or role="alert")
- [~] File input properly labelled
- [~] Consent checkbox associates label correctly
- [ ] Color contrast ≥4.5:1
- [~] Run `jest-axe` test on UploadPage
- [~] Manual keyboard navigation test
- [~] Screen reader test (VoiceOver)

**Definition of Done**:

- [~] All routes work
- [~] All edge cases produce correct UI
- [~] All Storybook stories render
- [~] `jest-axe` test passes with 0 violations
- [~] Keyboard-only flow completable end-to-end
- [~] `ACCESSIBILITY_AUDIT_UPLOAD.md` checklist filled in

**Requirements**: US-009 (acceptance criteria), accessibility

---

### Task 5.3: Document Upload Backend — Domain & Application Layer

**Goal**: Define the `Document` aggregate and CQRS commands/queries. Mock service in the UI stays in place; this task does NOT touch the frontend.

**Domain Model**:

```
Aggregate: Document
├── Value Objects:
│   ├── DocumentId (UUID)
│   ├── DocumentName
│   ├── DocumentType (PDF only in v1)
│   ├── FileSize
│   ├── UploadStatus (enum: pending, uploading, complete, failed)
│   ├── StorageKey (opaque, e.g. `{documentId}.pdf`)
│   ├── UploadedBy (UserId)
│   └── OrgId (data isolation — every repo query filters by it;
│             in v1 derived 1:1 from UserId until Org aggregate ships)
├── Domain Events:
│   ├── DocumentUploadStartedEvent
│   ├── DocumentUploadCompletedEvent
│   └── DocumentUploadFailedEvent
└── Invariants:
    ├── File size must be ≤50MB
    ├── File type must be PDF (DOCX/PPTX deferred to a later phase)
    ├── Document name must not be empty
    └── Status transitions: pending → uploading → complete/failed
        (no `processing` state in v1 — re-added when extraction pipeline lands)
```

**Application Layer (CQRS)**:

```
Commands:
├── InitiateUploadCommand → InitiateUploadHandler
│   ├── Validate file (size, type=PDF) and OrgId from session
│   ├── Generate storage URL (real GCS presigned in prod, backend-proxied URL in dev)
│   ├── Create Document aggregate (status: pending, scoped to OrgId)
│   └── Return upload URL + documentId
├── CompleteUploadCommand → CompleteUploadHandler
│   ├── Update Document status (uploading → complete)
│   ├── Emit DocumentUploadCompletedEvent
│   └── (Extraction pipeline triggering moved to a later phase)
└── FailUploadCommand → FailUploadHandler
    ├── Update Document status (uploading → failed)
    └── Emit DocumentUploadFailedEvent

Queries:
└── GetUploadStatusQuery → GetUploadStatusHandler
    └── Return current upload status (scoped to caller's OrgId)
```

**Deliverables**:

- [~] Document aggregate + factory
- [~] All value objects with validation
- [~] All domain events
- [~] `IDocumentRepository` interface
- [~] `IStorageService` interface (real impl in Task 5.4)
- [~] All command and query handlers
- [~] Unit tests for aggregate, value objects, and handlers (mock repos + storage)
- [~] Property test: file size validation, status transitions

**Files**:

```
apps/backend/src/modules/documents/
├── domain/
│   ├── document.aggregate.ts
│   ├── document-id.vo.ts
│   ├── document-name.vo.ts
│   ├── document-type.vo.ts
│   ├── file-size.vo.ts
│   ├── upload-status.vo.ts
│   ├── storage-key.vo.ts
│   ├── document.events.ts
│   ├── document.factory.ts
│   ├── document.repository.ts          # interface
│   └── storage.service.ts              # interface (port)
└── application/
    ├── commands/
    │   ├── initiate-upload.command.ts
    │   ├── initiate-upload.handler.ts
    │   ├── complete-upload.command.ts
    │   ├── complete-upload.handler.ts
    │   ├── fail-upload.command.ts
    │   └── fail-upload.handler.ts
    └── queries/
        ├── get-upload-status.query.ts
        └── get-upload-status.handler.ts
```

**Definition of Done**:

- [~] All domain and application tests pass
- [~] Coverage ≥90% on domain, ≥80% overall
- [~] No frontend changes in this task

**Requirements**: 1.1-1.5

---

### Task 5.4: Document Upload Backend — Infrastructure & Integration

**Goal**: Build the real infrastructure (Prisma repo, GCS/local storage, controller) AND swap the frontend `documentService` from mock to real. This is the task that "turns it on".

**Backend Deliverables**:

- [~] `PrismaDocumentRepository` implementing `IDocumentRepository`
- [~] `Document` Prisma model + migration
- [~] `StorageService` implementations:
  - **`LocalStorageDriver`** — fully working, writes to `apps/backend/uploads/`, serves PUT via a controller route
  - **`GcsStorageDriver`** — fully working (decision updated 2026-05-14). Streams body bytes through the backend to GCS via the SDK's `file.createWriteStream()`. Bytes pass through the backend perimeter (scannable/auditable). The original V4 presigned-URL minting code is retained as a private capability for a possible future direct-upload opt-in but is not used by the current architecture.
  - Both drivers registered as providers; a factory in `DocumentsModule` reads `STORAGE_DRIVER` env var (`local` | `gcs`) and binds one to the `IStorageService` port at boot.
  - Local-mode boot skips `GcsStorageDriver.onModuleInit` so missing GCS env vars are not a startup blocker in dev.
- [~] `DocumentController` with endpoints:
  - `POST /api/v1/documents/upload/initiate` (auth-guarded) → returns presigned URL + documentId
  - `POST /api/v1/documents/upload/complete` (auth-guarded) → confirms upload
  - `GET /api/v1/documents/:id/status` (auth-guarded) → returns current status
- [~] DTOs: `InitiateUploadDto`, `UploadResponseDto`, `CompleteUploadDto`, `UploadStatusDto`
- [~] `DocumentMapper` (Aggregate ↔ Prisma ↔ DTO)
- [~] `DocumentModule` wiring (controller, handlers, repo, storage, mapper)
- [~] All endpoints protected by `SessionAuthGuard`
- [~] All requests/responses follow `ApiResponse<T>` envelope

**Frontend Swap (one file)**:

- [~] Edit `apps/frontend/src/services/documentService.ts` — replace mock implementation with real HTTP calls via `httpService`. Hook signature unchanged. Mock toggle (dev-flag) removed. No other frontend files change.

**Files**:

```
apps/backend/src/modules/documents/
└── infrastructure/
    ├── prisma-document.repository.ts
    ├── storage/
    │   ├── storage.service.ts          # Interface re-export
    │   ├── local-storage.driver.ts
    │   └── gcs-storage.driver.ts
    ├── document.controller.ts
    ├── document.mapper.ts
    ├── document.module.ts
    └── dtos/
        ├── initiate-upload.dto.ts
        ├── upload-response.dto.ts
        ├── complete-upload.dto.ts
        └── upload-status.dto.ts

apps/backend/prisma/migrations/
└── <timestamp>_add_documents/
    └── migration.sql
```

**Testing**:

- [~] Repository integration tests (against test DB)
- [~] StorageService unit tests (local driver) + smoke test (GCS, optional gated by env)
- [~] Controller E2E tests (full upload flow: initiate → PUT to storage → complete → status)
- [~] Auth guard enforcement test (401 without session cookie)
- [~] Frontend integration test verifying real `documentService` against a mocked backend (MSW or similar)

**Definition of Done**:

- [~] Real upload works end-to-end in dev (local filesystem driver)
- [~] Auth-required: unauthenticated requests get 401
- [~] Frontend uses real service; `/upload` flow uploads a real file to disk
- [~] All tests pass (unit + integration + E2E)
- [~] No mock code remaining in `documentService.ts`

**Requirements**: US-009, 1.1-1.5

---

## Phase 6: User Story — Audit Service (Requirement 7)

### Task 6.1: Audit Domain Model

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

- [x] AuditEvent aggregate with factory
- [x] Value objects: AuditEventId, AuditAction, ActorId, ResourceId, Checksum, SequenceNumber
- [x] Domain event: AuditEventRecordedEvent
- [x] Repository interface: IAuditEventRepository
- [x] Unit tests for aggregate and value objects
- [x] Property test: Checksum verification

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

### Task 6.2: Audit Application Layer

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

- [x] RecordAuditEventCommand + RecordAuditEventHandler
- [x] QueryAuditEventsQuery + QueryAuditEventsHandler (pagination, filters)
- [x] ExportAuditLogQuery + ExportAuditLogHandler (JSON, CSV, PDF)
- [x] Event handlers for all domain events (user login, document upload, etc.)
- [x] Unit tests for all handlers
- [x] Property test: Sequence number monotonicity

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

### Task 6.3: Audit Infrastructure Layer

**Goal**: Append-only Prisma repository and audit controller

**Deliverables**:

- [x] PrismaAuditEventRepository (INSERT + SELECT only, no UPDATE/DELETE)
- [x] Database role configuration (no UPDATE/DELETE permissions)
- [x] AuditController (query endpoint, export endpoint)
- [x] DTOs: QueryAuditEventsDto, AuditEventResponseDto, ExportAuditLogDto
- [x] AuditMapper (AuditEvent aggregate ↔ Prisma ↔ DTO)
- [x] AuditModule wiring
- [x] Integration tests (verify immutability, sequence numbers)
- [x] Property test: Immutable audit log (attempt UPDATE/DELETE, verify rejection)

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

### Task 6.4: Audit UI (Optional)

**Goal**: Admin screen to view audit log

**Deliverables**:

- [x] AuditLogPage (admin only)
- [~] AuditLogTable component (filterable, paginated)
- [~] AuditEventDetail component (modal)
- [~] ExportAuditLogButton component
- [~] useAuditLog hook (React Query)
- [~] API client for /audit endpoints

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
**Phase 2**: Design System (6 tasks) — Tokens, Core Components, Layout, Modal/Tabs, Responsive, Tailwind
**Phase 3**: Authentication (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 4**: Home Screen (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 5**: Upload Screen (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 6**: Audit Service (4 tasks) — Domain → Application → Infrastructure → UI

**Total**: 30 tasks organized by phase and user story

---


## Implementation Order

1. **Phase 1: Scaffolding** (Tasks 1.1-1.8)
   - Set up monorepo structure
   - Create shared kernel (domain base classes)
   - Set up exception hierarchy
   - Configure Prisma, logging, testing

2. **Phase 2: Design System** (Tasks 2.1-2.6)
   - Extract design tokens from wireframes
   - Build core UI components (Button, Badge, RiskBadge, etc.)
   - Build layout components (TopNav, PageShell, etc.)
   - Build Modal & Tabs components
   - Implement responsive CSS
   - Configure Tailwind

3. **Phase 3: Authentication** (Tasks 3.1-3.4)
   - Domain model (User, Session aggregates)
   - Application layer (commands, queries, event handlers)
   - Infrastructure layer (Prisma repos, Auth0 integration, session guard)
   - UI layer (login redirect, logout button, protected routes)

4. **Phase 4: Home Screen** (Tasks 4.1-4.2)
   - Backend: Reference data endpoint with dashboard view model
   - Frontend: API infrastructure setup (client, httpService, endpoints, unwrap)
   - Frontend: Home page components with 3-tier API architecture

5. **Phase 5: Upload Screen** (Tasks 5.1-5.4)
   - Domain model (Document aggregate)
   - Application layer (upload commands, status queries)
   - Infrastructure layer (Prisma repo, storage service, upload controller)
   - UI layer (drag-and-drop upload with 3-tier API architecture)

6. **Phase 6: Audit Service** (Tasks 6.1-6.4)
   - Domain model (AuditEvent aggregate with tamper detection)
   - Application layer (record command, query handlers, event handlers)
   - Infrastructure layer (append-only Prisma repo, audit controller)
   - UI layer (audit log viewer, export functionality)

---

## Notes

- Each user story follows Clean Architecture: Domain → Application → Infrastructure → UI
- Domain models are defined upfront before implementation
- TDD approach: write tests alongside implementation
- Integration tests verify end-to-end flows
- Property tests validate invariants (checksums, sequence numbers, immutability)
- **Frontend architecture is non-negotiable**: 3-tier API stack, component structure, Shadcn UI base, centralized icons
- **Accessibility is built-in from day 1**: focus indicators, touch targets, ARIA labels, keyboard nav, color contrast
- **Mobile-first responsive**: start with 320px, progressively enhance with min-width media queries

---

## Phase 4: Home Screen

### Overview

Phase 4 delivers the first user-facing screen: the Home Dashboard. It introduces the `reference-data` backend module (query-only, no domain mutations) and the complete `HomePage` frontend component.

**Architecture**: The backend computes all KPIs, sorts, colors, and labels. The frontend is a pure view engine — it renders what the API returns.

**Persistence strategy**: Phase 4 uses **in-memory seed data** on the backend. The `Contract` and `Renewal` domain models ship in Phase 5 (Upload Screen). For now, `GetDashboardViewHandler` returns a hardcoded `DashboardViewModel` with realistic sample data matching the US-008 wireframe.

---

### Task 4.1: Reference Data Module — Domain & Application Layer

**Goal**: Define the `DashboardViewModel` shape and the `GetDashboardViewQuery` that produces it. No persistence adapter needed — the handler returns seed data.

**Requirements**: US-008 (Home Screen KPIs, recent contracts, urgent renewals)

**Deliverables**:

- [~] Create `src/modules/reference-data/` vertical slice skeleton
- [~] Define TypeScript interfaces / value objects for the view model:

  ```
  DashboardViewModel {
    kpis: {
      activeContractCount: number
      inProgressCount: number
      avgRiskScore: number          // rounded to 1 decimal
      criticalFlagCount: number
      urgentRenewalCount: number
      nextRenewalDate: string | null // ISO date string
    }
    recentContracts: RecentContractItem[]   // 4 most recent, sorted uploadDate DESC
    urgentRenewals: UrgentRenewalItem[]     // 3 most urgent, sorted daysRemaining ASC
    lastOpenedContract: RecentContractItem | null
  }

  RecentContractItem {
    id: string
    name: string
    type: 'vendor' | 'license' | 'lease' | 'nda' | 'partnership' | 'customer'
    riskScore: number
    riskLevel: 'low' | 'medium' | 'high' | 'critical'
    uploadedAt: string   // ISO date string
  }

  UrgentRenewalItem {
    id: string
    contractName: string
    renewalDate: string  // ISO date string
    daysRemaining: number
    urgency: 'overdue' | 'critical' | 'warning' | 'ok'
  }
  ```

- [~] Create `GetDashboardViewQuery` (no params — scoped to authenticated user's context)
- [~] Create `GetDashboardViewHandler` implementing `IQueryHandler<GetDashboardViewQuery, DashboardViewModel>`
  - Returns hardcoded seed data matching the US-008 wireframe sample (9 contracts, 6 renewals)
  - Seed data: 4 complete contracts (mixed types/risk scores), 3 urgent renewals (one overdue, one <30d, one <60d)
  - Computes all KPI values from the seed array (not hardcoded numbers — derive them from the seed data so the logic is testable)
- [~] Unit tests for `GetDashboardViewHandler`:
  - Returns correct KPI counts from seed data
  - `recentContracts` sorted by `uploadedAt` DESC, max 4 items
  - `urgentRenewals` sorted by `daysRemaining` ASC, max 3 items
  - `avgRiskScore` rounded to 1 decimal
  - `urgency` field computed correctly per threshold (overdue: <0, critical: <30, warning: <60, ok: ≥60)
  - `nextRenewalDate` is the date of the renewal with smallest positive `daysRemaining`

**Files**:

```
src/modules/reference-data/
├── application/
│   └── queries/
│       ├── get-dashboard-view.query.ts
│       ├── get-dashboard-view.handler.ts
│       └── get-dashboard-view.handler.spec.ts
└── domain/
    └── dashboard-view.model.ts   (interfaces: DashboardViewModel, RecentContractItem, UrgentRenewalItem)
```

**Test count target**: 10–15 unit tests, all passing

---

### Task 4.2: Reference Data Module — Infrastructure Layer

**Goal**: Expose `GET /api/v1/reference-data` via a NestJS controller, wire the module, add Swagger docs, and write an integration test.

**Requirements**: US-008, architecture playbook (API response envelope, SessionAuthGuard, ResponseInterceptor)

**Deliverables**:

- [~] Create `ReferenceDataResponseDto` mirroring `DashboardViewModel` with `@ApiProperty()` decorators
- [~] Create `ReferenceDataController`:
  - `@Get()` handler at `/api/v1/reference-data`
  - Protected by `SessionAuthGuard` (global guard already applied — no extra decorator needed)
  - Dispatches `GetDashboardViewQuery` via `QueryBus`
  - Returns `DashboardViewModel` — `ResponseInterceptor` wraps it in `ApiResponse<DashboardViewModel>`
  - `@ApiOperation`, `@ApiOkResponse`, `@ApiBearerAuth` Swagger decorators
- [~] Create `ReferenceDataModule`:
  - Imports `CqrsModule`
  - Registers `GetDashboardViewHandler` in `providers`
  - Exports nothing (controller-only module)
- [~] Register `ReferenceDataModule` in `AppModule`
- [~] Add `API.REFERENCE_DATA = '/api/v1/reference-data'` to frontend `endpoints.ts` (note: this is a frontend file — add it as a reminder comment in the controller or as a separate sub-task)
- [~] Controller unit test (`reference-data.controller.spec.ts`):
  - Mocks `QueryBus.execute` returning a `DashboardViewModel`
  - Asserts `GET /api/v1/reference-data` returns 200 with correct shape
  - Asserts 401 when no session cookie (via `SessionAuthGuard` mock)
- [~] E2E / integration test (`reference-data.e2e-spec.ts` in `test/`):
  - Boots full NestJS app with Supertest
  - Unauthenticated request → 401
  - Authenticated request (mock session) → 200 with `{ success: true, data: { kpis: {...}, recentContracts: [...], urgentRenewals: [...] } }`

**Files**:

```
src/modules/reference-data/
├── application/
│   └── queries/
│       └── (from Task 4.1)
├── domain/
│   └── (from Task 4.1)
└── infrastructure/
    ├── dtos/
    │   └── reference-data.response.dto.ts
    ├── reference-data.controller.ts
    ├── reference-data.controller.spec.ts
    └── reference-data.module.ts
test/
└── reference-data.e2e-spec.ts
```

**Test count target**: 8–12 tests (controller unit + e2e), all passing

---

### Task 4.3: Frontend API Infrastructure — referenceDataService & useReferenceData

**Goal**: Wire the 3-tier API call stack for the reference data endpoint. The `HomePage` will call `useReferenceData()` and receive a fully-typed `DashboardViewModel`.

**Requirements**: Architecture playbook (3-tier API stack, React Query, backend-driven UI)

**Deliverables**:

- [~] Add `API.REFERENCE_DATA = '/api/v1/reference-data'` to `src/api/endpoints.ts`
- [~] Add TypeScript types to `src/types/referenceData.ts`:

  ```typescript
  export interface RecentContractItem {
    id: string;
    name: string;
    type: 'vendor' | 'license' | 'lease' | 'nda' | 'partnership' | 'customer';
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    uploadedAt: string;
  }

  export interface UrgentRenewalItem {
    id: string;
    contractName: string;
    renewalDate: string;
    daysRemaining: number;
    urgency: 'overdue' | 'critical' | 'warning' | 'ok';
  }

  export interface DashboardKpis {
    activeContractCount: number;
    inProgressCount: number;
    avgRiskScore: number;
    criticalFlagCount: number;
    urgentRenewalCount: number;
    nextRenewalDate: string | null;
  }

  export interface DashboardViewModel {
    kpis: DashboardKpis;
    recentContracts: RecentContractItem[];
    urgentRenewals: UrgentRenewalItem[];
    lastOpenedContract: RecentContractItem | null;
  }
  ```

- [~] Create `src/services/referenceDataService.ts`:

  ```typescript
  import { httpService } from '@/api/httpService';
  import { API } from '@/api/endpoints';
  import { unwrap } from '@/api/unwrap';
  import { DashboardViewModel } from '@/types/referenceData';

  export const referenceDataService = {
    getDashboard: (): Promise<DashboardViewModel> =>
      httpService.get<DashboardViewModel>(API.REFERENCE_DATA).then(unwrap),
  };
  ```

- [~] Create `src/hooks/useReferenceData.ts`:

  ```typescript
  import { useQuery } from 'react-query';
  import { referenceDataService } from '@/services/referenceDataService';
  import { DashboardViewModel } from '@/types/referenceData';

  export function useReferenceData() {
    return useQuery<DashboardViewModel>({
      queryKey: ['reference-data'],
      queryFn: referenceDataService.getDashboard,
      refetchOnWindowFocus: false,
      staleTime: 30_000, // 30s — mutations will invalidate manually
    });
  }
  ```

- [~] Unit tests for `referenceDataService` (`src/services/__tests__/referenceDataService.spec.ts`):
  - Calls `httpService.get` with `API.REFERENCE_DATA`
  - Calls `unwrap` on the response
  - Returns the unwrapped `DashboardViewModel`
  - Throws when `success: false`
- [~] Unit tests for `useReferenceData` (`src/hooks/__tests__/useReferenceData.spec.ts`):
  - Uses `renderHook` + mocked `referenceDataService`
  - Returns `{ data, isLoading, isError }` correctly
  - `queryKey` is `['reference-data']`
  - `refetchOnWindowFocus` is false

**Files**:

```
apps/frontend/src/
├── api/
│   └── endpoints.ts                          (add REFERENCE_DATA constant)
├── types/
│   └── referenceData.ts                      (new)
├── services/
│   ├── referenceDataService.ts               (new)
│   └── __tests__/
│       └── referenceDataService.spec.ts      (new)
└── hooks/
    ├── useReferenceData.ts                   (new)
    └── __tests__/
        └── useReferenceData.spec.ts          (new)
```

**Test count target**: 8–12 tests, all passing

---

### Task 4.4: Home Screen UI — Static Layout & Sections

**Goal**: Build the complete `HomePage` component with all visual sections, using prop-driven data (no API calls yet). Every section matches the US-008 wireframe spec exactly.

**Requirements**: US-008 (all layout, typography, spacing, color, and interaction specs)

**Component structure** (follow the mandatory component-folder pattern):

```
src/pages/HomePage/
├── HomePage.tsx                  # JSX only, ≤15 lines, composes sections
├── useHomePage.ts                # All logic: data shaping, greeting, navigation handlers
├── HomePage.module.css           # Page-level styles (background, container)
├── HomePage.test.tsx             # Unit + accessibility tests
├── HomePage.stories.tsx          # Storybook stories (all states)
└── sections/                    # Sub-components for each section
    ├── GreetingSection/
    │   ├── GreetingSection.tsx
    │   ├── GreetingSection.test.tsx
    │   └── GreetingSection.module.css
    ├── KpiCardsSection/
    │   ├── KpiCardsSection.tsx
    │   └── KpiCardsSection.test.tsx
    ├── WhereToStartSection/
    │   ├── WhereToStartSection.tsx
    │   └── WhereToStartSection.test.tsx
    ├── HowItWorksSection/
    │   ├── HowItWorksSection.tsx
    │   └── HowItWorksSection.test.tsx
    ├── RecentContractsSection/
    │   ├── RecentContractsSection.tsx
    │   └── RecentContractsSection.test.tsx
    └── UrgentRenewalsSection/
        ├── UrgentRenewalsSection.tsx
        └── UrgentRenewalsSection.test.tsx
```

**Deliverables**:

- [~] **`GreetingSection`**: Time-based greeting ("Good morning/afternoon/evening, {name}."), context paragraph with critical flag count (red) and urgent renewal count (orange/dark), "View all contracts" + "+ Upload contract" buttons
- [~] **`KpiCardsSection`**: 4-column grid of `KPICard` components — Active Contracts, Average Risk Score (color-coded), Critical Flags Open (red), Renewals <60 Days (orange/dark). All values come from props.
- [~] **`WhereToStartSection`**: Dark upload CTA card (left, 1.4fr) + right column with Resume card (if `lastOpenedContract` exists) + Sample card. Uses `RiskBadge` and `TypePill` in the Resume card.
- [~] **`HowItWorksSection`**: 4-column grid of step cards (01–04) with step number in DM Mono, label, description, and "who" line.
- [~] **`RecentContractsSection`**: Table with 4 rows max. Columns: name (truncated), type (`TypePill`), risk (`RiskBadge` sm), uploaded date (DM Mono). Alternating row backgrounds. Click row → `onNav('results', { contractId })`.
- [~] **`UrgentRenewalsSection`**: Table with 3 rows max. Columns: name, renewal date (DM Mono), days remaining (color-coded), urgency badge. Left border colored by urgency threshold. Click row → `onNav('renewals', { renewalId })`.
- [~] **`HomePage`**: Composes all sections inside `PageShell`. Accepts `data: DashboardViewModel` and `onNav` as props. Uses `useHomePage` hook for greeting logic and navigation handlers.
- [~] **Empty states**: Each section handles missing data gracefully:
  - No contracts → KPI cards show 0, recent contracts shows "No contracts uploaded yet", resume card hidden
  - No urgent renewals → section shows "No urgent renewals"
- [~] **Accessibility**: Every interactive element has ARIA labels, focus indicators, keyboard navigation. Tables use `<table>`, `<thead>`, `<tbody>`, `<th scope="col">`. Buttons have descriptive labels.
- [~] **Mobile-first responsive**: KPI grid collapses to 2×2 on tablet (`md:`), 1-column on mobile. "Where to start" stacks vertically on mobile. "How it works" collapses to 2×2 on tablet, 1-column on mobile.
- [~] **Storybook stories** (`HomePage.stories.tsx`):
  - `Default` — full data set matching US-008 wireframe
  - `EmptyPortfolio` — no contracts, no renewals
  - `HighRiskPortfolio` — all contracts critical risk
  - `NoUrgentRenewals` — renewals all >60 days

**Unit tests** (`HomePage.test.tsx` + per-section tests):

- Greeting shows correct time-of-day salutation
- Critical flag count renders in red
- Urgent renewal count renders in orange when >0
- KPI cards display correct values from props
- Recent contracts table renders up to 4 rows
- Urgent renewals table renders up to 3 rows
- Renewal left border is red when `daysRemaining < 30`
- Renewal left border is orange when `daysRemaining < 60`
- `onNav('upload')` called when clicking upload button
- `onNav('results', { contractId })` called when clicking contract row
- Empty state renders when `recentContracts` is empty
- Empty state renders when `urgentRenewals` is empty
- axe accessibility scan: 0 violations

**Test count target**: 25–35 tests, all passing

---

### Task 4.5: Home Screen UI — Data Wiring, Routing & Integration

**Goal**: Wire `useReferenceData` into `HomePage`, integrate into the app router, add loading/error states, and write integration tests.

**Requirements**: US-008, architecture playbook (React Query, React Router v6, backend-driven UI)

**Deliverables**:

- [~] Create `src/pages/HomePage/HomePageContainer.tsx`:
  - Calls `useReferenceData()`
  - Shows `<Skeleton>` (Shadcn) loading state while `isLoading`
  - Shows error message if `isError`
  - Renders `<HomePage data={data} onNav={handleNav} />` when data is ready
  - `handleNav` uses React Router `useNavigate()` to map screen names to routes:
    - `'upload'` → `/upload`
    - `'results'` → `/contracts/:contractId`
    - `'renewals'` → `/renewals`
    - `'portfolio'` → `/contracts`
- [~] Register route in `App.tsx` (or router config):
  - `<Route path="/" element={<ProtectedRoute><HomePageContainer /></ProtectedRoute>} />`
  - After login callback, redirect lands on `/`
- [~] Integration test (`HomePage.integration.test.tsx`) using MSW:
  - Mock `GET /api/v1/reference-data` returning sample `DashboardViewModel`
  - Renders `HomePageContainer` inside `MemoryRouter` + `QueryClientProvider`
  - Asserts loading skeleton shown initially
  - Asserts KPI values appear after data loads
  - Asserts clicking a contract row navigates to `/contracts/:id`
  - Asserts clicking upload button navigates to `/upload`
  - Mock API returning 401 → asserts redirect to login
  - Mock API returning 500 → asserts error message shown
- [~] Update `LoginCallbackPage` to redirect to `/` after successful login (if not already doing so)
- [~] Smoke test: `npm run dev` → login → home screen renders with seed data

**Files**:

```
apps/frontend/src/
├── pages/
│   └── HomePage/
│       ├── HomePageContainer.tsx             (new)
│       └── HomePageContainer.test.tsx        (new — integration test with MSW)
└── App.tsx                                   (update: add / route)
```

**Test count target**: 8–12 integration tests, all passing

---

### Phase 4 Summary

| Task | Layer                        | Deliverable                                              | Tests |
| ---- | ---------------------------- | -------------------------------------------------------- | ----- |
| 4.1  | Backend domain + application | `GetDashboardViewQuery` + handler + seed data            | 10–15 |
| 4.2  | Backend infrastructure       | `GET /api/v1/reference-data` controller + module + e2e   | 8–12  |
| 4.3  | Frontend API layer           | `referenceDataService` + `useReferenceData` hook + types | 8–12  |
| 4.4  | Frontend UI (static)         | All `HomePage` sections, stories, accessibility          | 25–35 |
| 4.5  | Frontend integration         | `HomePageContainer`, routing, MSW integration tests      | 8–12  |

**Estimated total new tests**: 60–85 tests  
**Estimated effort**: 7–10 days  
**Phase 4 completion criteria**: `npm run dev` → login → home screen shows live seed data from backend API, all tests pass, Storybook stories cover all states.

---

## Phase 7: User Story — OCR Pipeline (Requirement 2)

**Status**: ✅ **COMPLETE (6/6 — 100%)** — see [ocr-design.md](./ocr-design.md) for full requirements & design.

**Progress (2026-05-15)**:
- ✅ **Task 7.1** — Domain layer (6 new VOs, `DocumentText` aggregate, 3 OCR events, extended `Document` with `processingStatus` + retry counter, +64 unit tests)
- ✅ **Task 7.2** — Application layer (3 commands, 2 queries, event-handler bridge, retry policy with 1s/4s/16s backoff + error taxonomy, +24 tests)
- ✅ **Task 7.3** — Mock + Native PDF + persistence (pdfjs-based classifier & extractor, `franc-min` language detector, `textQualityScore`, `ClassifierThenRouter` orchestrator, Prisma `DocumentText` model + migration, DI wired into `DocumentsModule`, integration test against real 7-page PDF)
- ✅ **Task 7.4** — Google Document AI driver (sync + batch paths behind one `extractText`, pure response→OcrOutput mapper, gRPC error mapping, lazy SDK adapter with regional endpoint, `scripts/setup-document-ai.sh` provisioning, env-flag-gated live integration test confirmed against real processor: 7 pages / 3.6s / confidence 0.9919, ~$0.01 cost)
- ✅ **Task 7.5** — Frontend processing-screen wiring (2 new HTTP routes, `processingService`, `useProcessingStatus` + `useRetryOcr` hooks, `ProcessingPageView` with 4 visual states + retry button, `/results/:id` stub page, 7 Storybook stories, +10 frontend tests)
- ✅ **Task 7.6** — E2E + load smoke (synthetic fixtures via `pdf-lib`: scanned, hybrid, corrupt; `fixtures-sanity.spec.ts` regression guard; `ocr-pipeline.e2e-spec.ts` with 7 scenarios incl. born-digital / scanned / hybrid / corrupt / transient-retry / user-retry / 5-doc concurrent smoke; controller e2e extended with `/processing-status` + `/retry-ocr` routes; `.env.example` Phase 7 vars documented)

**Final test totals**: 68 backend unit suites / **608 tests** (+1 skipped live), **18 OCR e2e tests** across 2 suites (`documents.e2e-spec.ts` + `ocr-pipeline.e2e-spec.ts`), **10 frontend tests** + 7 Storybook stories. Lint clean, build clean.

**Live Document AI verified once** against real processor (`projects/68158864400/locations/eu/processors/71b89b664f5d5cb`) at ~$0.01.

**Goal**: Turn an uploaded PDF (Phase 5 output) into a `DocumentText` artifact ready for clause extraction.

**Dependencies**: Phase 5 ✅ (upload + storage + state machine). Phase 6 not a hard blocker — `DocumentOCR*Event` will dispatch `RecordAuditEventCommand` once Phase 6 ships.

### Locked decisions (2026-05-15)

1. **200-page cap** — rejected above in `StartOcrProcessingCommand`.
2. **Text storage** — blob in `IStorageService` (`{documentId}.text.json`) + thin Prisma metadata row.
3. **Per-page confidence** — persisted as a field on `PageText` inside the blob.
4. **Separate `ProcessingStatus` VO** — co-exists with `UploadStatus` on `Document`.
5. **Retry CTA in v1** — "Retry OCR" button on `/processing/:id`, capped at 3 user-initiated retries.

### Architecture summary

- **Two real drivers + one mock** behind `IOcrService` (same swap pattern as `IStorageService`):
  - `NativePdfExtractor` (pdfjs) for born-digital pages — $0
  - `GoogleDocAiDriver` (sync ≤15p, batch otherwise) for scanned pages — $0.0015/page
  - `MockOcrDriver` for tests/local
- **Per-page classifier** decides which driver handles each page; documents can be `native_pdf`, `google_document_ai`, or `hybrid`.
- **Quality-demotion**: native-extracted pages with `textQualityScore < 0.5` (broken cmap / garbled text) fall through to Document AI.
- **State machine extension**: `complete → processing → ocr_complete | ocr_failed` on a new `ProcessingStatus` VO.
- **Triggering**: in-process `DocumentUploadCompletedHandler` dispatches `StartOcrProcessingCommand`. No queue in v1.

### Dependency graph & ordering

```
7.1 (domain) ──► 7.2 (application) ──┬──► 7.3 (mock + native + persistence)
                                     │       │
                                     │       ▼
                                     │   7.4 (Document AI)
                                     │       │
                                     │       ▼
                                     └──► 7.6 (E2E)
                                             ▲
                                             │
                                  7.5 (frontend) ┘
```

7.5 can run in parallel with 7.3/7.4 once 7.2's query contract is stable. Rough effort: 7.1 ~1-2d, 7.2 ~2d, 7.3 ~3-4d, 7.4 ~2-3d, 7.5 ~1-2d, 7.6 ~1-2d. **Total ~10-15 working days** single engineer.

---

### Task 7.1 — Domain layer ✅

Pure TypeScript; no I/O, no NestJS providers.

- [x] Create `apps/backend/src/modules/documents/domain/value-objects/processing-status.ts`
  - States: `not_started | processing | ocr_complete | ocr_failed`
  - Legal transitions: `not_started → processing`, `processing → ocr_complete | ocr_failed`, `ocr_failed → processing` (retry edge)
  - Throws `InvalidProcessingStatusTransitionError` on any other move
- [x] Add VOs under `value-objects/`:
  - [x] `ConfidenceScore` — float clamped 0..1, rejects NaN/out-of-range
  - [x] `TextQualityScore` — same shape, distinct semantic
  - [x] `Language` — ISO 639-1, allowlist `['en']` in v1
  - [x] `OcrDriver` — enum `native_pdf | google_document_ai | mock | hybrid`
  - [x] `PageText` — `{ pageNumber: int≥1, text, confidence, textQualityScore, driver }`
- [x] Extend existing `Document` aggregate:
  - [x] Field `processingStatus: ProcessingStatus` (default `not_started`)
  - [x] Field `userRetryCount: number` (default 0, cap 3)
  - [x] Field `failureReason: string | null`
  - [x] Methods: `startProcessing()`, `completeProcessing(result)`, `failProcessing(reason)`, `retryProcessing()` — each enforces a transition and emits the right event
- [x] Create new aggregate `DocumentText` in `domain/aggregates/document-text.ts`
  - [x] Fields per ocr-design.md §3 (`documentId`, `text`, `pages[]`, `confidence`, `minPageConfidence`, `language`, `driver`, `extractedAt`)
  - [x] Static factory `DocumentText.fromOcrOutput(documentId, OcrOutput)`
- [x] Create events in `domain/events/`:
  - [x] `DocumentOCRStartedEvent`
  - [x] `DocumentOCRCompletedEvent`
  - [x] `DocumentOCRFailedEvent`
- [x] Unit tests (~40):
  - [x] Every legal and illegal `ProcessingStatus` transition
  - [x] Each VO's validation rules (boundary, NaN, type)
  - [x] `Document.startProcessing()` from each starting state
  - [x] Retry cap enforcement (4th retry throws)
  - [x] `DocumentText.fromOcrOutput` happy path + empty-pages edge case

**Done when:** all new files compile, ~40 unit tests green, no other layer touched.

---

### Task 7.2 — Application layer ✅

Commands, queries, event handler. Uses ports (`IOcrService`, `IDocumentTextRepository`); no real I/O yet.

- [x] Commands under `application/commands/`:
  - [x] `StartOcrProcessingCommand { documentId }` + handler:
    - Load `Document` from `IDocumentRepository`
    - Assert `pageCount ≤ 200`, else `DocumentTooLargeError`
    - `document.startProcessing()` → persist → publish `DocumentOCRStartedEvent`
    - Call `IOcrService.extractText(...)`
    - Success path: build `DocumentText`, persist via `IDocumentTextRepository`, `document.completeProcessing(...)`, publish `DocumentOCRCompletedEvent`
    - Failure path: in-handler retry (3 attempts, backoff 1s/4s/16s, retryable taxonomy). After exhaustion: `document.failProcessing(reason)` + `DocumentOCRFailedEvent`
  - [x] `FailOcrProcessingCommand { documentId, reason }` + handler — explicit fail path for external callers (admin abort)
  - [x] `RetryOcrProcessingCommand { documentId }` + handler — assert status is `ocr_failed` and `userRetryCount < 3`, increment counter, `document.retryProcessing()`, delegate to `StartOcrProcessingCommand`
- [x] Queries under `application/queries/`:
  - [x] `GetDocumentTextQuery { documentId }` → `DocumentTextDto`
  - [x] `GetProcessingStatusQuery { documentId }` → `{ status, confidence?, error?, userRetryCount }`
- [x] Event handler: `DocumentUploadCompletedHandler` in `application/event-handlers/`
  - [x] Listens for Phase 5 `DocumentUploadCompletedEvent`
  - [x] Dispatches `StartOcrProcessingCommand`
  - [x] **Only wiring point into Phase 5** — no changes to upload module
- [x] Port interfaces:
  - [x] `IOcrService` (per ocr-design.md §5)
  - [x] `IDocumentTextRepository`
- [x] Retryable-error taxonomy:
  - [x] `OcrTransientError` (timeouts, 429, 503) → triggers backoff retry
  - [x] `OcrPermanentError` (invalid PDF, encrypted, page-cap exceeded) → fail immediately
- [x] Unit tests (~30):
  - [x] `StartOcrProcessingHandler` happy path with mocked `IOcrService`
  - [~] Transient-fail-then-success at attempt 2
  - [~] Permanent-fail on attempt 1 (no retry)
  - [x] Retries-exhausted → status flips to `ocr_failed`
  - [x] `RetryOcrProcessingHandler` succeeds when failed + count<3
  - [x] `RetryOcrProcessingHandler` rejects when count==3
  - [x] `RetryOcrProcessingHandler` rejects when status ≠ `ocr_failed`
  - [x] `DocumentUploadCompletedHandler` dispatches the right command

**Done when:** application layer compiles against port interfaces, ~30 unit tests green.

---

### Task 7.3 — Infrastructure: Mock + Native PDF + persistence ✅

Real implementations of everything *except* the cloud OCR call. Pipeline runs locally with no GCP dependency.

- [x] Add dependencies to `apps/backend/package.json`:
  - [x] `pdfjs-dist` — PDF parsing (Mozilla's engine, used by both classifier and native extractor)
  - [x] `franc-min` — language detection (pure JS, ~10 KB common languages)
  - [x] `wordlist-english` — for `textQualityScore` dictionary-hit ratio (or commit a hand-curated 5k list)
- [x] `infrastructure/ocr/pdf-classifier.ts`:
  - [x] For each page, use pdfjs `getOperatorList` + `getTextContent` to compute `(charCount, hasLargeImage)`
  - [x] Tag each page `digital | scanned | blank`
  - [x] Return `{ pageCount, perPageClassification: ('digital'|'scanned'|'blank')[] }`
- [x] `infrastructure/ocr/language-detector.ts`:
  - [x] Sample first 1–2 pages via native extraction
  - [x] Run `franc` → ISO 639-1 + confidence
  - [x] Reject if not in `OCR_LANGUAGES` allowlist
- [x] `infrastructure/ocr/native-pdf-extractor.ts`:
  - [x] Walk content stream via pdfjs `getTextContent`
  - [x] Space inference via positioning, line breaks via Y-coordinate
  - [x] Compute `textQualityScore` per page (dictionary-word ratio + Unicode-block sanity + replacement-char density)
  - [x] Return `OcrOutput` with `driver: 'native_pdf'`, `confidence: 1.0`
- [x] `infrastructure/ocr/mock-ocr-driver.ts`:
  - [x] Deterministic fixture text per page
  - [x] `confidence: 0.85`, `textQualityScore: 0.95`, `driver: 'mock'`
- [x] `infrastructure/ocr/classifier-then-router.ts` (the orchestrator):
  - [x] Step 1: language detect → reject if non-English
  - [x] Step 2: classify pages
  - [x] Step 3: per-page route — digital → native, scanned → cloud, blank → empty `PageText` with `confidence = 1.0`
  - [x] Step 4: demotion — digital pages with `textQualityScore < TEXT_QUALITY_THRESHOLD` rerun through cloud driver
  - [x] Step 5: merge into one `OcrOutput`, document-level driver = `native_pdf | google_document_ai | hybrid`
- [x] `OcrModule` + driver factory:
  - [x] Factory picks cloud slot from `OCR_DRIVER` env (`mock` in this task)
  - [x] Register `LanguageDetector`, `PdfClassifier`, `NativePdfExtractor`, `ClassifierThenRouter`
- [x] Prisma model + migration:
  - [x] `DocumentText` — `documentId` (PK, FK), `storageKey`, `textLength`, `confidence`, `minPageConfidence`, `language`, `driver`, `extractedAt`
  - [x] Generate migration
- [x] `infrastructure/persistence/prisma-document-text.repository.ts`:
  - [x] Write metadata row
  - [x] Write JSON blob `{documentId}.text.json` via `IStorageService.writeStream`
- [x] Wire `OcrModule` into `DocumentsModule` so `DocumentUploadCompletedHandler` resolves
- [x] Tests:
  - [x] Classifier against 4 fixture PDFs (born-digital, scanned, hybrid, broken-cmap)
  - [x] Native extractor against born-digital fixture
  - [x] `textQualityScore` — good text scores ~0.9, garbage scores ~0.1
  - [x] Language detector accept (English) / reject (other)
  - [x] `ClassifierThenRouter` integration for all 4 fixtures (asserts hybrid routing and demotion)
  - [x] Prisma repository round-trip with test DB

**Done when:** uploading a born-digital PDF via existing UI creates a real `DocumentText` row + blob, status flips to `ocr_complete`, no GCP credentials touched.

---

### Task 7.4 — Infrastructure: Google Document AI driver ✅

Swap cloud slot from `MockOcrDriver` to real `GoogleDocAiDriver`. Only task that requires GCP setup.

- [x] Add `@google-cloud/documentai` to backend dependencies
- [x] `scripts/setup-document-ai.sh` (idempotent, follows `scripts/setup-gcs.sh` pattern):
  - [x] Enable `documentai.googleapis.com` in the project
  - [x] Grant `roles/documentai.apiUser` to `contractintel-uploads-sa`
  - [x] Create OCR processor (`displayName: contractintel-ocr`, type `OCR_PROCESSOR`, region `eu`); print resource ID
- [x] Env docs in `docs/deployment/gcp-setup.md`:
  - [x] `OCR_DRIVER=google-document-ai`
  - [x] `OCR_GCP_PROJECT_ID`, `OCR_GCP_LOCATION=eu`, `OCR_GCP_PROCESSOR_ID`
- [x] `infrastructure/ocr/google-doc-ai-driver.ts` — single public method `extractText(input): Promise<OcrOutput>`:
  - [x] **Sync path** (≤15 pages, ≤20 MB): `processDocument` with `rawDocument`; map response → `OcrOutput`
  - [x] **Batch path** (>15 pages):
    - [x] Source PDF reused from Phase 5 storage key (already in `gs://{bucket}/`)
    - [x] `batchProcessDocuments` → input GCS URI + output prefix `gs://{bucket}/ocr-output/{documentId}/`
    - [x] Poll LRO (5s → 30s backoff, 10min timeout)
    - [x] On done: `list()` output prefix, read per-page `Document` JSONs via `@google-cloud/storage` directly (inside-the-driver shortcut), merge into one `OcrOutput`
  - [x] Page-count + size check at top selects path
  - [~] Error mapping:
    - [x] `RESOURCE_EXHAUSTED | UNAVAILABLE | DEADLINE_EXCEEDED` → `OcrTransientError`
    - [x] `INVALID_ARGUMENT | PERMISSION_DENIED` → `OcrPermanentError`
- [x] Response → `OcrOutput` mapping as a pure function (its own file, easy to unit test):
  - [x] Per-page token-weighted confidence (see message history for formula)
  - [x] Page-length-weighted document confidence
  - [x] Page text via `textAnchor.textSegments` slicing into `document.text`
- [x] Update driver factory in `OcrModule` to switch on `OCR_DRIVER`
- [x] Tests with `jest.mock('@google-cloud/documentai')`:
  - [x] Sync happy path
  - [x] Sync error mapping (each error class)
  - [x] Batch startup → polling → completion
  - [x] Batch polling timeout
  - [x] Batch result merge across multiple shard files
  - [x] Response-to-`OcrOutput` mapping unit tests in isolation (hybrid confidence fixtures)

**Done when:** `OCR_DRIVER=google-document-ai` env flip + real GCP processor produces valid `DocumentText`. Provisioning script runs cleanly in a fresh project. Tests mock the SDK; no live calls in default CI.

---

### Task 7.5 — Frontend: processing screen wiring ✅

Real polling, error UI, retry button. Can start once 7.2's query contract is locked.

- [x] `apps/frontend/src/api/processingService.ts`:
  - [x] `getProcessingStatus(documentId)` — same 3-tier pattern as existing services
  - [x] `retryOcr(documentId)`
- [x] `useProcessingStatus(documentId)` React Query hook:
  - [x] `refetchInterval: 2000`
  - [x] Stops polling once status is terminal (`ocr_complete` | `ocr_failed`)
- [x] `useRetryOcr` mutation hook — on success invalidates the status query so polling resumes
- [x] Update `ProcessingPage`:
  - [x] `processing` state — spinner + "Extracting text from your contract…"
  - [x] `ocr_complete` state — auto-navigate to `/results/:documentId` after brief success flash
  - [x] `ocr_failed` state — error card with `reason` inline, plus:
    - [x] **Retry OCR** button when `userRetryCount < 3` — calls `retryOcr`, polling resumes
    - [x] **Upload another** secondary CTA; primary CTA when `userRetryCount === 3`
- [x] Storybook stories:
  - [x] `Processing`
  - [x] `Complete`
  - [x] `Failed (can retry)`
  - [x] `Failed (retries exhausted)`
- [x] jest-axe pass on all four stories
- [x] RTL + MSW smoke test covering the four UI states + retry flow

**Done when:** real upload → `/processing/:id` shows real state from backend, retry button works end-to-end, axe clean, all stories render.

---

### Task 7.6 — E2E + load smoke ✅

Real upload → real pipeline (mock cloud driver) → real `DocumentText`, asserted end-to-end.

- [x] `documents-ocr.e2e-spec.ts` against real NestJS test app + real Prisma + tmp-dir storage:
  - [x] Born-digital fixture → wait for `ocr_complete` → assert `DocumentText` row, blob, `driver = native_pdf`, `confidence = 1.0`, page count
  - [x] Scanned fixture (mock driver) → `driver = google_document_ai` (mock fills that slot), confidence = 0.85
  - [x] Hybrid fixture → `driver = hybrid`, per-page drivers mixed
  - [x] Broken-cmap fixture → demotion path took effect
  - [x] Corrupt PDF → `ocr_failed` with `reason` set
  - [x] Retry happy path: fail once → retry → succeed
- [x] 5-document concurrent smoke — 5 parallel uploads all reach `ocr_complete` without serialization or deadlock
- [x] (Optional, env-flag gated) one real Document AI call against one fixture — local pre-signoff, not default CI
- [x] Update `docs/deployment/gcp-setup.md` — processor provisioning + env matrix for cold-start onboarding

**Done when:** `npm run test:e2e` green (mock cloud), gated real-cloud test passes when run by hand, docs sufficient for a new engineer to stand up Document AI in one sitting.

### Phase 7 success criteria

- Upload a born-digital PDF via `/upload` → land on `/processing/:id` → auto-redirect to `/results/:id` within ~10 seconds.
- Upload a scanned PDF (using a Document AI test processor or mock) → completion within latency budget.
- A deliberately broken PDF → retry button works; after 3 failed retries, fallback CTA appears.
- All tests green; 0 lint errors; a11y clean.

### Deferred to later phases (intentional Phase 7 scope discipline)

- DOCX / PPTX (separate ingestion adapters needed)
- Real async queue (BullMQ / PubSub) — introduced when pipeline has a second consumer (clause extractor)
- Per-page real-time progress (UI shows binary status only)
- Re-run as admin operation (CLI exists; admin UI deferred)
- Languages other than English (detector rejects up front in v1)

---

## Phase 8: User Story — Clause Extraction & Classification (Requirement 3)

**Status**: ✅ **COMPLETE (8/8 + bug fix — 100%)** — see [clause-extraction-design.md](./clause-extraction-design.md) for full requirements & design.

**Progress (2026-05-17)**:
- ✅ **Task 8.1** — Domain layer (7 VOs, `Clause` entity, `ExtractionRun` aggregate, 4 domain events, `Document` extended with `extractionStatus` + `currentExtractionRunId`, ~50 unit tests)
- ✅ **Task 8.2** — Application layer (3 commands, 3 queries, `DocumentOcrCompletedHandler` event bridge, retry policy with 1s/4s/16s backoff, 2-pass parent-resolution, hallucination drop via `indexOf`, embedding-failure isolation, ~35 tests)
- ✅ **Task 8.3** — Mock drivers + pgvector + persistence (Prisma migration enabling `vector` extension + `ExtractionRun`/`Clause` tables, `MockClauseExtractor` (5 deterministic clauses incl. nested), `MockEmbeddingService` (SHA-256 → 1024-dim L2-normalised), raw-SQL repository for `vector(1024)` binding, `ClausesModule` wired into `AppModule`)
- ✅ **Task 8.4** — Real Claude clause-extractor driver (`@anthropic-ai/sdk`, single tool-use call with prompt-cached system prompt, page-boundary chunking above 200k chars with namespaced clientRefs, full SDK error → taxonomy mapping, defence-in-depth response validator, live env-gated test). **Verified live against Opus 4.7**: 5 clauses returned, confidence 0.97–0.99, risk levels tracking the rubric.
- ✅ **Task 8.4.1** — Contract metadata extraction (extends Claude call to also return parties / key dates / financial terms, `ContractMetadata` VO with validation, jsonb column on `ExtractionRun`, ~$0.003 extra per contract)
- ✅ **Task 8.5** — Real Voyage embeddings driver (`voyage-law-2`, 1024-dim, batching ≤128 in parallel, retry+backoff, dim-mismatch guard, env-gated live test)
- ✅ **Task 8.6** — Frontend (broken into 8 sub-tasks):
  - ✅ **8.6.a** — Backend HTTP endpoints: `GET /clauses`, `GET /extraction-status`, `GET /text` (Document tab)
  - ✅ **8.6.b** — Frontend types + services + hooks (`useClauses`, `useExtractionStatus`, `useDocumentText`)
  - ✅ **8.6.c** — `ProcessingPage` redesigned per v2 wireframe — 6-step animated walk-through, simulated step progression clamped by backend reality, 5-second success dwell before redirect, rotating tips banner. Visual fidelity B confirmed in Storybook.
  - ✅ **8.6.d/e** — `ResultsPage` scaffold + Overview tab — breadcrumb, 4-tab nav, 272 px right sidebar, Risk Assessment card with weighted-average score, Parties / Key Dates / Financial Terms sections, Notes thread (local state)
  - ✅ **8.6.f** — Risk Flags tab — accordion list of clauses with `riskLevel >= medium`, severity dots, resolve/dismiss local state, "Deep dive →" stubbed for Phase 9
  - ✅ **8.6.g** — Document tab — inline contract rendering with offset-based clause highlights (critical + high only, per user pick), zoom controls, page-break separators
  - ✅ **8.6.h** — UI tests + a11y (41 frontend tests across ProcessingPage, ResultsPage, riskHelpers, including jest-axe passes; `tsconfig` updated with `vitest/globals`)
- ✅ **Task 8.7** — E2E + load smoke (`clauses-extraction.e2e-spec.ts` with 13 scenarios incl. happy / hallucination drop / permanent fail / transient retry / retries exhausted / embedding-failure isolation / idempotency / re-extraction / admin abort / 5-doc concurrent)
- ✅ **Bug fix (post-Phase 8)** — Tolerate Claude Opus 4.7's double-wrapped `tool_use.input.input` response shape (Claude sometimes nests our payload one level deeper than documented; mapper transparently unwraps). Regression test added.

**Final test totals**: 156 clauses-module unit tests + 13 e2e tests + 41 new frontend tests (riskHelpers 17, ProcessingPage 11, ResultsPage 13). 772 total backend unit tests; full backend suite green except 5 pre-existing pdfjs failures (unrelated).

**Live integration verified**: Anthropic Claude Opus 4.7 + (Voyage live test gated, ready to run when credits exist).

**Test contracts**: 5 synthetic PDFs in `test-contracts/output/` covering balanced/risky SaaS, NDA, MSA, executive employment — see `test-contracts/README.md`.

**Goal**: Turn a `DocumentText` (Phase 7 output) into a versioned set of classified, position-anchored, embedding-equipped `Clause` rows. Combined Claude call (per design.md) produces extract + classify + risk in one go; Phase 8 persists risk fields but does not surface them in UI (Phase 9 lights up risk UI + business logic).

**Dependencies**: Phase 7 ✅ (OCR pipeline, `DocumentText`, `DocumentOCRCompletedEvent`).

### Locked decisions (2026-05-17)

1. **Combined Claude call** — extract + classify + risk score in one invocation (honors design.md).
2. **Phase 8 persists risk fields; UI hides them.** Rubric is DRAFT — Phase 9 prerequisite: SME validation.
3. **Embedding model**: Voyage `voyage-law-2`, 1024-dim, pgvector storage.
4. **Vector dimension locked at 1024**; future model swap = migration + backfill.
5. **Nesting via self-FK** `parentClauseId`, max 2 levels, `ON DELETE SET NULL`.
6. **Global char offsets** into `DocumentText.text`; LLM returns text verbatim, server resolves offsets via `indexOf`; hallucinated text → drop + log.
7. **Versioned extraction runs** — `ExtractionRun` aggregate; re-extraction creates new run, old retained.
8. **In-process event trigger** (`DocumentOCRCompletedHandler`); crash-recovery deferred to Phase 9.
9. **`extracting` state** surfaced on `/processing/:id` as a second progress band (one screen rolls forward through OCR → extraction → results).
10. **Embedding failure ≠ extraction failure** — clauses persist with `embedding=null` if Voyage is down; flagged on the run.

### Architecture summary

- **Module**: new `apps/backend/src/modules/clauses/` with the same DDD shape as `documents/`.
- **Ports**: `IClauseExtractor`, `IEmbeddingService`, `IClauseRepository`, `IExtractionRunRepository`.
- **Drivers**:
  - `MockClauseExtractor` (deterministic fixture, ~5 clauses with one nested child)
  - `ClaudeClauseExtractor` (Anthropic SDK, single call w/ tool-use JSON schema, prompt-cached system prompt)
  - `MockEmbeddingService` (hash-based deterministic vectors)
  - `VoyageEmbeddingService` (`voyage-law-2`, batch 128, retry+backoff)
- **Persistence**: Prisma + pgvector. New tables `ExtractionRun`, `Clause`. `Document` gains `extractionStatus` + `currentExtractionRunId`.
- **Trigger**: `DocumentOCRCompletedHandler` (in `clauses/` module) dispatches `StartClauseExtractionCommand`. Zero changes to Phase 7 code.

### Dependency graph & ordering

```
8.1 (domain) ──► 8.2 (application) ──┬──► 8.3 (mock + pgvector + persistence)
                                     │       │
                                     │       ├──► 8.4 (Claude extractor)
                                     │       │
                                     │       └──► 8.5 (Voyage embeddings)
                                     │              │
                                     │              ▼
                                     └────────► 8.7 (E2E)
                                                    ▲
                                                    │
                                       8.6 (frontend) ─┘
```

8.6 can run in parallel with 8.4/8.5 once 8.2 query contracts are stable. Rough effort: 8.1 ~2d, 8.2 ~2d, 8.3 ~3d, 8.4 ~3d, 8.5 ~1d, 8.6 ~2-3d, 8.7 ~1-2d. **Total ~14-16 working days** single engineer.

---

### Task 8.1 — Domain layer ✅

Pure TypeScript; no I/O, no NestJS providers. New module `clauses/`.

- [x] VOs under `clauses/domain/value-objects/`:
  - [~] `ClauseId` (UUID)
  - [~] `ExtractionRunId` (UUID)
  - [~] `ClauseType` — enum of 15 values from Requirement 3 AC2; validates input
  - [~] `ConfidenceScore` — reuse from Phase 7 (or import as shared)
  - [~] `TextPosition` — `{ startOffset, endOffset, pageNumber }` with invariants (`start < end`, `start ≥ 0`, `pageNumber ≥ 1`)
  - [~] `ExtractionStatus` — `running | complete | failed`; legal transitions: `running → complete | failed` (failed terminal)
  - [~] `ModelVersion` — string format `<vendor>/<name>@<version>`
  - [~] `RiskLevel` — `low | medium | high | critical`; derive from int via `RiskLevel.fromScore(n)`
- [x] Entity `Clause` in `domain/entities/clause.ts`:
  - [~] Fields per `clause-extraction-design.md` §3.2
  - [~] Method `attachEmbedding(vector, modelVersion)` — sets vector + records embedding model
  - [~] Method `linkParent(parentClauseId)` — validates same-run constraint
  - [~] Invariant checks in factory
- [x] Aggregate root `ExtractionRun` in `domain/aggregates/extraction-run.ts`:
  - [~] Fields per design §3.1
  - [~] Methods: `start()`, `complete(clauseCount, droppedCount)`, `fail(reason)`
  - [~] Static factory `ExtractionRun.start(documentId, classifierVersion, embeddingVersion)`
- [x] Extend `Document` aggregate (`documents/domain/aggregates/document.ts`):
  - [~] Field `extractionStatus: ExtractionStatus | 'not_started'` (default `not_started`)
  - [~] Field `currentExtractionRunId: ExtractionRunId | null`
  - [~] Methods: `startExtraction()`, `completeExtraction(runId)`, `failExtraction(reason)` — each enforces transition, emits event
- [x] Events under `clauses/domain/events/`:
  - [~] `ClauseExtractionStartedEvent`
  - [~] `ClausesExtractedEvent` (batched: one per run)
  - [~] `ClauseExtractionCompletedEvent`
  - [~] `ClauseExtractionFailedEvent`
- [x] Unit tests (~50):
  - [~] Every legal/illegal `ExtractionStatus` transition
  - [~] Each VO's validation rules (boundary, NaN, out-of-range)
  - [~] `TextPosition` invariants
  - [~] `RiskLevel.fromScore` boundaries (0, 25, 26, 50, 51, 75, 76, 100)
  - [~] `Clause.linkParent` rejects cross-run parent
  - [~] `Document.startExtraction()` from each starting state
  - [~] `ExtractionRun.complete` enforces `clauseCount ≥ 0`

**Done when:** all new files compile, ~50 unit tests green, no other layer touched.

---

### Task 8.2 — Application layer ✅

Commands, queries, event handler. Uses ports (`IClauseExtractor`, `IEmbeddingService`, `IClauseRepository`, `IExtractionRunRepository`); no real I/O yet.

- [x] Commands under `clauses/application/commands/`:
  - [~] `StartClauseExtractionCommand { documentId }` + handler:
    - Load `Document` via `IDocumentRepository`
    - Idempotency: existing `running` or `complete` run for this document → return early
    - Load `DocumentText` via `IDocumentTextRepository` (Phase 7 port)
    - `document.startExtraction()` → persist → publish `DocumentExtractionStartedEvent`
    - Create `ExtractionRun` (status=running, model versions recorded)
    - Call `IClauseExtractor.extract(input)`
    - Server-side: resolve offsets via `indexOf`; drop hallucinated clauses (increment counter)
    - Server-side: two-pass parent resolution (`clientRef` → real `ClauseId`)
    - Call `IEmbeddingService.embedBatch(clauses.map(c => c.text))`; attach vectors
    - Persist run + clauses in single transaction; update `Document.extractionStatus` + `currentExtractionRunId`
    - Publish `ClausesExtractedEvent` + `ClauseExtractionCompletedEvent`
    - **Failure paths**: retry 3× (1s/4s/16s) for `ExtractionTransientError`; permanent + exhausted → `document.failExtraction(reason)` + `ClauseExtractionFailedEvent`
    - **Embedding-only failure**: clauses persist with `embedding=null`; run completes with `failureReason` note; not treated as extraction failure
  - [~] `FailClauseExtractionCommand { documentId, reason }` + handler — admin abort path
  - [~] `RetryClauseExtractionCommand { documentId }` + handler — assert `extractionStatus === extraction_failed`, then delegate to `StartClauseExtractionCommand` (creates new `ExtractionRun`)
- [x] Queries under `clauses/application/queries/`:
  - [~] `GetClausesForDocumentQuery { documentId }` → `ClauseDto[]` (from `currentExtractionRunId`)
  - [~] `GetClauseByIdQuery { clauseId }` → `ClauseDto`
  - [~] `GetExtractionRunStatusQuery { documentId }` → `{ status, clauseCount, droppedClauseCount, failureReason?, runId }`
- [~] Extend `GetProcessingStatusQuery` (Phase 7) to also return `extractionStatus` + `currentExtractionRunId`
- [x] Event handler `DocumentOCRCompletedHandler` in `clauses/application/event-handlers/`:
  - [~] Listens for Phase 7 `DocumentOCRCompletedEvent`
  - [~] Dispatches `StartClauseExtractionCommand`
  - [~] **Only wire-in point into Phase 7**
- [x] Port interfaces:
  - [~] `IClauseExtractor` (per design §4)
  - [~] `IEmbeddingService` (per design §4)
  - [~] `IClauseRepository`, `IExtractionRunRepository`
- [x] Error taxonomy (per design §12):
  - [~] `ExtractionTransientError`, `ExtractionPermanentError`
  - [~] `EmbeddingTransientError`, `EmbeddingPermanentError`
- [x] Unit tests (~35):
  - [~] `StartClauseExtractionHandler` happy path with mocks
  - [~] Idempotency: running → skip; complete → skip; failed → new run
  - [x] Transient-fail-then-success at attempt 2
  - [x] Permanent-fail on attempt 1 (no retry)
  - [~] Retries-exhausted → status flips to `extraction_failed`
  - [~] Hallucinated-text drop counted, surviving clauses persisted
  - [~] Parent resolution happy path + missing-parent fallback to root
  - [~] Embedding failure → clauses persist with `embedding=null`, run completes
  - [~] `RetryClauseExtractionHandler` rejects when status ≠ `extraction_failed`
  - [~] `DocumentOCRCompletedHandler` dispatches the right command

**Done when:** application layer compiles against port interfaces, ~35 unit tests green.

---

### Task 8.3 — Infrastructure: Mock + pgvector + persistence ✅

Real persistence + mock drivers. Pipeline runs locally with no external API dependency.

- [x] Add dependencies to `apps/backend/package.json`:
  - [~] (No new runtime deps — pgvector enabled via SQL extension; Voyage/Anthropic come in 8.4/8.5)
- [x] Prisma migration:
  - [~] `CREATE EXTENSION IF NOT EXISTS vector;`
  - [~] Create `ExtractionRun` table per design §10
  - [~] Create `Clause` table per design §10 with `embedding vector(1024)` column via `Unsupported("vector(1024)")`
  - [~] Add `extractionStatus` + `currentExtractionRunId` columns to `Document`
  - [~] Indexes: `Clause(documentId)`, `Clause(extractionRunId)`, `Clause(type)`, `Clause(parentClauseId)`, `Document(extractionStatus)`
  - [~] (Defer HNSW index — added in Phase 10)
- [x] `infrastructure/extraction/mock-clause-extractor.ts`:
  - [~] Deterministic 5-clause output: indemnification, limitation_of_liability, termination, payment_terms, other
  - [~] One nested sub-clause under termination
  - [~] Risk fields populated with mock values (e.g., riskScore=50, riskLevel=medium)
  - [~] Text slices chosen so `indexOf` resolves cleanly against the input
- [x] `infrastructure/embeddings/mock-embedding-service.ts`:
  - [~] Deterministic 1024-dim vectors via SHA-256 hash of text expanded to floats
  - [~] `modelVersion: 'mock/mock-embeddings@v1'`
- [x] `infrastructure/persistence/prisma-clause.repository.ts`:
  - [~] `saveRun(run, clauses)` — single transaction, two-pass insert (parents first, then children with resolved FK)
  - [~] Vector column uses `$queryRaw` `INSERT ... VALUES ($1::vector)` since Prisma doesn't natively type pgvector
  - [~] `findByDocumentId` reads vector via `$queryRaw` returning `embedding::text` for now (full vector ops in Phase 10)
- [~] `infrastructure/persistence/prisma-extraction-run.repository.ts`
- [x] `ClausesModule` + DI wiring:
  - [~] Factory picks `IClauseExtractor` from `CLAUSE_EXTRACTOR` env (`mock` default)
  - [~] Factory picks `IEmbeddingService` from `EMBEDDING_DRIVER` env (`mock` default)
  - [~] Registers event handler `DocumentOCRCompletedHandler`
- [~] Wire `ClausesModule` into `AppModule` so handler resolves
- [x] Tests:
  - [~] Prisma repository round-trip with test DB: insert run + 5 clauses incl. nested → re-read matches
  - [~] pgvector column populated and readable
  - [~] Parent FK SET NULL on parent delete
  - [~] `Clause(documentId)` index used (EXPLAIN check)
  - [~] `MockClauseExtractor` produces stable output for stable input
  - [~] `MockEmbeddingService` produces 1024-dim vectors, deterministic per text

**Done when:** uploading a PDF via existing UI runs Phase 5 → 7 → 8 with mocks; real `ExtractionRun` + `Clause` rows persist; vectors populated; status flips to `extraction_complete`. No external API credentials touched.

---

### Task 8.4 — Infrastructure: Claude clause-extractor driver ✅

Real Claude call replacing `MockClauseExtractor`.

- [~] Add `@anthropic-ai/sdk` to backend deps (latest stable)
- [x] Env docs in `docs/deployment/anthropic-setup.md` (new):
  - [~] `CLAUSE_EXTRACTOR=anthropic`
  - [~] `ANTHROPIC_API_KEY`
  - [~] `CLAUDE_MODEL=claude-opus-4-7`
- [x] `infrastructure/extraction/claude-clause-extractor.ts`:
  - [~] Single `messages.create` call with tool-use schema (`extract_clauses` tool per design §6.3)
  - [~] System prompt + tool schema marked `cache_control: { type: 'ephemeral' }` for prompt caching
  - [~] Few-shot examples in system prompt (3 calibration clauses per §6.2)
  - [~] Chunking: if `input.text.length > 200_000`, split at page boundaries, parallel calls, merge with offset-shift
  - [x] Error mapping:
    - `429 | 503 | 529 | overloaded_error` → `ExtractionTransientError`
    - `400 | invalid_request_error | context_overflow` → `ExtractionPermanentError`
  - [~] Records `modelVersion = 'anthropic/' + model + '@' + apiVersion`
- [~] Pure mapper `claude-response-to-extracted-clauses.ts` — pure function, easy unit test
- [~] Update `ClausesModule` factory to switch `IClauseExtractor` on `CLAUSE_EXTRACTOR` env
- [x] Tests with `jest.mock('@anthropic-ai/sdk')`:
  - [~] Happy path single chunk
  - [~] Multi-chunk happy path with offset stitching
  - [~] Hallucinated-text clause is dropped server-side (handler-level, not driver — but driver returns it)
  - [~] Parent-ref resolution unit test
  - [~] Each error class mapping
  - [~] Prompt-caching header present in request
- [~] Live env-flag-gated test (`CLAUSE_EXTRACTOR_LIVE_TEST=1`): one real Anthropic call against one fixture (10-page born-digital). Cost cap ~$0.05. Not default CI.

**Done when:** `CLAUSE_EXTRACTOR=anthropic` env flip + real API key produces valid `Clause` rows from a real fixture. Tests mock the SDK; no live calls in default CI.

---

### Task 8.5 — Infrastructure: Voyage embeddings driver ✅

Swap embeddings slot from `MockEmbeddingService` to `VoyageEmbeddingService`.

- [~] Add `voyageai` npm package to backend deps
- [x] Env docs in `docs/deployment/anthropic-setup.md`:
  - [~] `EMBEDDING_DRIVER=voyage`
  - [~] `VOYAGE_API_KEY`
  - [~] `VOYAGE_MODEL=voyage-law-2`
- [x] `infrastructure/embeddings/voyage-embedding-service.ts`:
  - [~] Batches of 128 (Voyage limit)
  - [~] Retry 1s/4s/16s on `429 | 5xx | timeout` → `EmbeddingTransientError`
  - [~] `400 | 401 | 403` → `EmbeddingPermanentError`
  - [~] Cost telemetry: log `{ provider, model, batchSize, tokensUsed, latencyMs }`
  - [~] `modelVersion = 'voyage/voyage-law-2@' + responseModelHeader`
- [~] (Optional, not required for Phase 8 ship) `openai-embedding-service.ts` as second adapter — note in design.md that swap would require migration due to dim mismatch
- [~] Update factory to switch on `EMBEDDING_DRIVER`
- [x] Tests with mocked HTTP (msw or `nock`):
  - [~] Happy batch
  - [~] Batch-of-1 edge case
  - [~] Batches >128 split across multiple HTTP calls and merge
  - [~] Partial-batch failure handling
  - [~] Retry on 429
  - [~] Error mapping per class
- [~] Live env-flag-gated test (`EMBEDDINGS_LIVE_TEST=1`): 5-clause batch against real Voyage. Cost <$0.01.

**Done when:** `EMBEDDING_DRIVER=voyage` env flip produces 1024-dim vectors persisted to `Clause.embedding`. Default CI uses mock; live test confirmed once before signoff.

---

### Task 8.6 — Frontend: extracting state + results screen ✅

Roll `/processing/:id` forward through extraction; light up real `/results/:id`.

- [x] Extend `apps/frontend/src/api/processingService.ts`:
  - [~] `getProcessingStatus` response shape adds `extractionStatus`, `currentExtractionRunId`
- [x] `useProcessingStatus` hook:
  - [~] Terminal conditions updated: stops polling on `extraction_complete | extraction_failed | ocr_failed`
- [x] Update `ProcessingPageView`:
  - [~] State `processing` (OCR running) — existing UI
  - [~] State `ocr_complete && extracting` — "Identifying clauses…" + second progress band
  - [~] State `extraction_complete` — auto-navigate to `/results/:documentId`
  - [~] State `extraction_failed` — error card with reason; "Contact support" CTA (retry deferred to Phase 9)
- [x] New `apps/frontend/src/api/clausesService.ts` (3-tier pattern):
  - [~] `getClauses(documentId)` → `ClauseDto[]`
- [~] `useClauses(documentId)` React Query hook
- [x] `/results/:documentId` real implementation (replaces Phase 7 stub):
  - [~] Layout: left rail PDF preview (`pdfjs-dist`), right rail clauses list
  - [~] Clauses grouped by `type`; per-card: type chip, confidence pill, page anchor, expandable text
  - [~] Filter chips (multi-select clause type) + min-confidence slider (custom components, not Shadcn — per pinned preference)
  - [~] Click clause → PDF scrolls to `pageNumber` + highlights `[startOffset, endOffset)` range
  - [~] **Risk fields not surfaced** (Phase 9)
- [x] Storybook stories:
  - [~] `Processing — OCR`
  - [~] `Processing — Extracting`
  - [~] `Results — Populated (mixed types)`
  - [~] `Results — Empty (extraction returned 0 clauses)`
  - [~] `Results — Filtered (only indemnification visible)`
  - [~] `Failed — Extraction`
- [~] jest-axe pass on all stories
- [~] RTL + MSW smoke test covering: extracting state visible, results render, filter + scroll-to-clause flow

**Done when:** real upload → `/processing/:id` rolls through OCR → extracting → auto-redirects to populated `/results/:id`. Filters + click-to-scroll work. Axe clean.

---

### Task 8.7 — E2E + load smoke ✅

Real upload → real pipeline (mock LLM + mock embeddings) → real `Clause` rows + vectors, asserted end-to-end.

- [x] `clauses-extraction.e2e-spec.ts` against real NestJS test app + real Prisma + pgvector test DB + tmp-dir storage:
  - [~] **Born-digital fixture** → wait for `extraction_complete` → assert `ExtractionRun` row, ≥1 `Clause` rows, each with `embedding` populated (1024 dim), `classifierModelVersion` + `embeddingModelVersion` set
  - [~] **Multi-page fixture with chunking** (>200k chars synthetic) → assert offsets correct after stitch: re-slice `DocumentText.text` with `[startOffset, endOffset)` matches `clause.text` for every clause
  - [~] **Hallucinated-text fixture** (custom mock returns one bad clause) → bad clause dropped, `droppedClauseCount = 1`, other clauses persist, warning logged
  - [~] **Nested clause fixture** → parent-child FK resolved; deleting parent sets child's `parentClauseId = null`
  - [~] **Permanent-fail fixture** (mock throws `ExtractionPermanentError`) → `ExtractionRun.status = failed`, `Document.extractionStatus = extraction_failed`, no clauses persisted
  - [~] **Transient retry fixture** (mock fails twice then succeeds) → succeeds at attempt 3, single `ExtractionRun` row, status = complete
  - [~] **Re-extraction** → call `RetryClauseExtractionCommand` after failed → new `ExtractionRun` row, old run retained, `Document.currentExtractionRunId` points to new run
  - [~] **Embedding failure** (mock embedding service throws permanent) → clauses persist with `embedding=null`, run completes with `failureReason` note
- [~] **5-document concurrent smoke** — 5 parallel uploads all reach `extraction_complete` without DB deadlocks or serialization issues
- [~] (Optional, env-flag gated) one live Anthropic call + one live Voyage call against one fixture for pre-signoff. Not default CI.
- [~] Controller e2e extended with `GET /documents/:id/clauses` route covered
- [~] Update `.env.example` with Phase 8 vars: `CLAUSE_EXTRACTOR`, `ANTHROPIC_API_KEY`, `CLAUDE_MODEL`, `EMBEDDING_DRIVER`, `VOYAGE_API_KEY`, `VOYAGE_MODEL`
- [~] Create `docs/deployment/anthropic-setup.md` — API key provisioning, cost telemetry, prompt-caching note

**Done when:** `npm run test:e2e` green (mock LLM + mock embeddings), gated real-cloud tests pass when run by hand, docs sufficient for new engineer to stand up Anthropic + Voyage in one sitting.

---

### Phase 8 success criteria

- Upload a born-digital contract via `/upload` → `/processing/:id` rolls through OCR → extracting → auto-redirects to `/results/:id` within ~30s for a 20-page PDF.
- `/results/:id` shows clauses grouped by type, with confidence + page anchors; clicking a clause highlights it in the PDF preview.
- Re-extraction (via admin command) produces a second `ExtractionRun`; old run retained.
- All tests green; 0 lint errors; axe clean; no live external API calls in default CI.

### Deferred to later phases (intentional Phase 8 scope discipline)

- **Risk rubric SME validation** — Phase 9 prerequisite (rubric in design.md §6.2 is DRAFT)
- **Risk UI** — Phase 9 (level badges, escalation flow, threshold-driven events)
- **Crash recovery** (outbox or queue) — Phase 9 (when risk scoring becomes second consumer)
- **Semantic search endpoint + UI** — Phase 10
- **HNSW vector index** — Phase 10 (when clause count >10k)
- **Reranker** (Voyage rerank-2) — Phase 10 quality upgrade
- **Admin re-extract / re-embed UI** — Phase 11 (CLI command only in v1)
- **Cross-chunk parent linking** — Phase 11 (if observed in real data)
- **Languages other than English** — Phase 12+ (OCR rejects upstream)
- **Self-hosted Llama / domain fine-tune** — Phase 12+ (when volume justifies)

---

## Phase 9: User Story — Risk Scoring (Requirement 4)

**Status**: 📋 **PLANNED (0/4)**

**Goal**: Complete the risk-scoring story by validating the rubric,
shipping the per-flag Deep Dive view, wiring escalation events, and
making the pipeline crash-safe.

### What's already shipped in Phase 8 (not Phase 9 work)

Risk surfacing landed inside Phase 8.6 — these are **done**:

- ✅ `Clause` rows persist `riskScore`, `riskLevel`, `riskFlags`,
  `riskExplanation` (Phase 8.1 + 8.4).
- ✅ Risk Assessment card on `/results/:id` Overview tab — big numeric
  score + Critical/Caution/Info counters (Phase 8.6.d/e).
- ✅ Right-sidebar mini risk card (Phase 8.6.d).
- ✅ Risk Flags tab — accordion of clauses with `riskLevel >= medium`,
  severity dots, resolve / dismiss state (Phase 8.6.f).
- ✅ Document tab — critical + high clauses highlighted by offset
  (Phase 8.6.g).

The original locked decision D15 ("UI hides risk until SME validation")
was relaxed during Phase 8.6 — the wireframe already surfaced risk on
every screen, and we shipped that. **The rubric remains DRAFT.** Phase
9.0 below catches up on the SME validation work that justifies what's
already on screen.

### Remaining Phase 9 tasks

- **9.0 Rubric validation (SME workstream)** — assemble ≥50 ground-truth
  clauses (mix of severities + clause types), have a senior contracts
  lawyer label each, run the rubric over them, iterate the prompt
  until Cohen's κ ≥ 0.7 against the SME labels. Output: rubric v1
  signed off, calibration set checked into the spec repo for future
  regression. **No code changes required if the rubric ships green.**
  If gaps surface, edit `claude-prompt.ts` and add a regression test
  per identified failure mode.

- **9.1 Deep Dive screen** — the one risk UI piece still stubbed. The
  "Deep dive →" button in the Risk Flags accordion is currently
  disabled with a "Coming soon" tooltip; this task lights it up.
  Wireframe target: `wirframes/version_02/design_handoff_ci_redesign/screens/deepdive.html`.

  Sections per the wireframe:
    - Severity header band
    - "What this means" (use `risk.explanation` from Phase 8)
    - "The actual clause" (verbatim text from `clause.text` + page/section ref)
    - "Why it matters" (business-consequence callout)
    - "Market standard" (bulleted list of reasonable alternatives)
    - "What to ask for — copy & paste this" (suggested redline)
    - Mark resolved / Dismiss / Back to flags

  Open scoping question (decide before starting): is the
  "Market standard" + "Suggested language" content **canned per
  clause-type** (Phase 9 fast path, ~2 days) or **generated by a
  second Claude call per flag** (Phase 9.x, ~3-5 days, ~$0.05 per
  drill-down)? Wireframe shows hardcoded per-clause-type content,
  which means Path A is the wireframe-faithful choice.

- **9.2 Risk-flag escalation events** — domain events for clauses with
  `riskLevel === 'critical'`: emit `ClauseEscalatedEvent`, route
  through the Notification Service (Requirement 9, T12 in design.md).
  Likely also adds reviewer-assignment plumbing if we want auto-route.

- **9.3 Crash recovery for the pipeline** — deferred from Phase 8.
  Once Phase 9.2 lands a second consumer of the extraction events
  (notifications, alongside future search indexing in Phase 10), the
  current in-process bus is too fragile. Introduce either the outbox
  pattern (Postgres-only) or a real queue (BullMQ / pg-boss). See
  design.md `:478-490` for the prior locked decision.

- **9.4 Admin "re-run risk" command** — re-extract a document using a
  newer rubric/prompt without re-OCR-ing. CLI for v1; UI for Phase 11.
  Already most of the way there — `RetryClauseExtractionCommand`
  exists from Phase 8.2; just needs a script wrapper.

### Locked decisions (carrying through from Phase 8)

1. **Risk lives on `Clause`**. Phase 9 doesn't introduce a Risk
   aggregate.
2. **Document-level score is a weighted average** of per-clause scores.
   Helpers already in `apps/frontend/src/lib/riskHelpers.ts`.
3. **Rubric versioning** rides on `classifierModelVersion` of
   `ExtractionRun`. Re-runs create new runs; old runs retain their
   risk snapshot.
4. **Risk thresholds** stay hardcoded for v1. Customer-configurable
   thresholds → Phase 10+ once we have multi-tenant data.

### Open questions

- "Suggested redline language" sourcing — canned (faithful to wireframe)
  vs. LLM-generated (more flexible, costs $).
- Do critical clauses auto-escalate via email/Slack, or just appear in
  an "Action Required" inbox? (Probably both — phase the rollout.)
- Does Phase 9 need its own spec doc (`risk-scoring-design.md`)?
  Probably yes once 9.0 produces the validated rubric; small ADR for
  the canned-vs-LLM decision either way.

## Phase 10: User Story — Contracts View (Wireframe Screen 7)

**Requirement**: see [Requirement 13: Contracts View (Portfolio)](./requirements.md#requirement-13-contracts-view-portfolio)
in `requirements.md` for the full epic, the nine child stories
(US-PORT-1..9), acceptance criteria, and resolved scope decisions.

This section covers **execution only**: the Clean Architecture layer
map and the engineering task breakdown that implements those
requirements.

### Phase 10 layer map (Clean Architecture / DDD)

Phase 10 spans four layers. Tasks are ordered so each layer is in
place before the one above it depends on it. Within a layer, tasks
can be parallelised.

```
┌──────────────────────────────────────────────────────────────┐
│ Interface / UI (frontend)                                    │
│   10.8 Portfolio page + components                           │
│   10.9 Layout variants                                       │
│   10.10 Export CSV                                           │
│   10.11 E2E                                                  │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Interface / HTTP (backend) + Frontend data adapters          │
│   10.5 GET /api/documents controller + DTOs                  │
│   10.6 useDocumentListFilters (URL ⇄ filter state)           │
│   10.7 useDocumentList (react-query hook)                    │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Application (use cases, query handlers, projections)         │
│   10.2 Projection event handlers (write-side → read-side)    │
│   10.3 Backfill use case (one-off projection rebuild)        │
│   10.4 GetDocumentList + GetDocumentSummary query handlers   │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Domain + Infrastructure                                      │
│   Domain (unchanged): Document aggregate, ExtractionRun,     │
│                       Clause, domain events                  │
│   Infrastructure: 10.1 DocumentListItem read model           │
│                   (Prisma schema, migration, repository)     │
└──────────────────────────────────────────────────────────────┘
```

#### Why this layering for Phase 10

- **Domain stays untouched.** The `Document` aggregate, its events,
  and the existing repository contracts are the source of truth. Phase
  10 does not introduce a `Contract` aggregate (see Glossary
  decision) and does not change any domain invariants.
- **Read model is infrastructure, not domain.** `DocumentListItem` is
  a denormalised cache shaped for a specific query — it has no
  business rules, no invariants. It lives next to Prisma, not next to
  the aggregate.
- **Projection handlers are application services.** They listen to
  domain events emitted by the write side and translate them into
  read-model updates. They contain no domain logic — only mapping.
  Same pattern as the Phase 6 audit module.
- **Query handlers bypass the aggregate.** Reads of the list go
  directly from query handler → read-model repository → Prisma. No
  loading of `Document` aggregates from the write side. This is CQRS
  in its lightest form: same database, separate read and write
  paths.
- **HTTP and UI depend inward, never outward.** The controller
  depends on application query handlers (not on Prisma). The UI
  depends on the HTTP contract (DTO), not on backend internals. The
  URL-state hook is pure and has no React or HTTP coupling beyond a
  thin wrapper — it is testable in isolation.

#### Dependency rule applied to the task order

1. **10.1** ships the read-model table + repository (infrastructure)
   first. Nothing in the application layer can reference it
   otherwise.
2. **10.2** + **10.3** (application: projections + backfill) bring
   the read model into a usable state. Without these the table is
   empty and queries return nothing.
3. **10.4** (application: query handlers) consumes the now-populated
   read model. Unit-testable against an in-memory repository — no
   HTTP, no React.
4. **10.5** (HTTP boundary) exposes the query handlers. Validates
   input at the boundary; never re-validates inside handlers.
5. **10.6** + **10.7** (frontend adapters) sit on the HTTP contract.
   The URL hook is pure; the data hook is a thin react-query
   wrapper. Both unit-testable.
6. **10.8**–**10.11** (UI) compose the hooks into screens. No
   business logic; purely presentational + responsive behaviour.
7. **10.12** documents the cross-cutting glossary decision.

#### Test pyramid by layer

| Layer | Test type | Examples |
|---|---|---|
| Domain | Unchanged | Existing `Document.spec.ts` |
| Infrastructure | Repository integration | `document-list-item.repository.spec.ts` against a real Postgres |
| Application | Unit | Each projection handler + each query handler against an in-memory repo |
| HTTP | Integration / E2E | Supertest covering `GET /api/documents` |
| Frontend pure | Unit | `parse.ts` / `serialize.ts` / CSV formatter |
| Frontend hook | Integration | `useDocumentListFilters` with `MemoryRouter`; `useDocumentList` with MSW |
| End-to-end | Playwright | Task 10.11 |

---

### Phase 10 tasks

#### ~~Task 10.1: Store contract list data efficiently~~ ✅

- Add `DocumentListItem` Prisma model to `schema.prisma`:
  - `id` (PK, = documentId), `orgId`, `name`, `type`, `counterparty`,
    `riskScore` (null), `flagsRed`, `flagsOrange`, `flagsBlue`,
    `terminationDate` (null), `status`, `uploadedAt`,
    `hasUnlimitedLiability`, `updatedAt`.
  - Indexes: `(orgId, riskScore)`, `(orgId, uploadedAt)`,
    `(orgId, name)`, `(orgId, status)`.
- Generate migration `phase10_document_list_items`.
- Repository interface + Prisma adapter
  (`document-list-item.repository.ts`).

#### ~~Task 10.2: Keep the contract list fresh as documents change~~ ✅

Mirror the Phase 6 audit module's event-handler wiring under
`modules/documents/application/projections/document-list-item/`:

- `OnDocumentUploadedHandler` → INSERT row with `status='processing'`.
- `OnExtractionRunCompletedHandler` → UPDATE row with riskScore,
  flag counts, `hasUnlimitedLiability`, `status='complete'`.
- `OnDocumentFailedHandler` → UPDATE row with `status='failed'`.
- Unit-test each handler against an in-memory repository.

#### ~~Task 10.3: Bring existing contracts into the new list~~ ✅

- One-off script `scripts/backfill-document-list-items.ts` that walks
  every existing `Document`, computes the projection columns from
  the latest `ExtractionRun` + clauses + parties, and upserts into
  `document_list_items`.
- Idempotent (re-runnable). Logs counts. Document in
  `apps/backend/README.md`.

#### ~~Task 10.4: Filter, sort, and paginate contracts on the server~~ ✅

Under `modules/documents/application/queries/`:

- `GetDocumentListQuery` + handler
  → `{ items, page, pageSize, total, totalPages }`. Accepts
  `{ orgId, q, risk, type, sort, page, pageSize }`. Risk-band
  thresholds (7+, 4–6.99, <4) live in a shared helper alongside
  `riskHelpers.ts`.
- `GetDocumentSummaryQuery` + handler → 5 KPI fields. Ignores
  filters. Scoped to `orgId`.
- Unit tests for both, including filter composition, sort modes,
  pagination edges (page=0, page>totalPages), and empty portfolio.

#### ~~Task 10.5: Expose the contract list to the frontend~~ ✅

- `GET /api/documents` controller in `modules/documents/http/`.
- Compose `GetDocumentListQuery` + `GetDocumentSummaryQuery` and
  return `{ items, page, pageSize, total, totalPages, summary }` in
  the standard API envelope.
- Validate query params (zod): `q` (string, ≤200 chars), `risk`
  (enum), `type` (enum), `sort` (enum), `page` (int ≥1),
  `pageSize` (int 1–50, default 8).
- E2E test covering happy path, filter composition, pagination,
  empty result.

#### ~~Task 10.6: Make filters shareable and refresh-safe via the URL~~ ✅

Under `apps/frontend/src/lib/documentListFilters/`:

- `parse.ts` — pure `URLSearchParams → DocumentListFilters` with
  defaults applied and invalid values coerced to defaults.
- `serialize.ts` — pure `DocumentListFilters → URLSearchParams`
  omitting defaults so the URL stays clean.
- `defaults.ts`.
- `useDocumentListFilters.ts` — thin React Router wrapper that calls
  `useSearchParams` + parse/serialize, with 250 ms debounce on `q`.
- Unit tests on `parse`/`serialize` (round-trip, defaults, coercion);
  one integration test on the hook with `MemoryRouter`.

#### ~~Task 10.7: Fetch contract list data on the page~~ ✅

- `react-query` v3 `useQuery` hook keyed on the URL params.
- `keepPreviousData: true` so paging doesn't flash a skeleton.
- Returns `{ items, page, pageSize, total, totalPages, summary,
  isLoading, isFetching, error, refetch }`.
- Uses the 3-tier API call stack from the frontend guidelines.

#### ~~Task 10.8: Show the contracts page with KPIs, filters, and table~~ ✅

Under `apps/frontend/src/pages/portfolio/`:

- `PortfolioPage` — route at `/contracts`, owns the hook, renders
  children. PageShell with title + Export CSV + Upload actions.
- `KpiStrip` — 5-card grid (US-PORT-1).
- `FilterStrip` — search + 3 selects (US-PORT-2).
- `ContractsTableCard` — card header with "{n} shown".
- `ContractsTable` — 7-column table (US-PORT-3).
- `ContractRow` — hover/focus/keyboard behaviour (US-PORT-4).
- `Pagination` — server-side controls (US-PORT-5).
- Empty / loading / error states per US-PORT-7.
- Responsive behaviour per US-PORT-8 (existing `ci-*` responsive
  classes from the wireframe stylesheet).

#### ~~Task 10.9: Support table / cards / minimal layouts~~ ✅

- `layoutVariant` prop (`'table' | 'cards' | 'minimal'`) on
  `PortfolioPage`, reflected in `?layout=`. Default `table`.
- `cards` and `minimal` variants per US-PORT-6.
- Tweaks-panel entry.

#### ~~Task 10.10: Export the filtered list to CSV~~ ✅

- Client-side CSV builder that re-fetches **all** filtered rows
  (single call with `pageSize=total`, capped at 5000) and triggers a
  browser download.
- Columns + formatting per US-PORT-9.
- Unit test on the CSV-formatting helper (quoting, escaping, ISO
  dates).

#### ~~Task 10.11: Verify the full Contracts View end-to-end~~ ✅

- Playwright spec covering: navigate to `/contracts`, see KPI strip,
  apply each filter, change sort, paginate, click a `complete` row
  → lands on Results, verify `failed` row is non-interactive,
  refresh preserves URL state, Export CSV downloads the expected
  file.

#### ~~Task 10.12: Document the Contract = Document decision~~ ✅

- Note "Contract = Document (v1)" in CONTEXT.md.
- One-line entry in `MEMORY.md` under project memory.
- Optional small ADR if we expect the equivalence to break later.

---

### MVP slice for cutting the first PR

10.1 → 10.2 → 10.3 → 10.4 → 10.5 → 10.6 → 10.7 → 10.8 ships the
US-PORT-1..5 + 7 + 8 slice. 10.9 (variants), 10.10 (CSV), 10.11
(E2E), 10.12 (docs) are follow-ups.

Open scope items (e.g. the 300px side column) are tracked in
`requirements.md` under Requirement 13 → **Still open**.

---

## Phase 11: Clause Intelligence (Similar Clauses + Semantic Search)

**Requirement**: see [Requirement 14: Clause Intelligence](./requirements.md#requirement-14-clause-intelligence-similar-clauses--semantic-search)
in `requirements.md` for the full epic, the three child stories
(US-CI-0..2), acceptance criteria, and resolved scope decisions.

**Visual specs**: `docs/design/similar-clauses-visual.md`,
`docs/design/semantic-search-visual.md`.

**Implementation plan**: `docs/design/similar-clauses-impl-plan.md` (US-CI-1).

This section covers **execution only**: the layer map and the
engineering task breakdown that implements those requirements.

### Phase 11 layer map (Clean Architecture / DDD)

```
┌──────────────────────────────────────────────────────────────┐
│ Interface / UI (frontend)                                    │
│   11.6  Find similar trigger + drawer integration            │
│   11.7  SimilarClausesDrawer + result-row components         │
│   11.8  Comparison-mode navigation + highlight               │
│   11.9  (US-CI-2) Search overlay + /search page              │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Interface / HTTP (backend) + Frontend data adapters          │
│   11.4  GET /api/v1/clauses/:id/similar controller + DTO     │
│   11.5  useSimilarClauses hook + service                     │
│   11.10 (US-CI-2) GET /api/v1/search controller + DTO        │
│   11.11 (US-CI-2) useSemanticSearch hook                     │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Application (use cases, query handlers)                      │
│   11.3  GetSimilarClauses query handler                      │
│   11.12 (US-CI-2) SearchPortfolio query handler + HyDE       │
│         rewriter port                                        │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Domain + Infrastructure                                      │
│   Domain (unchanged): Clause aggregate, Document aggregate   │
│   Infrastructure:                                            │
│     11.0  Pre-flight: HNSW index migration + embedding       │
│           backfill script                                    │
│     11.1  ClauseSimilarityRepository (pgvector raw SQL)      │
│     11.2  Demo-readiness audit script                        │
│     11.13 (US-CI-2) HydeQueryRewriter (Claude driver)        │
└──────────────────────────────────────────────────────────────┘
```

#### Why this layering for Phase 11

- **Domain stays untouched.** No new aggregates. The `Clause` aggregate
  already owns `embedding` and `embeddingModelVersion` from Phase 8;
  Phase 11 just queries it.
- **Vector search is infrastructure, not domain.** Cosine kNN is a
  storage concern (pgvector). It sits behind a repository interface
  (`ClauseSimilarityRepository`) so the query handler is testable
  against an in-memory implementation.
- **Query handlers bypass the aggregate.** Reads do not load `Clause`
  aggregates — they hit the read-side repository directly, same CQRS
  shape as Phase 10's contract list.
- **HyDE rewriting is a port.** The Claude driver implements
  `HydeQueryRewriter`; the handler depends only on the port. A
  pass-through stub is used in tests so semantic-search handler tests
  do not require an LLM.

#### Dependency rule applied to the task order

1. **11.0** ships the HNSW index + the backfill script. Without the
   index, the kNN query is unusable on real data; without the
   backfill, clauses ingested while Voyage was disabled are
   invisible.
2. **11.1** (infrastructure: repository) wraps pgvector raw SQL behind
   a domain-language interface.
3. **11.2** (audit script) verifies demo readiness — fail fast if the
   dataset cannot support a credible demo.
4. **11.3** (application: query handler) consumes the repository.
   Unit-testable against the in-memory implementation.
5. **11.4** (HTTP boundary) exposes the handler. Boundary validation
   only; never re-validates inside the handler.
6. **11.5**–**11.8** (frontend) compose hook → components → page
   integration. UI has no business logic.
7. **11.9**–**11.13** (US-CI-2) reuse the index, the result-row
   components, and the hook pattern from US-CI-1, then add HyDE +
   the dedicated search surface.

#### Test pyramid by layer

| Layer | Test type | Examples |
|---|---|---|
| Domain | Unchanged | Existing `Clause.spec.ts` |
| Infrastructure | Repository integration | `pgvector-clause-similarity.repository.spec.ts` against real Postgres + seeded embeddings |
| Application | Unit | `get-similar-clauses.handler.spec.ts` against in-memory repo |
| HTTP | Integration | Supertest covering `GET /api/v1/clauses/:id/similar` happy + 404 + 409 |
| Frontend pure | Unit | Similarity-bar formatting; URL-params (US-CI-2) parse/serialise |
| Frontend hook | Integration | `useSimilarClauses` with MSW |
| End-to-end | Playwright | Task 11.14 |

---

### Phase 11 tasks

#### ~~Task 11.0: Pre-flight — pgvector index + embedding backfill (US-CI-0)~~ ✅

**Goal**: ensure every existing clause has an embedding and that `Clause.embedding`
is indexed for sub-300ms kNN, before any feature work begins.

- **HNSW index migration**:
  `apps/backend/prisma/migrations/20260521000000_phase11_clause_embedding_hnsw_index/migration.sql`
  creates `Clause_embedding_cosine_idx` using `hnsw (embedding vector_cosine_ops)`,
  built `CONCURRENTLY` so writes are not blocked. The migration is
  marked `-- prisma-no-transaction` because `CREATE INDEX CONCURRENTLY`
  cannot run inside Prisma's default transaction wrapper.
- **Backfill script**: `apps/backend/scripts/backfill-clause-embeddings.ts`:
  - Selects every `Clause` with `embedding IS NULL` and non-empty `text`.
  - Calls the existing `VoyageEmbeddingService` in batches of 128 (the
    Voyage server-side cap; the driver enforces the same).
  - Writes back via raw SQL `UPDATE "Clause" SET embedding =
    $literal::vector, "embeddingModelVersion" = $model WHERE id = $id`
    — Prisma cannot bind `vector(1024)` directly.
  - Idempotent (re-run only touches still-null rows).
  - Flags: `--dry-run` (no Voyage calls, no writes) and `--limit=N`
    (cap rows in a single run).
  - Permanent errors abort with exit 1; transient errors log and
    continue (exit 2 if any transient batches were skipped).
- **Coverage audit query** (run before and after backfill):
  ```sql
  SELECT type,
         COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS embedded,
         COUNT(*) AS total
  FROM "Clause"
  GROUP BY type
  ORDER BY total DESC;
  ```
  After backfill, `embedded = total` for every clause type. If any
  clause type used in the demo has fewer than 3 embedded rows,
  upload supplemental contracts (operational task, not a code
  change — see US-CI-0 AC7).
- **Run order**:
  1. `npx prisma migrate deploy` (creates the HNSW index)
  2. `npx ts-node --project tsconfig.scripts.json scripts/backfill-clause-embeddings.ts --dry-run`
     — confirm pending counts look right
  3. Re-run without `--dry-run` to actually embed
  4. Re-run the coverage audit; confirm green
- **Acceptance** (US-CI-0 AC1–AC7): all met before Task 11.1 starts.

**Definition of Done**:
- [ ] Migration applied to development DB
- [ ] Coverage audit shows `embedded = total` for every type
- [ ] Every demo-relevant clause type has ≥3 embedded rows
- [ ] Backfill script tested with `--dry-run` and `--limit=10` on a real subset
- [ ] One-line note added to `MEMORY.md` linking to `phase11_status.md` (when created)

---

#### ~~Task 11.1: Vector-search repository (infrastructure)~~ ✅

**Goal**: hide pgvector raw SQL behind a domain-language interface so the
application layer never touches `$queryRaw`.

- Port: `apps/backend/src/modules/clauses/application/ports/clause-similarity.repository.ts`:
  ```ts
  export interface ClauseSimilarityRepository {
    findSimilar(input: {
      sourceClauseId: string;
      sourceDocumentId: string;
      clauseType: string;
      limit: number;
      minSimilarity?: number;
    }): Promise<SimilarClauseRow[]>;
  }
  ```
- Prisma adapter: `apps/backend/src/modules/clauses/infrastructure/persistence/pgvector-clause-similarity.repository.ts`:
  - Raw SQL using `<=>` cosine-distance operator.
  - Excludes self + same-document clauses; filters to same type.
  - Returns rows joined with `Document` for title + uploadedAt.
- In-memory adapter for tests: `mock-clause-similarity.repository.ts`
  with cosine-similarity computed in TS.

**Definition of Done**:
- [ ] Port exists with a single method, no Prisma types leaking
- [ ] Prisma adapter passes a real-DB integration test against a
      seeded fixture
- [ ] In-memory adapter passes a parity unit test (same input → same
      ordering as the Prisma adapter)

---

#### ~~Task 11.2: Demo-readiness audit script~~ ⏸ deferred

**Goal**: a single command that the operator runs before any demo to
verify the dataset will not embarrass the feature.

- `apps/backend/scripts/check-demo-readiness.ts`:
  - Reads a fixture file `scripts/fixtures/demo-clauses.json` listing
    `{ documentId, clauseId, expectedMinResults }` tuples.
  - For each, calls the `ClauseSimilarityRepository` directly and
    asserts `results.length >= expectedMinResults`.
  - Prints a green/red table; exits non-zero on any red row.
- Run as part of the Friday pre-demo checklist (US-010 implementation
  plan §6).

**Definition of Done**:
- [ ] Script exists and runs against the dev DB
- [ ] Fixture file committed with the demo clauses chosen for the
      Friday demo
- [ ] All fixture rows green

---

#### ~~Task 11.3: GetSimilarClauses query handler (application)~~ ✅

**Goal**: a single CQRS query that powers the Similar Clauses endpoint.

- `apps/backend/src/modules/clauses/application/queries/get-similar-clauses.query.ts`:
  `{ clauseId, limit = 5 }` with validation (`limit ∈ [1, 20]`).
- `get-similar-clauses.handler.ts`:
  1. Load source `Clause` by id; throw `ClauseNotFoundError` if
     missing.
  2. If `embedding IS NULL`, throw `ClauseNotEmbeddedError`.
  3. Call `ClauseSimilarityRepository.findSimilar(...)`.
  4. Map rows to `SimilarClausesResponse` DTO.
- DTO: `get-similar-clauses.dto.ts` matching the API contract in
  US-010 §API Contract.
- Spec: handler unit tests against in-memory repository — happy
  path, no results, missing source, null-embedding source, type
  filter applied, self/same-document exclusion.

**Definition of Done**:
- [ ] All handler-spec branches green
- [ ] DTO matches US-010 §API Contract exactly
- [ ] Error classes thrown match what the controller will map

---

#### ~~Task 11.4: GET /api/v1/clauses/:id/similar (HTTP boundary)~~ ✅

**Goal**: expose the query over HTTP with proper error mapping.

- Extend the existing clauses controller (or create one) with the
  route.
- Map errors to status codes per US-010 §API Contract:
  | Status | Code | When |
  |---|---|---|
  | 404 | `clause_not_found` | source missing |
  | 409 | `clause_not_embedded` | `embedding IS NULL` |
  | 400 | `invalid_limit` | `limit ∉ [1, 20]` |
- Apply the same auth guard as other clause endpoints.
- e2e test (supertest) against a docker-compose pgvector instance
  with seeded data: asserts shape, ordering, status codes.

**Definition of Done**:
- [ ] Route returns 200 with correct shape on happy path
- [ ] All error paths return the exact status + code from the spec
- [ ] p95 latency < 300ms on a portfolio of ≥10k embedded clauses

---

#### ~~Task 11.5: Frontend service + `useSimilarClauses` hook~~ ✅

**Goal**: feed components without coupling them to fetch logic.

- Service: `apps/frontend/src/services/similarClausesService.ts` —
  thin wrapper over the existing 3-tier API call stack, returning
  `SimilarClausesResponse`.
- Hook: `apps/frontend/src/hooks/useSimilarClauses.ts` —
  `react-query` v3 (project already uses v3; see Phase 10 decision).
  Keyed on `clauseId`. `enabled: clauseId != null`. Stale time 5
  minutes.

**Definition of Done**:
- [ ] Service unit-tested with MSW (happy + 404 + 409)
- [ ] Hook integration test renders against MSW and a `QueryClient`

---

#### ~~Task 11.6: `FindSimilarButton` + drawer state on Results page~~ ✅

**Goal**: wire the trigger into the existing clauses tab.

- New component: `apps/frontend/src/components/features/similar-clauses/FindSimilarButton/`
  (5-file structure per `USER_STORY_TEMPLATE.md`).
- Add the button to the clause card actions area on the Results page
  (`pages/ResultsPage/tabs/...`).
- Lift drawer state to the tab page:
  `const [openForClauseId, setOpenForClauseId] = useState<string | null>(null)`.
- Render the button only when `clause.embedding` is non-null
  (US-CI-1 AC6: hidden, not disabled).
- Wire `F` keyboard shortcut for focused clauses.

**Definition of Done**:
- [ ] Button renders on every embedded clause
- [ ] Button is absent (not disabled) on un-embedded clauses
- [ ] Click and `F` both open the drawer for the right clause
- [ ] No regressions on the existing clauses tab

---

#### ~~Task 11.7: `SimilarClausesDrawer` + result-row components~~ ✅

**Goal**: build the six components from US-010 §Component Inventory.

Build in this order so each is testable on its own:

1. `SimilarityBar` — `value: number` (0..1), bar + `% match` label.
2. `PrecedentRow` — bar · type · meta · snippet · arrow; default
   / hover / active states.
3. `SourceClauseCard` — muted compact variant of the clause card.
4. `EmptyPrecedentState` — icon + headline + body copy.
5. `SimilarClausesDrawer` — 480px right slide-over, header,
   source block, results list, breadcrumb, all states (loading
   skeletons / empty / error / loaded / single-result).
6. Storybook stories for every component covering every state.

Flag `SimilarityBar` and `PrecedentRow` in code comments as
**reusable infrastructure** — Task 11.9 (US-CI-2) imports them
unchanged.

**Definition of Done**:
- [ ] All 5 components built per the 5-file pattern
- [ ] Storybook covers default / hover / active / loading /
      empty / single-result states
- [ ] Unit + a11y tests pass (`role="dialog"`, focus trap, focus
      return, `aria-modal`, keyboard nav)

---

#### ~~Task 11.8: Comparison-mode navigation + highlight~~ ✅ (simplified)

**Goal**: clicking a result navigates the main view to the target
clause with a visible highlight, drawer stays open with active state.

- Lift "scroll into view + apply highlight" behaviour to the page
  (so the drawer doesn't need to know how the main view scrolls).
- 2-second highlight ring on the target clause; persistent
  left-border accent until drawer closes.
- Active row state in the drawer (filled border / accent).
- Breadcrumb in drawer header: `Similar clauses › {Contract} §{section}`.
- Clicking the source block returns navigation to source clause and
  clears active state.

**Definition of Done**:
- [ ] Navigation works for results in the same contract and in
      different contracts
- [ ] Highlight animation does not jank scrolling
- [ ] Active state matches the visual spec
- [ ] All US-CI-1 acceptance criteria met
- [ ] `phase11_status.md` memory note created marking US-CI-1
      complete

---

### ~~Tasks 11.9–11.13: US-CI-2 (Semantic Search)~~ ✅ — frontend only (mocked backend)

**What shipped (commit `5d57994`):** complete UX surface, mocked at the
service boundary. The components, hook, routing, and TopNav wiring are
all production-final; the search engine itself is hand-curated for
the 4 canonical suggested queries plus a single low-confidence
fallback for off-script input.

- **11.9** ✅ Search overlay component + `/search` page route
- **11.10** ⏸ `GET /api/v1/search` controller + DTO — **deferred**
  (mock service stands in)
- **11.11** ✅ `useSemanticSearch` hook + service (mock)
- **11.12** ⏸ `SearchPortfolio` query handler (HyDE rewriter →
  embedding → similarity repo) — **deferred** with the real backend
- **11.13** ⏸ `HydeQueryRewriter` Claude driver — **deferred** with
  the real backend

`SimilarityBar` and `PrecedentRow` are reused unchanged from Task 11.7
as designed. When the real backend lands (next sprint), the only file
that changes is `services/semanticSearchService.ts` — replace the
mock body with `httpService.get(API.SEARCH, ...).then(unwrap)`.

---

### ~~Task 11.14: Phase 11 E2E~~ ⏸ deferred

Playwright spec covering: open a contract, click `Find similar` on a
clause, see precedents in the drawer, click a result, verify
navigation + highlight, close the drawer, then (after US-CI-2)
`⌘K` → query → click contract result → land on the matched clause.

Deferred — unit + integration coverage is adequate for the demo;
revisit when US-CI-2 backend lands and the full flow is real.

---

### Additional work (unplanned but completed)

These weren't in the original Phase 11 plan but landed as part of the
sprint:

- ✅ **Design alignment polish pass** (`27ca517`) — brought the six
  Similar Clauses components up to the Claude Design handoff spec
  (threshold-coloured `SimilarityBar` with ticks, Georgia italic
  snippets, bottom-right arrow, breadcrumbs, footer kbd hints, slide-in
  animation, top:56px drawer mount). Also fixed a Tailwind v4 class-naming
  bug — camelCase classes (`text-inkMid`) were silently no-ops; mass
  rename to kebab-case (`text-ink-mid`).
- ✅ **Claude Design handoff imported** (`ecef0fc`) into
  `wirframes/version_02/design_handoff_new_features/` as the canonical
  reference superseding the lo-fi visual specs in `docs/design/`.
- ✅ **TopNav integration fixes** (`6e5f099`, `a59e2b3`) — GlobalSearchBar
  was originally wired into the unused `AppNav`; moved to the active
  `HomePageV2/components/TopNav`. ResultsPage never had top navigation at
  all — added it in all three return paths (loading / error / loaded).
- ✅ **Backend extraction fixes** (`59a76c3`, `e104774`) — dense DPAs
  (AWS, Salesforce) were failing with `corrupt_response`. Raised
  `MAX_OUTPUT_TOKENS` from 8192 → 32K and switched the Claude call
  from `messages.create` to `messages.stream(...).finalMessage()` to
  bypass the SDK's 10-min synchronous-call guard. Diagnostic log now
  includes `stop_reason` + `usage` so the next failure variant is
  unambiguous.
- ✅ **ProcessingPage demo speed-up** (`72005f4`) — trimmed
  `STEP_DWELL_MS` 3000→800 and `SUCCESS_DWELL_MS` 5000→1500. The
  artificial floor on the 6-step animation drops 18s → ~5s; backend
  reality still gates progression as before.
- ✅ **`--re-embed-mock` flag** on `backfill-clause-embeddings.ts`
  (`db4e8ec`) — supports re-embedding clauses whose `embeddingModelVersion`
  starts with `mock/`, used when switching the dev driver from the
  deterministic mock to real Voyage.
- ✅ **10 standard online contract PDFs** added to `test-contracts/online/`
  (`7649db8`) — AWS DPA, Salesforce DPA, Stripe DPA, Atlassian DPA, and
  6 Bonterms standards. After upload, demo dataset went from ~65 →
  119 clauses; `data_protection` from 2 → 42.

---

### Phase 11 outcome (2026-05-21)

**Status: shipped to `Development`**, 18 commits, demo-ready.

**What's live end-to-end:**

- **US-CI-1 (Similar Clauses)** — production: real `voyage-law-2`
  embeddings on every clause, pgvector HNSW kNN, drawer mounted in
  the Clauses tab on ResultsPage, `F` keyboard shortcut, click-to-new-tab
  navigation, all UI states (loading skeletons / empty / error /
  single / multi-result), threshold-coloured similarity bars, Georgia
  italic snippets, breadcrumbs, footer kbd hints. p95 latency <300ms.
- **US-CI-2 (Semantic Search)** — UX-complete, mock-backed: global
  `⌘K` overlay with two-section results (Top contracts + Top clauses),
  `/search` page with tabs / filter chips / sort / Load more,
  suggested-searches idle state, low-confidence banner, no-results
  fallback. Backend swap-ready (one file).

**Demo dataset:** 119 clauses across 13 contracts, 100% embedded.
`data_protection` 42 · `termination` 19 · `limitation_of_liability` 11.
Safe demo clicks: `data_protection`, `limitation_of_liability`,
`termination`, `indemnification`. Avoid: `change_of_control` (1),
`representations_warranties` (1) — will hit empty state.

**Tests:** 173 backend (clauses module) + 58 frontend (similar-clauses
+ hook + service). No regressions. Pre-existing 3 jest-syntax failures
in `authService` / `referenceDataService` / `LogoutButton` specs are
unrelated to Phase 11 work.

**What's intentionally deferred:**

- Task 11.2 (demo-readiness audit script) — dataset already verified
  manually; revisit when it grows.
- Tasks 11.10 / 11.12 / 11.13 (real Semantic Search backend with HyDE)
  — the highest-leverage post-demo work. UX is finished, swap is one
  service-body change. Estimated 1.5–2 days.
- Task 11.14 (Phase 11 E2E Playwright) — defer until the SS backend
  ships and the full flow is real.

**Open scope items** (cross-type matching, scoped `⌘K`, similarity
threshold UX) are tracked in `requirements.md` under
Requirement 14 → **Still open**.

---

### MVP slice for cutting the first PR

**US-CI-1 slice**: 11.0 → 11.1 → 11.2 → 11.3 → 11.4 → 11.5 → 11.6 →
11.7 → 11.8 ships Similar Clauses end-to-end. **Demo target: Fri
2026-05-22.** ✅ shipped 2026-05-21.

**US-CI-2 slice**: 11.9 → 11.10 → 11.11 → 11.12 → 11.13 follows
once US-CI-1 reaches DoD. ✅ frontend shipped 2026-05-21 with mock
service; backend deferred.

---

## Phase 12: Ask Your Portfolio (Conversational AI)

**Requirement**: see [Requirement 15: Ask Your Portfolio](./requirements.md#requirement-15-ask-your-portfolio-conversational-ai)
in `requirements.md` for the epic, the four child stories (US-AP-1..4),
acceptance criteria, and resolved scope decisions.

**Visual specs**: `WIREFRAMES_ASK_PAGE.md`,
`WIREFRAMES_CHAT_RESPONSE_TYPES.md`, interactive prototype
`wirframes/ask-page/ask-page.html`.

**Design / flow / plan**: `DESIGN_PORTFOLIO_AI_CHAT.md`,
`FLOW_QUESTION_TO_ANSWER.md`, `PORTFOLIO_AI_CHAT_IMPLEMENTATION_PLAN.md`.

This section covers **execution only**: the layer map and the engineering
task breakdown that implements those requirements.

### Phase 12 layer map (Clean Architecture / DDD)

```
┌──────────────────────────────────────────────────────────────┐
│ Interface / UI (frontend)                                    │
│   12.7  AskPage route + hero + ask box                       │
│   12.8  AnswerCard shell (header / body / footer)            │
│   12.9  Result blocks (risk, comparison, timeline,           │
│         clause-list, financial, doc-summary, prose)          │
│   12.10 SuggestedQuestions + Citation chip                   │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Interface / HTTP (backend) + Frontend data adapters          │
│   12.5  POST /api/v1/ask controller + DTOs                   │
│   12.6  useAskPortfolio hook + askService                    │
│   12.11 Thread/message/feedback controllers (US-AP-4)        │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Application (use cases, command/query handlers)              │
│   12.3  AskPortfolio command handler                         │
│   12.4  QueryHandlerRegistry + per-type query handlers       │
│         (risk first; rest in 12.9-parallel)                  │
└──────────────────────────────────────────────────────────────┘
                            ▲
┌──────────────────────────────────────────────────────────────┐
│ Domain + Infrastructure                                      │
│   Domain: ChatThread aggregate, ChatMessage entity,          │
│           ChatFeedback (new, minimal)                        │
│   Infrastructure:                                            │
│     12.0  Prisma schema + migration (thread/message/        │
│           feedback)                                          │
│     12.1  QueryClassifier (pure) + ContextBuilder           │
│           (reads documents/clauses/risk, reuses Phase 11     │
│           kNN for clause-type retrieval)                     │
│     12.2  ClaudeAnswerService (port + Anthropic driver) +    │
│           PromptBuilder + CitationExtractor                  │
└──────────────────────────────────────────────────────────────┘
```

#### Why this layering for Phase 12

- **No re-extraction.** Context is assembled from data Phases 3/4/11
  already produced (metadata, clauses, risk scores, embeddings). The
  ContextBuilder reads; it never re-runs the pipeline.
- **Classification + context are infrastructure/pure.** The classifier
  is a pure function; the context builder is a read-side service behind
  an interface, so the command handler is unit-testable without a DB.
- **The LLM is a port.** `ClaudeAnswerService` is an interface with an
  Anthropic driver; a stub returns canned answers in handler tests so
  no test needs a live LLM.
- **Query handlers behind a registry.** Each query type is its own
  handler implementing a common interface; the registry routes by the
  classifier's output. Adding a type = adding a handler, no edits to the
  command handler.
- **Grounding is enforced at the boundary.** CitationExtractor validates
  every reference against the retrieved context before the response
  leaves the application layer; unbacked references are dropped.

#### Dependency rule applied to the task order

1. **12.0** ships the schema + migration (thread / message / feedback).
2. **12.1** ships the pure classifier and the context builder (reads
   only). Unit-testable in isolation.
3. **12.2** ships the Claude port + driver, prompt builder, and citation
   extractor.
4. **12.3 / 12.4** (application) compose 12.1 + 12.2 behind the command
   handler and the query-handler registry — **risk handler first**.
5. **12.5** (HTTP boundary) exposes the handler; boundary validation only.
6. **12.6–12.8** (frontend) compose hook → ask box → answer-card shell.
7. **12.9** adds the remaining result blocks + their query handlers in
   parallel once the risk slice is green.
8. **12.10** adds suggestions + citation chips. **12.11** adds thread
   history + feedback (US-AP-4).

#### Test pyramid by layer

| Layer | Test type | Examples |
|---|---|---|
| Domain | Unit | `ChatThread.spec.ts` (message append, ownership) |
| Infrastructure | Unit / integration | `query-classifier.spec.ts` (pure); `context-builder.spec.ts` against seeded read models |
| Application | Unit | `ask-portfolio.handler.spec.ts` + per-handler specs against in-memory repos + stub LLM |
| HTTP | Integration | Supertest on `POST /api/v1/ask` happy + auth-scope + LLM-failure |
| Frontend pure | Unit | classifier-parity (if mirrored), citation chip mapping |
| Frontend hook | Integration | `useAskPortfolio` with MSW |
| End-to-end | Playwright | Task 12.12 |

---

### Phase 12 tasks

#### Task 12.0: Prisma schema + migration — thread / message / feedback

**Goal**: persist conversations so answers survive reloads and feedback can be recorded.

- Add `ChatThread`, `ChatMessage`, `ChatFeedback` models per
  `PORTFOLIO_AI_CHAT_IMPLEMENTATION_PLAN.md` (owner = user; message
  stores role, content, sequence, citations JSON, routing/format
  metadata JSON; feedback links 1:1 to an assistant message).
- Generate migration; add indexes on `(userId)`, `(threadId, sequence)`.
- **DoD**: migration applies cleanly; `prisma generate` passes.

#### Task 12.1: QueryClassifier (pure) + ContextBuilder (read-side)

**Goal**: turn a question into a query type and a grounded context slice.

- `QueryClassifier`: pure function → one of the 7 types; `general`
  fallback. Fully unit-tested across representative phrasings.
- `ContextBuilder`: per-type read of documents/clauses/risk scoped to
  the user; reuses Phase 11 kNN for `clause-type-search`. Returns a
  typed `PortfolioContext`.
- **DoD**: classifier + context builder unit tests green; no DB writes.

#### Task 12.2: ClaudeAnswerService (port + driver) + PromptBuilder + CitationExtractor

**Goal**: produce a grounded, cited answer from context + question.

- `ClaudeAnswerService` interface + Anthropic driver (uses
  `CLAUDE_API_KEY`); prompt-cache the system prompt.
- `PromptBuilder`: per-type system + user prompt from `PortfolioContext`.
- `CitationExtractor`: parse references, **validate against context**,
  drop unbacked ones.
- Stub driver for tests.
- **DoD**: extractor drops unbacked citations in tests; driver isolated
  behind the port.

#### Task 12.3: AskPortfolio command handler

**Goal**: orchestrate classify → build context → prompt → answer →
extract citations → persist messages.

- Persists user + assistant messages (Task 12.0); auth-scoped.
- **DoD**: handler unit test (in-memory repos + stub LLM) covers happy
  path + LLM-failure → structured error.

#### Task 12.4: QueryHandlerRegistry + risk handler

**Goal**: route by query type; implement `risk-analysis` end-to-end.

- Common `QueryHandler` interface (buildContext / buildPrompt /
  extractCitations / formatResponse); registry resolves by type.
- Risk handler returns ranked `structuredData` (format `ranked-list`).
- **DoD**: registry routing test; risk handler spec green.

#### Task 12.5: POST /api/v1/ask controller + DTOs

**Goal**: expose the handler over HTTP.

- Request/response DTOs (`prose`, `format`, `structuredData`,
  `citations`); boundary validation only; `@CurrentUser` scope.
- **DoD**: Supertest happy + auth-scope + LLM-failure (structured
  error, not 5xx).

#### Task 12.6: useAskPortfolio hook + askService

**Goal**: frontend data layer.

- React Query mutation; `askService` posts to `/api/v1/ask`; types
  mirror the DTOs.
- **DoD**: hook integration test with MSW.

#### Task 12.7: AskPage route + hero + ask box

**Goal**: the page shell (US-AP-1).

- `/ask` in `PageShell`; time-aware greeting; ask box (sparkle,
  placeholder, `⌘K` focus, gradient Ask button); newest-on-top stack;
  hero collapses after first answer.
- **DoD**: renders empty state; submit mounts a loading card.

#### Task 12.7a: TopNav "Ask" entry point

**Goal**: give users a navigation path to `/ask` (US-AP-1).

- Add an **"Ask"** primary link to `TopNav` (existing primary-nav
  pattern with `aria-current`); routes to `/ask`. No new ⌘K overlay —
  the design explicitly rejected the tabbed-⌘K approach.
- **DoD**: link renders in `TopNav`, marks `aria-current="page"` on
  `/ask`, and navigates there; existing `TopNav` tests updated.

#### Task 12.8: AnswerCard shell (header / body / footer)

**Goal**: the card frame around every answer.

- Header (`YOU ASKED` + question + action icons incl. dismiss); body
  (prose + block slot); footer (sources + Refine + 👍/👎).
- `aria-live="polite"` on load completion.
- **DoD**: shell renders with the risk block; dismiss removes the card.

#### Task 12.9: Result blocks + remaining query handlers (US-AP-3)

**Goal**: fan out from risk to all types.

- Blocks: `ResultTableBlock` (risk/general list), `ComparisonTableBlock`,
  `TimelineBlock`, `ClauseListBlock` (reuse `ClauseCard`/`PrecedentRow`),
  `FinancialSummaryBlock` (reuse `SimilarityBar`), `DocSummaryBlock`,
  `ProseBlock`; paired backend handlers.
- `ChatMessage`-style renderer picks the block from `metadata.format`.
- **DoD**: each block renders from canned `structuredData`; each handler
  spec green.

#### Task 12.10: SuggestedQuestions + Citation chip

**Goal**: first-run guidance + inline grounding.

- Suggestions (one per type, reuse `SuggestedSearches` look) fill +
  submit; citation chips map to footer sources and navigate on click.
- **DoD**: clicking a suggestion submits; clicking a chip navigates.

#### Task 12.11: Thread history + feedback (US-AP-4)

**Goal**: persistence-backed history and ratings.

- `GET` threads / thread-with-messages (auth-scoped); 👍/👎 →
  `ChatFeedback` (idempotent); delete cascades; `user_ask` AuditEvent.
- **DoD**: integration tests for list/get/feedback/delete + audit entry.

#### Task 12.12: Phase 12 E2E (Playwright)

**Goal**: prove the full path.

- Navigate to `/ask` → ask the risk question → assert a ranked card with
  citations → submit 👍 → reload and see the answer persisted.
- **DoD**: green in CI (defer until the risk slice is real).

---

### MVP slice for cutting the first PR

**US-AP vertical slice (risk only)**: 12.0 → 12.1 → 12.2 → 12.3 → 12.4 →
12.5 → 12.6 → 12.7 → 12.8 ships Ask Your Portfolio end-to-end for the
`risk-analysis` type — proving classify → context → Claude → grounded
cited card → persisted message.

**Fan-out**: 12.9 → 12.10 adds the remaining query types + suggestions
once the risk slice is green. **12.11** (history + feedback) and **12.12**
(E2E) follow.

**Deferred** (see Requirement 15 → Out of scope): SSE streaming,
multi-turn memory, composite mixed-type answers, PDF export/share.

---

## Phase 13: Playbook-Driven Contract Review Agent (MCP + Managed Agents)

**Requirement**: see [Requirement 16: Playbook-Driven Contract Review Agent](./requirements.md#requirement-16-playbook-driven-contract-review-agent-mcp--managed-agents)
in `requirements.md` for the epic, child stories (US-CR-1..3), and
acceptance criteria.

**Handoff / spec**: `docs/handoff-contract-review-agent.md`.
**Ruleset (agent spec)**: `docs/legal-playbook.md` (v1.0).
**Target output (Outcome rubric)**: `docs/sample-risk-report.md`.

The agent reads the *already-ingested* contract analysis and evaluates it
against the playbook — it does **not** re-extract. Architecture:
**playbook = static knowledge** (system prompt → later a Skill),
**contract = dynamic data via one MCP server** over the existing CQRS read
side, **report = §4 schema output**. One MCP tool layer underpins two
runtimes (Anthropic Managed Agents, AWS Bedrock AgentCore).

### Phase 13 layer map

```
PLAYBOOK (static, versioned) ──► agent KNOWLEDGE (system prompt → Skill)
CONTRACT (dynamic, per-run)  ──► agent DATA via MCP server ─┐
                                                            │ wraps QueryBus 1:1
   GetClausesForDocumentQuery ◄── get_document_clauses ─────┤  (no new logic)
   GetClauseByIdQuery         ◄── get_clause             ───┤
   GetSimilarClausesQuery     ◄── find_similar_clauses   ───┘  (live Voyage)
OUTPUT (the report)          ──► §4 schema → /mnt/session/outputs/ (markdown → docx)
KICKOFF                      ──► POST /documents/:id/review  (CLI backup)
```

#### Why this layering

- **No re-extraction.** Two uses of Claude stay separate: the pipeline at
  write-time (Requirement 3), the agent at read-time. The MCP tools are the
  read-time door.
- **Thin tool layer.** Each MCP tool wraps an existing query handler 1:1;
  correctness, org/format validation, and error mapping stay in the handlers.
- **Portable interface.** The same Streamable-HTTP MCP URL serves both
  runtimes — the architectural through-line of the demo.

### Phase 13 tasks

#### ~~Task 13.1: Contract-Review MCP server (build-order step 1)~~ ✅ (US-CR-1)

**Goal**: stand up the shared tool layer over the existing QueryBus.

- `McpModule` (`apps/backend/src/modules/mcp/`) imports `ClausesModule` +
  `CqrsModule`; `createContractReviewMcpServer(queryBus)` registers three
  tools (`get_document_clauses`, `get_clause`, `find_similar_clauses`)
  wrapping `GetClausesForDocumentQuery` / `GetClauseByIdQuery` /
  `GetSimilarClausesQuery` 1:1.
- `McpController` serves **Streamable HTTP** at `POST /mcp` (stateless: fresh
  server + transport per request), excluded from the `api/v1` prefix in
  `main.ts`. `McpBearerGuard` checks `MCP_BEARER_TOKEN` (permissive + warns
  when unset, for Inspector/local).
- Tools return the full stored DTO as JSON (verbatim text, risk fields,
  pageNumber); handler/domain errors surface as `isError` tool results.
- **DoD**: `tsc` clean; in-memory MCP client lists all three tools and calls
  one through the QueryBus successfully. ✅ Next: verify round-trip with MCP
  Inspector against a seeded contract, then expose via ngrok.

#### Task 13.2: Track A — Anthropic Managed Agents review (US-CR-2)

**Goal**: agent created once; one session per review; §4 report out.

- Env + vault (`static_bearer` for the MCP server) + Agent created once
  (system = playbook + 8-step algorithm; `mcp_servers` + `mcp_toolset` +
  `agent_toolset` for writing the report); store the agent id.
- Runtime: `sessions.create` → `user.define_outcome` (rubric =
  `docs/sample-risk-report.md` schema) → stream to completion →
  `files.list({scope_id})` to fetch the report from `/mnt/session/outputs/`.
- Wire to `POST /documents/:id/review`; keep a CLI script as backup.
- **DoD**: a seeded counterparty contract produces a §4-conformant report
  reproducing the sample's hard-stop override + tier logic.

#### Task 13.2b: Flex — playbook → Skill + `docx` report

**Goal**: promote static knowledge to a Skill and emit a Word report.

- Once 13.2 works: package the playbook as an Anthropic Skill; add the
  `docx` Skill so the report ships as `.docx` instead of markdown.
- **DoD**: same review runs with the playbook as a Skill and yields a `.docx`.

#### Task 13.3: Track B — AWS Bedrock AgentCore review (US-CR-3)

**Goal**: same MCP URL, second runtime (Claude via Bedrock).

- AgentCore runtime/gateway points at the **same** MCP URL; playbook
  delivered as the agent's instruction/knowledge.
- **DoD**: a review produces a §4-conformant report — one tool layer, two
  runtimes. (Second sprint — keep Track A green first.)

### Build order / slice

**Step 1 (done)**: 13.1 — the MCP server, independently testable.
**Then**: 13.2 (Track A) → 13.2b (Skill + docx flex) → 13.3 (Track B).

**Deferred** (see Requirement 16 → Out of scope): re-extraction, adding
`sectionRef` to the schema, CMA scheduled (cron) deployment.
