# Implementation Plan: Contract Analysis Platform

## Progress Summary

**Phase 1: Scaffolding & Cross-Cutting Concerns** — 2/8 tasks completed
- ✅ Task 1.1: Project Structure Setup (Commit: aec01ef)
- ✅ Task 1.2: Shared Kernel Tests (Commit: 6d4383f)
- ⏳ Task 1.3: Exception Hierarchy Tests
- ⏳ Task 1.4: Prisma Schema & Database Setup
- ⏳ Task 1.5: Configuration Service Tests
- ⏳ Task 1.6: Logging Infrastructure
- ⏳ Task 1.7: API Response Envelope Tests
- ⏳ Task 1.8: Testing Infrastructure

**Completed Work**:
- 33 files created (19 backend, 14 frontend)
- 1,347 lines of scaffolding code
- 5 source files + 5 test files (102+ test assertions)
- All following Clean Architecture + DDD + CQRS + Vertical Slicing patterns

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
- [x] Backend: NestJS project with TypeScript, Prisma, Jest
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

## Phase 2: Design System Implementation (From Wireframes)

### Task 2.1: Design Tokens Setup
**Goal**: Extract and implement design tokens from wireframes

**Deliverables**:
- [ ] `designTokens.ts` with all color definitions from `tokens.js`
  - Background colors: bg, bgAlt, surface, surfaceAlt
  - Text colors: ink, inkMid, inkSoft, inkMute
  - Border colors: border, borderMid
  - Accent colors: blue, blueDark, blueLight, blueMid
  - Semantic colors: green, orange, red (with dark, bg, border variants)
  - Nav colors: nav, navBorder
- [ ] Risk threshold functions: riskColor(), riskBg(), riskLabel(), riskShort()
- [ ] Severity functions: sevColor(), sevBg()
- [ ] Typography tokens (DM Sans, DM Mono)
- [ ] Spacing scale (xs, sm, md, lg, xl, xxl)
- [ ] Border radius scale (none, sm, md, lg, full)
- [ ] Shadow scale (sm, md, lg, xl)
- [ ] Breakpoints (mobile: 420px, sm: 640px, md: 860px, lg: 1100px)

**Files**:
```
frontend/src/config/
└── designTokens.ts
```

**Requirements**: Foundation for all UI components

---

### Task 2.2: Core UI Components (From Wireframes)
**Goal**: Implement reusable components matching wireframe designs using Shadcn UI as base

**Component Structure** (applies to ALL components):
- **ComponentName.tsx**: JSX only, max 15 lines, no logic
- **useComponentName.ts**: All UI logic (hooks, state, handlers)
- **ComponentName.module.css**: All styles
- **ComponentName.test.tsx**: Unit tests
- **ComponentName.stories.tsx**: Storybook story

---

#### Sub-Task 2.2.1: Button Component (Mobile-First)
**Goal**: Build accessible, responsive Button component

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Touch target: 48px minimum height
  - Padding: 12px 16px
  - Font size: 14px
  - Full-width on mobile by default
- [ ] **Tablet Design (640px-1024px)**
  - Touch target: 44px minimum height
  - Padding: 10px 16px
  - Font size: 14px
  - Auto-width (not full-width)
- [ ] **Desktop Design (1024px+)**
  - Touch target: 40px minimum height
  - Padding: 8px 16px
  - Font size: 14px
  - Hover states visible
- [ ] **Base: Shadcn UI Button component**
- [ ] **Variants**: primary, secondary, ghost, danger, success, dark
- [ ] **Sizes**: sm, md, lg (responsive sizing)
- [ ] **Props**: disabled, full, onClick
- [ ] **Accessibility**:
  - Focus indicators: 3px outline, visible
  - ARIA labels for icon-only buttons
  - Keyboard navigation (Tab, Enter, Space)
  - Color contrast ≥4.5:1
