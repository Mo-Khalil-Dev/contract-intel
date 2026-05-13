# US-001: Button Component (Design System Foundation)

**Epic**: Design System  
**Priority**: P0  
**Story Points**: 5  
**Status**: Ready for Implementation

---

## User Story

As a **developer**, I want a reusable, accessible, mobile-first Button component based on Shadcn UI so that I can build consistent, responsive interfaces across the application.

---

## Acceptance Criteria

### Component Structure (MANDATORY)

- [ ] **Button.tsx**: JSX only, max 15 lines, no logic
- [ ] **useButton.ts**: All UI logic (hooks, state, handlers)
- [ ] **Button.module.css**: All styles
- [ ] **Button.test.tsx**: Unit tests for all variants
- [ ] **Button.stories.tsx**: Storybook story for all states

### Base Implementation

- [ ] Uses Shadcn UI Button component as base
- [ ] Customized with design tokens from `designTokens.ts`
- [ ] Supports variants: primary, secondary, ghost, danger, success, dark
- [ ] Supports sizes: sm, md, lg (responsive sizing)
- [ ] Props: `variant`, `size`, `disabled`, `full` (full-width), `onClick`, `children`

### Mobile-First Responsive Design (320px → 1024px+)

#### Mobile Design (320px-640px)

- [ ] Touch target: **48px minimum height** (WCAG 2.5.5)
- [ ] Padding: 12px 16px
- [ ] Font size: 14px
- [ ] Full-width by default (`width: 100%`)
- [ ] Tested on real iPhone (portrait + landscape)
- [ ] Tested on real Android phone

#### Tablet Design (640px-1024px)

- [ ] Touch target: **44px minimum height**
- [ ] Padding: 10px 16px
- [ ] Font size: 14px
- [ ] Auto-width (not full-width)
- [ ] Tested on real iPad

#### Desktop Design (1024px+)

- [ ] Touch target: **40px minimum height**
- [ ] Padding: 8px 16px
- [ ] Font size: 14px
- [ ] Hover states visible
- [ ] Tested on desktop monitor with mouse

### Accessibility Requirements (WCAG 2.1 AA)

- [ ] **Focus indicators**: 3px outline, visible on focus
- [ ] **ARIA labels**: Required for icon-only buttons
- [ ] **Keyboard navigation**: Tab, Enter, Space
- [ ] **Color contrast**: ≥4.5:1 for all variants
- [ ] **Disabled state**: `aria-disabled="true"`, cursor not-allowed
- [ ] **Screen reader tested**: VoiceOver (iOS/macOS), NVDA (Windows)

### Testing Requirements (12-Layer Architecture)

#### Layer 1: Static Analysis & Type Checking

- [ ] **ESLint**: No errors, no warnings
- [ ] **TypeScript**: Strict mode enabled, no `any` types
- [ ] **Prettier**: Code formatted consistently
- [ ] **Commands**: `npm run lint`, `npm run type-check`

#### Layer 2: Component Unit Tests (React Testing Library)

- [ ] **All variants tested**: primary, secondary, ghost, danger, success, dark
- [ ] **All sizes tested**: sm, md, lg (responsive)
- [ ] **All states tested**: default, hover, focus, active, disabled
- [ ] **Props tested**: variant, size, disabled, full, onClick, children, type, aria-label
- [ ] **User interactions tested**: Click events, keyboard events (Enter, Space)
- [ ] **Coverage**: ≥80% for component logic
- [ ] **Commands**: `npm test`, `npm test -- --watch`

**Example Test Cases**:

```typescript
describe('Button Component', () => {
  it('should render with default props', () => { ... });
  it('should call onClick handler when clicked', () => { ... });
  it('should apply primary variant styles', () => { ... });
  it('should apply correct size classes', () => { ... });
  it('should disable button when disabled prop is true', () => { ... });
  it('should be full-width on mobile by default', () => { ... });
  it('should trigger onClick on Enter key press', () => { ... });
  it('should trigger onClick on Space key press', () => { ... });
});
```

#### Layer 5: Snapshot Testing

- [ ] **Visual components**: Snapshot tests for all variants
- [ ] **Snapshot review**: Manual review of snapshot diffs
- [ ] **Commands**: `npm test`, `npm test -- --updateSnapshot`

**Example Test Cases**:

```typescript
describe('Button Snapshots', () => {
  it('should match snapshot for primary variant', () => { ... });
  it('should match snapshot for secondary variant', () => { ... });
  it('should match snapshot for disabled state', () => { ... });
  it('should match snapshot for small size', () => { ... });
});
```

#### Layer 7: Accessibility Testing

- [ ] **axe-core automated scan**: 0 critical violations
- [ ] **Keyboard navigation**: Tab to button, Enter/Space to activate
- [ ] **Screen reader**: Test with VoiceOver (macOS/iOS) or NVDA (Windows)
- [ ] **Color contrast**: Verify all variants meet 4.5:1 ratio
- [ ] **Focus indicators**: Visible 3px outline on all variants
- [ ] **ARIA attributes**: aria-label required for icon-only buttons
- [ ] **Lighthouse a11y score**: ≥95
- [ ] **Commands**: `npm run test:a11y`

