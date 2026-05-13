# US-XXX: [Feature Name]

**Epic**: [Epic Name]  
**Priority**: P0/P1/P2/P3  
**Story Points**: [Points]  
**Status**: Ready for Implementation

---

## User Story

As a **[user role]**, I want [feature/capability] so that [business value/benefit].

---

## Acceptance Criteria

### Component Structure (MANDATORY for Frontend Components)

- [ ] **ComponentName.tsx**: JSX only, max 15 lines, no logic
- [ ] **useComponentName.ts**: All UI logic (hooks, state, handlers)
- [ ] **ComponentName.module.css**: All styles
- [ ] **ComponentName.test.tsx**: Unit tests for all variants
- [ ] **ComponentName.stories.tsx**: Storybook story for all states

### Functional Requirements

- [ ] [Requirement 1]
- [ ] [Requirement 2]
- [ ] [Requirement 3]

### Mobile-First Responsive Design (320px → 1024px+)

#### Mobile Design (320px-640px)

- [ ] Touch target: **48px minimum height** (WCAG 2.5.5)
- [ ] Padding: [specify]
- [ ] Font size: [specify]
- [ ] Layout: [describe mobile layout]
- [ ] Tested on real iPhone (portrait + landscape)
- [ ] Tested on real Android phone

#### Tablet Design (640px-1024px)

- [ ] Touch target: **44px minimum height**
- [ ] Padding: [specify]
- [ ] Font size: [specify]
- [ ] Layout: [describe tablet layout]
- [ ] Tested on real iPad

#### Desktop Design (1024px+)

- [ ] Touch target: **40px minimum height**
- [ ] Padding: [specify]
- [ ] Font size: [specify]
- [ ] Layout: [describe desktop layout]
- [ ] Hover states visible
- [ ] Tested on desktop monitor with mouse

### Accessibility Requirements (WCAG 2.1 AA)

- [ ] **Focus indicators**: 3px outline, visible on focus
- [ ] **ARIA labels**: Required for icon-only buttons and inputs
- [ ] **Keyboard navigation**: Tab, Enter, Space, Escape
- [ ] **Color contrast**: ≥4.5:1 for all text
- [ ] **Disabled state**: `aria-disabled="true"`, cursor not-allowed
- [ ] **Screen reader tested**: VoiceOver (iOS/macOS), NVDA (Windows)
- [ ] **Form labels**: All inputs have associated labels (htmlFor/id)
- [ ] **Alt text**: All images have descriptive alt text

---

## Testing Requirements (12-Layer Architecture)

### Layer 1: Static Analysis & Type Checking

- [ ] **ESLint**: No errors, no warnings
- [ ] **TypeScript**: Strict mode enabled, no `any` types
- [ ] **Prettier**: Code formatted consistently
- [ ] **Commands**: `npm run lint`, `npm run type-check`

### Layer 2: Component Unit Tests (React Testing Library)

- [ ] **All variants tested**: [list variants]
- [ ] **All sizes tested**: [list sizes]
- [ ] **All states tested**: default, hover, focus, active, disabled, loading, error
- [ ] **Props tested**: All prop combinations
- [ ] **User interactions tested**: Click, type, submit, etc.
- [ ] **Conditional rendering tested**: Loading, error, empty states
- [ ] **Coverage**: ≥80% for component logic
- [ ] **Commands**: `npm test`, `npm test -- --watch`

**Example Test Cases**:

```typescript
describe('ComponentName', () => {
  it('should render with default props', () => { ... });
  it('should call onClick handler when clicked', () => { ... });
  it('should show loading state', () => { ... });
  it('should show error message when error prop is true', () => { ... });
  it('should disable button when disabled prop is true', () => { ... });
});
```

### Layer 3: Hook Testing (if custom hooks)

- [ ] **Hook logic tested**: State updates, effects, side effects
- [ ] **Hook dependencies tested**: Correct dependency arrays
- [ ] **Commands**: `npm test`

**Example Test Cases**:

```typescript
describe('useComponentName', () => {
  it('should fetch data on mount', () => { ... });
  it('should set error if fetch fails', () => { ... });
  it('should update state when input changes', () => { ... });
});
```

### Layer 4: Integration Testing (MSW for API mocking)

- [ ] **API calls mocked**: Using MSW (Mock Service Worker)
- [ ] **Component + API tested**: Full flow from UI to API response
- [ ] **Error handling tested**: Network errors, 404, 500, etc.
- [ ] **Commands**: `npm run test:integration`

**Example Test Cases**:

```typescript
describe('ComponentName Integration', () => {
  it('should load data and display it', async () => { ... });
  it('should show error message on API failure', async () => { ... });
  it('should retry on network error', async () => { ... });
});
```

### Layer 5: Snapshot Testing

- [ ] **Visual components**: Snapshot tests for all variants
- [ ] **Snapshot review**: Manual review of snapshot diffs
- [ ] **Commands**: `npm test`, `npm test -- --updateSnapshot`

**Example Test Cases**:

```typescript
describe('ComponentName Snapshots', () => {
  it('should match snapshot for primary variant', () => { ... });
  it('should match snapshot for disabled state', () => { ... });
});
```

### Layer 6: Navigation & Routing Tests (if applicable)

- [ ] **Route guards tested**: Protected routes redirect to login
- [ ] **URL parameters tested**: Correct params passed to components
- [ ] **Navigation tested**: Correct navigation on button clicks
- [ ] **Commands**: `npm test`

### Layer 7: Accessibility Testing

- [ ] **axe-core automated scan**: 0 critical violations
- [ ] **Keyboard navigation**: Tab through all interactive elements
- [ ] **Screen reader**: Test with VoiceOver (macOS/iOS) or NVDA (Windows)
- [ ] **Color contrast**: Verify all text meets 4.5:1 ratio
- [ ] **Focus indicators**: Visible on all interactive elements
- [ ] **ARIA attributes**: Correct usage of aria-label, aria-describedby, etc.
- [ ] **Lighthouse a11y score**: ≥95
- [ ] **Commands**: `npm run test:a11y`

**Example Test Cases**:

```typescript
describe('ComponentName Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<ComponentName />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper labels for all inputs', () => { ... });
  it('should be keyboard navigable', () => { ... });
});
```

### Layer 8: Performance Testing (if performance-critical)

- [ ] **Render performance**: Component renders in <200ms
- [ ] **Re-render optimization**: No unnecessary re-renders
- [ ] **Bundle size**: Component bundle size tracked
- [ ] **Commands**: `npm run test:perf`

### Layer 10: Visual Regression Testing (Storybook + Chromatic)

- [ ] **Storybook stories**: All variants, sizes, states documented
- [ ] **Visual regression**: Chromatic or Percy integration
- [ ] **Commands**: `npm run storybook`, `npm run build-storybook`

**Required Stories**:

- Default story
- All variant stories
- All size stories
- All state stories (disabled, loading, error)
- Combination showcase (all variants together)

### Layer 11: E2E Testing (Cypress/Playwright) - Critical Flows Only

- [ ] **User journey tested**: [describe critical user journey]
- [ ] **Happy path**: Complete flow from start to finish
- [ ] **Error scenarios**: Network errors, validation errors
- [ ] **Commands**: `npm run test:e2e`

**Example Test Cases** (only for critical features):

```typescript
describe('Critical User Journey', () => {
  it('should complete full workflow', () => {
    cy.visit('/');
    cy.contains('Upload Contract').click();
    cy.get('[data-cy=file-upload]').attachFile('contract.pdf');
    cy.get('[data-cy=submit-btn]').click();
    cy.contains('Analysis Complete', { timeout: 60000 }).should('be.visible');
  });
});
```

### Layer 12: Production Monitoring (Post-Launch)

- [ ] **Error tracking**: Sentry integration
- [ ] **Session replay**: LogRocket integration
- [ ] **Analytics**: PostHog events tracked
- [ ] **Alerts**: Error rate, latency alerts configured

---

## Testing Strategy Summary

| Test Layer           | When to Run         | Coverage Target    | Speed      |
| -------------------- | ------------------- | ------------------ | ---------- |
| Layer 1: Static      | On every save       | 100%               | ⚡ <1s     |
| Layer 2: Unit        | On every commit     | ≥80%               | ⚡ <5s     |
| Layer 3: Hooks       | On every commit     | ≥80%               | ⚡ <5s     |
| Layer 4: Integration | On every commit     | Critical flows     | ⏱️ <60s    |
| Layer 5: Snapshot    | On every commit     | Visual components  | ⚡ <1s     |
| Layer 7: A11y        | On every commit     | 100%               | ⚡ <1s     |
| Layer 10: Visual     | On PR merge         | All components     | ⏱️ 2-5s    |
| Layer 11: E2E        | Before deploy       | 1-3 critical flows | ⏱️ 5-30m   |
| Layer 12: Monitoring | Always (production) | 100%               | 💰 Ongoing |

---

## Design Specifications

### Colors Used

- [List all colors with hex codes]
- Example: Primary: #2563EB, Error: #EF4444, Success: #10B981

### Typography

- Font family: [specify]
- Font sizes: [list all sizes used]
- Font weights: [list all weights used]
- Line heights: [specify]

### Spacing

- Padding: [specify]
- Margins: [specify]
- Gaps: [specify]

### Border Radius

- [Specify border radius values]

### Shadows

- [Specify shadow values if applicable]

---

## Component API (if applicable)

```typescript
interface ComponentNameProps {
  /**
   * [Description]
   * @default [default value]
   */
  propName: PropType;

  // ... more props
}
```

---

## File Structure

```
frontend/src/components/[core|features]/ComponentName/
├── ComponentName.tsx          # JSX only, max 15 lines, no logic
├── useComponentName.ts        # All UI logic (hooks, state, handlers)
├── ComponentName.module.css   # All styles
├── ComponentName.test.tsx     # Unit tests (Layer 2 + Layer 7)
├── ComponentName.stories.tsx  # Storybook story (Layer 10)
└── index.ts                   # Barrel export
```

---