- [ ] **Testing**:
  - Unit tests for all variants
  - Storybook stories for all states
  - Test on iPhone (portrait + landscape)
  - Test on Android phone
  - Test on iPad
  - Test on desktop with keyboard
  - Screen reader tested (VoiceOver/NVDA)
  - axe DevTools: 0 violations
  - Lighthouse a11y: ≥95

**Definition of Done**: Button works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.2.2: Badge Component (Mobile-First)
**Goal**: Build accessible Badge component

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Font size: 11px
  - Padding: 4px 8px
  - Border radius: 4px
- [ ] **Tablet/Desktop Design (640px+)**
  - Font size: 11px
  - Padding: 4px 8px
  - Border radius: 4px
- [ ] **Base: Shadcn UI Badge component**
- [ ] **Props**: label, color, bg, border, dot
- [ ] **Inline-flex layout** with optional dot indicator
- [ ] **Accessibility**:
  - Color contrast ≥4.5:1
  - ARIA label if dot-only
- [ ] **Testing**:
  - Unit tests for all variants
  - Storybook stories
  - Test on mobile, tablet, desktop
  - Color contrast verified
  - axe DevTools: 0 violations

**Definition of Done**: Badge works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.2.3: RiskBadge Component (Mobile-First)
**Goal**: Build accessible RiskBadge component

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Small size: 16px font, 24px height
  - Large size: 18px font, 28px height
  - DM Mono font
- [ ] **Tablet/Desktop Design (640px+)**
  - Small size: 14px font, 22px height
  - Large size: 16px font, 26px height
  - DM Mono font
- [ ] **Sizes**: sm, lg
- [ ] **Displays risk score** with colored dot
- [ ] **Color determined by risk threshold**
- [ ] **Accessibility**:
  - Color contrast ≥4.5:1
  - ARIA label: "Risk score: 72 out of 100"
- [ ] **Testing**:
  - Unit tests for all risk levels
  - Storybook stories
  - Test on mobile, tablet, desktop
  - Color contrast verified
  - Screen reader announces score
  - axe DevTools: 0 violations

**Definition of Done**: RiskBadge works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.2.4: TypePill Component (Mobile-First)
**Goal**: Build accessible TypePill component

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Font size: 11px
  - Padding: 4px 10px
  - Border radius: 12px
- [ ] **Tablet/Desktop Design (640px+)**
  - Font size: 11px
  - Padding: 4px 10px
  - Border radius: 12px
- [ ] **Maps contract types to colors**
  - Types: vendor, license, partnership, customer, lease, nda
  - Capitalized text
- [ ] **Accessibility**:
  - Color contrast ≥4.5:1
  - ARIA label: "Contract type: Vendor Agreement"
- [ ] **Testing**:
  - Unit tests for all types
  - Storybook stories
  - Test on mobile, tablet, desktop
  - Color contrast verified
  - axe DevTools: 0 violations

**Definition of Done**: TypePill works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.2.5: RiskBar Component (Mobile-First)
**Goal**: Build accessible RiskBar component

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Bar: 60px × 5px
  - Score: 14px DM Mono
  - Vertical layout (bar above score)
- [ ] **Tablet/Desktop Design (640px+)**
  - Bar: 72px × 5px
  - Score: 14px DM Mono
  - Horizontal layout (bar + score inline)
- [ ] **Horizontal progress bar**
- [ ] **Filled portion colored by risk level**
- [ ] **Score displayed in DM Mono**
- [ ] **Accessibility**:
  - ARIA label: "Risk score: 72 out of 100"
  - ARIA role="progressbar"
  - aria-valuenow, aria-valuemin, aria-valuemax
- [ ] **Testing**:
  - Unit tests for all risk levels
  - Storybook stories
  - Test on mobile, tablet, desktop
  - Screen reader announces score
  - axe DevTools: 0 violations

**Definition of Done**: RiskBar works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.2.6: FlagsSummary Component (Mobile-First)
**Goal**: Build accessible FlagsSummary component

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Dots: 6px diameter
  - Spacing: 4px between dots
  - Font: 12px DM Mono
  - Vertical layout if needed
