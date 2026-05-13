# Implementation Plan: Contract Analysis Platform

## Progress Summary

**Phase 1: Scaffolding & Cross-Cutting Concerns** — 7/7 tasks completed ✅

- ✅ Task 1.1: Project Structure Setup (Commit: aec01ef)
- ✅ Task 1.2: Shared Kernel Tests (Commit: 6d4383f)
- ✅ Task 1.3: Exception Hierarchy Tests (Commit: 896cbe8)
- ❌ Task 1.4: Prisma Schema & Database Setup — REMOVED (data models introduced incrementally per feature, Commit: bf39149)
- ✅ Task 1.5: Configuration Service (with class-validator, Commit: 52ef904)
- ✅ Task 1.6: Logging Infrastructure (pino + request id propagation, Commit: b67cbae)
- ✅ Task 1.7: API Response Envelope (ApiResponse<T> + PaginationMeta, Commit: e36bbea)
- ✅ Task 1.8: Testing Infrastructure (Jest + Supertest + factories + coverage thresholds, Commit: 55726cf)
- 🛠️ Tooling: lint + prettier + dependency alignment across full codebase (Commit: 772e1bc)

**Completed Work**:

- Monorepo scaffold (backend + frontend) — apps/backend (NestJS 11) and apps/frontend (React 18 + Vite)
- Shared kernel: Result, BaseEntity, ValueObject, AggregateRoot, DomainEvent
- Exception hierarchy: AppError → Domain/Application/Infrastructure + 5 common exceptions + global HttpExceptionFilter (RFC 7807)
- Configuration: AppConfigService with class-validator startup validation, typed enums, env-specific files
- Logging: dedicated LoggerModule, request ID propagation via x-request-id, sensitive field redaction
- API response envelope: ApiResponse<T>, PaginationMeta, isPaginatedPayload, buildPaginationMeta + ResponseInterceptor
- Testing infrastructure: Jest unit + Jest e2e (Supertest), TestFactory base class, coverage thresholds (global ≥80%, domain ≥90%)
- Lint clean (0 errors / 0 warnings), Prettier formatted across whole repo
- All following Clean Architecture + DDD + CQRS + Vertical Slicing patterns

---

## Phase Plan (Post-Phase 1)

| Phase   | Theme                                                    | Tasks   |
| ------- | -------------------------------------------------------- | ------- |
| Phase 2 | Design System (Shadcn UI base + domain components)       | 5 tasks |
| Phase 3 | Authentication (Auth0 + Session encryption + Guard + UI) | 4 tasks |
| Phase 4 | Home Screen (Reference Data API + Dashboard UI)          | 3 tasks |
| Phase 5 | Upload Screen (Document Ingestion domain + UI)           | 4 tasks |
| Phase 6 | Audit Service (append-only event log + admin UI)         | 4 tasks |

**Phase 2 design decision (2026-05-13)**: We use Shadcn UI as the base for all standard primitives (Button, Badge, Input, Card, Dialog, Tabs, etc.). We only build components for contract-domain concepts (RiskBadge, RiskBar, FlagsSummary, TypePill, KPICard) and application layout (TopNav, OrgBanner, PageShell). This cuts Phase 2 from the originally-planned 30+ sub-tasks down to 5 focused tasks.

**Phase 2 tooling decision (2026-05-13)**: Shadcn CLI v4.7 generates output for Tailwind v4. Project upgraded from Tailwind v3.4 → v4.3. Theme moved from `tailwind.config.ts` to CSS-first `@theme {}` block in `src/index.css`. `@tailwindcss/vite` plugin replaces the PostCSS pipeline. `src/config/designTokens.ts` retained for JS-side risk/severity helpers.

**Phase 2 progress**: 🎉 **5/5 tasks complete**

- ✅ Task 2.1: Design Tokens (Commit: 81c7fc8)
- ✅ Task 2.2: Shadcn UI Bootstrap (Commit: 0b9f9f3)
- ✅ Task 2.3: Domain Components (Commit: 09807c4)
- ✅ Task 2.4: Layout Components
- ✅ Task 2.5: Centralised Icons

---

## Overview

This implementation plan follows a **user story-driven approach** with Clean Architecture principles, aligned with the **high-fidelity wireframes** from Claude Design.

Each user story includes:

1. **Domain Model** — aggregates, value objects, domain events
2. **Clean Architecture Layers** — domain → application → infrastructure
3. **UI Components** — React components matching the wireframe designs

