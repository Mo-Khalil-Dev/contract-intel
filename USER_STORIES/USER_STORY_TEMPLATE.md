# US-XXX: [Feature Name]

**Epic**: [Epic Name]  
**Priority**: P0/P1/P2/P3  
**Story Points**: [Points]  
**Status**: Ready for Implementation / In Progress / Done  

---

## User Story

As a **[role]**, I want [feature] so that [benefit].

---

## Acceptance Criteria

### Component Structure (MANDATORY)
- [ ] **[ComponentName].tsx**: JSX only, max 15 lines, no logic
- [ ] **use[ComponentName].ts**: All UI logic (hooks, state, handlers)
- [ ] **[ComponentName].module.css**: All styles
- [ ] **[ComponentName].test.tsx**: Unit tests for all variants
- [ ] **[ComponentName].stories.tsx**: Storybook story for all states
- [ ] **index.ts**: Barrel export (optional)

### Base Implementation
- [ ] [Core functionality requirement 1]
- [ ] [Core functionality requirement 2]
- [ ] [Core functionality requirement 3]

### Mobile-First Responsive Design (320px → 1024px+)

#### Mobile Design (320px-640px)
- [ ] Touch target: **48px minimum height** (WCAG 2.5.5)
- [ ] Padding: [specify mobile padding]
- [ ] Font size: [specify mobile font size]
- [ ] Layout: [specify mobile layout - stack, full-width, etc.]
- [ ] Tested on real iPhone (portrait + landscape)
- [ ] Tested on real Android phone

#### Tablet Design (640px-1024px)
- [ ] Touch target: **44px minimum height**
- [ ] Padding: [specify tablet padding]
- [ ] Font size: [specify tablet font size]
- [ ] Layout: [specify tablet layout]
- [ ] Tested on real iPad

#### Desktop Design (1024px+)
- [ ] Touch target: **40px minimum height**
- [ ] Padding: [specify desktop padding]
- [ ] Font size: [specify desktop font size]
- [ ] Layout: [specify desktop layout]
- [ ] Hover states visible
- [ ] Tested on desktop monitor with mouse

### Accessibility Requirements (WCAG 2.1 AA)
- [ ] **Focus indicators**: 3px outline, visible on focus
- [ ] **ARIA labels**: Required for icon-only buttons and inputs
- [ ] **Keyboard navigation**: Tab, Enter, Space, Escape
- [ ] **Color contrast**: ≥4.5:1 for all text
- [ ] **Touch targets**: ≥48px on mobile, ≥44px on tablet, ≥40px on desktop
- [ ] **Semantic HTML**: Use proper tags (button, nav, main, article)
- [ ] **Screen reader tested**: VoiceOver (iOS/macOS), NVDA (Windows)
- [ ] **Form labels**: All inputs have associated labels (htmlFor/id)

---

## 12-Layer Testing Requirements

### Layer 1: Static Analysis & Type Checking
- [ ] ESLint passes with no errors
- [ ] TypeScript strict mode passes
- [ ] All props have TypeScript interfaces
- [ ] No `any` types used
- [ ] Prettier formatting applied

**Commands**:
```bash
npm run lint
npm run type-check
```

---

### Layer 2: Component Unit Tests (React Testing Library)
- [ ] Test all variants (if applicable)
- [ ] Test all sizes (if applicable)
- [ ] Test all states (default, hover, focus, active, disabled, loading, error)
- [ ] Test user interactions (click, type, submit)
- [ ] Test conditional rendering (loading, error, empty states)
- [ ] Test all prop combinations
- [ ] Coverage: ≥80% for component logic

**Example Test Structure**:
```typescript
describe('[ComponentName] Component', () => {
  it('should render with default props', () => { ... });
  it('should call onClick handler when clicked', () => { ... });
  it('should show loading state', () => { ... });
  it('should show error state', () => { ... });
  it('should disable button when disabled prop is true', () => { ... });
});
```

**Commands**:
```bash
npm test -- [ComponentName].test.tsx
npm test -- --coverage
```

---

### Layer 3: Hook Testing (if custom hooks exist)
- [ ] Test hook state updates
- [ ] Test hook side effects
- [ ] Test hook error handling
- [ ] Test hook cleanup

**Example**:
```typescript
describe('use[ComponentName] Hook', () => {
  it('should fetch data on mount', async () => { ... });
  it('should set error if fetch fails', async () => { ... });
});
```

---

### Layer 4: Integration Testing (MSW + React Testing Library)
- [ ] Test component with mocked API calls
- [ ] Test component with routing
- [ ] Test component with state management (Redux/Context)
- [ ] Test happy path (successful flow)
- [ ] Test error scenarios (404, 500, network failure)

**Example**:
```typescript
describe('[ComponentName] Integration', () => {
  it('should load data and display it', async () => { ... });
  it('should handle API error gracefully', async () => { ... });
});
```