- [ ] **Tablet/Desktop Design (640px+)**
  - Dots: 6px diameter
  - Spacing: 4px between dots
  - Font: 12px DM Mono
  - Horizontal layout
- [ ] **Inline dots + counts** for red/orange/green flags
- [ ] **Shows "—"** if no red/orange flags
- [ ] **DM Mono font** for numbers
- [ ] **Accessibility**:
  - Color contrast ≥4.5:1
  - ARIA label: "3 critical flags, 5 medium flags, 2 low flags"
  - Screen reader announces counts
- [ ] **Testing**:
  - Unit tests for all flag combinations
  - Storybook stories
  - Test on mobile, tablet, desktop
  - Screen reader announces counts
  - axe DevTools: 0 violations

**Definition of Done**: FlagsSummary works on all devices, fully accessible, all tests pass

---

**Files**:
```
frontend/src/components/core/
├── Button/
│   ├── Button.tsx          # JSX only, max 15 lines
│   ├── useButton.ts        # All logic
│   ├── Button.module.css   # Styles
│   ├── Button.test.tsx     # Tests
│   └── Button.stories.tsx  # Storybook
├── Badge/
│   ├── Badge.tsx
│   ├── useBadge.ts
│   ├── Badge.module.css
│   ├── Badge.test.tsx
│   └── Badge.stories.tsx
├── RiskBadge/
│   ├── RiskBadge.tsx
│   ├── useRiskBadge.ts
│   ├── RiskBadge.module.css
│   ├── RiskBadge.test.tsx
│   └── RiskBadge.stories.tsx
├── TypePill/
│   ├── TypePill.tsx
│   ├── useTypePill.ts
│   ├── TypePill.module.css
│   ├── TypePill.test.tsx
│   └── TypePill.stories.tsx
├── RiskBar/
│   ├── RiskBar.tsx
│   ├── useRiskBar.ts
│   ├── RiskBar.module.css
│   ├── RiskBar.test.tsx
│   └── RiskBar.stories.tsx
├── FlagsSummary/
│   ├── FlagsSummary.tsx
│   ├── useFlagsSummary.ts
│   ├── FlagsSummary.module.css
│   ├── FlagsSummary.test.tsx
│   └── FlagsSummary.stories.tsx
└── icons.tsx               # All SVG icons centralized
```

**Overall Accessibility Requirements** (ALL components):
- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥44px on mobile, ≥40px on desktop
- [ ] ARIA labels on icon buttons
- [ ] Keyboard navigation (Tab, Enter, Space)
- [ ] Color contrast ≥4.5:1
- [ ] Screen reader tested (VoiceOver on iOS/macOS, NVDA on Windows)
- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y score: ≥95

**Overall Testing Requirements** (ALL components):
- [ ] Unit tests for all variants/states
- [ ] Storybook stories for visual testing
- [ ] Test on real iPhone (portrait + landscape)
- [ ] Test on real Android phone
- [ ] Test on real iPad
- [ ] Test on desktop monitor
- [ ] Test at 100%, 150%, 200% zoom
- [ ] Keyboard navigation tested
- [ ] Screen reader tested

**Requirements**: US-001 to US-007 (Design System Foundation)

---

### Task 2.2.5: Centralized Icons
**Goal**: Create single source of truth for all SVG icons

**Deliverables**:
- [ ] **src/components/core/icons.tsx**: All SVG icons as React components
  ```typescript
  export const UploadIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* SVG path */}
    </svg>
  );
  
  export const CheckIcon = () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
      {/* SVG path */}
    </svg>
  );
  
  // ... all other icons
  ```

**Rules**:
- [ ] All SVG icons in one file
- [ ] No inline SVGs in components
- [ ] Consistent sizing (24×24 default)
- [ ] Accessible (aria-hidden="true" on decorative icons)
- [ ] Named exports (not default)

**Files**:
```
frontend/src/components/core/
└── icons.tsx                  # All SVG icons centralized
```

**Requirements**: Frontend architecture guidelines

---

### Task 2.3: Layout Components (From Wireframes)
**Goal**: Implement navigation and page layout components