**Example Test Cases**:

```typescript
describe('Button Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<Button>Click me</Button>);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have visible focus indicator', () => { ... });
  it('should be keyboard navigable', () => { ... });
  it('should have aria-label for icon-only button', () => { ... });
});
```

#### Layer 10: Visual Regression Testing (Storybook + Chromatic)

- [ ] **Storybook stories**: All variants, sizes, states documented
- [ ] **Visual regression**: Chromatic or Percy integration
- [ ] **Commands**: `npm run storybook`, `npm run build-storybook`

**Required Stories**:

- Default story
- All variant stories (primary, secondary, ghost, danger, success, dark)
- All size stories (sm, md, lg)
- All state stories (disabled, loading)
- Combination showcase (all variants together)
- Icon-only button story
- Full-width button story

#### Real Device Testing

- [ ] **iPhone**: Portrait + landscape
- [ ] **Android phone**: Portrait + landscape
- [ ] **iPad**: Portrait + landscape
- [ ] **Desktop monitor**: Mouse hover states
- [ ] **Zoom testing**: 100%, 150%, 200%

---

## Testing Strategy Summary

| Test Layer        | When to Run     | Coverage Target | Speed   |
| ----------------- | --------------- | --------------- | ------- |
| Layer 1: Static   | On every save   | 100%            | ⚡ <1s  |
| Layer 2: Unit     | On every commit | ≥80%            | ⚡ <5s  |
| Layer 5: Snapshot | On every commit | All variants    | ⚡ <1s  |
| Layer 7: A11y     | On every commit | 100%            | ⚡ <1s  |
| Layer 10: Visual  | On PR merge     | All components  | ⏱️ 2-5s |

---

## Design Specifications

### Variants (from Design Tokens)

#### Primary