The plan starts with **scaffolding and cross-cutting concerns**, then proceeds through **Design System → Authentication → Core Screens**.

## Frontend Architecture Guidelines

All frontend tasks follow these mandatory patterns:

### 1. Component Structure (Every Component)

```
ComponentName/
├── ComponentName.tsx          # JSX only, max 15 lines, no logic
├── useComponentName.ts        # All UI logic (hooks, state, handlers)
├── ComponentName.module.css   # All styles
├── ComponentName.test.tsx     # Unit tests
└── ComponentName.stories.tsx  # Storybook story
```

### 2. 3-Tier API Call Stack (Every API Call)

```
UI Hook (useX.ts)
  → Service (src/services/)
    → httpService (src/api/httpService.ts)
      → Axios (client.ts)
```

**Rules**:

- Hooks call service methods only (no axios, no fetch, no direct HTTP)
- Services own domain shape, unwrap `ApiResponse<T>`, handle errors
- httpService is the ONLY file that imports axios
- All API URLs defined in `src/api/endpoints.ts`

### 3. API Response Standard

All backend endpoints return:

```typescript
{ success: boolean; data?: T; error?: string }
```

Every service method must call `.then(unwrap)` — never return raw `ApiResponse` to a hook.

### 4. Shadcn UI as Base

Use Shadcn UI components as the foundation, then customize with design tokens.

### 5. Accessibility Built-In (Every Component)

- Focus indicators visible (3px outline)
- Touch targets ≥44px on mobile
- ARIA labels on icon buttons
- Keyboard navigation (Tab, Enter, Space, Escape)
- Color contrast ≥4.5:1
- Screen reader tested

### 6. Mobile-First Responsive

Start with 320px baseline, progressively enhance with `min-width` media queries.

### 7. All SVG Icons Centralized

All SVG icons live in `src/components/core/icons.tsx`. No inline SVGs elsewhere.

---

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

### Task 3.2: Authentication Application Layer

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

### Task 3.3: Authentication Infrastructure Layer

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

- [ ] Add to **src/api/endpoints.ts**:
  ```typescript
  export const API = {
    // ... existing endpoints
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    CURRENT_USER: '/api/v1/auth/me',
    REFRESH_SESSION: '/api/v1/auth/refresh',
  };
  ```

**Service Layer**:

- [ ] **src/services/authService.ts**
  - Calls httpService for auth endpoints
  - Unwraps ApiResponse<T>
  - No axios imports

  ```typescript
  export const authService = {
    getCurrentUser: async (): Promise<User> => {
      return httpService.get<User>(API.CURRENT_USER).then(unwrap);
    },

    logout: async (): Promise<void> => {
      return httpService.post<void>(API.LOGOUT, {}).then(unwrap);
    },
  };
  ```

**Hook Layer**:

- [ ] **useAuth.ts**: React Query hook
  - Calls authService methods
  - No httpService or axios imports
  - Returns { user, isLoading, logout, refetch }

  ```typescript
  export function useAuth() {
    const queryClient = useQueryClient();

    const { data: user, isLoading } = useQuery({
      queryKey: ['current-user'],
      queryFn: authService.getCurrentUser,
      retry: false,
    });

    const logoutMutation = useMutation({
      mutationFn: authService.logout,
      onSuccess: () => {
        queryClient.clear();
        window.location.href = '/login';
      },
    });

    return {
      user,
      isLoading,
      logout: logoutMutation.mutate,
    };
  }
  ```

**UI Components**:

- [ ] **LoginCallbackPage** component
  - Handles Auth0 redirect
  - No custom login UI (Auth0 Universal Login)
  - Extracts code from URL
  - Redirects to home on success
- [ ] **LogoutButton** component
  - Button.tsx (JSX only, max 15 lines)
  - useLogoutButton.ts (calls useAuth hook)
  - LogoutButton.module.css
  - LogoutButton.test.tsx
  - LogoutButton.stories.tsx
  - Touch target ≥44px
  - Focus indicator visible
  - ARIA label
- [ ] **ProtectedRoute** component
  - Wraps routes requiring authentication
  - Uses useAuth hook
  - Redirects to login if not authenticated
  - Shows loading state
- [ ] **SessionRefresh** component
  - Silent token refresh before expiry
  - Uses useAuth hook
  - No UI (background process)

**Files**:

```
frontend/src/
├── api/
│   └── endpoints.ts           # Add auth endpoints
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
    └── LoginCallbackPage/
        ├── LoginCallbackPage.tsx
        ├── useLoginCallbackPage.ts
        ├── LoginCallbackPage.module.css
        └── LoginCallbackPage.test.tsx
```

**Accessibility Requirements**:

- [ ] Focus indicators visible on logout button
- [ ] Touch target ≥44px
- [ ] ARIA label on logout button
- [ ] Keyboard navigation (Tab, Enter)
- [ ] Screen reader announces logout action

**Testing Requirements**:

- [ ] Mock at service boundary (not axios)
- [ ] Test hooks against mocked authService
- [ ] Test components with mocked useAuth hook
- [ ] Integration test: full auth flow

**Requirements**: 0.1-0.12

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

- [ ] GET /api/v1/reference-data endpoint
- [ ] Query handler to compute dashboard metrics
- [ ] Business logic for KPI calculations:
  - Active contracts = status 'complete'
  - Avg risk score = mean of complete contracts
  - Critical flags = sum of red flags across portfolio
  - Urgent renewals = renewals with daysRemaining < 60
- [ ] Sorting logic:
  - Recent contracts: sort by uploadDate DESC, take 4
  - Urgent renewals: sort by daysRemaining ASC, take 3
- [ ] Response DTO matching wireframe data structure
- [ ] **Backend-Driven UI**: Include `actions` and `ui` fields in response
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
- [ ] Unit tests for calculations
- [ ] Integration tests

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

- [ ] **src/api/client.ts**: Axios instance configuration

  ```typescript
  import axios from 'axios';

  export const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    timeout: 30000,
    withCredentials: true, // For session cookies
  });
  ```

- [ ] **src/api/httpService.ts**: HTTP wrapper (ONLY file that imports axios)

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

- [ ] **src/api/endpoints.ts**: All API URL constants

  ```typescript
  export const API = {
    REFERENCE_DATA: '/api/v1/reference-data',
    LOGIN: '/api/v1/auth/login',
    LOGOUT: '/api/v1/auth/logout',
    CURRENT_USER: '/api/v1/auth/me',
    // ... all other endpoints
  };
  ```

- [ ] **src/api/unwrap.ts**: ApiResponse<T> unwrapper utility

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

- [ ] **src/types/api.ts**: Shared API types

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

- [ ] ONLY httpService.ts imports axios
- [ ] Services call httpService, never axios directly
- [ ] Hooks call services, never httpService or axios
- [ ] All API URLs defined in endpoints.ts
- [ ] Every service method calls .then(unwrap)
- [ ] No URL string literals outside endpoints.ts

**Testing**:

- [ ] Mock at service boundary (not axios)
- [ ] Test services with mocked httpService
- [ ] Test hooks with mocked services

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

- [ ] **src/api/client.ts**: Axios instance only
- [ ] **src/api/httpService.ts**: HTTP wrapper (only file that imports axios)
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

- [ ] **src/services/referenceDataService.ts**
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

- [ ] **useReferenceData.ts**: React Query hook
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

- [ ] **HomePage** component (main container)
  - Uses useReferenceData hook
  - Passes data to child components
  - No API calls directly
- [ ] **OrgBanner** component
  - Background: white, border-bottom
  - Padding: 14px 32px
  - Left: Icon + "Northwind Holdings Ltd" + description
  - Right: Status dot + "All systems operational"
  - Responsive: stack on mobile
- [ ] **GreetingSection** component
  - Heading: "Good morning, [name]" (32px weight 800)
  - Context paragraph with critical flags + urgent renewals
  - Action buttons: "View all contracts" + "+ Upload contract"
  - Responsive: stack buttons on mobile
- [ ] **KPICards** component
  - Grid: 4 columns (responsive: 2 cols on tablet, 1 col on mobile)
  - 4 cards: Active contracts, Avg risk score, Critical flags, Renewals <60d
  - StatCard component with dynamic colors
  - Mobile-first: 1 col → 2 col → 4 col
- [ ] **WhereToStart** component
  - Grid: 1.4fr 1fr (responsive: 1 col on mobile)
  - Left: Upload CTA card (dark background, blue accent circle)
  - Right column: Resume card + Browse register + Review renewals
  - Mobile-first: stack vertically
- [ ] **RecentContracts** component
  - Card with header + "See all →" button
  - 4 rows: TypePill, contract name, party, flags, risk badge
  - Hover state: background change
  - Click: navigate to portfolio
  - Responsive: horizontal scroll on mobile
