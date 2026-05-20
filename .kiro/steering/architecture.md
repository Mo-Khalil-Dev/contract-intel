# Architecture Guidelines

## Core Principles

This project follows **Clean Architecture + DDD + CQRS + Vertical Slicing + Ports & Adapters**.

Key principles:

- Dependencies point inward (domain has zero framework dependencies)
- Domain layer is pure business logic
- CQRS: commands mutate, queries read directly from DB
- Vertical slicing: each feature owns its full stack
- Ports & Adapters: all infrastructure abstracted behind interfaces

---

## Backend Architecture

### Module Structure (Vertical Slice)

Each feature module owns its complete stack:

```
src/modules/{feature}/
├── domain/                   # Pure business logic (no framework deps)
│   ├── {feature}.aggregate.ts      # Aggregate root
│   ├── {feature}-id.vo.ts          # Value objects
│   ├── {feature}.events.ts         # Domain events
│   ├── {feature}.factory.ts        # Factory
│   └── {feature}.repository.ts     # Repository interface (port)
│
├── application/              # Use cases
│   ├── commands/             # Write operations (CQRS)
│   │   ├── {action}.command.ts
│   │   └── {action}.handler.ts
│   ├── queries/              # Read operations (CQRS)
│   │   ├── {action}.query.ts
│   │   └── {action}.handler.ts
│   └── events/               # Domain event handlers
│       └── {event}.handler.ts
│
└── infrastructure/           # Framework & external concerns
    ├── {feature}.repository.impl.ts  # Adapter implementing the port (Prisma / TypeORM / SQL / in-memory)
    ├── {feature}.controller.ts
    ├── {feature}.module.ts
    ├── {feature}.mapper.ts           # Persistence row ↔ Domain ↔ DTO
    └── dtos/
```

> The persistence adapter is chosen **per feature** when that feature ships. There is no global ORM commitment — the domain layer only knows the port.

### Domain Layer Rules

**Result Pattern** for error handling:

```typescript
static create(props): Result<T> {
  if (invalid) return Result.fail(new DomainException(...))
  return Result.ok(new Entity(props))
}
```

**Repository Convention**:

- Returns `T | null` (null = not found)
- Throws `InfrastructureException` on failure
- Never returns persistence-layer types (always domain aggregates) — Prisma rows, TypeORM entities, raw rows stay inside the adapter

### Exception Hierarchy

Three-layer system:

- `DomainException` — business rule violations (422, 409)
- `ApplicationException` — use case failures (404, 403, 409, 503)
- `InfrastructureException` — external failures (500)

Global `HttpExceptionFilter` returns RFC 7807 Problem Details.

### Mapper Layer

Three representations (never leak between layers):

- `Persistence` (Prisma row / TypeORM entity / raw row — whichever the feature uses) ↔ `Domain` (Aggregate) ↔ `DTO` (API Response)

Each module has `{Feature}Mapper` implementing:

```typescript
interface Mapper<Domain, Persistence, Response> {
  toDomain(persistence: Persistence): Domain;
  toPersistence(domain: Domain): Persistence;
  toDto(domain: Domain): Response;
}
```

### API Response Envelope

All endpoints return:

```typescript
// Success
{ "success": true, "data": { ... }, "meta": null }

// Paginated
{ "success": true, "data": [...], "meta": { "total": 0, "page": 1, "pageSize": 20 } }

// Error (RFC 7807)
{ "success": false, "error": { "type": "...", "title": "...", "status": 422, "detail": "..." } }
```

- `ResponseInterceptor` wraps all success responses
- `HttpExceptionFilter` formats all errors
- Prefix: `/api/v1/`

### Infrastructure Ports

All infrastructure concerns abstracted behind interfaces:

| Port             | Env var          | Local     | Demo                 | Production           |
| ---------------- | ---------------- | --------- | -------------------- | -------------------- |
| `StorageService` | `STORAGE_DRIVER` | `local`   | `gcs`                | `gcs`                |
| `OCRService`     | `OCR_DRIVER`     | `mock`    | `google-document-ai` | `google-document-ai` |
| `QueueService`   | `QUEUE_DRIVER`   | `memory`  | `pg-boss`            | `bullmq`             |
| `SecretsService` | `SECRETS_DRIVER` | `env`     | `env`                | `gcp-secret-manager` |
| `LoggerService`  | `LOGGER_DRIVER`  | `console` | `pino`               | `pino`               |

---

## Frontend Architecture

### Component Structure (MANDATORY)

Every component MUST follow this structure:

```
ComponentName/
├── ComponentName.tsx          # JSX only, max 15 lines, no logic
├── useComponentName.ts        # All UI logic (hooks, state, handlers)
├── ComponentName.module.css   # All styles
├── ComponentName.test.tsx     # Unit tests
└── ComponentName.stories.tsx  # Storybook story
```

**Rules**:

- JSX file: rendering only, no business logic
- Hook file: all state, effects, handlers, computed values
- CSS file: component-specific styles (Tailwind for utilities)
- Test file: co-located with component
- Story file: all variants, states, sizes

### 3-Tier API Call Stack (MANDATORY)

Every API call MUST flow through these layers:

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

### API Response Standard

All backend endpoints return:

```typescript
{ success: boolean; data?: T; error?: string }
```

Every service method MUST call `.then(unwrap)` — never return raw `ApiResponse` to a hook.

The shared `unwrap<T>` utility lives in `src/api/unwrap.ts`.

### Design System Integration

**Shadcn UI is the base for every standard primitive.** We install components via `npx shadcn add <name>`; the source is copied into `src/components/ui/` and is owned by us from that point on. We customise via design tokens, not by re-writing.

**Build custom only for what Shadcn doesn't ship.** That means contract-domain components (RiskBadge, RiskBar, FlagsSummary, TypePill, KPICard) and application layout (TopNav, OrgBanner, PageShell). These live in `src/components/core/` and `src/components/layout/`.

**Hard rules**:

- ❌ Do **not** hand-roll Button, Badge, Input, Card, Dialog, Tabs, Checkbox, Dropdown, Tooltip, Skeleton, Toast, Avatar — use Shadcn.
- ✅ Each Shadcn primitive is reviewed once at install time to ensure its styles map to our design tokens.
- ✅ Custom components in `core/` and `layout/` follow the standard structure (tsx ≤ 15 lines, hook owns logic, co-located test + story).
- ✅ All SVG icons live in `src/components/core/icons.tsx`. Lint should fail PRs with inline `<svg>` elsewhere.

**Design Tokens**: All colors, spacing, typography, shadows, border-radius defined in `src/config/designTokens.ts` — single source of truth.

**Tailwind Config**: `tailwind.config.js` imports from `designTokens.ts`. No literal hex / px values in component code.

**Risk and severity helpers**: `designTokens.ts` exports `riskColor()`, `riskBg()`, `riskLabel()`, `riskShort()`, `sevColor()`, `sevBg()` so threshold logic lives in one place.

### Mobile-First Responsive (MANDATORY)

Start with 320px baseline, progressively enhance with `min-width` media queries.

```typescript
// ✅ DO: Mobile-first (min-width)
<div className="
  p-sm              /* Mobile: 8px padding */
  md:p-md           /* Tablet: 16px padding */
  lg:p-lg           /* Desktop: 24px padding */
">
```

```typescript
// ❌ DON'T: Desktop-first (max-width)
<div className="
  p-lg              /* Desktop first */
  md:p-md           /* Then tablet */
  sm:p-sm           /* Then mobile (wrong!) */
">
```

### Accessibility Built-In (MANDATORY)

Every component MUST include:

- **Focus indicators**: 3px outline, visible
- **Touch targets**: ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- **ARIA labels**: on icon buttons and inputs
- **Keyboard navigation**: Tab, Enter, Space, Escape
- **Color contrast**: ≥4.5:1 for normal text
- **Screen reader tested**: VoiceOver on iOS/macOS, NVDA on Windows

**Testing checklist**:

- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y score: ≥95
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

### Centralized Icons

All SVG icons MUST live in `src/components/core/icons.tsx`. No inline SVGs elsewhere.

```typescript
// ✅ DO: Import from icons.tsx
import { UploadIcon } from '@/components/core/icons';

// ❌ DON'T: Inline SVG
<svg>...</svg>
```

---

## Frontend Error Handling (MANDATORY)

Every error that crosses the API boundary is normalised into a single structured type. Components and hooks never deal with raw `AxiosError` or plain `Error` objects.

### Error Layer Structure

```
src/errors/
├── AppError.ts          # Structured error class (mirrors RFC 7807)
├── errorMessages.ts     # Code → user-friendly message map
├── parseApiError.ts     # Normalises any thrown value → AppError
└── index.ts             # Barrel export

src/services/
└── feedbackService.ts   # Centralised toast/notification API (wraps sonner)

src/components/core/
└── ErrorBoundary/
    ├── ErrorBoundary.tsx      # React class component — catches render errors
    ├── useErrorBoundary.ts    # Derives display copy from error type
    ├── ErrorBoundary.test.tsx
    └── index.ts
```

### AppError

`AppError` is the single error type used everywhere in the frontend. It mirrors the backend RFC 7807 Problem Details envelope.