**Commands**:
```bash
npm run test:integration
```

---

### Layer 5: Snapshot Testing
- [ ] Create snapshots for all variants
- [ ] Create snapshots for all states
- [ ] Review snapshot diffs before updating

**Example**:
```typescript
it('should match snapshot for primary variant', () => {
  const { container } = render(<Component variant="primary" />);
  expect(container.firstChild).toMatchSnapshot();
});
```

---

### Layer 6: Navigation & Routing Tests (if applicable)
- [ ] Test route navigation
- [ ] Test URL parameter handling
- [ ] Test protected routes (auth required)
- [ ] Test redirects

---

### Layer 7: Accessibility Testing
- [ ] Run axe DevTools: 0 critical violations
- [ ] Run Lighthouse a11y: ≥95
- [ ] Test keyboard navigation (Tab through all elements)
- [ ] Test screen reader (VoiceOver, NVDA)
- [ ] Verify color contrast ≥4.5:1
- [ ] Verify all images have alt text
- [ ] Verify all form inputs have labels

**Example**:
```typescript
import { axe, toHaveNoViolations } from 'jest-axe';
expect.extend(toHaveNoViolations);

it('should have no accessibility violations', async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

**Commands**:
```bash
npm run test:a11y
```

---

### Layer 8: Performance Testing (if applicable)
- [ ] Render time < 200ms for lists with 100 items
- [ ] No unnecessary re-renders
- [ ] Bundle size impact documented

**Example**:
```typescript
it('should render 100 items in under 200ms', () => {
  const onRenderCallback = jest.fn();
  render(
    <Profiler id="Component" onRender={onRenderCallback}>
      <Component items={Array(100).fill({})} />
    </Profiler>
  );
  const [, , actualDuration] = onRenderCallback.mock.calls[0];
  expect(actualDuration).toBeLessThan(200);
});
```

---

### Layer 9: Storybook Stories
- [ ] Story for each variant
- [ ] Story for each size
- [ ] Story for each state
- [ ] Story for all combinations (if reasonable)
- [ ] Interactive controls (argTypes)
- [ ] Auto-generated docs (tags: ['autodocs'])

**Example**:
```typescript
export const Primary: Story = {
  args: { variant: 'primary', children: 'Button' },
};

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px' }}>
      <Component variant="primary">Primary</Component>
      <Component variant="secondary">Secondary</Component>
    </div>
  ),
};
```

**Commands**:
```bash
npm run storybook
```

---

### Layer 10: Visual Regression Testing (Chromatic)
- [ ] Chromatic build passes
- [ ] Visual diffs reviewed and approved
- [ ] No unintended visual changes

**Commands**:
```bash
npm run chromatic
```

---

### Layer 11: E2E Testing (Cypress) - Only for Critical Flows
- [ ] E2E test for critical user journey (if applicable)
- [ ] Test covers happy path
- [ ] Test covers error scenarios

**Example**:
```typescript
describe('[Feature] E2E', () => {
  it('should complete [workflow]', () => {
    cy.visit('/[page]');
    cy.get('[data-cy=button]').click();
    cy.contains('Success').should('be.visible');
  });
});
```

**Commands**:
```bash
npm run test:e2e
```

---

### Layer 12: Production Monitoring (Post-Launch)
- [ ] Sentry error tracking configured
- [ ] LogRocket session replay configured (if applicable)
- [ ] PostHog analytics events tracked (if applicable)

---

## Testing Summary Checklist

**Before Code Review**:
- [ ] Layer 1: ESLint + TypeScript passes
- [ ] Layer 2: Component unit tests pass (≥80% coverage)
- [ ] Layer 3: Hook tests pass (if applicable)
- [ ] Layer 5: Snapshots created and reviewed
- [ ] Layer 7: axe DevTools passes (0 critical violations)
- [ ] Layer 9: Storybook stories created for all variants

**Before Merge**:
- [ ] Layer 4: Integration tests pass
- [ ] Layer 7: Lighthouse a11y ≥95
- [ ] Layer 7: Keyboard navigation tested manually
- [ ] Layer 7: Screen reader tested manually
- [ ] All tests pass in CI pipeline

**Post-Merge** (if applicable):
- [ ] Layer 10: Chromatic visual regression approved
- [ ] Layer 11: E2E tests pass (if critical flow)

---

## Design Specifications

### Colors Used
- [List all colors from design tokens]

### Typography
- Font family: [specify]
- Font sizes: [specify]
- Font weights: [specify]

### Spacing
- Padding: [specify]
- Margins: [specify]
- Gaps: [specify]

### Border Radius
- [specify]

### Shadows
- [specify]

---

## Component API

```typescript
interface [ComponentName]Props {
  /**
   * [Description]
   * @default [default value]
   */
  [propName]: [type];
  
