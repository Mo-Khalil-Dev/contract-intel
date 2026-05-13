# ContractIntel Redesign — User Stories & Implementation Plan

**Source**: Design handoff from Claude Design (May 2026)  
**Target**: React/Next.js implementation in existing codebase  
**Scope**: 8 screens + 13 reusable components + design system

---

## Design System Foundation

### US-001: Implement Design Tokens & Color System

**Priority**: P0 (blocks all other work)

As a developer, I need the design tokens defined so all components use consistent colors, typography, and spacing.

**Acceptance Criteria:**

- [ ] Design tokens file created with all color definitions (blue, red, orange, green, neutral palette)
- [ ] Risk color function implemented: riskColor(score) → returns appropriate color
- [ ] Risk background function: riskBg(score) → returns background color
- [ ] Risk label function: riskLabel(score) → returns "High Risk" / "Medium Risk" / "Low Risk"
- [ ] Font imports configured (DM Sans: 400,600,700,800; DM Mono: 400,600,700)
- [ ] Global CSS applied: box-sizing, scrollbar styling, focus states, animations
- [ ] Token values match design specification exactly

**Design Spec Values:**

- Primary: #2563EB (blue), #1D4ED8 (dark), #DBEAFE (light)
- Semantic: red=#EF4444, orange=#F59E0B, green=#10B981
- Neutral: bg=#FAFAF9, surface=#FFFFFF, ink=#0F172A
- Nav: #0F172A with #1E293B border

---

### US-002: Create Reusable Button Component (Btn)

**Priority**: P0

As a developer, I need a flexible button component supporting 6 variants and 3 sizes.

**Acceptance Criteria:**

- [ ] Component supports variants: primary, secondary, ghost, danger, success, dark
- [ ] Supports sizes: sm (6px 14px, 13px), md (10px 20px, 14px), lg (14px 28px, 16px)
- [ ] `disabled` prop: opacity 0.45, cursor not-allowed
- [ ] `full` prop: width 100%
- [ ] Hover/focus states via CSS transitions (0.15s)
- [ ] Border-radius: 8px
- [ ] Letter-spacing: -0.01em
- [ ] onClick handler support
- [ ] Renders correctly in all combinations

---

### US-003: Create Badge Components (Badge, RiskBadge, TypePill)

**Priority**: P0

As a developer, I need three specialized badge components for displaying labels and risk information.

**Badge Component:**

- [ ] Supports label, color, bg, border, dot props
- [ ] Dot is 6px circle, optional
- [ ] Border-radius: 6px, padding: 3px 9px, font-size: 12px

**RiskBadge Component:**

- [ ] Displays risk score with colored dot and monospace number
- [ ] Supports sm (3px 9px, 12px) and lg (5px 12px, 14px) sizes
- [ ] Dot: 6px (sm) or 8px (lg)
- [ ] Font: DM Mono weight 700
- [ ] Color determined by risk threshold

**TypePill Component:**

- [ ] Maps contract type → color + background
- [ ] Types: vendor, license, partnership, customer, lease, nda
- [ ] Border-radius: 6px, padding: 3px 9px
- [ ] Text-transform: capitalize

---

### US-004: Create Risk Visualization Components (RiskBar, FlagsSummary)

**Priority**: P0

As a developer, I need components to visualize risk scores and flag summaries.

**RiskBar Component:**

- [ ] Horizontal progress bar: 72px wide, 5px tall
- [ ] Filled portion colored by risk level
- [ ] Score displayed in DM Mono weight 700, 12px
- [ ] Border-radius: 3px

**FlagsSummary Component:**

- [ ] Displays inline dots + counts for red/orange/green flags
- [ ] Colors: red=#EF4444, orange=#F59E0B, green=#10B981
- [ ] Font: DM Mono weight 700, 12px
- [ ] Shows "—" if no red/orange flags
- [ ] Gap: 7px between dots

---

### US-005: Create Layout Components (TopNav, PageShell)

**Priority**: P0

As a developer, I need navigation and page layout components to structure the app.

**TopNav Component:**

