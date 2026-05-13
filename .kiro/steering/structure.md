# Project Structure

## Repository Layout

```
contract-intel-v2/
├── apps/
│   ├── backend/              # NestJS API (not yet created)
│   │   ├── src/
│   │   │   ├── modules/      # Feature modules (vertical slices)
│   │   │   │   ├── contracts/
│   │   │   │   ├── documents/
│   │   │   │   ├── analysis/
│   │   │   │   ├── playbook/
│   │   │   │   ├── renewals/
│   │   │   │   ├── audit/
│   │   │   │   └── users/
│   │   │   ├── shared/       # Shared kernel
│   │   │   │   ├── domain/   # Base classes (Entity, ValueObject, AggregateRoot)
│   │   │   │   ├── exceptions/ # Exception hierarchy
│   │   │   │   └── infrastructure/ # Ports (StorageService, OCRService, etc.)
│   │   │   ├── config/       # Configuration service
│   │   │   └── main.ts       # Application entry point
│   │   ├── prisma/
│   │   │   ├── schema.prisma # Database schema
│   │   │   ├── migrations/   # Migration history
│   │   │   └── seed.ts       # Sample data seeder
│   │   ├── test/             # E2E tests
│   │   ├── .env.example      # Environment template
│   │   └── package.json
│   │
│   └── frontend/             # React SPA (not yet created)
│       ├── src/
│       │   ├── pages/        # Page components (route-level)
│       │   │   ├── HomePage/
│       │   │   ├── PortfolioPage/
│       │   │   ├── UploadPage/
│       │   │   ├── ResultsPage/
│       │   │   └── ...
│       │   ├── components/   # Reusable UI components
│       │   │   ├── core/     # Design system components
│       │   │   │   ├── Button/
│       │   │   │   ├── Badge/
│       │   │   │   ├── Card/
│       │   │   │   ├── Modal/
│       │   │   │   ├── TopNav/
│       │   │   │   └── icons.tsx
│       │   │   └── features/ # Feature-specific components
│       │   ├── hooks/        # Custom React hooks
│       │   ├── services/     # API service layer
│       │   │   ├── contractService.ts
│       │   │   ├── analysisService.ts
│       │   │   └── ...
│       │   ├── api/          # HTTP client layer
│       │   │   ├── client.ts       # Axios instance
│       │   │   ├── httpService.ts  # HTTP wrapper (only axios imports)
│       │   │   ├── endpoints.ts    # All API URLs
│       │   │   └── unwrap.ts       # ApiResponse unwrapper
│       │   ├── types/        # TypeScript types
│       │   ├── config/       # Configuration
│       │   │   └── designTokens.ts # Design system tokens
│       │   ├── styles/       # Global styles
│       │   │   └── globals.css
│       │   └── App.tsx       # Root component
│       ├── public/           # Static assets
│       ├── .env.example      # Environment template
│       └── package.json
│
├── .kiro/
│   ├── specs/                # Spec-driven development docs
│   │   └── contract-analysis-platform/
│   │       ├── .config.kiro  # Spec metadata
│   │       ├── requirements.md
│   │       ├── design.md
│   │       └── tasks.md
│   └── steering/             # Project guidance docs (this file)
│       ├── architecture.md   # Architecture guidelines & testing
│       ├── product.md        # Product overview
│       ├── tech.md           # Tech stack & commands
│       └── structure.md      # This file
│
├── USER_STORIES/             # User story documentation
│   └── US-008_Home_Screen.md
│
├── scripts/                  # Utility scripts
│   └── setup.sh
│
├── DESIGN_HANDOFF_PLAN.md    # Design system implementation plan
├── README.md                 # Project README
├── package.json              # Root package.json (workspaces)
├── .prettierrc               # Prettier config
├── .gitignore
└── .DS_Store
```

## Module Organization (Backend)

Each feature module follows **Vertical Slicing** — owns its full stack from domain to infrastructure:

```
src/modules/{feature}/
├── domain/                   # Pure business logic (no framework deps)
│   ├── {feature}.aggregate.ts      # Aggregate root
│   ├── {feature}-id.vo.ts          # Value objects
│   ├── {feature}-status.vo.ts
│   ├── {feature}.events.ts         # Domain events
│   ├── {feature}.factory.ts        # Factory for creating aggregates
│   └── {feature}.repository.ts     # Repository interface (port)
│
├── application/              # Use cases (orchestration)
│   ├── commands/             # Write operations (CQRS)
│   │   ├── create-{feature}.command.ts
│   │   ├── create-{feature}.handler.ts
│   │   ├── update-{feature}.command.ts
│   │   └── update-{feature}.handler.ts
│   ├── queries/              # Read operations (CQRS)
│   │   ├── get-{feature}.query.ts
│   │   ├── get-{feature}.handler.ts
│   │   ├── list-{features}.query.ts
│   │   └── list-{features}.handler.ts
│   └── events/               # Domain event handlers
│       └── {event}.handler.ts
│
├── infrastructure/           # Framework & external concerns
│   ├── prisma-{feature}.repository.ts  # Prisma implementation
│   ├── {feature}.controller.ts         # REST API controller
│   ├── {feature}.module.ts             # NestJS module
│   ├── {feature}.mapper.ts             # Persistence ↔ Domain ↔ DTO
│   └── dtos/                           # API request/response DTOs
│       ├── create-{feature}.dto.ts
│       ├── update-{feature}.dto.ts
│       └── {feature}.response.dto.ts
│
└── __tests__/                # Tests co-located with module
    ├── {feature}.aggregate.spec.ts
    ├── create-{feature}.handler.spec.ts
    └── {feature}.controller.spec.ts
```

## Component Organization (Frontend)

**MANDATORY: Component-Folder Pattern**

Each component lives in its own folder containing ALL related files:

```
src/components/{ComponentName}/
├── ComponentName.tsx           # JSX only (max 15 lines)
├── useComponentName.ts         # All logic (hooks, state, handlers)
├── ComponentName.module.css    # Component-specific styles
├── ComponentName.test.tsx      # Unit tests (Layer 2: Component Unit Tests)
├── ComponentName.stories.tsx   # Storybook story (Layer 10: Visual Regression)
└── index.ts                    # Barrel export (optional)
```

**Rules**:
- JSX file: rendering only, no business logic
- Hook file: all state, effects, handlers, computed values
- CSS file: component-specific styles (Tailwind for utilities)
- Test file: co-located with component (Layer 2 unit tests + Layer 7 a11y tests)
- Story file: all variants, states, sizes for Storybook (visual regression baseline)
- Everything related to the component stays in its folder

**Testing Requirements per Component**:
- **Layer 1 (Static)**: TypeScript strict mode, ESLint checks
- **Layer 2 (Unit)**: Test all variants, sizes, states, props
- **Layer 5 (Snapshot)**: Snapshot tests for visual components
- **Layer 7 (A11y)**: jest-axe for accessibility violations
- **Layer 10 (Visual)**: Storybook stories for all combinations

**Example Structure**:
```
src/components/
├── core/                       # Design system components
│   ├── Button/
│   │   ├── Button.tsx
│   │   ├── useButton.ts
│   │   ├── Button.module.css
│   │   ├── Button.test.tsx
│   │   ├── Button.stories.tsx
│   │   └── index.ts
│   ├── Badge/
│   │   ├── Badge.tsx
│   │   ├── useBadge.ts
│   │   ├── Badge.module.css
│   │   ├── Badge.test.tsx
│   │   ├── Badge.stories.tsx
│   │   └── index.ts
│   └── icons.tsx               # Centralized SVG icons
│
└── features/                   # Feature-specific components
    ├── ContractCard/
    │   ├── ContractCard.tsx
    │   ├── useContractCard.ts
    │   ├── ContractCard.module.css
    │   ├── ContractCard.test.tsx
    │   ├── ContractCard.stories.tsx
    │   └── index.ts
    └── FlagItem/
        ├── FlagItem.tsx
        ├── useFlagItem.ts
        ├── FlagItem.module.css
        ├── FlagItem.test.tsx
        ├── FlagItem.stories.tsx
        └── index.ts
```

**Import Pattern**:
```typescript
// ✅ DO: Import from component folder
import { Button } from '@/components/core/Button';
import { ContractCard } from '@/components/features/ContractCard';

// ❌ DON'T: Import from parent folder
import { Button } from '@/components/core';
```

## API Layer Organization (Frontend)

Three-tier architecture for API calls:

```
src/
├── hooks/                    # UI Hooks (Layer 1)
│   ├── useContracts.ts       # Calls contractService
│   ├── useAnalysis.ts        # Calls analysisService
│   └── ...
│
├── services/                 # Service Layer (Layer 2)
│   ├── contractService.ts    # Domain logic, calls httpService
│   ├── analysisService.ts
│   └── ...
│
└── api/                      # HTTP Layer (Layer 3)
    ├── client.ts             # Axios instance only
    ├── httpService.ts        # HTTP wrapper (only file that imports axios)
    ├── endpoints.ts          # All API URL constants
    └── unwrap.ts             # ApiResponse<T> unwrapper utility
```

**Flow**: `useContracts` → `contractService` → `httpService` → `axios`

## Shared Kernel (Backend)

Cross-cutting concerns shared by all modules:

```
src/shared/
├── domain/                   # Base domain classes
│   ├── entity.ts             # Base Entity class
│   ├── value-object.ts       # Base ValueObject class
│   ├── aggregate-root.ts     # Base AggregateRoot class
│   ├── domain-event.ts       # Base DomainEvent class
│   └── result.ts             # Result<T> pattern for error handling
│
├── exceptions/               # Exception hierarchy
│   ├── app-error.ts          # Base AppError class
│   ├── domain-exception.ts   # Business rule violations
│   ├── application-exception.ts  # Use case failures
│   └── infrastructure-exception.ts  # External service failures
│
└── infrastructure/           # Infrastructure ports (interfaces)
    ├── storage.service.ts    # File storage abstraction
    ├── ocr.service.ts        # OCR abstraction
    ├── queue.service.ts      # Job queue abstraction
    ├── secrets.service.ts    # Secrets management abstraction
    └── logger.service.ts     # Logging abstraction
```

## Design System (Frontend)

All design tokens centralized:

```
src/config/
└── designTokens.ts           # Single source of truth
    ├── colors                # Brand, semantic, neutral
    ├── darkColors            # Dark mode palette
    ├── typography            # Font families, sizes, weights
    ├── spacing               # xs, sm, md, lg, xl, xxl
    ├── shadows               # sm, md, lg, xl
    ├── borderRadius          # none, sm, md, lg, full
    ├── zIndex                # Layering system
    └── breakpoints           # mobile, tablet, desktop, wide
```

**Integration**: Tailwind config imports and uses these tokens

## Naming Conventions

### Backend
- **Aggregates**: PascalCase, singular (e.g., `Contract`, `Document`)
- **Value Objects**: PascalCase with suffix (e.g., `ContractId`, `RiskScore`)
- **Commands**: PascalCase with verb (e.g., `CreateContractCommand`)
- **Queries**: PascalCase with verb (e.g., `GetContractQuery`)
- **Events**: PascalCase, past tense (e.g., `ContractCreatedEvent`)
- **Handlers**: PascalCase with suffix (e.g., `CreateContractHandler`)
- **DTOs**: PascalCase with suffix (e.g., `CreateContractDto`)
- **Files**: kebab-case (e.g., `contract.aggregate.ts`)

### Frontend
- **Components**: PascalCase (e.g., `Button`, `ContractCard`)
- **Hooks**: camelCase with `use` prefix (e.g., `useContracts`, `useButton`)
- **Services**: camelCase with suffix (e.g., `contractService`)
- **Types**: PascalCase (e.g., `Contract`, `RiskFlag`)
- **Files**: PascalCase for components, camelCase for others

## Key Directories

### Backend
- `src/modules/`: Feature modules (vertical slices)
- `src/shared/`: Shared kernel (domain base classes, exceptions, ports)
- `src/config/`: Configuration service
- `prisma/`: Database schema and migrations
- `test/`: E2E tests

### Frontend
- `src/pages/`: Route-level page components
- `src/components/core/`: Design system components (Button, Badge, Card, etc.)
- `src/components/features/`: Feature-specific components
- `src/hooks/`: Custom React hooks
- `src/services/`: API service layer
- `src/api/`: HTTP client layer
- `src/config/`: Design tokens and configuration
- `src/types/`: TypeScript type definitions

## File Naming Patterns

### Backend
- Aggregates: `{feature}.aggregate.ts`
- Value Objects: `{feature}-{name}.vo.ts`
- Commands: `{action}-{feature}.command.ts`
- Handlers: `{action}-{feature}.handler.ts`
- Queries: `{action}-{feature}.query.ts`
- Events: `{feature}-{event}.event.ts`
- DTOs: `{action}-{feature}.dto.ts`
- Repositories: `{feature}.repository.ts` (interface), `prisma-{feature}.repository.ts` (implementation)

### Frontend
- Components: `{ComponentName}.tsx`
- Hooks: `use{ComponentName}.ts`
- Styles: `{ComponentName}.module.css`
- Tests: `{ComponentName}.test.tsx`
- Stories: `{ComponentName}.stories.tsx`
- Services: `{feature}Service.ts`

## Current State

**Status**: Project structure defined, implementation not yet started

**Next Steps**:
1. Create `apps/backend/` and `apps/frontend/` directories
2. Initialize NestJS backend with Clean Architecture structure
3. Initialize React frontend with Vite + TailwindCSS
4. Implement design system components (US-001 to US-007)
5. Implement core screens (US-008 onwards)

**Existing Files**:
- Design handoff plan with 27 user stories
- Spec documents (requirements, design, tasks) in `.kiro/specs/contract-analysis-platform/`
- Sample user story (US-008 Home Screen) in `USER_STORIES/`
- Architecture guidelines in `.kiro/steering/architecture.md`