**Component Structure** (applies to ALL components):
- **ComponentName.tsx**: JSX only, max 15 lines, no logic
- **useComponentName.ts**: All UI logic (hooks, state, handlers)
- **ComponentName.module.css**: All styles
- **ComponentName.test.tsx**: Unit tests
- **ComponentName.stories.tsx**: Storybook story

---

#### Sub-Task 2.3.1: TopNav Component (Mobile-First)
**Goal**: Build accessible, responsive navigation

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Height: 56px, sticky, z-index 200
  - Logo box (28×28, blue background, rounded 7px)
  - Hamburger menu button (≥48px touch target)
  - User avatar (32×32, initials "JW")
  - Mobile drawer (slides down, full-width)
  - Close button in drawer (≥48px touch target)
- [ ] **Tablet Design (640px-1024px)**
  - Height: 56px, sticky
  - Logo + partial nav links
  - Hamburger menu for overflow items
  - "+ Upload" button visible
  - User avatar (32×32)
- [ ] **Desktop Design (1024px+)**
  - Height: 56px, sticky
  - Logo + full center nav links with active state
  - "+ Upload" button + user avatar (32×32)
  - No hamburger menu
  - Hover states visible
- [ ] **Accessibility**:
  - Skip link to main content (visible on focus)
  - Hamburger button: aria-label="Open menu", aria-expanded
  - Mobile drawer: role="navigation", aria-label="Main navigation"
  - Focus trap in mobile drawer when open
  - Escape key closes drawer
  - Focus returns to hamburger on close
  - Keyboard navigation (Tab, Enter, Escape)
  - Focus indicators visible (3px outline)
- [ ] **Testing**:
  - Unit tests for menu open/close
  - Storybook stories for all states
  - Test on iPhone (portrait + landscape)
  - Test on Android phone
  - Test on iPad
  - Test on desktop with keyboard
  - Screen reader tested (VoiceOver/NVDA)
  - axe DevTools: 0 violations
  - Lighthouse a11y: ≥95

**Definition of Done**: TopNav works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.3.2: PageShell Component (Mobile-First)
**Goal**: Build responsive page layout container

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Title: 18px weight 700
  - Subtitle: 13px
  - Action buttons: stack vertically, full-width
  - Body padding: 16px
- [ ] **Tablet Design (640px-1024px)**
  - Title: 20px weight 700
  - Subtitle: 14px
  - Action buttons: horizontal, auto-width
  - Body padding: 24px
- [ ] **Desktop Design (1024px+)**
  - Title: 22px weight 700
  - Subtitle: 14px
  - Action buttons: horizontal, auto-width
  - Body padding: 32px
- [ ] **Header bar**: background white, border-bottom
- [ ] **Body**: flex 1, overflow auto, background #FAFAF9
- [ ] **noPad prop** to disable body padding
- [ ] **Semantic HTML**: <main>, <header>
- [ ] **Accessibility**:
  - Semantic HTML structure
  - ARIA landmarks (main, header)
- [ ] **Testing**:
  - Unit tests for all props
  - Storybook stories
  - Test on mobile, tablet, desktop
  - axe DevTools: 0 violations

**Definition of Done**: PageShell works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.3.3: SectionLabel Component (Mobile-First)
**Goal**: Build accessible section heading

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Font: 10px weight 700, uppercase
  - Letter-spacing: 0.08em
  - Color: #94A3B8 (muted)
  - Margin-bottom: 8px
- [ ] **Tablet/Desktop Design (640px+)**
  - Font: 11px weight 700, uppercase
  - Letter-spacing: 0.08em
  - Color: #94A3B8 (muted)
  - Margin-bottom: 10px
- [ ] **Semantic HTML**: <h2>, <h3> (configurable)
- [ ] **Accessibility**:
  - Proper heading hierarchy
  - Color contrast ≥4.5:1
- [ ] **Testing**:
  - Unit tests
  - Storybook stories
  - Test on mobile, tablet, desktop
  - axe DevTools: 0 violations

