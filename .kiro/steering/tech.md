# Tech Stack & Build System

## Architecture

**Pattern**: Clean Architecture + DDD + CQRS + Vertical Slicing + Ports & Adapters

**Monorepo Structure**: npm workspaces with separate backend and frontend apps

## Backend Stack

- **Framework**: NestJS 10 + TypeScript
- **ORM**: Prisma
- **Database**: SQLite (local dev), PostgreSQL (Railway demo, GCP Cloud SQL production)
- **Authentication**: Auth0 (hosted Universal Login, Authorization Code Flow)
- **CQRS**: @nestjs/cqrs (commands mutate, queries read directly)
- **Logging**: pino + nestjs-pino (JSON in production, pretty in dev)
- **Validation**: class-validator + class-transformer
- **API Docs**: @nestjs/swagger (OpenAPI)
- **Testing**: Jest + Supertest

## Frontend Stack

- **Framework**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: TailwindCSS + Design Tokens
- **State Management**: 
  - React Query (server state / data fetching)
  - Redux Toolkit (complex shared state) or React Context (simple local state)
- **HTTP Client**: Axios (with response unwrapping interceptor)
- **Forms**: Formik + Yup
- **Routing**: React Router v6
- **Testing**: Vitest + React Testing Library
- **Component Development**: Storybook

## Infrastructure & External Services

| Service | Local Dev | Railway Demo | GCP Production |
|---------|-----------|--------------|----------------|
| Storage | Local filesystem | GCS bucket | GCS bucket |
| OCR | Mock | Google Document AI | Google Document AI |
| AI | Claude API | Claude API | Claude API |
| Queue | In-memory | pg-boss | BullMQ + Memorystore Redis |
| Secrets | .env file | Railway env vars | GCP Secret Manager |
| Logging | pino-pretty | JSON | JSON → Cloud Logging |

**Observability**:
- Backend APM: Dynatrace (OneAgent)
- Frontend APM: LogRocket (session replay + error tracking)
- Analytics: PostHog (product analytics + feature flags)

**Resilience**: cockatiel (retry + circuit breaker + timeout for external APIs)

## Common Commands

### Installation
```bash
# Install all dependencies (root + workspaces)
npm install
```

### Development
```bash
# Run both backend and frontend concurrently
npm run dev

# Run backend only (http://localhost:3000)
npm run dev:backend

# Run frontend only (http://localhost:5173)
npm run dev:frontend
```

### Backend-Specific Commands
```bash
cd apps/backend

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Create new migration
npm run prisma:migrate:dev

# Open Prisma Studio (DB GUI)
npm run prisma:studio

# Seed database
npm run prisma:seed
```

### Testing
```bash
# Run all tests (all workspaces)
npm test

# Backend tests only
npm test --workspace=apps/backend

# Frontend tests only
npm test --workspace=apps/frontend

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage

# Integration tests
npm run test:integration

# API tests
npm run test:api

# E2E tests
npm run test:e2e

# E2E tests (headed mode - with browser visible)
npm run test:e2e -- --headed

# Accessibility tests
npm run test:a11y

# Performance tests
npm run test:perf

# All tests (full suite)
npm run test:all
```

### Testing by Layer (12-Layer Architecture)

#### Layer 1: Static Analysis
```bash
# ESLint
npm run lint

# TypeScript type checking
npm run type-check

# Both
npm run lint && npm run type-check
```

#### Layer 2-3: Unit Tests (Components + Hooks)
```bash
# Run unit tests
npm test

# Watch mode (re-run on file change)
npm test -- --watch

# Coverage report
npm test -- --coverage

# Specific test file
npm test ComponentName.test.tsx
```

#### Layer 4: Integration Tests
```bash
# Backend integration tests (real database)
cd apps/backend
npm run test:integration

# Frontend integration tests (MSW mocking)
cd apps/frontend
npm run test:integration
```

#### Layer 5: API Tests
```bash
# Backend API tests (Supertest)
cd apps/backend
npm run test:api
```

#### Layer 6: E2E Tests
```bash
# Run E2E tests (Cypress/Playwright)
npm run test:e2e

# Run E2E tests with browser visible
npm run test:e2e -- --headed

# Run specific E2E test
npm run test:e2e -- --spec "cypress/e2e/contract-workflow.cy.ts"
```

#### Layer 7: Accessibility Tests
```bash
# Run accessibility tests (axe-core + Lighthouse)
npm run test:a11y

# Lighthouse CI
npm run lighthouse
```

#### Layer 8: Performance Tests
```bash
# Frontend performance tests
npm run test:perf

# Backend load tests (k6)
k6 run test/load-test.js
```

#### Layer 9: Security Tests
```bash
# Dependency scanning
npm audit

# Detailed vulnerability analysis
snyk test

# Secret scanning
trufflehog filesystem . --json

# SAST (SonarQube)
sonar-scanner
```

#### Layer 10: Visual Regression Tests
```bash
# Run Storybook
npm run storybook

# Build Storybook
npm run build-storybook

# Visual regression (Chromatic)
npx chromatic --project-token=$CHROMATIC_TOKEN
```

### Testing Quick Reference