- [ ] Height: 56px, background: #0F172A
- [ ] Sticky, z-index 200
- [ ] Left: Logo box (28×28, #2563EB bg, rounded 7px) + "ContractIntel" text (15px weight 700)
- [ ] Center: Nav links with active state (rgba(255,255,255,0.08) bg, weight 600)
- [ ] Right: "+ Upload" button + user avatar (32×32, initials "JW", 70% opacity)
- [ ] Links: Home, Contracts, Playbook, Compare, Renewals, Settings
- [ ] onNav callback for screen changes

**PageShell Component:**

- [ ] Title (22px weight 700) + optional subtitle + optional action buttons
- [ ] Header bar: background #FFFFFF, border-bottom: 1px solid #E2E8F0
- [ ] Body: flex 1, overflow auto, background #FAFAF9
- [ ] Header padding: 20px 32px 16px
- [ ] noPad prop to disable body padding

---

### US-006: Create Modal & Tabs Components

**Priority**: P0

As a developer, I need modal dialog and tab navigation components.

**Modal Component:**

- [ ] Fixed overlay: rgba(0,0,0,0.4)
- [ ] Panel: background #FFFFFF, border-radius 12px, box-shadow 0 24px 64px rgba(0,0,0,0.18)
- [ ] Header: background #FFFFFF, border-bottom 1px solid #E2E8F0
- [ ] Title: 15px weight 700
- [ ] Close button (✕) top-right
- [ ] Click outside to close
- [ ] Max-width 480px, maxHeight 90vh
- [ ] onClose callback

**Tabs Component:**

- [ ] Horizontal tab bar, border-bottom 1px solid #E2E8F0
- [ ] Active tab: blue (#2563EB) text, bottom border 2px solid #2563EB, weight 700
- [ ] Inactive: #64748B text, weight 400
- [ ] Padding: 11px 18px per tab
- [ ] onChange callback

---

### US-007: Create Utility Components (SectionLabel, Divider, StatCard)

**Priority**: P1

As a developer, I need small utility components for consistent layout patterns.

**SectionLabel:**

- [ ] Font: 11px weight 700, uppercase, letter-spacing 0.08em
- [ ] Color: #94A3B8 (muted)
- [ ] Margin-bottom: 10px

**Divider:**

- [ ] Height: 1px, background: #E2E8F0
- [ ] Default margin: 20px vertical

**StatCard:**

- [ ] Background: #FFFFFF, border: 1px solid #E2E8F0, border-radius: 10px
- [ ] Padding: 16px 20px
- [ ] Label: 11px weight 700 uppercase, #94A3B8
- [ ] Value: 28px weight 800, DM Mono
- [ ] Optional sub-text: 12px, #94A3B8
- [ ] Supports color prop for value text

---

## Screen Implementation

### US-008: Home Screen / Landing Page

**Priority**: P1

As a user, I want to see a dashboard with key metrics and quick actions to understand my portfolio status.

**Acceptance Criteria:**

- [ ] Org banner at top: "Northwind Holdings Ltd" with status indicator
- [ ] Greeting: "Good morning, [name]"
- [ ] Summary text: critical flags count + urgent renewals count
- [ ] View all contracts + Upload contract buttons
- [ ] 4 KPI cards: Active contracts, Avg risk score, Critical flags, Renewals <60d
- [ ] "Where to start" card with upload CTA (dark background, gradient accent)
- [ ] "Pick up where you left off" card showing last opened contract
- [ ] "How it works" section: 4-step numbered process
- [ ] Recent contracts: 4 contract rows with type, risk score, dates
- [ ] Urgent renewals: 3 renewal rows with days remaining
- [ ] OnNav callback for CTA buttons

---

### US-009: Portfolio Screen (Contract List)

**Priority**: P1

As a user, I want to see all my contracts in a searchable, filterable list.

**Acceptance Criteria:**

- [ ] Page title: "Contracts"
- [ ] Filter strip with 4 inputs:
  - Search input (flex: 1, min-width 200px)
  - Risk filter: All / High / Medium / Low
  - Type filter: All / Vendor / License / Partnership / Customer / Lease / NDA
  - Sort: Risk / Date / Flags / Name
- [ ] Table with 8 columns: Contract name, Type (pill), Risk (badge), Flags (summary), Counterparty, Expiry date, Uploaded date, Status
- [ ] Table header: background #F4F3F1, font-size 10px, weight 700, uppercase
- [ ] Row hover: background #E8F4EF
- [ ] Status badge: "Complete" (green), "Processing" (blue with pulse animation)
- [ ] 8 rows per page, pagination buttons (28×28px)
- [ ] Clicking complete contract navigates to Results screen
- [ ] Filtering/sorting resets to page 1

**Layout Variants (from tweaks):**

- [ ] Table variant (default)
- [ ] Card variant (grid layout)
- [ ] Minimal variant (list with minimal info)

---

### US-010: Upload Screen

**Priority**: P1

As a user, I want to upload contract files with drag-and-drop support.

**Acceptance Criteria:**

- [ ] Centered form, max-width 560px
- [ ] Drag-and-drop zone:
  - Border: 2px dashed #CBD5E1
  - Hover state: border #2563EB, background #DBEAFE
  - Click triggers hidden file input
- [ ] File list below zone: filename + size + remove button per file
- [ ] Consent checkbox: "I agree to AI processing" (required)
- [ ] Cancel + Submit buttons
- [ ] Submit disabled until: files selected AND checkbox checked
- [ ] onDone callback with file list
- [ ] onBack callback for cancel

**Upload Style Variants (from tweaks):**

- [ ] Default size zone
- [ ] Large size zone

---

### US-011: Processing Screen

**Priority**: P1

As a user, I want to see upload progress and know what to expect next.

**Acceptance Criteria:**

- [ ] Centered layout
- [ ] Animated spinner: CSS @keyframes spin 2s linear, circle with stroke-dasharray
- [ ] "Analysis in progress" heading
- [ ] Explanatory copy: "We're analyzing your contracts..."
- [ ] Queued files list: filename + animated pulse dot per file
- [ ] "What happens next" section: 4 numbered steps with circle numbers
- [ ] "Back to Contracts" secondary button
- [ ] onDone callback when processing complete

---

### US-012: Results Screen (Contract Detail)

**Priority**: P2 (core detail view)

As a user, I want to view detailed contract information with risk flags and compliance status.

**Acceptance Criteria:**

- [ ] Breadcrumb: "Contracts" → "/" → contract name (truncated)
- [ ] Header buttons: Prev/Next contract, Export, Approve
- [ ] Left panel (flex: 1):
  - Tabs: Overview, Risk Flags (N), Document, History
  - Overview tab: Parties, Key Dates, Financial Terms (key-value rows)
  - Notes section: existing notes + add note input
  - Risk Flags tab: flag count summary, accordion rows per flag (expandable)
    - Collapsed: dot + title + section ref + chevron
    - Expanded: description + recommendation box + Resolve + Dismiss buttons
  - Document tab: PDF viewer + clause inspector panel (280px)
  - History tab: chronological activity feed with dots, timestamps, authors
- [ ] Right sidebar (280px):
  - Risk score card: large number (DM Mono 32px weight 900)
  - Risk level label
  - Flag count breakdown (red/orange/green)
  - Quick meta: Type, Counterparty, Effective date, Expires, etc.
- [ ] onNav callback for prev/next navigation
- [ ] onDeepDive callback for flag investigation
- [ ] onExport callback

**Risk Flag Styling (from tweaks):**

- [ ] Accordion variant (default)
- [ ] Cards variant

---

### US-013: DeepDive Screen (Flag Details)

**Priority**: P2

As a user, I want to investigate individual risk flags in detail.

**Acceptance Criteria:**

- [ ] Flag detail panel with: flag title, severity badge, description
- [ ] Document context: quoted text from contract showing the flagged clause
- [ ] Recommendation details with action items
- [ ] "Copy Clause" button
- [ ] Resolve / Dismiss / Back buttons
- [ ] onBack callback

---

### US-014: Compare Screen (Playbook)

**Priority**: P2

As a user, I want to compare contracts against our internal playbook standards.

**Acceptance Criteria:**

- [ ] Page title: "Playbook"
- [ ] Contract selector: dropdown to choose contract for comparison
- [ ] When contract selected:
  - Compliance bar: segmented progress (red/orange/green proportions)
  - "XX% aligned" text
  - Clause compliance counts
- [ ] Clause table:
  - Columns: Clause, Your Standard Position, Acceptable Range (no contract)
  - Columns: Clause, Your Standard Position, Contract Language, Status (with contract)
- [ ] "Your Standard Position" cells: hover shows Edit button → inline textarea
- [ ] Status badges: ✓ Compliant (green), ⚠ Deviation (orange), ✕ Non-compliant (red), — N/A (muted)
- [ ] "View flag →" link for non-compliant clauses
- [ ] Save/Cancel buttons on edit

---

### US-015: Renewals Screen

**Priority**: P2

As a user, I want to track upcoming renewals and prioritize action items.

**Acceptance Criteria:**

- [ ] Page title: "Renewals"
- [ ] Full-width table sorted by daysRemaining ascending
- [ ] Columns: Contract name, Renewal date, Days remaining, Notice period, Risk score, Status
- [ ] Left border color by urgency:
  - Red: <0 days (overdue) or <30 days
  - Orange: <60 days
  - Green: ≥60 days
- [ ] Days column text: "Xd overdue", "TODAY", or "Xd"
- [ ] Row click: toggle detail panel (280px right sidebar)
- [ ] Detail panel: renewal status, contract name, key dates, risk score, "View Contract" + "Acknowledge" buttons
- [ ] Row selection state persists

---

### US-016: Settings Screen

**Priority**: P3

As an admin, I want to manage team members, billing, and audit logs.

**Acceptance Criteria:**

- [ ] Page title: "Settings"
- [ ] 3 tabs: Team, Billing, Audit Log
- [ ] **Team tab:**
  - Table: Member (name + email), Role (select), Last Active, Status (● Active / ⏳ Pending), Actions
  - Remove button on each row (except admin)
  - Role select: Admin, Reviewer, Viewer
- [ ] **Billing tab:**
  - Plan card: plan name, price/limit, usage progress bar, usage count
  - Current plan: "Professional"
  - Usage: 72% shown as example
- [ ] **Audit Log tab:**
  - Placeholder content for v1

---

### US-017: Export Screen

**Priority**: P3

As a user, I want to export contract data in standard formats.

**Acceptance Criteria:**

- [ ] Page title: "Export"
- [ ] Format selector: PDF, Excel, CSV
- [ ] Include options: Summary, Full Analysis, Risk Flags Only
- [ ] Recipients field: email addresses for automated send
- [ ] Generate + Send buttons
- [ ] Export preview
- [ ] onBack callback

---

## Data & State Management

### US-018: Define Data Model & Sample Data

**Priority**: P0

As a developer, I need sample data matching the design specification.

**Acceptance Criteria:**

- [ ] Contract type: id, name, type, riskScore (0-10), flags {red, orange, green}, parties, uploadDate, status, dates, financial terms, riskFlags array
- [ ] RiskFlag type: id, severity, title, description, recommendation, page, section, status
- [ ] Renewal type: id, contractId, name, renewalDate, daysRemaining, noticePeriod, status, riskScore
- [ ] TeamMember type: id, name, email, role, lastLogin, status, avatar
- [ ] 9+ contracts in sample data with various risk scores and statuses
- [ ] 6+ renewals with varied daysRemaining
- [ ] 5+ team members with different roles

---

## Interactions & Animations

### US-019: Implement Screen Routing & Navigation

**Priority**: P1

As a user, I need smooth navigation between screens with proper state management.

**Acceptance Criteria:**

- [ ] TopNav handles screen switching
- [ ] Screen state persists selectedContractId during detail/deepdive navigation
- [ ] Back buttons return to previous screen with state intact
- [ ] Breadcrumbs on detail screens
- [ ] Upload → Processing → Results flow works end-to-end

---

### US-020: Implement Flag Resolution Interactions

**Priority**: P2

As a user, I want to resolve and dismiss risk flags with visual feedback.

**Acceptance Criteria:**

- [ ] Resolve button: flag opacity 0.5, add "✓ Resolved" label
- [ ] Dismiss button: flag removed from list (filtered from view)
- [ ] State persists during session
- [ ] "Mark note resolved" on notes: adds "✓ Resolved" label

---

### US-021: Implement Playbook Edit Interactions

**Priority**: P2

As a user, I want to edit standard positions inline and save changes.

**Acceptance Criteria:**

- [ ] Hover "Your Standard Position" cell: Edit button appears (opacity 0→1 transition)
- [ ] Click: cell becomes textarea with Save/Cancel
- [ ] Save: updates state, closes editor
- [ ] Cancel: discards changes, closes editor
- [ ] Visual feedback on save (toast or state confirmation)

---

### US-022: Implement CSS Animations

**Priority**: P1

As a user, I want smooth, subtle animations for better UX.

**Acceptance Criteria:**

- [ ] Processing spinner: @keyframes spin 2s linear infinite
- [ ] Processing file pulse: @keyframes pulse 1.4s infinite, staggered per file
- [ ] Contracts processing badge pulse: @keyframes pulse 1.2s infinite
- [ ] Button/link hover: transition all 0.15s
- [ ] Modal fade in/out: smooth transitions
- [ ] Tab switch: color transition 0.12s

---

## Polish & Refinement

### US-023: Implement Responsive Design

**Priority**: P2

As a user on mobile/tablet, I want the interface to remain usable.

**Acceptance Criteria:**

- [ ] TopNav collapses on mobile (<768px)
- [ ] Sidebar detail panels stack below on mobile
- [ ] Filter strip wraps on tablet
- [ ] Table scrolls horizontally on mobile
- [ ] Buttons remain accessible on touch devices
- [ ] Modal max-width: 92vw

---

### US-024: Implement Accessibility (a11y)

**Priority**: P2

As a user with accessibility needs, I want keyboard navigation and screen reader support.

**Acceptance Criteria:**

- [ ] Buttons have focus-visible outline: 2px solid #2563EB
- [ ] Form inputs accessible with labels
- [ ] Modal focus trap (focus doesn't escape modal)
- [ ] Color alone doesn't convey meaning (risk labels text + color)
- [ ] Semantic HTML: buttons, nav, main, section
- [ ] ARIA labels where needed (close button, etc.)

---

### US-025: Performance Optimization

**Priority**: P3

As a user, I want the app to load and respond quickly.

**Acceptance Criteria:**

- [ ] Code splitting by screen
- [ ] Memoization of expensive components (list tables, modals)
- [ ] Lazy load images
- [ ] Debounce search/filter inputs
- [ ] Virtual scrolling for large tables

---

## Quality Assurance

### US-026: Visual Regression Testing

**Priority**: P2

As a developer, I need tests to catch unintended design changes.

**Acceptance Criteria:**

- [ ] Screenshot tests for each screen
- [ ] Component-level visual tests (buttons, badges, etc.)
- [ ] Color accuracy verification
- [ ] Font weight/size verification
- [ ] Spacing/alignment verification

---

### US-027: Functional Testing

**Priority**: P2

As a developer, I need tests to verify core interactions work.

**Acceptance Criteria:**

- [ ] Navigation between screens works
- [ ] Filter/search updates results
- [ ] Sort changes table order
- [ ] Flag expand/collapse works
- [ ] File upload triggers processing flow
- [ ] Form validation works
- [ ] Modal close button works

---

## Summary

**Total User Stories**: 27  
**P0 (Blocks all)**: 7 stories (Design system + core components)  
**P1 (Primary implementation)**: 10 stories (Screens + navigation)  
**P2 (Core features)**: 8 stories (Detail views, interactions, testing)  
**P3 (Polish)**: 2 stories (Export, accessibility, performance)

**Estimated Implementation Order**:

1. Design tokens & components (US-001 → US-007)
2. Layout shells (US-008 → US-011)
3. Core screens (US-012 → US-016)
4. Routing & state (US-019 → US-022)
5. Polish (US-023 → US-027)

---

## Notes for Implementation

- **No tweaks panel needed in production** — remove `TweaksPanel` component, keep variants configurable via props/state
- **Font imports**: Add Google Fonts link for DM Sans (400,600,700,800) and DM Mono (400,600,700)
- **Color system**: Implement as JavaScript tokens object (T = { ... }) for dynamic theming
- **Responsive breakpoints**: Design is desktop-first; test at 1920px, 1440px, 768px, 375px
- **Data source**: Sample data provided in design; replace with API calls to backend
- **Component library**: Build once, reuse across all screens