- [ ] **UrgentRenewals** component
  - Card with header + "All →" button
  - 3 rows with left border colored by urgency (red/orange/green)
  - Days remaining display with color coding
  - Click: navigate to renewals
  - Responsive: horizontal scroll on mobile
- [ ] **HowItWorks** component
  - Section title + description
  - 4-step grid: numbered circles, labels, descriptions, owners
  - Arrow connectors between steps
  - Responsive: 2 cols on tablet, 1 col on mobile
- [ ] **PlaybookExamples** component
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

- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥44px on mobile
- [ ] ARIA labels where needed
- [ ] Keyboard navigation (Tab, Enter)
- [ ] Color contrast ≥4.5:1
- [ ] Semantic HTML
- [ ] Screen reader tested

**Testing Requirements**:

- [ ] Mock at service boundary (not axios)
- [ ] Test hooks against mocked services
- [ ] Test components with mocked hooks
- [ ] Integration test: full API flow

**Requirements**: US-008 (all acceptance criteria), wireframe pixel-perfect match

---

## Phase 5: User Story — Upload Screen (Wireframe Screen 2)

### Task 5.1: Document Upload Domain Model

**Goal**: Define Document aggregate with upload workflow

**Domain Model**:

```
Aggregate: Document
├── Value Objects:
│   ├── DocumentId (UUID)
│   ├── DocumentName
│   ├── DocumentType (PDF, DOCX)
│   ├── FileSize
│   ├── UploadStatus (enum: pending, uploading, processing, complete, failed)
│   ├── StorageKey
│   └── UploadedBy (UserId)
├── Domain Events:
│   ├── DocumentUploadStartedEvent
│   ├── DocumentUploadCompletedEvent
│   ├── DocumentUploadFailedEvent
│   └── DocumentProcessingStartedEvent
└── Invariants:
    ├── File size must be ≤50MB
    ├── File type must be PDF or DOCX
    ├── Document name must not be empty
    └── Status transitions: pending → uploading → processing → complete/failed
```

**Deliverables**:

- [ ] Document aggregate with factory
- [ ] Value objects: DocumentId, DocumentName, DocumentType, FileSize, UploadStatus, StorageKey
- [ ] Domain events: DocumentUploadStartedEvent, DocumentUploadCompletedEvent, DocumentUploadFailedEvent
- [ ] Repository interface: IDocumentRepository
- [ ] Unit tests for aggregate and value objects
- [ ] Property test: File size validation, status transitions

**Files**:

```
modules/documents/domain/
├── document.aggregate.ts
├── document-id.vo.ts
├── document-name.vo.ts
├── document-type.vo.ts
├── file-size.vo.ts
├── upload-status.vo.ts
├── storage-key.vo.ts
├── document.events.ts
├── document.factory.ts
└── document.repository.ts (interface)
```

**Requirements**: US-009 (Upload Screen), 1.1-1.5 (Document Upload)

---

### Task 5.2: Document Upload Application Layer

**Goal**: Commands and queries for document upload workflow

**CQRS Structure**:

```
Commands:
├── InitiateUploadCommand → InitiateUploadHandler
│   ├── Validate file (size, type)
│   ├── Generate presigned URL (GCS)
│   ├── Create Document aggregate (status: pending)
│   └── Return upload URL + documentId
├── CompleteUploadCommand → CompleteUploadHandler
│   ├── Update Document status (uploading → processing)
│   ├── Trigger OCR job
│   └── Emit DocumentUploadCompletedEvent
└── FailUploadCommand → FailUploadHandler
    ├── Update Document status (uploading → failed)
    └── Emit DocumentUploadFailedEvent

Queries:
└── GetUploadStatusQuery → GetUploadStatusHandler
    └── Return current upload status + progress
```

**Deliverables**:

- [ ] InitiateUploadCommand + InitiateUploadHandler
- [ ] CompleteUploadCommand + CompleteUploadHandler
- [ ] FailUploadCommand + FailUploadHandler
- [ ] GetUploadStatusQuery + GetUploadStatusHandler
- [ ] Unit tests for all handlers (mock repositories, storage service)

**Files**:

```
modules/documents/application/
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

**Requirements**: 1.1-1.5

---

### Task 5.3: Document Upload Infrastructure Layer

**Goal**: Prisma repository, storage service, and upload controller

**Deliverables**:

- [ ] PrismaDocumentRepository implementing IDocumentRepository
- [ ] StorageService (GCS presigned URLs, local filesystem for dev)
- [ ] DocumentController with endpoints:
  - POST /documents/upload/initiate (returns presigned URL)
  - POST /documents/upload/complete (confirms upload)
  - GET /documents/:id/status (polling endpoint)
- [ ] DTOs: InitiateUploadDto, UploadResponseDto, CompleteUploadDto, UploadStatusDto
- [ ] DocumentMapper (Document aggregate ↔ Prisma ↔ DTO)
- [ ] DocumentModule wiring
- [ ] Integration tests (full upload flow)

**Files**:

```
modules/documents/infrastructure/
├── prisma-document.repository.ts
├── storage.service.ts
├── document.controller.ts
├── document.mapper.ts
├── document.module.ts
└── dtos/
    ├── initiate-upload.dto.ts
    ├── upload-response.dto.ts
    ├── complete-upload.dto.ts
    └── upload-status.dto.ts
```

**Requirements**: 1.1-1.5

---

### Task 5.4: Upload Screen UI

**Goal**: Drag-and-drop upload interface with 3-tier API architecture

**3-Tier API Call Stack**:

```
UI Hook (useUpload.ts)
  → Service (documentService.ts)
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

- [ ] Add to **src/api/endpoints.ts**:
  ```typescript
  export const API = {
    // ... existing endpoints
    INITIATE_UPLOAD: '/api/v1/documents/upload/initiate',
    COMPLETE_UPLOAD: '/api/v1/documents/upload/complete',
    UPLOAD_STATUS: (id: string) => `/api/v1/documents/${id}/status`,
  };
  ```

**Service Layer**:

- [ ] **src/services/documentService.ts**
  - Calls httpService for upload endpoints
  - Unwraps ApiResponse<T>
  - No axios imports

  ```typescript
  export const documentService = {
    initiateUpload: async (file: File): Promise<UploadResponse> => {
      return httpService
        .post<UploadResponse>(API.INITIATE_UPLOAD, {
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
        .then(unwrap);
    },

    uploadToStorage: async (url: string, file: File): Promise<void> => {
      // Direct upload to GCS presigned URL (not through httpService)
      await fetch(url, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type },
      });
    },

    completeUpload: async (documentId: string): Promise<void> => {
      return httpService.post<void>(API.COMPLETE_UPLOAD, { documentId }).then(unwrap);
    },

    getUploadStatus: async (documentId: string): Promise<UploadStatus> => {
      return httpService.get<UploadStatus>(API.UPLOAD_STATUS(documentId)).then(unwrap);
    },
  };
  ```

**Hook Layer**:

- [ ] **useUpload.ts**: React Query mutation hook
  - Calls documentService methods
  - No httpService or axios imports
  - Returns { upload, isUploading, progress, error }

  ```typescript
  export function useUpload() {
    const uploadMutation = useMutation({
      mutationFn: async (file: File) => {
        // 1. Initiate upload
        const { uploadUrl, documentId } = await documentService.initiateUpload(file);

        // 2. Upload to storage
        await documentService.uploadToStorage(uploadUrl, file);

        // 3. Complete upload
        await documentService.completeUpload(documentId);

        return { documentId };
      },
    });

    return {
      upload: uploadMutation.mutate,
      isUploading: uploadMutation.isPending,
      error: uploadMutation.error,
    };
  }
  ```

**UI Components**:

- [ ] **UploadPage** component
  - Uses useUpload hook
  - Passes upload function to child components
  - No API calls directly
- [ ] **UploadDropzone** component (Base: Shadcn UI)
  - Drag-and-drop area (dashed border, blue on hover)
  - File input (hidden, triggered by click)
  - File validation (size ≤50MB, type PDF/DOCX)
  - Shows selected file name + size
  - "Choose file" button (≥44px touch target)
  - Keyboard accessible (Tab, Enter, Space)
  - ARIA labels for screen readers
- [ ] **ConsentCheckbox** component (Base: Shadcn UI Checkbox)
  - Checkbox + label: "I confirm this document is authorized..."
  - Required before upload
  - Keyboard accessible (Space to toggle)
  - ARIA required
- [ ] **UploadButton** component
  - Disabled until file selected + consent checked
  - Shows loading spinner during upload
  - Touch target ≥44px
  - Focus indicator visible
  - ARIA label