**Definition of Done**: SectionLabel works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.3.4: Divider Component (Mobile-First)
**Goal**: Build accessible divider

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Height: 1px, background: #E2E8F0
  - Vertical margin: 12px (configurable)
- [ ] **Tablet/Desktop Design (640px+)**
  - Height: 1px, background: #E2E8F0
  - Vertical margin: 16px (configurable)
- [ ] **ARIA role="separator"**
- [ ] **Testing**:
  - Unit tests
  - Storybook stories
  - Test on mobile, tablet, desktop
  - axe DevTools: 0 violations

**Definition of Done**: Divider works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.3.5: StatCard Component (Mobile-First)
**Goal**: Build accessible stat card

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Background: white, border, border-radius: 8px
  - Padding: 16px
  - Label: 10px weight 700 uppercase
  - Value: 24px weight 800, DM Mono
  - Sub-text: 11px
- [ ] **Tablet/Desktop Design (640px+)**
  - Background: white, border, border-radius: 10px
  - Padding: 20px
  - Label: 11px weight 700 uppercase
  - Value: 28px weight 800, DM Mono
  - Sub-text: 12px
- [ ] **Optional color prop** for value text
- [ ] **Accessibility**:
  - Color contrast ≥4.5:1
  - ARIA label: "Active contracts: 127"
  - Semantic HTML
- [ ] **Testing**:
  - Unit tests for all variants
  - Storybook stories
  - Test on mobile, tablet, desktop
  - Color contrast verified
  - Screen reader announces stat
  - axe DevTools: 0 violations

**Definition of Done**: StatCard works on all devices, fully accessible, all tests pass

---

**Files**:
```
frontend/src/components/core/
├── TopNav/
│   ├── TopNav.tsx          # JSX only, max 15 lines
│   ├── useTopNav.ts        # All logic (menu state, navigation)
│   ├── TopNav.module.css   # Styles
│   ├── TopNav.test.tsx     # Tests
│   └── TopNav.stories.tsx  # Storybook
├── PageShell/
│   ├── PageShell.tsx
│   ├── usePageShell.ts
│   ├── PageShell.module.css
│   ├── PageShell.test.tsx
│   └── PageShell.stories.tsx
├── SectionLabel/
│   ├── SectionLabel.tsx
│   ├── useSectionLabel.ts
│   ├── SectionLabel.module.css
│   ├── SectionLabel.test.tsx
│   └── SectionLabel.stories.tsx
├── Divider/
│   ├── Divider.tsx
│   ├── useDivider.ts
│   ├── Divider.module.css
│   ├── Divider.test.tsx
│   └── Divider.stories.tsx
└── StatCard/
    ├── StatCard.tsx
    ├── useStatCard.ts
    ├── StatCard.module.css
    ├── StatCard.test.tsx
    └── StatCard.stories.tsx
```

**Overall Accessibility Requirements** (ALL components):
- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- [ ] ARIA labels where needed
- [ ] Keyboard navigation (Tab, Enter, Escape)
- [ ] Color contrast ≥4.5:1
- [ ] Semantic HTML
- [ ] Screen reader tested (VoiceOver on iOS/macOS, NVDA on Windows)
- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y score: ≥95

**Overall Testing Requirements** (ALL components):
- [ ] Unit tests for all states
- [ ] Storybook stories for visual testing
- [ ] Test on real iPhone (portrait + landscape)
- [ ] Test on real Android phone
- [ ] Test on real iPad
- [ ] Test on desktop monitor
- [ ] Test at 100%, 150%, 200% zoom
- [ ] Keyboard navigation tested
- [ ] Screen reader tested

**Requirements**: US-005 (Layout Components)

---

### Task 2.4: Modal & Tabs Components (From Wireframes)
**Goal**: Implement modal dialog and tab navigation

**Component Structure** (applies to ALL components):
- **ComponentName.tsx**: JSX only, max 15 lines, no logic
- **useComponentName.ts**: All UI logic (hooks, state, handlers)
- **ComponentName.module.css**: All styles
- **ComponentName.test.tsx**: Unit tests
- **ComponentName.stories.tsx**: Storybook story