```typescript
// src/errors/AppError.ts
export class AppError extends Error {
  readonly code: string; // Machine-readable code (e.g. "CONTRACT_NOT_FOUND")
  readonly status: number; // HTTP status (0 = network/timeout)
  readonly detail: string; // User-safe message — safe to display directly
  readonly correlationId?: string;
  readonly fieldErrors?: Record<string, string[]>;

  get isNetworkError(): boolean; // status === 0
  get isClientError(): boolean; // 4xx
  get isServerError(): boolean; // 5xx
}
```

**Rules:**

- `AppError` is the ONLY error type that leaves the API layer
- Never catch a raw `AxiosError` in a hook or component — it will already be an `AppError` by the time it reaches you
- `detail` is always safe to show to the user — never show `message` (which may contain internal info)

### parseApiError

Single normalisation point. Called inside `httpService` — never call it directly in hooks or components.

```typescript
// src/errors/parseApiError.ts
export function parseApiError(error: unknown): AppError {
  // Handles: AxiosError (with/without response), AppError, plain Error, unknown
  // Maps HTTP status codes to error codes automatically
  // Extracts correlationId from X-Request-Id header or response body
  // Builds fieldErrors from backend validation error arrays
}
```

### feedbackService

All toasts go through `feedbackService`. Never call `toast` from `sonner` directly in a component or hook.

```typescript
// src/services/feedbackService.ts
feedbackService.success('Contract approved');
feedbackService.error(err); // AppError → shows err.detail automatically
feedbackService.error('Failed to upload contract'); // plain string
feedbackService.warning('Session expires in 5 min');
feedbackService.info('Analysis running in background');

// For async operations with loading state:
const id = feedbackService.loading('Uploading...');
feedbackService.resolveLoading(id, 'Upload complete');
feedbackService.rejectLoading(id, err);
```

**Rules:**

- ❌ Never call `toast.success(...)` / `toast.error(...)` directly — always use `feedbackService`
- ✅ Pass the full `AppError` to `feedbackService.error()` — it extracts `detail` and `correlationId` automatically
- ✅ Use `loading` / `resolveLoading` / `rejectLoading` for multi-step async operations

### ErrorBoundary

Wraps the entire app (and optionally individual feature sections) to catch unhandled render errors.

```typescript
// App.tsx — top-level wrap
<ThemeProvider attribute="class" defaultTheme="light">
  <ErrorBoundary>
    <BrowserRouter>...</BrowserRouter>
    <Toaster position="bottom-right" richColors closeButton />
  </ErrorBoundary>
</ThemeProvider>

// Feature-level — custom fallback
<ErrorBoundary fallback={(err, reset) => <ContractSectionError onRetry={reset} />}>
  <ContractDetailSection />
</ErrorBoundary>
```

**Rules:**

- The top-level `<ErrorBoundary>` in `App.tsx` is mandatory — never remove it
- `<Toaster>` must be inside `<ErrorBoundary>` but outside `<BrowserRouter>` so it survives route changes
- `componentDidCatch` is the integration point for Sentry/LogRocket — add the SDK call there when APM is wired up

### Error Flow: End to End

```
User action
  → Hook calls service method
  → Service calls httpService.get/post/...
  → httpService catches AxiosError → parseApiError() → throws AppError
  → Service re-throws AppError (or wraps in feedbackService.error)
  → Hook's onError / catch block receives AppError
  → feedbackService.error(err) → sonner toast shows err.detail
  → If render throws → ErrorBoundary catches → shows recovery UI
```

### Error Handling in Hooks

```typescript
// ✅ DO: React Query mutation with feedbackService
const approveMutation = useMutation({
  mutationFn: () => contractService.approve(id),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['reference-data'] });
    feedbackService.success('Contract approved');
  },
  onError: (err) => feedbackService.error(err), // AppError passed directly
});

// ✅ DO: Manual async with loading toast
const handleUpload = async (file: File) => {
  const toastId = feedbackService.loading('Uploading contract...');
  try {
    await contractService.upload(file);
    feedbackService.resolveLoading(toastId, 'Upload complete');
  } catch (err) {
    feedbackService.rejectLoading(toastId, err);
  }
};

// ❌ DON'T: Raw error handling in a hook
onError: (err: any) => toast.error(err.message); // Never do this
```

### Error Messages Map

All user-facing error strings live in `src/errors/errorMessages.ts`. Never hardcode error strings in components or hooks.

```typescript
// src/errors/errorMessages.ts
export const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: 'Unable to reach the server. Please check your connection.',
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to perform this action.",
  NOT_FOUND: "The resource you're looking for doesn't exist.",
  CONTRACT_NOT_FOUND: 'Contract not found.',
  CONTRACT_ALREADY_APPROVED: 'This contract has already been approved.',
  CONTRACT_ANALYSIS_FAILED: 'Contract analysis failed. Please try uploading again.',
  DOCUMENT_TOO_LARGE: 'The file is too large. Maximum size is 50 MB.',
  UNSUPPORTED_FILE_TYPE: 'Only PDF and DOCX files are supported.',
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  // ...
};
```

To add a new error: add the code to `errorMessages.ts` and ensure the backend returns that code in the `error.code` field of the Problem Details body.

### Checklist

- [ ] `AppError` is the only error type used in hooks and components
- [ ] `parseApiError` is called only inside `httpService` — never in hooks/services
- [ ] All toasts go through `feedbackService` — no direct `toast.*` calls
- [ ] `<ErrorBoundary>` wraps `App` root
- [ ] `<Toaster>` is mounted once in `App.tsx`
- [ ] `componentDidCatch` sends to Sentry/LogRocket (when APM is wired)
- [ ] New error codes added to `errorMessages.ts` before use
- [ ] `feedbackService.error(err)` receives the full `AppError`, not `err.message`

---

## Authentication (Auth0)

### Flow

Authorization Code Flow — Auth0 hosted Universal Login:

1. Frontend redirects to Auth0 login
2. Auth0 redirects back with code
3. Backend exchanges code for tokens
4. Backend stores tokens in HttpOnly cookies
5. Protected routes validate access_token JWT
6. Refresh token when access_token expires

### Session Model

```typescript
Session {
  id: string
  userId: string
  encryptedAccessToken: string  // AES-256-CBC
  encryptedRefreshToken: string // AES-256-CBC
  salt: string                  // PBKDF2 salt
  keyName: string               // Rotating key name
  accessTokenExpiresAt: Date
  expiresAt: Date
  lastUsedAt: Date
  createdAt: Date
  ipAddress: string
  userAgent: string
}
```

### Security Checklist

- [ ] `state` parameter validated (CSRF protection)
- [ ] `client_secret` never exposed to frontend
- [ ] Tokens stored in HttpOnly cookies (XSS protection)
- [ ] Cookies have Secure flag (HTTPS only)
- [ ] Cookies have SameSite=Strict (CSRF protection)
- [ ] JWT signature verified using Auth0 JWKS
- [ ] JWT expiration checked (exp claim)
- [ ] Tokens encrypted before DB storage
- [ ] Refresh token rotation
- [ ] Session invalidation on logout

---

## Backend-Driven Declarative Frontend

**Philosophy**: "If it's not in the response, it doesn't exist."

Frontend is a **view engine**. Backend makes all decisions.

### API Contract

