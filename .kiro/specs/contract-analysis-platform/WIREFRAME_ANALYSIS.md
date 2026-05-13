# Wireframe Analysis & Implementation Plan

## Overview

High-fidelity wireframes from Claude Design have been analyzed and integrated into the implementation plan. The wireframes provide pixel-perfect designs for all 10 core screens with complete design tokens, components, and responsive behavior.

## Wireframe Assets Location

```
wirframes/project/ci-redesign/
├── ContractIntel Redesign.html    # Main design file (READ THIS FIRST)
├── tokens.js                       # Design tokens (colors, typography, spacing)
├── components.jsx                  # Reusable UI components
├── screens-a.jsx                   # Screens 1-4 (Home, Upload, Processing, Results)
├── screens-b.jsx                   # Screens 5-10 (DeepDive, Compare, Portfolio, etc.)
└── app.jsx                         # App shell with navigation
```

## Available Screens

### ✅ Screen 1: Home / Dashboard
**File**: `screens-a.jsx` → `HomeScreen`
**Complexity**: High (10+ sub-components)
**Key Features**:
- Org banner with system status
- Personalized greeting with critical metrics
- 4 KPI cards (active contracts, avg risk, critical flags, renewals)
- "Where to start" section (upload CTA + quick actions)
- Recent contracts table (4 rows)
- Urgent renewals table (3 rows)
- "How it works" 4-step process
- Playbook examples + team contacts

**Data Requirements**:
- User info (name, role)
- Contract statistics (active, in progress, avg risk, flags)
- Recent contracts (sorted by uploadDate DESC, limit 4)
- Urgent renewals (sorted by daysRemaining ASC, limit 3)

---

### ✅ Screen 2: Upload
**File**: `screens-a.jsx` → `UploadScreen`
**Complexity**: Medium
**Key Features**:
- Drag-and-drop zone with hover states
- File list with size display and remove buttons
- Consent checkbox (required)
- Submit button (disabled until files + consent)
- Reassurance text (encrypted, never shared, delete anytime)

**Variants**:
- `uploadStyle`: 'default' | 'simple' (affects padding)

---

### ✅ Screen 3: Processing
**File**: `screens-a.jsx` → `ProcessingScreen`
**Complexity**: Low
**Key Features**:
- Animated spinner (CSS @keyframes)
- "Analysis in progress" heading
- Queued files list with animated pulse dots
- "What happens next" 4-step explanation
- "Back to Contracts" button

---

### ✅ Screen 4: Results / Contract Detail
**File**: `screens-a.jsx` → `ResultsScreen`
**Complexity**: Very High (most complex screen)
**Key Features**:
- Breadcrumb navigation
- Header buttons: Prev/Next, Export, Approve
- **Left panel** (tabs):
  - Overview: Parties, Key Dates, Financial Terms, Notes
  - Risk Flags: Accordion with expand/collapse, Resolve/Dismiss buttons
  - Document: PDF viewer + clause inspector (280px sidebar)
  - History: Activity feed with timestamps
- **Right sidebar** (280px):
  - Risk score card (large number, DM Mono 32px)
  - Risk level label
  - Flag count breakdown (red/orange/green)
  - Quick meta: Type, Counterparty, Dates, etc.

**Responsive**:
- Split layout (left + right) on desktop
- Vertical stack on mobile (sidebar moves below)

---

### ✅ Screen 5: DeepDive / Flag Detail
**File**: `screens-b.jsx` → `DeepDiveScreen`
**Complexity**: Medium
**Key Features**:
- Flag severity header (colored background)
- "What this means" section
- "The actual clause" (quoted text with source)
- "Why it matters" (risk explanation)
- "Market standard" (checklist)
- "What to ask for" (copy-paste language)
- Actions: Resolve, Dismiss, Back

---

### ✅ Screen 6: Compare
**File**: `screens-b.jsx` → `CompareScreen`
**Complexity**: Very High (complex grid logic)
**Key Features**:
- Contract selection bar (2-5 contracts)
- Add/remove contracts with picker dropdown
- Winner recommendation (if clear winner exists)
- Comparison grid:
  - Sticky header row with contract names
  - Grouped rows: Parties, Dates, Financial, Risk Profile, Key Clauses
  - Color-coded cells: green (better), red (worse), neutral
  - Checkmarks/X marks for boolean clauses
- Export modal (PDF, XLSX, DOCX)
- Legend

**Logic**:
- Median-based scoring for numeric values
- Boolean scoring for yes/no clauses
- Winner determination: most "better" verdicts, fewest "worse"

---

### ✅ Screen 7: Portfolio / Contract List
**File**: `screens-b.jsx` → `PortfolioScreen`
**Complexity**: High
**Key Features**:
- Filter strip: Search, Risk filter, Type filter, Sort
- Table with 8 columns: Name, Type, Risk, Flags, Counterparty, Expiry, Uploaded, Status
- Row hover: background change
- Status badge: "Complete" (green), "Processing" (blue with pulse)
- Pagination (8 rows per page)
- Click row: navigate to Results screen

**Variants**:
- `layoutVariant`: 'table' | 'cards' | 'minimal'