---

#### Sub-Task 2.4.1: Modal Component (Mobile-First)
**Goal**: Build accessible, responsive modal dialog

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Fixed overlay: rgba(0,0,0,0.4)
  - Panel: full-width minus 16px margin, max-height 90vh
  - Background: white, border-radius: 12px
  - Header padding: 16px
  - Body padding: 16px
  - Title: 14px weight 700
  - Close button: top-right, ≥48px touch target
  - Scroll body if content overflows
- [ ] **Tablet Design (640px-1024px)**
  - Panel: max-width 600px, centered
  - Header padding: 20px
  - Body padding: 20px
  - Title: 15px weight 700
  - Close button: ≥44px touch target
- [ ] **Desktop Design (1024px+)**
  - Panel: max-width 480px (configurable), centered
  - Header padding: 24px
  - Body padding: 24px
  - Title: 15px weight 700
  - Close button: ≥40px touch target
  - Box-shadow: 0 24px 64px rgba(0,0,0,0.18)
- [ ] **Base: Shadcn UI Dialog component**
- [ ] **Click outside to close**
- [ ] **Escape key to close**
- [ ] **onClose callback**
- [ ] **Accessibility**:
  - Focus trap (focus stays inside modal)
  - Focus returns to trigger on close
  - ARIA role="dialog"
  - ARIA labelledby for title
  - ARIA describedby for body
  - Keyboard navigation (Tab, Shift+Tab, Escape)
  - Close button: aria-label="Close dialog"
  - Body scroll locked when modal open
- [ ] **Testing**:
  - Unit tests for open/close
  - Storybook stories for all states
  - Test on iPhone (portrait + landscape)
  - Test on Android phone
  - Test on iPad
  - Test on desktop with keyboard
  - Focus trap tested
  - Escape key tested
  - Click outside tested
  - Screen reader tested (VoiceOver/NVDA)
  - axe DevTools: 0 violations
  - Lighthouse a11y: ≥95

**Definition of Done**: Modal works on all devices, fully accessible, all tests pass

---

#### Sub-Task 2.4.2: Tabs Component (Mobile-First)
**Goal**: Build accessible, responsive tab navigation

**Deliverables**:
- [ ] **Mobile Design (320px-640px)**
  - Horizontal tab bar, border-bottom
  - Active tab: blue text, bottom border 2px solid blue, weight 700
  - Inactive: #64748B text, weight 400
  - Padding: 10px 14px per tab
  - Horizontal scroll if tabs overflow
  - Scroll snap to tabs
  - Font: 13px
- [ ] **Tablet Design (640px-1024px)**
  - Padding: 11px 16px per tab
  - Font: 14px
  - Horizontal scroll if needed
- [ ] **Desktop Design (1024px+)**
  - Padding: 11px 18px per tab
  - Font: 14px
  - No scroll (tabs fit)
- [ ] **Base: Shadcn UI Tabs component**
- [ ] **onChange callback**
- [ ] **Accessibility**:
  - Keyboard navigation (Arrow keys, Home, End, Tab)
  - ARIA role="tablist", "tab", "tabpanel"
  - ARIA selected on active tab
  - ARIA controls linking tab to panel
  - ARIA labelledby linking panel to tab
  - Focus indicators visible (3px outline)
  - Touch targets ≥48px on mobile
- [ ] **Testing**:
  - Unit tests for tab switching
  - Storybook stories for all states
  - Test on iPhone (horizontal scroll)
  - Test on Android phone
  - Test on iPad
  - Test on desktop with keyboard
  - Arrow key navigation tested
  - Home/End key tested
  - Screen reader tested (VoiceOver/NVDA)
  - axe DevTools: 0 violations
  - Lighthouse a11y: ≥95

**Definition of Done**: Tabs works on all devices, fully accessible, all tests pass

---