  // ... more props
}
```

---

## File Structure

```
frontend/src/components/[core|features]/[ComponentName]/
├── [ComponentName].tsx          # JSX only, max 15 lines, no logic
├── use[ComponentName].ts        # All UI logic (hooks, state, handlers)
├── [ComponentName].module.css   # All styles
├── [ComponentName].test.tsx     # Unit tests
├── [ComponentName].stories.tsx  # Storybook story
└── index.ts                     # Barrel export (optional)
```

---

## Implementation Tasks

### Task 1: Component Structure (Mobile-First)
**Goal**: Build mobile-first component with proper structure

**Deliverables**:
- [ ] Create [ComponentName].tsx (JSX only, max 15 lines)
- [ ] Create use[ComponentName].ts (all logic)
- [ ] Create [ComponentName].module.css (mobile-first styles)
- [ ] Implement mobile design (320px-640px)
- [ ] Implement tablet design (640px-1024px)
- [ ] Implement desktop design (1024px+)
- [ ] Wire design tokens

**Definition of Done**: Component renders on all screen sizes, uses design tokens

---

### Task 2: Variants & States
**Goal**: Implement all variants and states

**Deliverables**:
- [ ] Implement all variants
- [ ] Implement all sizes (responsive)
- [ ] Implement all states (default, hover, focus, active, disabled, loading, error)
- [ ] Apply design tokens
- [ ] Add transitions

**Definition of Done**: All variants and states work correctly

---

### Task 3: Accessibility
**Goal**: Make component fully accessible (WCAG 2.1 AA)

**Deliverables**:
- [ ] Add focus indicators (3px outline, visible)
- [ ] Add ARIA labels (where needed)
- [ ] Implement keyboard navigation
- [ ] Verify color contrast ≥4.5:1
- [ ] Add semantic HTML
- [ ] Test with screen reader

**Definition of Done**: Component passes WCAG 2.1 AA, screen reader announces correctly

---

### Task 4: Testing (12-Layer Architecture)
**Goal**: Comprehensive testing across all layers

**Deliverables**:
- [ ] Layer 1: ESLint + TypeScript passes
- [ ] Layer 2: Unit tests (all variants, sizes, states)
- [ ] Layer 3: Hook tests (if applicable)
- [ ] Layer 4: Integration tests (if applicable)
- [ ] Layer 5: Snapshot tests
- [ ] Layer 7: Accessibility tests (axe, Lighthouse, keyboard, screen reader)
- [ ] Layer 9: Storybook stories (all combinations)
- [ ] Test on real devices (iPhone, Android, iPad, desktop)
- [ ] Test at 100%, 150%, 200% zoom

**Definition of Done**: All tests pass, component works on all devices, fully accessible

---

## Edge Cases & States

### [Edge Case 1]
- [ ] [Behavior]

### [Edge Case 2]
- [ ] [Behavior]

---

## Component Dependencies

- [List all components this component depends on]

---

## Notes for Implementation

1. [Note 1]
2. [Note 2]
3. [Note 3]

---

## Acceptance Checklist

**Component Structure**:
- [ ] Component structure follows mandatory pattern (5-6 files)
- [ ] JSX file max 15 lines
- [ ] All logic in hook file
- [ ] All styles in CSS file

**Functionality**:
- [ ] All variants implemented
- [ ] All sizes implemented (responsive)
- [ ] All states implemented

**Responsive Design**:
- [ ] Mobile-first (320px → 1024px+)
- [ ] Touch targets ≥48px on mobile
- [ ] Tested on real iPhone
- [ ] Tested on real Android phone
- [ ] Tested on real iPad
- [ ] Tested on desktop monitor
- [ ] Tested at 100%, 150%, 200% zoom

**Accessibility**:
- [ ] Focus indicators visible (3px outline)
- [ ] ARIA labels on icon-only buttons/inputs
- [ ] Keyboard navigation works (Tab, Enter, Space, Escape)
- [ ] Color contrast ≥4.5:1 (all variants)
- [ ] Semantic HTML used
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y: ≥95

**Testing (12-Layer Architecture)**:
- [ ] Layer 1: ESLint + TypeScript passes
- [ ] Layer 2: Unit tests pass (≥80% coverage)
- [ ] Layer 3: Hook tests pass (if applicable)
- [ ] Layer 4: Integration tests pass (if applicable)
- [ ] Layer 5: Snapshot tests created
- [ ] Layer 7: Accessibility tests pass
- [ ] Layer 9: Storybook stories created
- [ ] Layer 10: Visual regression approved (if applicable)
- [ ] Layer 11: E2E tests pass (if critical flow)

**Code Quality**:
- [ ] Code review approved
- [ ] No hardcoded values (all from design tokens)
- [ ] No console.log statements
- [ ] No commented-out code
- [ ] Documentation updated

**Ready for Merge**:
- [ ] All acceptance criteria met
- [ ] All tests pass in CI pipeline
- [ ] Ready for merge to main