- Background: `colors.primary` (#2563EB)
- Text: `colors.white` (#FFFFFF)
- Hover: opacity 0.9
- Focus: 3px outline `colors.primary`

#### Secondary

- Background: `colors.gray200` (#EEEEEE)
- Text: `colors.gray900` (#212121)
- Hover: `colors.gray300`
- Focus: 3px outline `colors.gray500`

#### Ghost

- Background: transparent
- Text: `colors.primary`
- Hover: `colors.gray100`
- Focus: 3px outline `colors.primary`

#### Danger

- Background: `colors.error` (#D32F2F)
- Text: `colors.white`
- Hover: opacity 0.9
- Focus: 3px outline `colors.error`

#### Success

- Background: `colors.success` (#388E3C)
- Text: `colors.white`
- Hover: opacity 0.9
- Focus: 3px outline `colors.success`

#### Dark

- Background: `colors.gray900` (#212121)
- Text: `colors.white`
- Hover: `colors.gray800`
- Focus: 3px outline `colors.gray700`

### Sizes (Responsive)

| Size | Mobile (320px-640px)           | Tablet (640px-1024px)          | Desktop (1024px+)              |
| ---- | ------------------------------ | ------------------------------ | ------------------------------ |
| sm   | 44px height, 10px 14px padding | 40px height, 8px 14px padding  | 36px height, 6px 12px padding  |
| md   | 48px height, 12px 16px padding | 44px height, 10px 16px padding | 40px height, 8px 16px padding  |
| lg   | 52px height, 14px 20px padding | 48px height, 12px 20px padding | 44px height, 10px 20px padding |

### Typography

- Font family: DM Sans (from `typography.fontFamily.body`)
- Font weight: 600 (semibold)
- Font size: 14px (all sizes)
- Letter spacing: 0.01em

### Border Radius

- All variants: `borderRadius.md` (8px)

### Transitions

- All properties: 0.15s ease-in-out
- Hover: opacity or background-color
- Focus: outline

---

## Component API

```typescript
interface ButtonProps {
  /**
   * Visual style variant
   * @default 'primary'
   */
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'dark';

  /**
   * Button size (responsive)
   * @default 'md'
   */
  size?: 'sm' | 'md' | 'lg';

  /**
   * Disabled state
   * @default false
   */
  disabled?: boolean;

  /**
   * Full-width on mobile
   * @default true on mobile, false on tablet/desktop
   */
  full?: boolean;

  /**
   * Button text or icon content
   */
  children: React.ReactNode;

  /**
   * Click handler
   */
  onClick?: () => void;

  /**
   * Button type (for forms)
   * @default 'button'
   */
  type?: 'button' | 'submit' | 'reset';

  /**
   * ARIA label (required for icon-only buttons)
   */
  'aria-label'?: string;
}
```

---

## File Structure

```
frontend/src/components/core/Button/
├── Button.tsx          # JSX only, max 15 lines, no logic
├── useButton.ts        # All UI logic (hooks, state, handlers)
├── Button.module.css   # All styles
├── Button.test.tsx     # Unit tests
└── Button.stories.tsx  # Storybook story
```

---

## Implementation Tasks

### Task 1: Component Structure (Mobile-First)

**Goal**: Build mobile-first Button component with Shadcn UI base

**Deliverables**:

- [ ] Install Shadcn UI Button component: `npx shadcn-ui@latest add button`
- [ ] Create Button.tsx (JSX only, max 15 lines)
- [ ] Create useButton.ts (all logic)
- [ ] Create Button.module.css (mobile-first styles)
- [ ] Implement mobile design (320px-640px):
  - 48px minimum height
  - 12px 16px padding
  - Full-width by default
- [ ] Implement tablet design (640px-1024px):
  - 44px minimum height
  - 10px 16px padding
  - Auto-width
- [ ] Implement desktop design (1024px+):
  - 40px minimum height
  - 8px 16px padding
  - Hover states
- [ ] Wire design tokens (colors, spacing, typography, borderRadius)

**Definition of Done**: Button renders on all screen sizes, uses design tokens

---

### Task 2: Variants & States

**Goal**: Implement all variants and states

**Deliverables**:

- [ ] Implement 6 variants: primary, secondary, ghost, danger, success, dark
- [ ] Implement 3 sizes: sm, md, lg (responsive)
- [ ] Implement states: default, hover, focus, active, disabled
- [ ] Apply design tokens for colors
- [ ] Add transitions (0.15s ease-in-out)

**Definition of Done**: All variants and states work correctly

---

### Task 3: Accessibility

**Goal**: Make Button fully accessible (WCAG 2.1 AA)

**Deliverables**:

- [ ] Add focus indicators (3px outline, visible)
- [ ] Add ARIA labels for icon-only buttons
- [ ] Implement keyboard navigation (Tab, Enter, Space)
- [ ] Verify color contrast ≥4.5:1 for all variants
- [ ] Add disabled state with `aria-disabled="true"`
- [ ] Test with screen reader (VoiceOver, NVDA)

**Definition of Done**: Button passes WCAG 2.1 AA, screen reader announces correctly

---

### Task 4: Testing

**Goal**: Comprehensive testing on all devices

**Deliverables**:

- [ ] Write unit tests for all variants
- [ ] Write unit tests for all sizes
- [ ] Write unit tests for all states
- [ ] Create Storybook stories for all combinations
- [ ] Test on real iPhone (portrait + landscape)
- [ ] Test on real Android phone
- [ ] Test on real iPad
- [ ] Test on desktop monitor
- [ ] Test at 100%, 150%, 200% zoom
- [ ] Test keyboard navigation
- [ ] Test screen reader
- [ ] Run axe DevTools (0 critical violations)
- [ ] Run Lighthouse a11y (≥95)

**Definition of Done**: All tests pass, Button works on all devices, fully accessible

---

## Edge Cases & States

### Icon-Only Button

- [ ] Requires `aria-label` prop
- [ ] Minimum 48px × 48px on mobile
- [ ] Minimum 44px × 44px on tablet
- [ ] Minimum 40px × 40px on desktop

### Loading State

- [ ] Shows spinner icon
- [ ] Disabled during loading
- [ ] ARIA label: "Loading..."

### Full-Width

- [ ] Default on mobile (320px-640px)
- [ ] Optional on tablet/desktop via `full` prop

---

## Notes for Implementation

1. **Shadcn UI Base**: Start with Shadcn UI Button, customize with design tokens
2. **Mobile-First**: Build for 320px first, enhance for larger screens
3. **Touch Targets**: Minimum 48px on mobile (WCAG 2.5.5)
4. **Focus Indicators**: Always visible, never remove without replacement
5. **Color Contrast**: Verify all variants meet 4.5:1 ratio
6. **Real Device Testing**: Emulators are not enough — test on real devices
7. **Screen Reader**: Test with VoiceOver (iOS/macOS) and NVDA (Windows)

---

## Acceptance Checklist

- [ ] Component structure follows mandatory pattern (5 files)
- [ ] Uses Shadcn UI Button as base
- [ ] All variants implemented (6 variants)
- [ ] All sizes implemented (3 sizes, responsive)
- [ ] Mobile-first responsive (320px → 1024px+)
- [ ] Touch targets ≥48px on mobile
- [ ] Focus indicators visible (3px outline)
- [ ] ARIA labels on icon-only buttons
- [ ] Keyboard navigation works (Tab, Enter, Space)
- [ ] Color contrast ≥4.5:1 (all variants)
- [ ] Screen reader tested (VoiceOver, NVDA)
- [ ] Unit tests pass (all variants, sizes, states)
- [ ] Storybook stories created (all combinations)
- [ ] Tested on real iPhone
- [ ] Tested on real Android phone
- [ ] Tested on real iPad
- [ ] Tested on desktop monitor
- [ ] Tested at 100%, 150%, 200% zoom
- [ ] axe DevTools: 0 critical violations
- [ ] Lighthouse a11y: ≥95
- [ ] Code review approved
- [ ] Ready for merge to main