## Implementation Tasks

### Task 1: Component Structure (Mobile-First)

**Goal**: Build mobile-first component with proper structure

**Deliverables**:

- [ ] Create component folder structure (5 files)
- [ ] Implement mobile design (320px-640px)
- [ ] Implement tablet design (640px-1024px)
- [ ] Implement desktop design (1024px+)
- [ ] Wire design tokens

**Testing**:

- [ ] Layer 1: ESLint + TypeScript checks pass
- [ ] Layer 2: Basic unit tests for rendering

**Definition of Done**: Component renders on all screen sizes, uses design tokens

---

### Task 2: Variants & States

**Goal**: Implement all variants and states

**Deliverables**:

- [ ] Implement all variants
- [ ] Implement all sizes
- [ ] Implement all states
- [ ] Apply design tokens

**Testing**:

- [ ] Layer 2: Unit tests for all variants, sizes, states
- [ ] Layer 5: Snapshot tests for visual components

**Definition of Done**: All variants and states work correctly, tests pass

---

### Task 3: Accessibility

**Goal**: Make component fully accessible (WCAG 2.1 AA)

**Deliverables**:

- [ ] Add focus indicators
- [ ] Add ARIA labels
- [ ] Implement keyboard navigation
- [ ] Verify color contrast
- [ ] Test with screen reader

**Testing**:

- [ ] Layer 7: axe-core automated scan (0 violations)
- [ ] Layer 7: Keyboard navigation test
- [ ] Layer 7: Screen reader test
- [ ] Layer 7: Lighthouse a11y score ≥95

**Definition of Done**: Component passes WCAG 2.1 AA, screen reader announces correctly

---

### Task 4: Testing & Documentation

**Goal**: Comprehensive testing and documentation

**Deliverables**:

- [ ] Write unit tests (Layer 2)
- [ ] Write integration tests (Layer 4, if applicable)
- [ ] Create Storybook stories (Layer 10)
- [ ] Test on real devices
- [ ] Document component API

**Testing**:

- [ ] Layer 1: Static analysis passes
- [ ] Layer 2: Unit tests ≥80% coverage
- [ ] Layer 4: Integration tests (if applicable)
- [ ] Layer 5: Snapshot tests
- [ ] Layer 7: A11y tests pass
- [ ] Layer 10: Storybook stories created
- [ ] Real device testing (iPhone, Android, iPad, desktop)

**Definition of Done**: All tests pass, component documented, works on all devices

---

## Edge Cases & States

### [Edge Case 1]

- [ ] [Description and handling]

### [Edge Case 2]

- [ ] [Description and handling]

---

## Component Dependencies

- [List all component dependencies]
- Example: Button, Badge, Modal, etc.

---

## Notes for Implementation

1. **[Note 1]**
2. **[Note 2]**
3. **[Note 3]**

---

## Acceptance Checklist

### Component Structure

- [ ] Component structure follows mandatory pattern (5 files)
- [ ] JSX file: max 15 lines, no logic
- [ ] Hook file: all logic extracted
- [ ] CSS file: all styles extracted
- [ ] Test file: comprehensive tests
- [ ] Story file: all variants documented

### Functionality

- [ ] All functional requirements met
- [ ] All variants implemented
- [ ] All sizes implemented
- [ ] All states implemented

### Responsive Design

- [ ] Mobile-first approach (320px → 1024px+)
- [ ] Touch targets ≥48px on mobile
- [ ] Touch targets ≥44px on tablet
- [ ] Touch targets ≥40px on desktop
- [ ] Tested on real iPhone
- [ ] Tested on real Android phone
- [ ] Tested on real iPad
- [ ] Tested on desktop monitor
- [ ] Tested at 100%, 150%, 200% zoom

### Accessibility

- [ ] Focus indicators visible (3px outline)
- [ ] ARIA labels on icon-only buttons/inputs
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Color contrast ≥4.5:1 (all text)
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] Form labels associated (htmlFor/id)
- [ ] Alt text on images

### Testing (12-Layer Architecture)

- [ ] **Layer 1**: ESLint + TypeScript pass
- [ ] **Layer 2**: Unit tests ≥80% coverage
- [ ] **Layer 3**: Hook tests (if applicable)
- [ ] **Layer 4**: Integration tests (if applicable)
- [ ] **Layer 5**: Snapshot tests
- [ ] **Layer 7**: axe DevTools: 0 critical violations
- [ ] **Layer 7**: Lighthouse a11y: ≥95
- [ ] **Layer 10**: Storybook stories created
- [ ] **Layer 11**: E2E tests (if critical feature)

### Code Quality

- [ ] Code review approved
- [ ] No console.log statements
- [ ] No hardcoded values (uses design tokens)
- [ ] No inline styles (uses CSS modules)
- [ ] No `any` types (TypeScript strict mode)
- [ ] Ready for merge to main

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] All testing requirements met (relevant layers)
- [ ] Component documented (Storybook + JSDoc)
- [ ] Code review approved
- [ ] Merged to main
- [ ] Deployed to staging
- [ ] QA approved
- [ ] Ready for production