---

### ✅ Screen 8: Renewals
**File**: `screens-b.jsx` → `RenewalsScreen`
**Complexity**: Medium
**Key Features**:
- Full-width table sorted by daysRemaining ASC
- Columns: Contract name, Renewal date, Days remaining, Notice period, Risk score, Status
- Left border color by urgency:
  - Red: <0 days (overdue) or <30 days
  - Orange: <60 days
  - Green: ≥60 days
- Days column text: "Xd overdue", "TODAY", or "Xd"
- Row click: toggle detail panel (280px right sidebar)
- Detail panel: renewal status, dates, risk score, "View Contract" + "Acknowledge" buttons

---

### ✅ Screen 9: Settings
**File**: `screens-b.jsx` → `SettingsScreen`
**Complexity**: Medium
**Key Features**:
- 3 tabs: Team, Billing, Audit Log
- **Team tab**:
  - Table: Member (name + email), Role (select), Last Active, Status, Actions
  - Remove button (except admin)
  - Role select: Admin, Reviewer, Viewer
- **Billing tab**:
  - Plan card: name, price/limit, usage progress bar, usage count
  - Current plan: "Professional"
- **Audit Log tab**:
  - Placeholder for v1

---

### ✅ Screen 10: Export
**File**: `screens-b.jsx` → `ExportScreen`
**Complexity**: Low
**Key Features**:
- Format selector: PDF, Excel, CSV
- Include options: Summary, Full Analysis, Risk Flags Only
- Recipients field: email addresses
- Generate + Send buttons
- Export preview

---

## Design System Components

### Shadcn UI Integration Strategy

We'll use **Shadcn UI** as the foundation and customize it to match the wireframe designs. This gives us:
- ✅ Accessible components out of the box (WCAG AA compliant)
- ✅ Radix UI primitives (battle-tested, production-ready)
- ✅ Tailwind CSS styling (matches our design tokens approach)
- ✅ Copy-paste components (no npm package, full control)
- ✅ TypeScript support
- ✅ Dark mode ready

### Component Mapping: Wireframe → Shadcn UI

| Wireframe Component | Shadcn UI Base | Customization Needed |
|---------------------|----------------|----------------------|
| **Btn** (Button) | `button` | ✅ Add variants: success, dark; customize colors |
| **Badge** | `badge` | ✅ Add dot prop, custom colors |
| **RiskBadge** | `badge` | ✅ Custom: risk score display, DM Mono font, colored dot |
| **TypePill** | `badge` | ✅ Custom: contract type color mapping |
| **RiskBar** | `progress` | ✅ Custom: 72px width, risk color coding |
| **FlagsSummary** | Custom | ❌ Build from scratch (inline dots + counts) |
| **TopNav** | `navigation-menu` | ✅ Custom: sticky header, mobile drawer |
| **PageShell** | Custom layout | ❌ Build from scratch (page container) |
| **SectionLabel** | Custom | ❌ Build from scratch (simple styled div) |
| **Divider** | `separator` | ✅ Use as-is |
| **StatCard** | `card` | ✅ Customize content layout |
| **Modal** | `dialog` | ✅ Customize styling to match wireframe |
| **Tabs** | `tabs` | ✅ Customize styling to match wireframe |

### Additional Shadcn UI Components to Use

| Component | Use Case | Screens |
|-----------|----------|---------|
| `dropdown-menu` | User avatar menu, filter dropdowns | TopNav, Portfolio |
| `select` | Role selector, filter selects | Settings, Portfolio |
| `input` | Search, form fields | Portfolio, Upload |
| `textarea` | Notes, comments | Results |
| `checkbox` | Consent checkbox, multi-select | Upload, Settings |
| `radio-group` | Export format selection | Export |
| `table` | Contract list, renewals, compare | Portfolio, Renewals, Compare |
| `accordion` | Risk flags expand/collapse | Results |
| `scroll-area` | Long content areas | Results, Compare |
| `toast` | Success/error notifications | All screens |
| `alert` | Info banners, warnings | Home, Results |
| `avatar` | User profile pictures | TopNav, Settings |
| `skeleton` | Loading states | All screens |
| `command` | Search with keyboard shortcuts | Portfolio (future) |

### Custom Components (Not in Shadcn UI)

These need to be built from scratch but can use Shadcn UI primitives:

1. **RiskBadge** - Custom badge with risk score + colored dot
2. **TypePill** - Custom badge with contract type color mapping
3. **RiskBar** - Custom progress bar with risk color coding
4. **FlagsSummary** - Inline dots + counts display
5. **TopNav** - Navigation with mobile drawer (uses `navigation-menu` + `sheet`)
6. **PageShell** - Page layout container
7. **SectionLabel** - Uppercase label component
8. **StatCard** - KPI card (uses `card` as base)
9. **OrgBanner** - Organization header banner
10. **GreetingSection** - Dashboard greeting with metrics

---

## Design Tokens (from `tokens.js`)