Every response includes `actions` (what's allowed) and `ui` (how to display):

```typescript
{
  "resource": { /* data */ },

  "actions": {
    "canSubmit": {
      "allowed": false,
      "blockedReason": "3 required questions are unanswered",
      "helpText": "Answer all red-marked questions to proceed"
    },
    "canSave": { "allowed": true }
  },

  "ui": {
    "submitButtonLabel": "Submit for Review",
    "submitButtonColor": "primary",
    "showProgressBar": true,
    "progressPercentage": 66
  }
}
```

### Frontend Implementation

```typescript
// ✅ DO: Read from response
if (response.actions.canSubmit.allowed) {
  renderSubmitButton();
} else {
  renderDisabledButton();
  showMessage(response.actions.canSubmit.blockedReason);
}

// ❌ DON'T: Calculate
if (answers.length === total) {
  // Never do this
  renderSubmitButton();
}
```

---

## Reference Data API Pattern

One endpoint called once on app load returns all pre-computed view models:

```
GET /api/v1/reference-data
```

**Response structure**:

```typescript
interface ReferenceDataResponse {
  user: { id; name; email; role; orgName };
  views: {
    dashboard: DashboardViewModel;
    contractsList?: ContractsListViewModel;
    // new views added here over time
  };
  actions: {
    canUploadDocument: ActionPermission;
    canCreateEngagement: ActionPermission;
    // ...
  };
  ui: {
    orgBannerText: string;
    systemStatus: 'operational' | 'degraded' | 'maintenance';
    systemStatusColor: string;
  };
}
```

**Rules**:

- Fetch all views in one call
- Backend computes all KPIs, colors, labels, sorted lists
- Frontend never calculates business values
- Refetch triggered by mutations
- Cached by React Query with `queryKey: ['reference-data']`

---

## Audit Service

**Storage**: PostgreSQL, same DB, INSERT-only role

**Invocation**: Domain event handlers (audit is a side effect)

**Data model**:

```typescript
AuditEvent {
  id: string
  timestamp: Date
  actorId: string
  actorIp: string
  actorAgent: string
  action: string
  resourceType: string
  resourceId: string
  metadata: JSON
  checksum: string  // SHA-256(id|timestamp|actorId|action|resourceId)
}
```

**Rules**:

- INSERT-only (no UPDATE/DELETE on audit table)
- Tamper detection via SHA-256 checksum
- Indefinite retention
- Metadata is flexible JSON per action

---

## Structured Logging

**Library**: pino + nestjs-pino

**Local**: pino-pretty (human-readable, colored)

**Production**: JSON → GCP Cloud Logging

**Request ID**: Generated per request, propagated via `AsyncLocalStorage`, returned in `X-Request-Id` header

**Standard fields**: `level`, `time`, `requestId`, `userId`, `service`, `environment`, `msg`

**Redact**: auth headers, cookies, passwords, tokens

**Never use `console.log`** — always inject and use `LoggerService`

---

## Resilience (External APIs)

Using `cockatiel`:

| API                | Retry                  | Circuit Breaker  | Timeout |
| ------------------ | ---------------------- | ---------------- | ------- |
| Claude API         | 3x exponential backoff | Yes (5 failures) | 60s     |
| Google Document AI | 3x exponential backoff | Yes (5 failures) | 30s     |
| Auth0              | 2x fixed 1s            | No               | 10s     |
| GCS                | 3x exponential backoff | No               | 30s     |

Circuit open → `ExternalServiceUnavailableException` → 503

---

## 12-Layer Testing Architecture

Testing is a layered, intentional discipline that catches bugs at every stage—from code commit to production monitoring. Each layer catches different types of failures at different costs. Layer 1 catches bugs in seconds; Layer 12 catches them when users would notice.

### Testing Pyramid

```
                      ⬆️ SLOW & EXPENSIVE
                     / \
                    /   \  Layer 12: Production Monitoring
                   /     \  Layer 11: Observability Testing
                  /       \  Layer 10: Contract Testing
                 /         \ Layer 9: A11y Testing
                /           \Layer 8: Security Testing
               /             \Layer 7: Performance Testing
              /               \Layer 6: E2E Testing
             /                 \
            ╱───────────────────╲
           │  Layer 5: API Tests  │  ← Most cost-effective
          │  Layer 4: Integration  │
         │  Layer 3: Unit Tests    │
        │ Layer 2: Code Review    │
       │ Layer 1: Static Analysis │
      └─────────────────────────────┘
                ⬇️ FAST & CHEAP

  Philosophy:
  - Many fast tests (L1-3): instant feedback
  - Some integration tests (L4-5): catch interactions
  - Few E2E tests (L6): critical user journeys only
  - Nightly/weekly tests (L7-11): catch edge cases
  - Always-on (L12): production observability
```

### Layer 1: Static Analysis & Type Checking

**What it is**: Catching bugs without running code—linting, type checking, and code inspection.

**Cost**: ⚡ Instant (< 1 second)  
**Coverage**: 🎯 5-10% of bugs (simple mistakes)  
**When to run**: On every file save (IDE), on every commit

**Tools**:

- ESLint (JavaScript/TypeScript)
- TypeScript strict mode
- Prettier (code formatting)

**Configuration**:

```json
{
  "eslintConfig": {
    "extends": ["eslint:recommended"],
    "parserOptions": { "ecmaVersion": 2022 }
  },
  "typescript": {
    "strict": true,
    "noImplicitAny": true,
    "noUnusedLocals": true
  }
}
```

**Commands**:

```bash
npm run lint         # ESLint checks
npm run type-check   # TypeScript checks
```

---

### Layer 2: Code Review & Peer Review

**What it is**: Human review of code before it merges—catching logic errors, architectural issues, and knowledge sharing.

**Cost**: ⏱️ 15-30 minutes per PR (human time)  
**Coverage**: 🎯 10-20% of bugs (logic errors, architecture mismatches)  
**When to run**: Before merging to main

**Branch Protection Rules**:

- ✓ Require 1 code review
- ✓ Require approving reviews
- ✓ Dismiss stale reviews on new commits
- ✓ Require status checks to pass

**Review Checklist**:

- [ ] Code follows our style guide
- [ ] Changes include tests
- [ ] Logging/error handling is present
- [ ] No hardcoded secrets or credentials
- [ ] Documentation updated
- [ ] PR description explains the why
- [ ] Architecture aligns with our patterns

---

### Layer 3: Unit Testing (Functions in Isolation)

**What it is**: Fast tests of individual functions—mocking dependencies, testing happy path and edge cases.

**Cost**: ⚡ Instant (< 5 seconds for 100 tests)  
**Coverage**: 🎯 30-40% of bugs (function-level logic errors)  
**When to run**: On every file save (watch mode), on every commit

**Test Organization**: Arrange → Act → Assert

**Example (Domain Layer)**:

```typescript
// test/domain/entities/contract.spec.ts
describe('Contract Entity', () => {
  it('should calculate risk score correctly', () => {
    const contract = new Contract({
      id: '1',
      clauses: [
        { type: 'termination', risk: 'high' },
        { type: 'liability', risk: 'medium' },
      ],
    });

    expect(contract.calculateRiskScore()).toBe(75);
  });

  it('should prevent approval if high-risk flags unresolved', () => {
    const contract = new Contract({
      id: '1',
      flags: [{ severity: 'high', resolved: false }],
    });

    expect(() => contract.approve()).toThrow('Cannot approve with unresolved high-risk flags');
  });
});
```

**Commands**:

```bash
npm test                    # Run all tests
npm test -- --watch        # Watch mode (rerun on change)
npm test -- --coverage     # Show coverage %
```

**Target Coverage**:

- Domain layer: ≥ 90%
- Application layer: ≥ 80%
- Infrastructure layer: ≥ 70%

---

### Layer 4: Integration Testing (Components Together)

**What it is**: Test how components interact—real database, real HTTP calls (to test services), but still isolated from external world.

**Cost**: ⏱️ Moderate (1-5 seconds per test)  
**Coverage**: 🎯 40-50% of bugs (interaction issues, database problems)  
**When to run**: On every commit (CI pipeline)

**Example (Repository Integration)**:

```typescript
// test/infrastructure/repositories/contract.repository.integration.spec.ts
describe('ContractRepository Integration', () => {
  let repository: ContractRepository;
  let dataSource: DataSource;

  beforeAll(async () => {
    dataSource = await new DataSource({
      type: 'postgres',
      host: 'localhost',
      port: 5433,
      database: 'test_contract_intel',
      synchronize: true,
      dropSchema: true, // Fresh DB each test
    }).initialize();

    repository = new ContractRepository(dataSource);
  });

  afterAll(async () => {
    await dataSource.destroy();
  });

  it('should create and retrieve contract end-to-end', async () => {
    // 1. Create contract
    const contract = await repository.save({
      id: '1',
      name: 'Test Contract',
      status: 'pending',
    });
    expect(contract.id).toBeDefined();

    // 2. Retrieve contract
    const retrieved = await repository.findById(contract.id);
    expect(retrieved.name).toBe('Test Contract');

    // 3. Verify in database
    const dbRecord = await dataSource.query('SELECT * FROM contracts WHERE id = $1', [contract.id]);
    expect(dbRecord).toHaveLength(1);
  });

  it('should use index for contract lookup by userId', async () => {
    // Create 100 contracts
    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        repository.save({ userId: 'user1', name: `Contract ${i}` }),
      ),
    );

    // Query should use index
    const plan = await dataSource.query('EXPLAIN SELECT * FROM contracts WHERE user_id = $1', [
      'user1',
    ]);

    // Verify index is used (not seq scan)
    expect(plan.some((row) => row['Node Type'] === 'Index Scan')).toBe(true);
  });
});
```

**Commands**:

```bash
npm run test:integration        # Run integration tests only
npm run test:integration:watch  # Watch mode
```

---

### Layer 5: API Testing (Endpoint Testing)

**What it is**: Test HTTP endpoints—request/response, status codes, error handling, security headers.

**Cost**: ⏱️ Moderate (1-3 seconds per test)  
**Coverage**: 🎯 50-60% of bugs (HTTP layer issues)  
**When to run**: On every commit (CI pipeline)

**Example (API Endpoint)**:

```typescript
// test/api/contracts.api.spec.ts
import request from 'supertest';
import { app } from '../src/main';

describe('Contracts API', () => {
  describe('POST /contracts', () => {
    it('should create contract with valid input', async () => {
      const response = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Contract',
          type: 'vendor',
        });

      expect(response.status).toBe(201); // Created
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('Test Contract');
      expect(response.body).not.toHaveProperty('internalNotes'); // No leaks
    });

    it('should reject unauthorized request', async () => {
      const response = await request(app)
        .post('/api/v1/contracts')
        // No Authorization header
        .send({ name: 'Test' });

      expect(response.status).toBe(401); // Unauthorized
      expect(response.body.message).toContain('authentication');
    });

    it('should return 400 for missing required field', async () => {
      const response = await request(app)
        .post('/api/v1/contracts')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing name
          type: 'vendor',
        });

      expect(response.status).toBe(400);
      expect(response.body.errors).toContainEqual(expect.objectContaining({ field: 'name' }));
    });
  });

  describe('GET /contracts/:id', () => {
    it('should return 404 for nonexistent contract', async () => {
      const response = await request(app)
        .get('/api/v1/contracts/99999')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('should return 403 if user lacks access', async () => {
      const response = await request(app)
        .get('/api/v1/contracts/other-user-contract')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403); // Forbidden
    });
  });
});
```

**Commands**:

```bash
npm run test:api          # Run API tests
npm run test:api:watch    # Watch mode
```

**Test Coverage for Each Endpoint**:

1. Happy path (200/201)
2. Auth required (401)
3. Missing fields (400)
4. Invalid values (400)
5. Resource not found (404)
6. Permission denied (403)

---

### Layer 6: E2E Testing (User Workflows)

**What it is**: Test complete user journeys—browser automation, UI interactions, full stack (API + Database + UI).

**Cost**: ⏱️ Slow (5-30 seconds per test)  
**Coverage**: 🎯 60-70% of bugs (user-facing issues)  
**When to run**: On PR merge (before production), nightly, not locally (too slow)

**Example (Cypress)**:

```typescript
// cypress/e2e/contract-workflow.cy.ts
describe('Contract Upload and Analysis Workflow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('test@example.com', 'password');
  });

  it('should upload and analyze contract', () => {
    // Navigate to upload
    cy.contains('Upload Contract').click();
    cy.url().should('include', '/upload');

    // Upload file
    cy.get('[data-cy=file-upload]').attachFile('test-contract.pdf');
    cy.get('[data-cy=contract-name]').type('Vendor Agreement');
    cy.get('[data-cy=submit-btn]').click();

    // Wait for processing
    cy.contains('Processing...').should('be.visible');
    cy.contains('Analysis Complete', { timeout: 60000 }).should('be.visible');

    // Verify results
    cy.url().should('include', '/contracts/');
    cy.get('[data-cy=risk-score]').should('contain', '%');
    cy.get('[data-cy=flags-count]').should('be.visible');
  });

  it('should show validation errors for invalid upload', () => {
    cy.contains('Upload Contract').click();

    // Try to submit without file
    cy.get('[data-cy=submit-btn]').click();

    // Should show error
    cy.contains('Please select a file').should('be.visible');
    cy.url().should('not.include', '/contracts'); // Still on form
  });
});
```

**Commands**:

```bash
npm run test:e2e              # Run E2E tests
npm run test:e2e -- --headed  # With browser visible
npm run test:e2e:debug        # Debug mode
```

**Priority**:

1. Critical user journeys (contract upload → analysis → review)
2. High-value flows (export report, share result)
3. Error scenarios (network error handling)

**Skip**:

- Every button click (use unit tests)
- Every input validation (use API tests)
- UI implementation details (use visual tests)

---

### Layer 7: Performance Testing (Load & Stress)

**What it is**: Test how system behaves under load—concurrent users, throughput, latency degradation.

**Cost**: ⏱️ Expensive (need test environment; consumes resources)  
**Coverage**: 🎯 70-75% of bugs (scalability, resource issues)  
**When to run**: Before major releases, after significant changes

**Tools**: k6, JMeter, Gatling, Locust

**Example (k6 script)**:

```javascript
// test/load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 10 }, // Ramp up to 10 users
    { duration: '2m', target: 50 }, // Ramp up to 50 users
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '1m', target: 0 }, // Ramp down to 0 users
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // P95 latency < 500ms
    http_req_failed: ['rate<0.1'], // Error rate < 10%
  },
};

export default function () {
  const baseUrl = 'http://localhost:3000/api/v1';
  const authToken = 'test-token';

  // Upload contract
  const uploadRes = http.post(
    `${baseUrl}/contracts`,
    JSON.stringify({
      name: 'Test Contract',
      type: 'vendor',
    }),
    {
      headers: {
        Authorization: `Bearer ${authToken}`,
        'Content-Type': 'application/json',
      },
    },
  );

  check(uploadRes, {
    'Upload status 201': (r) => r.status === 201,
    'Upload response time < 200ms': (r) => r.timings.duration < 200,
  });

  sleep(1);
}
```

**Commands**:

```bash
k6 run test/load-test.js
```

**Thresholds**:

- P95 latency < 500ms
- Error rate < 1%
- No memory leaks (check after soak test)

---

### Layer 8: Security Testing (Vulnerability Scanning)

**What it is**: Automated scanning for security issues—dependency vulnerabilities, secrets in code, injection attacks.

**Cost**: ⏱️ Moderate (seconds for dependency scanning, minutes for full SAST)  
**Coverage**: 🎯 75-80% of bugs (security issues)  
**When to run**: On every commit (dependencies), nightly (full scan)

**Tools**:

- npm audit (dependency scanning)
- Snyk (detailed vulnerability analysis)
- TruffleHog (secret scanning)
- SonarQube (SAST)
- OWASP ZAP (DAST)

**Commands**:

```bash
# Dependency scanning
npm audit                    # Built-in; check for known CVEs
snyk test                    # More detailed; fix suggestions

# Secret scanning
trufflehog filesystem . --json

# SAST with SonarQube
sonar-scanner \
  -Dsonar.projectKey=contract-intel \
  -Dsonar.sources=src \
  -Dsonar.host.url=http://sonarqube:9000
```

**CI/CD Integration**:

```yaml
# .github/workflows/security.yml
name: Security Scan

on: [push, pull_request]

jobs:
  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0

      # Dependency scanning
      - run: npm audit --audit-level=moderate

      # Secret scanning
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./

      # SAST
      - uses: SonarSource/sonarcloud-github-action@master
```

---

### Layer 9: Accessibility Testing (A11y)

**What it is**: Verify app is usable by everyone—keyboard navigation, screen readers, color contrast, labels.

**Cost**: ⏱️ Moderate (automated scanning is fast; manual testing is slow)  
**Coverage**: 🎯 75-80% of bugs (accessibility issues)  
**When to run**: On every commit (automated scan), quarterly (manual audit)

**Tools**: axe, Lighthouse, Pa11y

**Example (Jest + axe)**:

```typescript
// test/accessibility.spec.ts
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ContractUploadForm from '../src/components/ContractUploadForm';

expect.extend(toHaveNoViolations);

describe('ContractUploadForm Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ContractUploadForm />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper labels', () => {
    const { getByLabelText } = render(<ContractUploadForm />);

    const fileInput = getByLabelText('Contract File');
    expect(fileInput).toBeInTheDocument();
  });

  it('should be keyboard navigable', () => {
    const { getByRole } = render(<ContractUploadForm />);

    const submitButton = getByRole('button', { name: /upload/i });
    submitButton.focus();
    expect(document.activeElement).toBe(submitButton);
  });
});
```

**Commands**:

```bash
npm run test:a11y          # Automated scanning
# Manual: Use NVDA (Windows) or VoiceOver (Mac) to test
```

**WCAG AA Requirements**:

- Color contrast ≥ 4.5:1
- Keyboard navigation works
- Screen reader announces content
- Form fields have labels
- Images have alt text

---

### Layer 10: Contract Testing (API Contracts)

**What it is**: Verify API contracts between services—requests/responses match expected schema; prevents breaking changes.

**Cost**: ⏗ Moderate (setup overhead, then fast)  
**Coverage**: 🎯 70-75% of bugs (integration issues between services)  
**When to run**: On every commit (when APIs change)

**Tools**: Pact, Spring Cloud Contract

**Example (Pact)**:

```typescript
// test/contracts/contract-service.pact.spec.ts
import { PactV3 } from '@pact-foundation/pact';
import axios from 'axios';

describe('Contract Service API Contract', () => {
  const provider = new PactV3({
    provider: 'ContractService',
    consumer: 'DashboardService',
  });

  it('should get contract by ID', () => {
    return provider
      .addInteraction({
        states: [{ description: 'contract 123 exists' }],
        uponReceiving: 'a request for contract 123',
        withRequest: {
          method: 'GET',
          path: '/contracts/123',
        },
        willRespondWith: {
          status: 200,
          body: {
            id: 123,
            name: 'Vendor Agreement',
            riskScore: 75,
            status: 'approved',
          },
        },
      })
      .executeTest(async (mockServer) => {
        const response = await axios.get(`${mockServer.url}/contracts/123`);

        expect(response.status).toBe(200);
        expect(response.data.riskScore).toBe(75);
      });
  });
});
```

**Commands**:

```bash
npm run test:contract  # Generates pact/*.json files
```

---

### Layer 11: Monitoring & Observability Testing

**What it is**: Verify system observability—logs are meaningful, metrics are accurate, traces are useful for debugging.

**Cost**: ⏗ Moderate (setup overhead, then useful ongoing)  
**Coverage**: 🎯 70-80% of bugs (found in production with good observability)  
**When to run**: On every deploy (check logs make sense), daily (health checks)

**Example (Verify Logs)**:

```typescript
// test/observability.spec.ts
import { logger } from '../src/logger';

describe('Observability', () => {
  it('should log contract upload', () => {
    const logSpy = jest.spyOn(logger, 'info');

    contractService.upload(contract);

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        event: 'contract_uploaded',
        contractId: expect.any(String),
        userId: expect.any(String),
      }),
    );
  });

  it('should expose metrics', async () => {
    const response = await request(app).get('/metrics').expect(200);

    expect(response.text).toContain('contract_uploaded_total');
    expect(response.text).toContain('http_request_duration_seconds');
  });
});
```

**Verify in Production**:

```bash
# Check if logs are meaningful
curl http://localhost:3000/metrics | grep contract_uploaded_total

# Query logs
curl -s "http://elasticsearch:9200/logs-*/_search" \
  -d '{"query": {"term": {"event": "contract_uploaded"}}}' | jq
```

---

### Layer 12: Production Monitoring & Continuous Improvement

**What it is**: Monitor production system 24/7—catch real issues, track metrics, continuous improvement based on data.

**Cost**: 💰 Expensive (ongoing operational cost)  
**Coverage**: 🎯 90%+ of bugs (caught by real users, fixed before impact spreads)  
**When to run**: Always (production 24/7)

**Tools**:

- Sentry (error tracking)
- Prometheus (metrics)
- Grafana (dashboards)
- Dynatrace (APM)
- LogRocket (frontend monitoring)

**Setup (Sentry + Prometheus + Grafana)**:

```typescript
// src/main.ts - Set up error tracking
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% of requests
});

app.use(Sentry.Handlers.requestHandler());

// Business logic...

app.use(Sentry.Handlers.errorHandler());
```

**Alert Rules**:

```yaml
# alerts.yml
groups:
  - name: contract-intel
    rules:
      - alert: HighErrorRate
        expr: rate(contract_errors_total[5m]) > 0.01
        for: 5m
        annotations:
          summary: 'Error rate > 1%'

      - alert: HighLatency
        expr: histogram_quantile(0.95, http_request_duration_seconds) > 0.5
        for: 5m
        annotations:
          summary: 'P95 latency > 500ms'
```

**On-Call Runbook**:

```
# If Error Rate Alert Fires

1. Check current errors:
   SELECT COUNT(*) FROM errors WHERE created_at > now() - 5 minutes

2. Are they coming from a specific endpoint?
   SELECT endpoint, COUNT(*) FROM errors GROUP BY endpoint

3. Is it a database issue?
   SELECT latency FROM query_stats WHERE duration > 1000

4. Is it a recent deploy?
   Check deployment history

5. If recent deploy, rollback:
   kubectl rollout undo deployment/contract-intel

6. If not recent, investigate logs:
   curl "http://elasticsearch:9200/logs/_search?q=event:error" | jq
```

---

### Testing Matrix by Clean Architecture Layer

| Layer              | Test Type   | Database   | Mock Deps    | Speed  | Example                         |
| ------------------ | ----------- | ---------- | ------------ | ------ | ------------------------------- |
| **Domain/Entity**  | Unit        | ❌ None    | ❌ None      | ⚡ ms  | contract.calculateRiskScore()   |
| **Application/UC** | Unit        | ❌ None    | ✅ Repos     | ⚡ ms  | uploadContractUseCase.execute() |
| **Presentation**   | API         | ❌ None    | ✅ Use Cases | ⏱️ sec | POST /contracts                 |
| **Infrastructure** | Integration | ✅ Test DB | ❌ None      | ⏱️ sec | repository.save()               |
| **End-to-End**     | E2E         | ✅ Test DB | ❌ None      | ⏱️ min | User journey                    |

---

### Testing by Clean Architecture Layer

The rule: **closer to domain = faster and more isolated. Closer to infrastructure = slower but more real.**

```
┌──────────────────────┬────────────────┬─────────────┬──────────────┬──────────────┐
│ Layer                │ Test Type      │ Database    │ Mock Deps    │ Speed        │
├──────────────────────┼────────────────┼─────────────┼──────────────┼──────────────┤
│ Domain/Entity        │ Unit           │ ❌ None     │ ❌ None      │ ⚡ Instant   │
│ Application/UC       │ Unit           │ ❌ None     │ ✅ Repos     │ ⚡ Instant   │
│ Presentation         │ API (supertest)│ ❌ None     │ ✅ Use Cases │ ⏱️ Seconds   │
│ Infrastructure       │ Integration    │ ✅ Test DB  │ ❌ None      │ ⏱️ Seconds   │
├──────────────────────┼────────────────┼─────────────┼──────────────┼──────────────┤
│ End-to-End           │ E2E (Cypress)  │ ✅ Test DB  │ ❌ None      │ ⏱️ Minutes   │
│ Performance          │ Load (k6)      │ ✅ Prod-like│ ❌ None      │ ⏱️ Minutes   │
└──────────────────────┴────────────────┴─────────────┴──────────────┴──────────────┘
```

**Domain Layer** — Unit tests, no mocks, no DB:

```typescript
// src/modules/contracts/domain/__tests__/contract.aggregate.spec.ts
describe('Contract Aggregate', () => {
  it('should calculate risk score correctly', () => {
    const contract = ContractFactory.create({
      flags: [{ severity: 'critical' }, { severity: 'medium' }],
    });
    expect(contract.calculateRiskScore()).toBe(75);
  });

  it('should prevent approval if critical flags unresolved', () => {
    const contract = ContractFactory.create({
      flags: [{ severity: 'critical', status: 'open' }],
    });
    expect(() => contract.approve()).toThrow('Cannot approve with unresolved critical flags');
  });
});
```

**Application Layer** — Unit tests, mock repositories only:

```typescript
// src/modules/contracts/application/commands/__tests__/upload-contract.handler.spec.ts
describe('UploadContractHandler', () => {
  let handler: UploadContractHandler;
  let mockRepository: jest.Mocked<IContractRepository>;

  beforeEach(() => {
    mockRepository = { findById: jest.fn(), save: jest.fn() };
    handler = new UploadContractHandler(mockRepository);
  });

  it('should save contract and return DTO', async () => {
    mockRepository.save.mockResolvedValue(ContractFactory.create());

    const result = await handler.execute(new UploadContractCommand({ title: 'Test' }));

    expect(result.isSuccess).toBe(true);
    expect(mockRepository.save).toHaveBeenCalled();
  });
});
```

**Presentation Layer** — API tests via Supertest, mock use cases:

```typescript
// src/modules/contracts/infrastructure/__tests__/contract.controller.api.spec.ts
describe('ContractController API', () => {
  it('should return 201 on POST /contracts', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/contracts')
      .set('Authorization', `Bearer ${authToken}`)
      .send({ title: 'Vendor Agreement' });

    expect(response.status).toBe(201);
    expect(response.body.data).toHaveProperty('id');
  });

  it('should return 401 without auth', async () => {
    const response = await request(app.getHttpServer())
      .post('/api/v1/contracts')
      .send({ title: 'Test' });

    expect(response.status).toBe(401);
  });
});
```

**Infrastructure Layer** — Integration tests against the feature's chosen persistence adapter:

```typescript
// src/modules/contracts/infrastructure/contract.repository.integration.spec.ts
describe('ContractRepository Integration', () => {
  it('should save and retrieve contract', async () => {
    const contract = ContractFactory.create();
    await repository.save(contract);

    const retrieved = await repository.findById(contract.id);
    expect(retrieved).toBeDefined();
    expect(retrieved.id.value).toBe(contract.id.value);
  });
});
```

> The adapter under test is whichever the feature ships (`PrismaContractRepository`, `TypeOrmContractRepository`, `SqlContractRepository`, or an in-memory variant for early development).

**Decision Matrix** — which test to write:

```
What am I testing?
├─ Pure business logic (no dependencies)?
│  └─ DOMAIN UNIT TEST — no DB, no mocks
│
├─ Use case (orchestrates logic + repos)?
│  └─ APPLICATION UNIT TEST — no DB, mock repositories
│
├─ HTTP endpoint (routing, auth, status codes)?
│  └─ PRESENTATION API TEST — no DB, mock use cases
│
├─ Repository (database operations)?
│  └─ INFRASTRUCTURE INTEGRATION TEST — real test DB, no mocks
│
└─ Full user journey (UI to database)?
   └─ E2E TEST — real test DB, real browser
```

**Practical Tips**:

- ✅ Test behavior, not implementation
- ✅ Use descriptive test names
- ✅ Test happy path + error cases + edge cases
- ✅ Mock external dependencies (repos, services, HTTP)
- ✅ Use real database for repository tests
- ❌ Don't test private methods
- ❌ Don't have interdependent tests
- ❌ Don't use real databases in unit tests
- ❌ Don't test framework code (NestJS decorators)

---

| Layer                 | Target Speed | When to Run               |
| --------------------- | ------------ | ------------------------- |
| Layer 1 (Static)      | < 30 seconds | On every save             |
| Layer 2 (Review)      | < 1 hour     | Within business day       |
| Layer 3 (Unit)        | < 5 seconds  | On every save             |
| Layer 4 (Integration) | < 60 seconds | On commit                 |
| Layer 5 (API)         | < 60 seconds | On commit                 |
| Layer 6 (E2E)         | < 5 minutes  | On PR merge only          |
| Layer 7 (Performance) | < 10 minutes | Nightly or before release |
| Layer 8 (Security)    | < 2 minutes  | On every commit           |
| Layer 9 (A11y)        | < 1 minute   | Nightly                   |
| Layer 10 (Contract)   | < 1 minute   | On API change             |

---

### Testing Strategy by Feature Type

**Critical Features** (Contract Upload, Analysis, Approval):

- Layer 1: Static analysis ✓
- Layer 2: Code review (1 peer) ✓
- Layer 3: Unit tests (80%+ coverage) ✓
- Layer 4: Integration tests (full flow) ✓
- Layer 5: API tests (all endpoints) ✓
- Layer 6: E2E test (user workflow) ✓
- Layer 8: Security test (no injection) ✓
- Layer 11: Logs meaningful ✓
- Layer 12: Production monitoring ✓

**Medium Features** (Export Report, Search):

- Layer 1: Static analysis ✓
- Layer 2: Code review (1 peer) ✓
- Layer 3: Unit tests (60%+ coverage) ✓
- Layer 4: Integration tests (happy path) ✓
- Layer 5: API tests (main flow) ✓
- Layer 6: E2E test (optional)
- Layer 7: Performance test (nightly) ✓

**Low-Risk Features** (UI Theme, Layout):

- Layer 1: Static analysis ✓
- Layer 2: Code review (1 peer) ✓
- Layer 3: Unit tests (if has logic)
- Layer 6: Visual regression test ✓

---

### Coverage Thresholds

**Domain Layer**: ≥ 90% coverage  
**Application Layer**: ≥ 80% coverage  
**Infrastructure Layer**: ≥ 70% coverage  
**Overall**: ≥ 80% coverage

**Test Factories**: Create test factories per aggregate with sensible defaults

**CI/CD**: lint + unit + integration on every commit, block merge on failure

---

### Commands Reference

```bash
# Layer 1: Static Analysis
npm run lint
npm run type-check

# Layer 3: Unit Tests
npm test
npm test -- --watch
npm test -- --coverage

# Layer 4: Integration Tests
npm run test:integration
npm run test:integration:watch

# Layer 5: API Tests
npm run test:api
npm run test:api:watch

# Layer 6: E2E Tests
npm run test:e2e
npm run test:e2e -- --headed
npm run test:e2e:debug

# Layer 7: Performance Tests
k6 run test/load-test.js

# Layer 8: Security Tests
npm audit
snyk test
trufflehog filesystem . --json

# Layer 9: Accessibility Tests
npm run test:a11y

# Layer 10: Contract Tests
npm run test:contract

# All Tests
npm run test:all
```

---

### Implementation Timeline

**Week 1: Foundation (Layers 1-3)**

- Day 1-2: Setup ESLint + TypeScript
- Day 3-5: Write unit tests (80% coverage on 1 service)
- Day 6-7: Enable code review in GitHub

**Week 2: Integration & API (Layers 4-5)**

- Day 8-9: Add integration tests (real DB)
- Day 10-11: Add API tests (all endpoints)
- Day 12-13: Add basic E2E test (1 user journey)
- Day 14: Fix any failing tests

**Week 3: Quality & Security (Layers 6, 8)**

- Day 15-16: Add security scanning (npm audit, secrets)
- Day 17-18: Add performance baseline
- Day 19-20: Setup monitoring (Prometheus + Grafana)
- Day 21: Test everything together

**Week 4: Polish & Launch (Layers 7, 9, 10-12)**

- Day 22-24: Add E2E for critical flows
- Day 25-26: Add accessibility scanning
- Day 27-28: Setup production monitoring
- Day 29-30: Deploy with confidence!

---

## Observability

- **Dynatrace**: backend APM via OneAgent (automatic, no code changes)
- **LogRocket**: frontend session replay + error tracking (redact document content and auth headers)
- **PostHog**: product analytics + feature flags
  - Backend flags evaluated server-side via PostHog Node.js SDK
  - Frontend flags evaluated client-side via PostHog JS SDK

---

## Deployment Environments

| Concern  | Local Dev        | Railway (Demo)   | GCP (Production)     |
| -------- | ---------------- | ---------------- | -------------------- |
| Database | SQLite           | PostgreSQL       | Cloud SQL            |
| Storage  | Local filesystem | GCS bucket       | GCS bucket           |
| Queue    | In-memory        | pg-boss          | BullMQ + Memorystore |
| Secrets  | `.env` file      | Railway env vars | GCP Secret Manager   |
| Logging  | pino-pretty      | JSON             | JSON → Cloud Logging |

---

## Key Rules Summary

### Backend

1. Domain layer has zero framework dependencies
2. CQRS: commands mutate, queries read directly
3. Repository returns `T | null`, throws on failure
4. Mapper layer: Persistence ↔ Domain ↔ DTO (never leak)
5. All infrastructure behind ports (interfaces)
6. Global exception filter returns RFC 7807
7. All responses wrapped in `ApiResponse<T>`

### Frontend

1. Component structure: TSX + hook + CSS + test + story
2. 3-tier API stack: hook → service → httpService → axios
3. httpService is ONLY file that imports axios
4. All URLs in `src/api/endpoints.ts`
5. Mobile-first responsive (min-width media queries)
6. Accessibility built-in (focus, touch targets, ARIA, keyboard, contrast)
7. All SVG icons in `src/components/core/icons.tsx`
8. Backend-driven UI (read from response, never calculate)
9. `AppError` is the ONLY error type used in hooks and components — never raw `AxiosError` or `Error`
10. All toasts go through `feedbackService` — never call `toast.*` directly
11. `parseApiError` is called only inside `httpService` — never in hooks or services
12. `<ErrorBoundary>` wraps the app root; `<Toaster>` mounted once in `App.tsx`

### Testing

1. **12-layer testing architecture** — each layer catches different bugs at different costs
2. **By Clean Architecture layer**:
   - Domain/Entity → Unit tests (no mocks, no DB)
   - Application/Use Cases → Unit tests (mock repositories only)
   - Presentation/Controllers → API tests via Supertest (mock use cases)
   - Infrastructure/Repositories → Integration tests (real test DB)
   - Full stack → E2E tests (1-2 critical journeys only)
3. **Coverage thresholds**: domain ≥90%, application ≥80%, overall ≥80%
4. **Test factories** per aggregate with sensible defaults
5. **CI blocks merge on failure** — lint + unit + integration + security on every commit
6. **Test distribution**: 80% unit (fast), 15% integration/API (medium), 5% E2E (slow)
7. **Zero flaky tests** — fix immediately or delete
8. **Test behavior, not implementation** — test what it does, not how

### Security

1. Auth0 Authorization Code Flow
2. Tokens in HttpOnly cookies
3. Tokens encrypted in DB (AES-256-CBC)
4. JWT signature verified
5. Refresh token rotation
6. Session invalidation on logout
7. Audit trail for all actions

---

## 12-Layer Frontend Testing Architecture

Frontend testing is fundamentally different from backend testing. While backend tests business logic, database, and APIs, frontend tests the user experience, interactions, and visual correctness.

### Frontend Testing Pyramid

```
⬆️ SLOW & EXPENSIVE
                   /                      \
                  /  Layer 12: Production   \
                 /   Monitoring              \
                /  Layer 11: E2E Tests        \
               /  Layer 10: Visual Regression  \
              /  Layer 9: Mobile-Specific       \
             /  Layer 8: Performance             \
            /  Layer 7: Accessibility             \
           /  Layer 6: Navigation & Routing        \
          ╱────────────────────────────────────────╲
         │  Layer 5: Snapshot Tests                │
        │  Layer 4: Integration Tests              │
       │  Layer 3: Hook Tests                     │
      │  Layer 2: Component Unit Tests            │
     │  Layer 1: Static Analysis                 │
    └─────────────────────────────────────────────┘
                ⬇️ FAST & CHEAP

Distribution:
  ⚡ Fast (unit, hook, snapshot): 80% of tests
  ⏱️ Medium (integration, routing): 15% of tests
  ⏱️ Slow (E2E): 5% of tests (1-3 critical journeys)
```

### Layer 1: Static Analysis & Linting (Type Safety)

**What**: Catching errors before running code—TypeScript, ESLint, React-specific rules.

**Cost**: ⚡ Instant (< 1 second)  
**Coverage**: 🎯 5-10% of bugs (type errors, missing props)  
**When**: On every save (IDE), on every commit

**Config**:

```json
{
  "extends": ["eslint:recommended", "plugin:react/recommended", "plugin:react-hooks/recommended"],
  "rules": {
    "react/prop-types": "warn",
    "react-hooks/rules-of-hooks": "error",
    "react-hooks/exhaustive-deps": "warn",
    "no-console": "warn"
  }
}
```

**TypeScript**:

```typescript
// ❌ CAUGHT BY LAYER 1
const ContractCard = ({ contractId, onApprove, missingProp }) => { ... }

// ✅ CORRECT
interface Props {
  contractId: string;
  onApprove: (id: string) => void;
}
const ContractCard: React.FC<Props> = ({ contractId, onApprove }) => { ... }
```

---

### Layer 2: Component Unit Tests (Isolated, No Dependencies)

**What**: Test individual components in isolation—props, state, handlers, conditional rendering.

**Tools**: React Testing Library, Jest/Vitest

**Cost**: ⚡ Fast (< 1 second per test)  
**Coverage**: 🎯 30-40% of bugs (component logic errors)  
**When**: On every save (watch mode), on every commit

**Example**:

```typescript
// src/components/ContractCard/ContractCard.test.tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ContractCard } from './ContractCard';

describe('ContractCard Component', () => {
  it('should render contract title and status', () => {
    render(
      <ContractCard
        id="1"
        title="Vendor Agreement"
        status="pending"
        riskScore={75}
        onApprove={jest.fn()}
      />
    );

    expect(screen.getByText('Vendor Agreement')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  it('should call onApprove with contract id on button click', async () => {
    const user = userEvent.setup();
    const mockOnApprove = jest.fn();

    render(
      <ContractCard
        id="1"
        title="Vendor Agreement"
        status="pending"
        riskScore={75}
        onApprove={mockOnApprove}
      />
    );

    await user.click(screen.getByRole('button', { name: /approve/i }));
    expect(mockOnApprove).toHaveBeenCalledWith('1');
  });

  it('should disable approve button for high-risk contracts', () => {
    render(
      <ContractCard
        id="1"
        title="Risky Contract"
        status="pending"
        riskScore={95}
        onApprove={jest.fn()}
      />
    );

    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
  });

  it('should show loading state', () => {
    render(
      <ContractCard
        id="1"
        title="Vendor Agreement"
        status="pending"
        riskScore={75}
        onApprove={jest.fn()}
        isLoading={true}
      />
    );

    expect(screen.getByRole('button', { name: /approve/i })).toBeDisabled();
    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });
});
```

**Rules**:

- ✅ Test user interactions (click, type, submit)
- ✅ Test conditional rendering (loading, error, empty states)
- ✅ Test all prop combinations
- ❌ Don't test implementation details (internal state, private functions)
- ❌ Don't test external libraries

---

### Layer 3: Hook Testing (Custom Logic)

**What**: Test custom React hooks in isolation—state updates, effects, side effects.

**Tools**: `renderHook` from `@testing-library/react`

**Cost**: ⚡ Fast (< 1 second per test)  
**Coverage**: 🎯 20-30% of bugs (custom hook logic)  
**When**: On every commit

**Example**:

```typescript
// src/hooks/useContracts.test.ts
import { renderHook, waitFor } from '@testing-library/react';
import { useContracts } from './useContracts';

describe('useContracts Hook', () => {
  beforeEach(() => {
    global.fetch = jest.fn();
  });

  it('should fetch contracts on mount', async () => {
    const mockContracts = [{ id: '1', title: 'Vendor Agreement' }];
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => mockContracts,
    });

    const { result } = renderHook(() => useContracts());

    expect(result.current.loading).toBe(true);

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.contracts).toEqual(mockContracts);
    expect(result.current.error).toBeNull();
  });

  it('should set error if fetch fails', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({ ok: false });

    const { result } = renderHook(() => useContracts());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.error).toBeTruthy();
    expect(result.current.contracts).toEqual([]);
  });
});
```

---

### Layer 4: Integration Testing (Components + State + API)

**What**: Test components with mocked API calls, routing, and state management together.

**Tools**: MSW (Mock Service Worker) + React Testing Library + Redux/Context Provider

**Cost**: ⏱️ Moderate (1-3 seconds per test)  
**Coverage**: 🎯 40-50% of bugs (integration issues)  
**When**: On every commit

**Example**:

```typescript
// src/pages/ContractDetailPage/ContractDetailPage.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { ContractDetailPage } from './ContractDetailPage';
import { AppProviders } from '../../test-utils/AppProviders';

const server = setupServer(
  http.get('/api/v1/contracts/:id', ({ params }) => {
    return HttpResponse.json({
      id: params.id,
      title: 'Vendor Agreement',
      status: 'pending',
      riskScore: 65,
      flags: [{ id: 'f1', severity: 'medium', description: 'Unusual termination clause' }],
    });
  }),
  http.post('/api/v1/contracts/:id/approve', () => {
    return HttpResponse.json({ status: 'approved' });
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

describe('ContractDetailPage Integration', () => {
  it('should load contract and allow approval', async () => {
    const user = userEvent.setup();

    render(
      <AppProviders>
        <ContractDetailPage contractId="1" />
      </AppProviders>
    );

    // Wait for contract to load
    await waitFor(() => {
      expect(screen.getByText('Vendor Agreement')).toBeInTheDocument();
    });

    // Verify flags are shown
    expect(screen.getByText('Unusual termination clause')).toBeInTheDocument();

    // Approve contract
    await user.click(screen.getByRole('button', { name: /approve/i }));

    // Verify success
    await waitFor(() => {
      expect(screen.getByText(/approved/i)).toBeInTheDocument();
    });
  });

  it('should handle API error gracefully', async () => {
    server.use(
      http.get('/api/v1/contracts/:id', () => {
        return HttpResponse.json({ error: 'Not found' }, { status: 404 });
      })
    );

    render(
      <AppProviders>
        <ContractDetailPage contractId="999" />
      </AppProviders>
    );

    await waitFor(() => {
      expect(screen.getByText(/contract not found/i)).toBeInTheDocument();
    });
  });
});
```

---

### Layer 5: Snapshot Testing (Visual Regression Detection)

**What**: Capture component output as snapshots; detect unintended UI changes.

**Cost**: ⚡ Fast (< 1 second)  
**Coverage**: 🎯 5-10% of bugs (unintended visual changes)  
**When**: On every commit

**Example**:

```typescript
// src/components/RiskBadge/RiskBadge.test.tsx
import { render } from '@testing-library/react';
import { RiskBadge } from './RiskBadge';

describe('RiskBadge Snapshots', () => {
  it('should match snapshot for critical risk', () => {
    const { container } = render(<RiskBadge level="critical" />);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should match snapshot for low risk', () => {
    const { container } = render(<RiskBadge level="low" />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
```

⚠️ **Warning**: Don't abuse snapshots. Use for visual components only, not business logic. Update snapshots intentionally with `npm test -- --updateSnapshot`.

---

### Layer 6: Navigation & Routing Tests

**What**: Test navigation, URL changes, route guards, and page transitions.

**Cost**: ⏱️ Moderate (1-2 seconds)  
**Coverage**: 🎯 10-15% of bugs (routing issues)  
**When**: On every commit

**Example**:

```typescript
// src/routing/routing.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { ContractDetailPage } from '../pages/ContractDetailPage';
import { LoginPage } from '../pages/LoginPage';

describe('Routing', () => {
  it('should redirect to login if not authenticated', async () => {
    render(
      <MemoryRouter initialEntries={['/contracts/1']}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/contracts/:id"
            element={
              <ProtectedRoute>
                <ContractDetailPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/sign in/i)).toBeInTheDocument();
    });
  });

  it('should render page if authenticated', async () => {
    // Mock auth context
    render(
      <MemoryRouter initialEntries={['/contracts/1']}>
        <AuthProvider value={{ isAuthenticated: true }}>
          <Routes>
            <Route
              path="/contracts/:id"
              element={
                <ProtectedRoute>
                  <ContractDetailPage />
                </ProtectedRoute>
              }
            />
          </Routes>
        </AuthProvider>
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/contract/i)).toBeInTheDocument();
    });
  });
});
```

---

### Layer 7: Accessibility Testing (A11y)

**What**: Verify app is usable by everyone—keyboard navigation, screen readers, color contrast.

**Tools**: jest-axe, Lighthouse, axe DevTools

**Cost**: ⚡ Fast (automated), ⏱️ Slow (manual)  
**Coverage**: 🎯 10-20% of bugs (accessibility issues)  
**When**: On every commit (automated), quarterly (manual)

**Example**:

```typescript
// src/components/ContractUploadForm/ContractUploadForm.test.tsx
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ContractUploadForm } from './ContractUploadForm';

expect.extend(toHaveNoViolations);

describe('ContractUploadForm Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(
      <ContractUploadForm onUpload={jest.fn()} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper labels for all inputs', () => {
    const { getByLabelText } = render(
      <ContractUploadForm onUpload={jest.fn()} />
    );
    expect(getByLabelText('Contract Title')).toBeInTheDocument();
    expect(getByLabelText('Contract File')).toBeInTheDocument();
  });

  it('should be keyboard navigable', async () => {
    const { getByRole } = render(
      <ContractUploadForm onUpload={jest.fn()} />
    );
    const submitBtn = getByRole('button', { name: /upload/i });
    submitBtn.focus();
    expect(document.activeElement).toBe(submitBtn);
  });
});
```

---

### Layer 8: Performance Testing (Render Performance)

**What**: Detect performance regressions—slow renders, unnecessary re-renders, bundle size.

**Tools**: React Profiler, Lighthouse, webpack-bundle-analyzer

**Cost**: ⏱️ Moderate  
**Coverage**: 🎯 15-20% of bugs (performance regressions)  
**When**: On performance-critical paths, nightly

**Example**:

```typescript
// src/components/ContractList/ContractList.perf.test.tsx
import { render } from '@testing-library/react';
import { Profiler } from 'react';
import { ContractList } from './ContractList';

describe('ContractList Performance', () => {
  it('should render 100 contracts in under 200ms', () => {
    const contracts = Array.from({ length: 100 }, (_, i) => ({
      id: `${i}`,
      title: `Contract ${i}`,
      status: 'pending',
      riskScore: 50,
    }));

    const onRenderCallback = jest.fn();

    render(
      <Profiler id="ContractList" onRender={onRenderCallback}>
        <ContractList contracts={contracts} />
      </Profiler>
    );

    const [, , actualDuration] = onRenderCallback.mock.calls[0];
    expect(actualDuration).toBeLessThan(200);
  });
});
```

---

### Layer 9: Mobile-Specific Testing (React Native)

**What**: Test mobile-specific issues—touch interactions, screen sizes, native APIs.

**Tools**: React Native Testing Library, Detox

**Cost**: ⏱️ Moderate (1-2 seconds)  
**Coverage**: 🎯 30-40% of bugs (mobile-specific issues)  
**When**: On every commit

**Note**: ContractIntel is a web app. This layer applies if a React Native mobile app is added in future.

---

### Layer 10: Visual Regression Testing (Screenshots)

**What**: Screenshot-based testing—compare visual appearance across changes.

**Tools**: Percy, Chromatic (Storybook integration)

**Cost**: 💰 Expensive (SaaS service)  
**Coverage**: 🎯 20-30% of bugs (visual/styling regressions)  
**When**: On every commit (if paid), nightly (if free)

**Storybook + Chromatic** (preferred approach for this project):

```typescript
// src/components/ContractCard/ContractCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ContractCard } from './ContractCard';

const meta: Meta<typeof ContractCard> = {
  title: 'Features/Contracts/ContractCard',
  component: ContractCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ContractCard>;

export const Pending: Story = {
  args: {
    id: '1',
    title: 'Vendor Agreement',
    status: 'pending',
    riskScore: 65,
  },
};

export const HighRisk: Story = {
  args: {
    id: '2',
    title: 'Risky Contract',
    status: 'pending',
    riskScore: 92,
  },
};

export const Approved: Story = {
  args: {
    id: '3',
    title: 'Approved Contract',
    status: 'approved',
    riskScore: 30,
  },
};
```

---

### Layer 11: E2E Testing (Full User Journeys)

**What**: Test complete user workflows—from login to final action.

**Tools**: Cypress, Playwright

**Cost**: ⏱️ Slow (5-30 minutes total)  
**Coverage**: 🎯 70-80% of bugs (user-facing issues)  
**When**: Before deployment, nightly, not on every commit

**Example (Cypress)**:

```typescript
// cypress/e2e/contract-review-workflow.cy.ts
describe('Contract Review Workflow', () => {
  beforeEach(() => {
    cy.visit('http://localhost:3000');
    cy.login('reviewer@example.com', 'password');
  });

  it('should complete full contract review workflow', () => {
    // Upload contract
    cy.contains('Upload Contract').click();
    cy.get('[data-cy=file-upload]').attachFile('vendor-agreement.pdf');
    cy.get('[data-cy=title-input]').type('Vendor Agreement');
    cy.get('[data-cy=submit-btn]').click();

    // Wait for AI analysis
    cy.contains('Analyzing...', { timeout: 60000 }).should('be.visible');
    cy.contains('Analysis Complete', { timeout: 120000 }).should('be.visible');

    // Review flags
    cy.get('[data-cy=flags-list]').should('be.visible');
    cy.get('[data-cy=flag-item]').first().click();
    cy.get('[data-cy=flag-note]').type('Reviewed and acceptable');
    cy.get('[data-cy=resolve-flag-btn]').click();

    // Approve contract
    cy.get('[data-cy=approve-btn]').click();
    cy.get('[data-cy=confirm-approve-btn]').click();

    // Verify approved
    cy.contains('Contract Approved').should('be.visible');
    cy.get('[data-cy=contract-status]').should('contain', 'approved');
  });

  it('should show validation errors for invalid upload', () => {
    cy.contains('Upload Contract').click();
    cy.get('[data-cy=submit-btn]').click();

    cy.contains('Please select a file').should('be.visible');
    cy.url().should('not.include', '/contracts/');
  });
});
```

**Priority**:

1. Critical user journeys (upload → analysis → review → approve)
2. High-value flows (export report, playbook comparison)
3. Error scenarios (network error, invalid file)

**Skip**: Every button click, every input validation (use component tests instead)

---

### Layer 12: Production Monitoring & User Feedback

**What**: Monitor real users, catch bugs in production, gather feedback.

**Tools**: Sentry (errors), LogRocket (session replay), PostHog (analytics)

**Cost**: 💰 Ongoing  
**Coverage**: 🎯 95%+ of bugs (caught by real users)  
**When**: Always (production 24/7)

**Setup**:

```typescript
// src/main.tsx
import * as Sentry from '@sentry/react';

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.MODE,
  tracesSampleRate: 0.1,
  integrations: [
    new Sentry.Replay({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
});

// Wrap app with error boundary
const SentryRoutes = Sentry.withSentryRouting(Routes);
```

---

### Frontend Testing Quick Reference

| Layer          | Test Type          | Tool                  | Speed      |
| -------------- | ------------------ | --------------------- | ---------- |
| 1. Static      | ESLint, TypeScript | `npm run lint`        | ⚡ <1s     |
| 2. Component   | Unit               | React Testing Library | ⚡ <1s     |
| 3. Hooks       | Unit               | `renderHook`          | ⚡ <1s     |
| 4. Integration | Integration        | MSW + RTL             | ⏱️ 1-3s    |
| 5. Snapshot    | Snapshot           | Jest                  | ⚡ <1s     |
| 6. Routing     | Integration        | React Router          | ⏱️ 1-2s    |
| 7. A11y        | Automated + Manual | jest-axe              | ⚡ <1s     |
| 8. Performance | Profiler           | React DevTools        | ⚡ <1s     |
| 9. Mobile      | Unit (RN)          | RN Testing Library    | ⚡ <1s     |
| 10. Visual     | Screenshot         | Chromatic/Percy       | ⏱️ 2-5s    |
| 11. E2E        | Browser automation | Cypress/Playwright    | ⏱️ 5-30m   |
| 12. Production | Monitoring         | Sentry, LogRocket     | 💰 Ongoing |

### Frontend Testing Strategy for ContractIntel

```
Layer 1:  ESLint + TypeScript
          ├─ Component prop types checked
          └─ No implicit any, strict mode

Layer 2:  Component Tests (80%+ coverage)
          ├─ ContractCard (status, risk score, actions)
          ├─ ContractUploadForm (validation, loading)
          ├─ FlagItem (resolve, dismiss, notes)
          ├─ RiskBadge (all severity levels)
          └─ PlaybookComparison (match/mismatch display)

Layer 3:  Hook Tests
          ├─ useContracts (fetch, filter, pagination)
          ├─ useContractDetail (fetch, approve, reject)
          ├─ useFileUpload (upload, progress, error)
          └─ useReferenceData (app-load data)

Layer 4:  Integration Tests (MSW mocking API)
          ├─ Upload flow: select file → upload → processing → results
          ├─ Review flow: load contract → review flags → approve
          └─ Error handling (404, 500, network failure)

Layer 5:  Snapshot Tests
          ├─ RiskBadge (all levels)
          └─ ContractStatusBadge (all statuses)

Layer 6:  Routing Tests
          ├─ Protected routes (unauthenticated → login)
          ├─ URL parameters (/contracts/:id)
          └─ Redirects after login

Layer 7:  Accessibility Tests
          ├─ axe-core automated scan on all pages
          ├─ Keyboard navigation (Tab through all elements)
          └─ Form labels and ARIA attributes

Layer 8:  Performance Tests
          ├─ ContractList render < 200ms (100 items)
          └─ No unnecessary re-renders on filter change

Layer 11: E2E Tests (Cypress)
          ├─ Upload contract → AI analysis → review flags → approve
          ├─ Filter contracts by status/risk
          └─ Export report

Layer 12: Production Monitoring
          ├─ Sentry error tracking
          ├─ LogRocket session replay
          └─ PostHog analytics
```

### Key Rules (Frontend Testing)

1. **Test from the user's perspective** — use `getByRole`, `getByLabelText`, not `getByTestId` where possible
2. **Mock at the API boundary** — use MSW to mock HTTP, not internal functions
3. **Co-locate tests** — `ComponentName.test.tsx` lives next to `ComponentName.tsx`
4. **One story per variant** — every Storybook story is a visual test
5. **Accessibility is not optional** — every component passes axe before merge
6. **E2E tests are expensive** — 1-3 critical journeys only, not every feature
7. **Snapshot tests need review** — never auto-update without checking the diff
8. **Performance budgets** — set render time limits and enforce them in CI

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

## Frontend Architecture Enforcement Checklist

Condensed PR-review checklist. Every frontend task must pass these.

### Component Structure
- [ ] `ComponentName.tsx` — JSX only, max 15 lines, no logic
- [ ] `useComponentName.ts` — all UI logic
- [ ] `ComponentName.module.css` — all styles
- [ ] `ComponentName.test.tsx` — unit tests
- [ ] `ComponentName.stories.tsx` — Storybook story

### 3-Tier API Call Stack
- [ ] UI Hook (`useX.ts`) calls service methods only
- [ ] Service unwraps `ApiResponse<T>` and owns domain shape
- [ ] `httpService.ts` is the ONLY file that imports axios
- [ ] No axios imports outside `httpService.ts`
- [ ] All API URLs defined in `src/api/endpoints.ts`

### API Response Standard
- [ ] Backend returns `{ success, data?, error? }`
- [ ] Service calls `.then(unwrap)` — never returns raw `ApiResponse` to a hook

### Shadcn UI Integration
- [ ] Use Shadcn primitives for Button, Badge, Input, Card, Dialog, Tabs, Checkbox, Dropdown, Tooltip, Skeleton, Toast, Avatar
- [ ] Customise via design tokens, not by rewriting
- [ ] Custom components only for what Shadcn doesn't ship (domain components + layout)

### Centralized Icons
- [ ] All SVG icons live in `src/components/core/icons.tsx`
- [ ] No inline `<svg>` elsewhere
- [ ] Named exports, consistent 24×24 default

### Accessibility
- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥44px on mobile
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation (Tab, Enter, Space, Escape)
- [ ] Colour contrast ≥4.5:1
- [ ] axe DevTools: 0 critical violations; Lighthouse a11y ≥95

### Mobile-First Responsive
- [ ] 320px baseline
- [ ] `min-width` media queries (not `max-width`)
- [ ] Tested on real devices

### Testing
- [ ] Mock at the service boundary, not at axios
- [ ] Hooks tested against mocked services
- [ ] Components tested with mocked hooks
- [ ] One integration test per feature for the full API flow