- [ ] **UploadProgress** component
  - Progress bar (0-100%)
  - Status text: "Uploading...", "Processing...", "Complete"
  - Cancel button (if upload in progress)
  - ARIA live region for status updates

**Files**:

```
frontend/src/
├── api/
│   └── endpoints.ts           # Add upload endpoints
├── services/
│   └── documentService.ts     # Upload domain logic, calls httpService
├── hooks/
│   └── useUpload.ts           # React Query mutation hook, calls service
├── pages/UploadPage/
│   ├── UploadPage.tsx         # JSX only, max 15 lines
│   ├── useUploadPage.ts       # All logic (uses useUpload)
│   ├── UploadPage.module.css  # Styles
│   ├── UploadPage.test.tsx    # Tests
│   └── UploadPage.stories.tsx # Storybook
└── components/upload/
    ├── UploadDropzone/
    │   ├── UploadDropzone.tsx
    │   ├── useUploadDropzone.ts
    │   ├── UploadDropzone.module.css
    │   ├── UploadDropzone.test.tsx
    │   └── UploadDropzone.stories.tsx
    ├── ConsentCheckbox/
    │   ├── ConsentCheckbox.tsx
    │   ├── useConsentCheckbox.ts
    │   ├── ConsentCheckbox.module.css
    │   ├── ConsentCheckbox.test.tsx
    │   └── ConsentCheckbox.stories.tsx
    ├── UploadButton/
    │   ├── UploadButton.tsx
    │   ├── useUploadButton.ts
    │   ├── UploadButton.module.css
    │   ├── UploadButton.test.tsx
    │   └── UploadButton.stories.tsx
    └── UploadProgress/
        ├── UploadProgress.tsx
        ├── useUploadProgress.ts
        ├── UploadProgress.module.css
        ├── UploadProgress.test.tsx
        └── UploadProgress.stories.tsx
```

**Accessibility Requirements** (ALL components):

- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥44px on mobile
- [ ] ARIA labels on all interactive elements
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Color contrast ≥4.5:1
- [ ] ARIA live regions for status updates
- [ ] Screen reader tested

**Testing Requirements**:

- [ ] Mock at service boundary (not axios)
- [ ] Test hooks against mocked services
- [ ] Test components with mocked hooks
- [ ] Integration test: full upload flow

**Requirements**: US-009 (all acceptance criteria), 1.1-1.5

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

### Task 6.3: Audit Infrastructure Layer

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