### Colors
```javascript
bg:        '#FAFAF9'   // Background
bgAlt:     '#F4F3F1'   // Alternate background
surface:   '#FFFFFF'   // Card/panel background
ink:       '#0F172A'   // Primary text
inkMid:    '#334155'   // Secondary text
inkSoft:   '#64748B'   // Tertiary text
inkMute:   '#94A3B8'   // Muted text
border:    '#E2E8F0'   // Border
borderMid: '#CBD5E1'   // Mid border

blue:      '#2563EB'   // Primary accent
blueDark:  '#1D4ED8'
blueLight: '#DBEAFE'
blueMid:   '#93C5FD'

green:     '#10B981'   // Success
orange:    '#F59E0B'   // Warning
red:       '#EF4444'   // Error

nav:       '#0F172A'   // Nav background
navBorder: '#1E293B'   // Nav border
```

### Typography
- **Font families**: DM Sans (UI), DM Mono (data/numbers)
- **Font weights**: 400, 500, 600, 700, 800
- **Font sizes**: 10px, 11px, 12px, 13px, 14px, 15px, 16px, 18px, 22px, 28px, 32px

### Spacing
- Padding: 32px (desktop), 20px (tablet), 16px (mobile), 14px (small mobile)
- Gap: 8px, 10px, 12px, 14px, 16px, 18px, 20px

### Border Radius
- sm: 4px
- md: 6px, 8px
- lg: 10px, 12px
- full: 50% (circles)

### Breakpoints
- xs: ≤420px (small phone)
- sm: ≤640px (phone)
- md: ≤860px (tablet)
- lg: ≤1100px (tablet landscape)

---

## Responsive Behavior

### Mobile (≤640px)
- Nav links hidden, hamburger shown
- Grids collapse: 4-col → 2-col → 1-col
- Padding reduced: 32px → 16px
- Font sizes reduced
- Tables scroll horizontally
- Results screen: split → vertical stack

### Tablet (≤860px)
- Nav links hidden, hamburger shown
- Grids: 4-col → 2-col
- Padding: 32px → 20px
- Tables scroll horizontally

### Desktop (>860px)
- Full nav links visible
- Multi-column grids
- Split layouts (Results screen)
- Full padding

---

## Implementation Priority

### Phase 1: Foundation (Week 1-2)
1. ✅ Project scaffold (NestJS + React + Prisma)
2. ✅ Shared kernel (Result, exceptions, base classes)
3. ✅ Prisma schema
4. ✅ Configuration service
5. ✅ Logging infrastructure
6. ✅ Testing infrastructure

### Phase 2: Design System (Week 2-3)
1. Design tokens setup
2. Core UI components (Button, Badge, RiskBadge, TypePill, etc.)
3. Layout components (TopNav, PageShell, Modal, Tabs)
4. Responsive CSS
5. Tailwind configuration
6. Storybook setup

### Phase 3: Authentication (Week 3-4)
1. Auth0 integration
2. Session management
3. User aggregate
4. Login/logout flows
5. Protected routes

### Phase 4: Home Screen (Week 4-5)
1. Reference data API
2. Dashboard metrics calculation
3. Home screen UI components
4. Recent contracts + renewals
5. KPI cards

### Phase 5: Document Ingestion (Week 5-6)
1. Upload screen UI
2. Document aggregate
3. File upload API
4. Storage service (local/GCS)
5. Processing screen UI

### Phase 6: OCR & Clause Extraction (Week 6-8)
1. Google Document AI integration
2. Claude API integration
3. Clause aggregate
4. Risk scoring engine
5. Results screen UI

### Phase 7: Remaining Screens (Week 8-12)
1. Portfolio screen
2. Compare screen
3. Renewals screen
4. Settings screen
5. DeepDive screen
6. Export screen

---

## Next Steps

1. **Review wireframes** in browser:
   ```bash
   cd wirframes/project/ci-redesign
   open "ContractIntel Redesign.html"
   ```

2. **Start with Phase 1** (Foundation):
   - Initialize NestJS backend
   - Initialize React frontend
   - Set up Prisma with SQLite

3. **Then Phase 2** (Design System):
   - Extract design tokens
   - Build core components
   - Set up Storybook

4. **Iterate through phases** following the task breakdown in `tasks.md`

---

## Questions to Resolve

1. **Authentication**: Use Auth0 or build custom? (Design doc says Auth0)
2. **Database**: SQLite (local) → PostgreSQL (production)? (Design doc confirms)
3. **File storage**: Local filesystem (dev) → GCS (production)? (Design doc confirms)
4. **OCR**: Mock (dev) → Google Document AI (production)? (Design doc confirms)
5. **AI**: Claude API for clause extraction? (Design doc confirms)
6. **Queue**: In-memory (dev) → BullMQ + Redis (production)? (Design doc confirms)

All questions already answered in design doc ✅

---

## Success Criteria

- [ ] All 10 screens implemented pixel-perfect to wireframes
- [ ] All 13 reusable components working
- [ ] Responsive on mobile, tablet, desktop
- [ ] Accessible (WCAG AA)
- [ ] Backend APIs for all screens
- [ ] Clean Architecture maintained
- [ ] TDD approach (tests first)
- [ ] Storybook for all components
- [ ] End-to-end user flows working