**Files**:
```
frontend/src/components/core/
├── Modal/
│   ├── Modal.tsx           # JSX only, max 15 lines
│   ├── useModal.ts         # All logic (open/close state, focus trap)
│   ├── Modal.module.css    # Styles
│   ├── Modal.test.tsx      # Tests
│   └── Modal.stories.tsx   # Storybook
└── Tabs/
    ├── Tabs.tsx            # JSX only, max 15 lines
    ├── useTabs.ts          # All logic (active tab state)
    ├── Tabs.module.css     # Styles
    ├── Tabs.test.tsx       # Tests
    └── Tabs.stories.tsx    # Storybook
```

**Overall Accessibility Requirements** (ALL components):
- [ ] Focus trap in modal
- [ ] Focus returns to trigger on close
- [ ] Escape key closes modal
- [ ] Click outside closes modal
- [ ] ARIA roles (dialog, tablist, tab, tabpanel)
- [ ] ARIA labels
- [ ] Keyboard navigation (Tab, Arrow keys, Escape, Home, End)
- [ ] Focus indicators visible (3px outline)
- [ ] Touch targets ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- [ ] Screen reader tested (VoiceOver on iOS/macOS, NVDA on Windows)
- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y score: ≥95

**Overall Testing Requirements** (ALL components):
- [ ] Unit tests for all interactions
- [ ] Storybook stories for visual testing
- [ ] Test on real iPhone (portrait + landscape)
- [ ] Test on real Android phone
- [ ] Test on real iPad
- [ ] Test on desktop monitor
- [ ] Test at 100%, 150%, 200% zoom
- [ ] Keyboard navigation tested
- [ ] Screen reader tested

**Requirements**: US-006 (Modal & Tabs Components)

---

### Task 2.5: Responsive CSS & Breakpoints
**Goal**: Implement responsive overrides matching wireframe breakpoints

**Deliverables**:
- [ ] Responsive CSS classes (ci-* prefixed)
- [ ] Breakpoints:
  - lg ≤ 1100px (tablet landscape)
  - md ≤ 860px (tablet)
  - sm ≤ 640px (phone)
  - xs ≤ 420px (small phone)
- [ ] Mobile nav behavior (hide links, show hamburger)
- [ ] Grid collapsing (4-col → 2-col → 1-col)
- [ ] Table horizontal scroll
- [ ] Results screen layout (split → vertical)
- [ ] Padding adjustments (32px → 20px → 16px → 14px)
- [ ] Font size scaling
- [ ] Touch target sizing (≥44px)

**Files**:
```
frontend/src/styles/
├── responsive.css
└── globals.css
```

**Requirements**: US-023 (Responsive Design)

---

### Task 2.6: Tailwind Configuration
**Goal**: Wire design tokens into Tailwind config

**Deliverables**:
- [ ] Tailwind config importing designTokens.ts
- [ ] Color palette from tokens
- [ ] Spacing scale from tokens
- [ ] Font families (DM Sans, DM Mono)
- [ ] Font sizes from tokens
- [ ] Border radius from tokens
- [ ] Box shadows from tokens
- [ ] Breakpoints from tokens
- [ ] Dark mode configuration (class-based)

**Files**:
```
frontend/
├── tailwind.config.js
└── postcss.config.js
```

**Requirements**: Design system integration

---

## Phase 3: User Story — Authentication (Requirement 0)

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
      return httpService
        .get<User>(API.CURRENT_USER)
        .then(unwrap);
    },
    
    logout: async (): Promise<void> => {
      return httpService
        .post<void>(API.LOGOUT, {})
        .then(unwrap);
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
      return httpService
        .get<ReferenceDataResponse>(API.REFERENCE_DATA)
        .then(unwrap);
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
      return httpService
        .post<void>(API.COMPLETE_UPLOAD, { documentId })
        .then(unwrap);
    },
    
    getUploadStatus: async (documentId: string): Promise<UploadStatus> => {
      return httpService
        .get<UploadStatus>(API.UPLOAD_STATUS(documentId))
        .then(unwrap);
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