### Task 6.4: Audit UI (Optional)

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
**Phase 2**: Design System (6 tasks) — Tokens, Core Components, Layout, Modal/Tabs, Responsive, Tailwind
**Phase 3**: Authentication (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 4**: Home Screen (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 5**: Upload Screen (4 tasks) — Domain → Application → Infrastructure → UI
**Phase 6**: Audit Service (4 tasks) — Domain → Application → Infrastructure → UI

**Total**: 30 tasks organized by phase and user story

---

## Frontend Architecture Enforcement Checklist

Every frontend task MUST follow these patterns. Use this checklist to verify compliance:

### ✅ Component Structure (Every Component)

- [ ] **ComponentName.tsx**: JSX only, max 15 lines, no logic
- [ ] **useComponentName.ts**: All UI logic (hooks, state, handlers)
- [ ] **ComponentName.module.css**: All styles
- [ ] **ComponentName.test.tsx**: Unit tests
- [ ] **ComponentName.stories.tsx**: Storybook story

### ✅ 3-Tier API Call Stack (Every API Call)

- [ ] **Layer 1 - UI Hook (useX.ts)**: Calls service methods only
- [ ] **Layer 2 - Service (src/services/)**: Calls httpService, unwraps ApiResponse<T>
- [ ] **Layer 3 - httpService (src/api/httpService.ts)**: ONLY file that imports axios
- [ ] **No axios imports** outside httpService.ts
- [ ] **All API URLs** defined in src/api/endpoints.ts

### ✅ API Response Standard (Every Service Method)

- [ ] Backend returns `{ success: boolean; data?: T; error?: string }`
- [ ] Service calls `.then(unwrap)` to extract data
- [ ] Never return raw ApiResponse to hooks

### ✅ Shadcn UI Integration (Every Component)

- [ ] Use Shadcn UI components as base (Button, Dialog, Tabs, Checkbox, etc.)
- [ ] Customize with design tokens
- [ ] Never build from scratch if Shadcn has it

### ✅ Centralized Icons (Every Icon)

- [ ] All SVG icons in `src/components/core/icons.tsx`
- [ ] No inline SVGs in components
- [ ] Named exports (not default)
- [ ] Consistent sizing (24×24 default)

### ✅ Accessibility (Every Component)

- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥44px on mobile
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation (Tab, Enter, Space, Escape)
- [ ] Color contrast ≥4.5:1
- [ ] Screen reader tested

### ✅ Mobile-First Responsive (Every Component)

- [ ] Start with 320px baseline
- [ ] Use `min-width` media queries (not `max-width`)
- [ ] Test on real devices (iPhone, Android, iPad, desktop)

### ✅ Testing (Every Component)

- [ ] Mock at service boundary (not axios)
- [ ] Test hooks against mocked services
- [ ] Test components with mocked hooks
- [ ] Integration test for full API flow

---

## File Structure Reference

### Backend (NestJS + Clean Architecture)

```
apps/backend/src/
├── modules/{feature}/
│   ├── domain/                   # Pure business logic
│   │   ├── {feature}.aggregate.ts
│   │   ├── {feature}-id.vo.ts
│   │   ├── {feature}.events.ts
│   │   ├── {feature}.factory.ts
│   │   └── {feature}.repository.ts (interface)
│   ├── application/              # Use cases (CQRS)
│   │   ├── commands/
│   │   │   ├── {action}.command.ts
│   │   │   └── {action}.handler.ts
│   │   ├── queries/
│   │   │   ├── {action}.query.ts
│   │   │   └── {action}.handler.ts
│   │   └── events/
│   │       └── {event}.handler.ts
│   └── infrastructure/           # Framework & external concerns
│       ├── prisma-{feature}.repository.ts
│       ├── {feature}.controller.ts
│       ├── {feature}.module.ts
│       ├── {feature}.mapper.ts
│       └── dtos/
│           ├── create-{feature}.dto.ts
│           └── {feature}.response.dto.ts
├── shared/
│   ├── domain/                   # Base classes
│   ├── exceptions/               # Exception hierarchy
│   └── infrastructure/           # Ports (interfaces)
└── config/                       # Configuration service
```

### Frontend (React + 3-Tier Architecture)

```
apps/frontend/src/
├── api/                          # Layer 3: HTTP client
│   ├── client.ts                 # Axios instance only
│   ├── httpService.ts            # ONLY file that imports axios
│   ├── endpoints.ts              # All API URLs as constants
│   └── unwrap.ts                 # ApiResponse unwrapper utility
├── services/                     # Layer 2: Domain logic
│   ├── authService.ts            # Calls httpService, unwraps ApiResponse
│   ├── documentService.ts
│   └── referenceDataService.ts
├── hooks/                        # Layer 1: UI hooks
│   ├── useAuth.ts                # Calls authService
│   ├── useUpload.ts              # Calls documentService
│   └── useReferenceData.ts       # Calls referenceDataService
├── pages/                        # Page components
│   ├── HomePage/
│   │   ├── HomePage.tsx          # JSX only, max 15 lines
│   │   ├── useHomePage.ts        # All logic
│   │   ├── HomePage.module.css   # Styles
│   │   ├── HomePage.test.tsx     # Tests
│   │   └── HomePage.stories.tsx  # Storybook
│   └── UploadPage/
│       ├── UploadPage.tsx
│       ├── useUploadPage.ts
│       ├── UploadPage.module.css
│       ├── UploadPage.test.tsx
│       └── UploadPage.stories.tsx
├── components/
│   ├── core/                     # Design system components
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── useButton.ts
│   │   │   ├── Button.module.css
│   │   │   ├── Button.test.tsx
│   │   │   └── Button.stories.tsx
│   │   ├── Badge/
│   │   ├── Modal/
│   │   ├── Tabs/
│   │   └── icons.tsx             # All SVG icons centralized
│   └── features/                 # Feature-specific components
│       ├── home/
│       │   ├── OrgBanner/
│       │   ├── GreetingSection/
│       │   └── KPICards/
│       └── upload/
│           ├── UploadDropzone/
│           ├── ConsentCheckbox/
│           └── UploadProgress/
├── config/
│   └── designTokens.ts           # Single source of truth for design
├── types/
│   └── api.ts                    # Shared API types
└── styles/
    ├── globals.css
    └── responsive.css
```

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