| Layer | Command | When | Speed |
|-------|---------|------|-------|
| 1. Static | `npm run lint && npm run type-check` | On save | ⚡ <1s |
| 2. Unit | `npm test` | On commit | ⚡ <5s |
| 3. Hooks | `npm test` | On commit | ⚡ <5s |
| 4. Integration | `npm run test:integration` | On commit | ⏱️ <60s |
| 5. API | `npm run test:api` | On commit | ⏱️ <60s |
| 6. E2E | `npm run test:e2e` | Before deploy | ⏱️ 5-30m |
| 7. A11y | `npm run test:a11y` | On commit | ⚡ <1s |
| 8. Performance | `npm run test:perf` | Nightly | ⏱️ <60s |
| 9. Security | `npm audit` | On commit | ⏱️ <10s |
| 10. Visual | `npm run storybook` | On PR merge | ⏱️ 2-5s |

### Linting & Formatting
```bash
# Lint all workspaces
npm run lint

# Format all files with Prettier
npm run format

# Auto-fix linting issues
npm run lint -- --fix
```

### Building
```bash
# Build all workspaces
npm run build

# Build backend only
npm run build --workspace=apps/backend

# Build frontend only
npm run build --workspace=apps/frontend
```

### API Documentation
```bash
# Start backend in dev mode
npm run dev:backend

# Open Swagger docs
open http://localhost:3000/api/docs
```

### Storybook (Frontend Component Development)
```bash
cd apps/frontend

# Run Storybook
npm run storybook

# Build static Storybook site
npm run build-storybook
```

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL="file:./dev.db"  # SQLite for local dev

# Auth0
AUTH0_DOMAIN="your-tenant.auth0.com"
AUTH0_CLIENT_ID="..."
AUTH0_CLIENT_SECRET="..."
AUTH0_AUDIENCE="..."

# Claude API
CLAUDE_API_KEY="sk-ant-..."

# Google Document AI
GCP_PROJECT_ID="..."
GCP_PROCESSOR_ID="..."

# Infrastructure Drivers
STORAGE_DRIVER="local"  # local | gcs
OCR_DRIVER="mock"       # mock | google-document-ai
QUEUE_DRIVER="memory"   # memory | pg-boss | bullmq
SECRETS_DRIVER="env"    # env | gcp-secret-manager
LOGGER_DRIVER="console" # console | pino

# GCP (production only)
GCS_BUCKET_NAME="..."
REDIS_URL="..."
```

### Frontend (.env)
```bash
VITE_API_BASE_URL="http://localhost:3000/api/v1"
VITE_AUTH0_DOMAIN="your-tenant.auth0.com"
VITE_AUTH0_CLIENT_ID="..."
VITE_POSTHOG_KEY="..."
VITE_LOGROCKET_APP_ID="..."
```

## Key Architectural Patterns

### Backend Module Structure (Vertical Slice)
```
src/modules/{feature}/
  domain/              # Pure domain logic (no framework deps)
    {feature}.aggregate.ts
    {feature}-id.vo.ts
    {feature}.events.ts
    {feature}.factory.ts
    {feature}.repository.ts  # Interface (port)
  application/         # Use cases
    commands/
      {action}.command.ts
      {action}.handler.ts
    queries/
      {action}.query.ts
      {action}.handler.ts
    events/
      {event}.handler.ts
  infrastructure/      # Framework & external concerns
    prisma-{feature}.repository.ts
    {feature}.controller.ts
    {feature}.module.ts
    {feature}.mapper.ts
    dtos/
```

### Frontend Component Structure
```
src/components/{ComponentName}/
  ComponentName.tsx           # JSX only (max 15 lines)
  useComponentName.ts         # All logic (hooks, state, handlers)
  ComponentName.module.css    # Styles
  ComponentName.test.tsx      # Tests
  ComponentName.stories.tsx   # Storybook story
```

### Frontend API Call Stack (3-Tier)
```
UI Hook (useX.ts) 
  → Service (src/services/) 
    → httpService (src/api/httpService.ts) 
      → Axios (client.ts)
```

**Rules**:
- Hooks call service methods only (no direct axios)
- Services own domain shape, unwrap `ApiResponse<T>`
- httpService is the only file that imports axios
- All API URLs defined in `src/api/endpoints.ts`

## Design System Integration

**Design Tokens**: All colors, spacing, typography, shadows, border-radius defined in `src/config/designTokens.ts`

**Tailwind Config**: Wired to design tokens for consistent theming

**Mobile-First**: Start with 320px baseline, progressively enhance with `min-width` media queries

**Accessibility**: Built-in from day 1 (focus indicators, touch targets ≥44px, ARIA labels, keyboard nav, contrast ≥4.5:1)

## Deployment

### Railway (Demo)
```bash
railway up
```

### GCP Cloud Run (Production)
```bash
# Build
npm run build

# Deploy API
gcloud run deploy contract-intel-api --source ./apps/backend

# Deploy Frontend
gcloud run deploy contract-intel-web --source ./apps/frontend
```

## Node Version Requirements

- **Node.js**: >= 20.0.0
- **npm**: >= 10.0.0

Check with:
```bash
node --version
npm --version
```
