# US-008: Home Screen / Landing Page

**Epic**: Core Screens  
**Priority**: P1  
**Story Points**: 13  
**Status**: Ready for Implementation  

---

## User Story

As a **legal operations manager**, I want to see a personalized dashboard with key portfolio metrics and urgent alerts so that I can quickly understand my contract portfolio health and prioritize actions.

---

## Acceptance Criteria

### Layout & Structure
- [ ] Page uses PageShell component (no custom title bar needed — org banner replaces header)
- [ ] Full-height scrollable container with background color #FAFAF9
- [ ] Max-width 1120px centered layout with horizontal padding 32px
- [ ] All sections have proper vertical spacing (margins documented below)

### Org Banner (Top)
- [ ] Background: #FFFFFF
- [ ] Border-bottom: 1px solid #E2E8F0
- [ ] Padding: 14px 32px
- [ ] Content row with flex layout:
  - **Left section**:
    - Icon: SVG (14×14) showing chart/graph
    - Text: **"Northwind Holdings Ltd"** (weight 700, color #0F172A)
    - Divider: "·" (color #94A3B8)
    - Description: "Legal Operations · Contract Review Workspace"
  - **Right section** (margin-left: auto):
    - Status dot: 6px circle, background #10B981
    - Text: "All systems operational" (color #94A3B8, font-size 12px)
- [ ] Font: DM Sans, font-size 12px throughout

### Greeting Section
- [ ] Padding: 36px 32px 24px (within 1120px container)
- [ ] Two-column flex layout: left (greeting + context) | right (buttons)
- [ ] **Left Column**:
  - Heading: "Good morning, [userName]." (font-size 32px, weight 800, color #0F172A, letter-spacing -0.03em)
  - Context paragraph (font-size 15px, color #64748B):
    - Text: "You have **{criticalFlagCount} critical flags** across your portfolio and **{urgentRenewals} urgent renewals** in the next 60 days."
    - Critical flags text (within `<strong>`): color #EF4444
    - Urgent renewals text (within `<strong>`): 
      - Color #F59E0B if count > 0 and daysRemaining < 60
      - Color #0F172A otherwise
- [ ] **Right Column** (flex: 0 0 auto):
  - Two buttons in row:
    1. "View all contracts" button (secondary variant)
    2. "+ Upload contract" button (primary variant)
  - Gap between buttons: 10px

### KPI Cards Section
- [ ] Grid: `gridTemplateColumns: repeat(4, 1fr)`
- [ ] Gap: 12px
- [ ] Margin-bottom: 32px
- [ ] **4 Cards** with data:

#### Card 1: Active Contracts
- Label: "Active Contracts"
- Value: {activeContractCount}
- Sub-text: "{inProgressCount} in review"
- Color: #0F172A (text color for value)

#### Card 2: Average Risk Score
- Label: "Average Risk Score"
- Value: {avgRiskScore} (rounded to 1 decimal)
- Sub-text: Risk classification based on value
  - If ≥ 7: "High — review needed" (color #EF4444)
  - If ≥ 4: "Medium" (color #F59E0B)
  - If < 4: "Low" (color #10B981)
- Value color: matches sub-text color

#### Card 3: Critical Flags Open
- Label: "Critical Flags Open"
- Value: {redFlagCount}
- Sub-text: "Across all contracts"
- Color: #EF4444 (red)

#### Card 4: Renewals < 60 Days
- Label: "Renewals < 60 days"
- Value: {urgentRenewalCount}
- Sub-text: 
  - If count > 0: "Next: {nextRenewalDate}" (format: YYYY-MM-DD)
  - If count = 0: "—"
- Color: #F59E0B (orange) if count > 0, else #0F172A

**Card Styling** (StatCard component):
- Background: #FFFFFF
- Border: 1px solid #E2E8F0
- Border-radius: 10px
- Padding: 14px 18px
- Label styling: font-size 11px, weight 700, uppercase, letter-spacing 0.07em, color #94A3B8
- Value styling: font-size 28px, weight 800, font-family DM Mono, line-height 1.1
- Sub-text styling: font-size 11px, color #64748B, margin-top 4px

### "Where to Start" Section
- [ ] Grid: `gridTemplateColumns: 1.4fr 1fr` (primary CTA larger than secondary)
- [ ] Gap: 16px
- [ ] Margin-bottom: 36px

#### Left Card: Upload CTA
- Background: #0F172A (dark)
- Border-radius: 12px
- Padding: 24px 28px
- Cursor: pointer
- Position: relative, overflow: hidden
- Text color: #FFFFFF
- **Decorative background element**: 
  - Position: absolute, top -40px, right -40px
  - Size: 180×180px circle
  - Background: #2563EB with opacity 0.18
  - Z-index: lower than content

- **Content** (position: relative):
  - **Top label**: "Where to start" (font-size 11px, weight 700, uppercase, letter-spacing 0.08em, opacity 0.55)
  - **Title**: "Send a contract for review" (font-size 22px, weight 700, letter-spacing -0.02em, margin-bottom 6px)
  - **Description**: "Drop a PDF or Word file here and ContractIntel will run it against the Northwind playbook before passing it to a reviewer." (font-size 13px, color rgba(255,255,255,0.72), line-height 1.6, max-width 420px, margin 0 0 18px)
  - **CTA Row** (display flex, gap 10px, flex-wrap wrap):
    - Button: "+ Upload contract" (primary variant, size md)
    - Helper text: "PDF, DOCX · up to 50 MB · 60s analysis" (font-size 12px, opacity 0.55)

- **Interaction**: `onClick={() => onNav('upload')}`

#### Right Column: Resume + Sample
- Display: flex, flex-direction: column, gap 10px

##### Resume Card (if lastOpenedContract exists)
- Background: #FFFFFF
- Border: 1px solid #E2E8F0
- Border-radius: 10px
- Padding: 14px 16px
- Cursor: pointer
- Transition: border-color 0.15s
- Hover state: border-color #CBD5E1

- **Content**:
  - Label: "Pick up where you left off" (font-size 11px, weight 700, uppercase, letter-spacing 0.07em, color #94A3B8, margin-bottom 6px)
  - Contract name: {lastOpenedContractName} (font-size 14px, weight 700, color #0F172A, overflow hidden, text-overflow ellipsis, white-space nowrap, margin-bottom 4px)
  - Risk badge: RiskBadge component (size sm) showing risk score
  - Type pill: TypePill component showing contract type
  - Dates row: "Expires {expiryDate}" (font-size 12px, color #64748B)

- **Interaction**: `onClick={() => onNav('results', { contractId: lastOpenedContractId })}`

##### Sample Card (secondary CTA)
- Same styling as resume card
- Content:
  - Label: "Explore" (or "View example")
  - Text: "See a full contract analysis" (font-size 14px, weight 700)
  - Description: "Browse a sample contract with AI flags and recommendations" (font-size 12px, color #64748B)

- **Interaction**: `onClick={() => onNav('results', { contractId: 1 })}` (sample contract)

### How It Works Section
- [ ] Margin-bottom: 36px
- [ ] **Title**: "How it works" (font-size 18px, weight 700, color #0F172A, margin-bottom 20px)
- [ ] **4-step process grid**: `gridTemplateColumns: repeat(4, 1fr)`, gap 20px

#### Each Step Card
- Display: flex, flex-direction: column, gap 12px
- **Step number**: {n} (e.g., "01") — font-size 32px, weight 800, color #2563EB, font-family DM Mono
- **Step label**: {label} — font-size 14px, weight 700, color #0F172A
- **Description**: {desc} — font-size 13px, color #64748B, line-height 1.5
- **Who**: {who} — font-size 12px, color #94A3B8, font-style italic

**Step data**:
1. n: "01", label: "Upload", desc: "Drop in any vendor, licence or partnership contract — PDF or DOCX.", who: "Anyone in Legal Ops"
2. n: "02", label: "AI review", desc: "ContractIntel scans every clause against the Northwind playbook.", who: "Automated · ~60 seconds"
3. n: "03", label: "Reviewer sign-off", desc: "A reviewer confirms risk flags and adds notes for the business owner.", who: "Reviewer / Senior Counsel"
4. n: "04", label: "Approve & file", desc: "Approved contracts are filed to the register; renewals tracked automatically.", who: "Head of Legal"

### Recent Contracts Section
- [ ] **Title**: "Recently uploaded" or "Recent contracts" (font-size 16px, weight 700, color #0F172A, margin-bottom 12px)
- [ ] Margin-bottom: 32px
- [ ] **Table** showing 4 most recent complete contracts (sorted by uploadDate DESC)

**Table Structure**:
- Columns: Contract name, Type, Risk score, Uploaded date
- Rows: up to 4
- Header row:
  - Background: #F4F3F1
  - Font-size: 10px, weight 700, uppercase, letter-spacing 0.06em
  - Color: #64748B
  - Padding: 10px 14px
  - Border-bottom: 1px solid #E2E8F0

- Body rows (per recent contract):
  - Padding: 12px 14px
  - Alternating background: #FFFFFF / #F4F3F1
  - Hover: background #E8F4EF (clickable)
  - Cursor: pointer
  - Border-bottom: 1px solid #E2E8F0
  
  - **Contract name column**: weight 600, max-width 240px, truncated with ellipsis
  - **Type column**: TypePill component
  - **Risk column**: RiskBadge component (size sm)
  - **Uploaded column**: date in format MM/DD/YYYY, font-family DM Mono, font-size 12px

- **Interaction**: Click row → `onNav('results', { contractId: contract.id })`

### Urgent Renewals Section
- [ ] **Title**: "Urgent renewals" (font-size 16px, weight 700, color #0F172A, margin-bottom 12px)
- [ ] Margin-bottom: 40px
- [ ] **Table** showing 3 renewals with smallest daysRemaining (sorted ascending)

**Table Structure**:
- Columns: Contract name, Renewal date, Days remaining, Status
- Rows: up to 3
- Same header styling as recent contracts table

- Body rows (per urgent renewal):
  - Padding: 12px 14px
  - Alternating background: #FFFFFF / #F4F3F1
  - **Left border** (4px solid) colored by urgency:
    - Red (#EF4444): if daysRemaining < 0 (overdue) or daysRemaining < 30
    - Orange (#F59E0B): if daysRemaining < 60
    - Green (#10B981): otherwise
  - Hover: background #E8F4EF
  - Cursor: pointer
  - Border-bottom: 1px solid #E2E8F0

  - **Contract name column**: weight 600, truncated
  - **Renewal date**: format YYYY-MM-DD, font-family DM Mono, font-size 12px
  - **Days remaining**:
    - If daysRemaining < 0: "{abs(daysRemaining)}d overdue" (color #EF4444, weight 700)
    - If daysRemaining = 0: "TODAY" (color #EF4444, weight 700)
    - Otherwise: "{daysRemaining}d" (color based on threshold)
    - Font-size 12px
  - **Status badge**: color coded by status (overdue/urgent/ontrack)

- **Interaction**: Click row → navigate to renewals screen with renewal selected

---

## Props Interface

```typescript
interface HomeScreenProps {
  onNav: (screen: string, extra?: { contractId?: number; flagId?: number }) => void;
}
```

### Required Data (from context/store):
- `contracts: Contract[]` - list of all contracts
- `renewals: Renewal[]` - list of all renewals
- `currentUser: { name: string }` - logged-in user info

### Computed Values:
- `completeContracts = contracts.filter(c => c.status === 'complete')`
- `activeContractCount = completeContracts.length`
- `inProgressCount = contracts.filter(c => c.status !== 'complete').length`
- `avgRiskScore = (completeContracts.reduce((sum, c) => sum + c.riskScore, 0) / Math.max(1, completeContracts.length)).toFixed(1)`
- `criticalFlagCount = completeContracts.reduce((sum, c) => sum + c.flags.red, 0)`
- `urgentRenewals = renewals.filter(r => r.daysRemaining < 60)`
- `recentContracts = completeContracts.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 4)`
- `lastOpenedContract = completeContracts[0]`
- `urgentRenewalsList = renewals.sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 3)`

---

## Design Specifications

### Colors Used
- Background: #FAFAF9
- Surface: #FFFFFF
- Text (primary): #0F172A
- Text (secondary): #64748B
- Text (muted): #94A3B8
- Border: #E2E8F0
- Risk (red): #EF4444
- Risk (orange): #F59E0B
- Risk (green): #10B981
- Accent (blue): #2563EB

### Typography
- Font family: DM Sans (all text except dates/scores)
- Monospace: DM Mono (for dates, scores, numbers)
- Base sizes: 11px (labels), 12px (body), 13px (descriptions), 14px (UI), 15px (context), 18px (section titles), 22px (card titles), 32px (greeting)

### Spacing
- Container padding: 32px horizontal
- Section margin-bottom: 20-40px (documented per section)
- Card padding: 14px 18px (StatCard), 24px 28px (CTA cards), 14px 16px (table rows)
- Grid gaps: 12px (KPI cards), 16px (where-to-start), 20px (how-it-works)

### Border Radius
- Cards: 10px
- Buttons: 8px
- CTA card: 12px
- Badges/pills: 6px

### Shadows
- No drop shadows on main content
- Modal-only shadow (if modals appear on this screen)

---

## Interactions

| Trigger | Behavior |
|---------|----------|
| Click "View all contracts" | Navigate to portfolio screen |
| Click "+ Upload contract" button | Navigate to upload screen |
| Click upload CTA card | Navigate to upload screen |
| Click recent contract row | Navigate to results screen with contractId |
| Click resume card | Navigate to results screen with lastOpenedContractId |
| Click sample card | Navigate to results screen with sample contractId (1) |
| Click urgent renewal row | Navigate to renewals screen with renewal selected |

---

## Edge Cases & States

### No Contracts Yet
- [ ] If `completeContracts.length = 0`:
  - Average risk score shows "—"
  - "Active contracts" shows "0"
  - Critical flags shows "0"
  - Recent contracts section hidden or shows placeholder: "No contracts uploaded yet"
  - Resume card hidden

### No Renewals Yet
- [ ] If `urgentRenewals.length = 0`:
  - "Renewals < 60 days" shows "0"
  - Urgent renewals section hidden or shows placeholder: "No urgent renewals"

### All Renewals >60 Days
- [ ] Urgent renewals section hidden or shows placeholder

### User Name Missing
- [ ] Greeting defaults to "Good morning" (without name) or shows placeholder

---

## Component Dependencies

- **TopNav** (sticky at top, passed `screen='home'`)
- **PageShell** (optional — main layout handled by sections)
- **Btn** (variant: primary, secondary; size: md, sm)
- **RiskBadge** (size: sm)
- **TypePill** (type from contract)
- **StatCard** (4 instances for KPIs)

---

## Testing Requirements

### Unit Tests
- [ ] Correct KPI calculations (active count, avg risk, flag count, renewal count)
- [ ] Correct sorting (recent contracts by date DESC, renewals by daysRemaining ASC)
- [ ] Risk score color selection matches thresholds
- [ ] onNav callbacks fire with correct screen and contractId params

### Visual Tests
- [ ] Org banner renders with correct styling
- [ ] Greeting text matches logged-in user
- [ ] 4 KPI cards display with correct colors
- [ ] "Where to start" cards render with proper hover states
- [ ] How-it-works 4-step layout renders in 4-column grid
- [ ] Recent contracts table shows up to 4 rows
- [ ] Urgent renewals table shows up to 3 rows
- [ ] Renewal left border color changes by daysRemaining thresholds

### Integration Tests
- [ ] Clicking buttons navigates to correct screens
- [ ] Passing contractId via `onNav` is received by Results screen
- [ ] Data recalculates when contracts/renewals change
- [ ] Empty states show appropriate placeholders

---

## Notes for Implementation

1. **Sample Data**: Use the provided sample data from the design handoff (9 contracts, 6 renewals, 5 team members)
2. **Hard-coded org name**: "Northwind Holdings Ltd" is hard-coded in this version (can be made dynamic later)
3. **User greeting**: Placeholder "James" — replace with actual logged-in user name from auth context
4. **Decorative SVG in org banner**: Simple 14×14 chart icon — can be imported from SVG library or inlined
5. **Responsive breakpoints**: This design is desktop-first; tablet layout may need grid adjustments (2×2 for KPI cards on tablet)
6. **Future enhancement**: "Resume" card can show last viewed contract from session storage instead of just first contract
7. **Performance**: Consider memoizing components to avoid re-renders on data updates

---

## Acceptance Checklist

- [ ] All sections render with correct layout and spacing
- [ ] All data calculations are accurate
- [ ] All colors match design specification
- [ ] All typography (sizes, weights, families) matches specification
- [ ] All interactions (onNav callbacks) work correctly
- [ ] Responsive design works on mobile/tablet (if included in scope)
- [ ] Component passes visual regression tests
- [ ] Component passes functional/integration tests
- [ ] Code review approved
- [ ] Ready for merge to main
