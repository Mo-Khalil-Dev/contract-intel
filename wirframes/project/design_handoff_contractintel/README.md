# Handoff: ContractIntel — Lloyds Theme

## Overview

ContractIntel is an AI-powered contract analysis and risk management tool, themed for Lloyds Bank. It allows legal/procurement teams to upload contracts, receive AI-generated risk scores and flag analysis, track renewals, and compare contracts against internal playbook positions.

## About the Design Files

The files in this bundle (`ContractIntel Lloyds.html` and its supporting `.jsx`/`.js` files) are **design references built as interactive HTML prototypes** — they show intended look, feel, and behaviour but are not production code. Your task is to **recreate these designs in your existing application environment** (React, Next.js, etc.) using its established patterns, component library, and routing conventions.

## Fidelity

**High-fidelity.** These are pixel-level mocks with final colours, typography, spacing, component states, and interactions fully specified. Implement pixel-accurately using your production stack.

---

## Design Tokens

### Colour Palette

```
// Backgrounds
bg:          #F4F8F6   (page background)
surface:     #FFFFFF   (card/panel)
surface2:    #EDF4EF   (table header, modal header)

// Navigation
navBg:       #006A4D   (top nav bar)
navBg2:      #005238   (active nav item bg / darker variant)

// Borders
border:      #D5E6DC   (default)
border2:     #BBCFC6   (inputs, secondary)

// Text
text:        #0D1F17   (primary)
textMid:     #2B4A38
textSoft:    #537060
textMute:    #8DAF9C

// Accent
accent:      #006A4D
accentBg:    #E8F4EF
accentHover: #005238

// Semantic — Risk
red:         #C0392B  |  redBg:    #FDF0EE  |  redBorder:    #F5C6C0
orange:      #C87500  |  orangeBg: #FEF8EE  |  orangeBorder: #F5DCAA
green:       #1A7A46  |  greenBg:  #EDF8F2  |  greenBorder:  #A8DFC0
```

### Risk Score Thresholds

- `score >= 7` → **High** (red)
- `score >= 4` → **Medium** (orange)
- `score < 4` → **Low** (green)

### Typography

- **Primary font:** `Lato` (weights 400, 700, 900) — Google Fonts
- **Monospace font:** `IBM Plex Mono` (weights 400, 600, 700) — used for scores, dates, codes
- Base font size: 13px

### Spacing / Radii

- Card border-radius: `6px`; pill/badge: `3–4px`
- Standard card padding: `14–18px`
- Page horizontal padding: `28px`
- Standard gap between siblings: `8–12px`
- Scrollbar width: `5px`

### Shadows

- Modal: `0 20px 60px rgba(0,0,0,0.15)`
- No drop shadows on cards — borders only

---

## Application Structure

The app is a single-page React app with the following top-level screens, navigated via a sticky top nav bar:

| Screen key   | Label        | Notes                                 |
| ------------ | ------------ | ------------------------------------- |
| `contracts`  | Contracts    | Default landing screen                |
| `detail`     | (no nav tab) | Pushed when a contract row is clicked |
| `portfolio`  | Portfolio    |                                       |
| `playbook`   | Playbook     |                                       |
| `renewals`   | Renewals     |                                       |
| `settings`   | Settings     |                                       |
| `upload`     | (no nav tab) | Triggered by "+ Upload" button        |
| `processing` | (no nav tab) | Shown after upload submission         |

---

## Components

### TopNav

Sticky nav bar, height `52px`, background `#006A4D`, `border-bottom: 2px solid #005238`.

- **Left:** Horse mark SVG logo (32×32) + "ContractIntel" (15px, weight 700) + "by Lloyds" (9px, uppercase, 55% white opacity)
- **Centre:** Nav links — `padding: 7px 14px`, `border-radius: 4px`. Active state: `background #005238`, `border-bottom: 2px solid rgba(255,255,255,0.8)`, weight 700. Inactive: 65% white opacity. Hover: darken bg.
- **Right:** Username (12px, 65% white) + avatar circle (30px, 20% white bg, 1.5px white border, initials 11px weight 700)

### PageShell

Full-height column layout:

- **Header bar:** `background: #FFFFFF`, `border-bottom: 1px solid #D5E6DC`, `padding: 18px 28px 14px`. Title (20px weight 700, letter-spacing -0.02em) + optional subtitle (12px, `textSoft`) + optional right-side action buttons.
- **Body:** `flex: 1`, `overflow: auto`, `background: #F4F8F6`

### WBtn (Button)

`border-radius: 4px`, `font-family: Lato`, `font-weight: 600`, `letter-spacing: 0.01em`

| Variant   | Background  | Color     | Border              |
| --------- | ----------- | --------- | ------------------- |
| primary   | `#006A4D`   | `#fff`    | none                |
| secondary | `#FFFFFF`   | `#2B4A38` | `1px solid #BBCFC6` |
| ghost     | transparent | `#537060` | none                |
| danger    | `#FDF0EE`   | `#C0392B` | `1px solid #F5C6C0` |
| success   | `#EDF8F2`   | `#1A7A46` | `1px solid #A8DFC0` |

- Default padding: `7px 14px`, font-size 13px
- Small (`small` prop): `4px 11px`, font-size 11px
- Disabled: `opacity: 0.4`, `cursor: not-allowed`

### WRiskBadge

Coloured pill showing numeric risk score. Dot + number in IBM Plex Mono.

- Small: `padding: 2px 7px`, font-size 11px, dot 6px
- Large: `padding: 4px 10px`, font-size 13px, dot 8px
- Colours based on risk threshold (see Design Tokens)

### WTypePill

Contract type label pill. `border-radius: 3px`, `padding: 2px 8px`, `font-size: 11px`, `font-weight: 600`, `text-transform: capitalize`.

| Type        | Color   | Background |
| ----------- | ------- | ---------- |
| vendor      | #5A3F9B | #F2EFF9    |
| license     | #0C6B99 | #EBF5FA    |
| partnership | #0A7A6E | #EAF7F5    |
| customer    | #9B1865 | #FAF0F6    |
| lease       | #7A5200 | #FAF6EC    |
| nda         | #3A5040 | #EDF2EF    |

### WFlags

Inline flag summary: coloured dot + count for each severity that is > 0.
Red dot `#C0392B`, orange `#C87500`, green `#1A7A46`. Font: IBM Plex Mono 12px weight 700. Shows `—` if only green or none.

### RiskBar

Mini horizontal progress bar (60px wide, 5px tall, `border-radius: 2px`) showing risk score as a filled bar coloured by severity, followed by score text in IBM Plex Mono weight 700.

### WTabs

Tab bar strip, `background: #FFFFFF`, `border-bottom: 1px solid #D5E6DC`.

- Tab: `padding: 10px 16px`, font-size 12px, no border/background.
- Active: `font-weight: 700`, `color: #006A4D`, `border-bottom: 2px solid #006A4D`, `margin-bottom: -1px`.
- Inactive: `color: #537060`

### WModal

Overlay (`background: rgba(0,0,0,0.45)`, click-outside to close). Panel: `background: #fff`, `border-radius: 6px`, `box-shadow: 0 20px 60px rgba(0,0,0,0.15)`. Header: `background: #EDF4EF`, `border-bottom: 1px solid #D5E6DC`, `padding: 14px 18px`. Close button `✕`.

---

## Screens

### 1. Contracts (`contracts`)

A sortable, filterable table of all contracts.

**Filter strip** (`background: #FFFFFF`, `border-bottom`, `padding: 10px 28px`):

- Search input (flex: 1, min-width 200px)
- Risk filter select: All / High (7+) / Medium (4–7) / Low (<4)
- Type filter select: All / Vendor / License / Partnership / Customer / Lease / NDA
- Sort select: Risk / Date / Flags / Name

**Table** (`background: #FFFFFF`, `border-radius: 6px`, `padding: 20px 28px` outer container):
Columns: Contract · Type · Risk Score · Flags · Counterparty · Expiry · Uploaded · Status

- Header row: `background: #F4F8F6`, `font-size: 10px`, `font-weight: 700`, uppercase, `letter-spacing: 0.06em`, `color: #537060`
- Body rows: alternating `#FFFFFF` / `#F4F8F6`; hover: `background: #E8F4EF`; clickable if `status === 'complete'`
- Row padding: `10px 14px`
- Contract name: `font-weight: 600`, truncated with ellipsis, `max-width: 240px`
- Counterparty: `font-size: 12px`, truncated, `max-width: 160px`
- Dates: IBM Plex Mono 11px
- Status badge: "Complete" → `greenBg/green`; "Processing" → `accentBg/accent` with animated pulse dot + percentage

**Pagination:** centered row of numbered buttons (28×28px, `border-radius: 4px`). Active: `background: #006A4D`, `color: #fff`.

**State:** 8 rows per page. Filtering/sorting resets to page 1.

---

### 2. Contract Detail (`detail`)

Two-column layout. Left: tabs + content. Right: 280px fixed sidebar.

**Breadcrumb bar** (`background: #FFFFFF`, `border-bottom`, `padding: 10px 28px`): "Contracts" link → "/" divider → contract name (truncated). Right side: Prev/Next contract buttons + Export + Approve buttons.

**Left panel tabs:** Overview · Risk Flags (N) · Document · History

#### Overview tab

Max-width 580px. Three sections (Parties, Key Dates, Financial Terms), each with key-value rows (`padding: 8px 0`, border-bottom). Label column: 170px, `font-size: 12px`, `color: textSoft`. Value: 12px, `font-weight: 500`.

Notes section below: existing notes shown as author + date header, note text, "Mark resolved" button. Input + "Add" button to append new notes.

#### Risk Flags tab

Max-width 680px. Summary bar at top (counts by severity). Each flag is an accordion row:

- Collapsed: coloured dot + title + section ref (`§X.X`) + chevron. Click to expand.
- Expanded: description paragraph, recommendation box (`background: #F4F8F6`, `border-left`-style via accent colour), Resolve + Dismiss buttons.
- Resolved flags: `opacity: 0.5`; dismissed flags: hidden.

#### Document tab

Two-column grid: document viewer (flex: 1) + 280px clause inspector panel.

- Viewer: styled like a real PDF page (`font-family: Georgia`, `font-size: 12px`, `line-height: 1.8`). Risk highlights shown with coloured `background` on flagged text (`#fde68a` for orange, `#fca5a5` for red).
- Clause inspector: selected clause name, quoted text, flag label, recommendation text, "Copy Clause" button.
- Zoom controls and page nav (decorative/static in prototype).

#### History tab

Chronological activity feed. Each entry: coloured dot + action title + timestamp (IBM Plex Mono) + author + detail text. `border-bottom` separating entries.

**Right sidebar (280px):**

- Risk score card: large score number (32px IBM Plex Mono weight 900), risk level label, flag count breakdown (red/orange/green). Coloured background based on risk level.
- Quick meta key-value rows (font-size 11px): Type (WTypePill), Counterparty, Effective, Expires, Notice, Auto-Renewal, Value, Schedule.

---

### 3. Portfolio (`portfolio`)

**KPI row:** 5 cards in a CSS grid. Each: label (10px uppercase), large number (26px IBM Plex Mono weight 800), sub-label (11px muted). Cards coloured by semantic colour where applicable.

**Main grid (2 columns: 1fr + 280px):**

- Left: "Contracts by Risk Score" table — rank #, contract, type, risk bar, flags, expiry. Clickable rows.
- Right column (stacked):
  - Liability Exposure panel: three rows (Capped / Other / Unlimited) each with label, count, and a mini 4px progress bar.
  - Upcoming Renewals panel: shows renewals within 90 days, sorted by urgency. Days shown in risk colour (red if overdue/< 30d, orange if < 60d).

---

### 4. Playbook (`playbook`)

A standards table for 10 clause categories. Grouped by category (Risk, Commercial, Intellectual Property, Governance).

**Contract comparison strip:** a `<select>` to choose a contract. When selected, shows compliance counts and a segmented progress bar (green/orange/red proportions) + "% aligned" figure.

**Table columns (when no contract selected):** Clause · Your Standard Position · Acceptable Range  
**Table columns (when contract selected):** Clause · Your Standard Position · Contract Language · Status

- "Your Standard Position" cell is editable inline: hover shows an "Edit" button (opacity 0 → 1), click opens a `<textarea>` with Save/Cancel.
- Status badge: ✓ Compliant (green), ⚠ Deviation (orange), ✕ Non-compliant (red), — N/A (muted). Each in coloured pill.
- "View flag →" link if a non-green flag is matched.

**Clause-to-flag matching logic:** each clause has a `flagMatch` function that checks if any of the contract's `riskFlags` titles match keywords. Results determine the status badge.

---

### 5. Renewals (`renewals`)

Left: full-width table of all renewals sorted by urgency (`daysRemaining` ascending).

- Left border of each row coloured by urgency: red (<0 or <30d), orange (<60d), green (otherwise).
- Days column shows "Xd overdue", "TODAY", or "Xd".

Right: 280px detail panel shown when a row is selected.

- Header coloured by risk level, renewal status label, contract name.
- Key-value rows: Renewal Date, Days, Notice Period, Risk Score.
- "View Contract" (primary) + "Acknowledge" (secondary) buttons.

---

### 6. Settings (`settings`)

Three tabs: Team · Billing · Audit Log

**Team tab:**

- Table: Member (name + email), Role (editable `<select>`), Last Active, Status (● Active / ⏳ Pending), Actions (Remove button, except for the admin row).

**Billing tab:**

- Single card: plan name ("Professional"), price/limit, usage progress bar (72% shown), usage count.

**Audit Log tab:** placeholder content for v1.

---

### 7. Upload (`upload`)

Centred narrow form (max-width 560px):

- Drag-and-drop zone: dashed border (2px dashed `#BBCFC6`), hover/drag state switches to `accent` border + `accentBg` background. Click triggers hidden `<input type="file">`.
- File list below drop zone: each file shows filename, size, remove button.
- Consent checkbox (required): text about AI processing.
- Cancel + Submit buttons. Submit disabled until files selected AND checkbox checked.

---

### 8. Processing (`processing`)

Centred confirmation screen:

- Animated spinning SVG ring (`border-radius` circle with stroke-dasharray, CSS `@keyframes spin 2s linear`).
- "Analysis in progress" heading + explanatory copy.
- Queued files list with animated pulse dot per file.
- "What happens next" — 4-step process list with numbered circles.
- "Back to Contracts" secondary button.

---

## Data Model

See `data.js` for the full shape. Key types:

```typescript
type Contract = {
  id: number;
  name: string;
  type: 'vendor' | 'license' | 'partnership' | 'customer' | 'lease' | 'nda';
  riskScore: number; // 0–10
  flags: { red: number; orange: number; green: number };
  parties: [string, string];
  uploadDate: string; // YYYY-MM-DD
  status: 'complete' | 'processing';
  effectiveDate: string | null;
  terminationDate: string | null;
  noticePeriod: string | null;
  autoRenewal: string | null;
  paymentAmount: string | null;
  currency: string | null;
  paymentSchedule: string | null;
  priceEscalation: string | null;
  paymentTerms: string | null;
  riskFlags: RiskFlag[];
  progress?: number; // 0–100, only when status === 'processing'
};

type RiskFlag = {
  id: number;
  severity: 'red' | 'orange' | 'green';
  title: string;
  status: 'open' | 'accepted';
  description: string;
  recommendation: string;
  page: number;
  section: string;
};

type Renewal = {
  id: number;
  contractId: number;
  name: string;
  renewalDate: string; // YYYY-MM-DD
  daysRemaining: number; // negative = overdue
  noticePeriod: string;
  status: 'overdue' | 'urgent' | 'ontrack';
  riskScore: number;
};

type TeamMember = {
  id: number;
  name: string;
  email: string;
  role: 'Admin' | 'Reviewer' | 'Viewer';
  lastLogin: string;
  status: 'active' | 'pending';
  avatar: string; // 2-letter initials
};
```

---

## Interactions Summary

| Trigger                              | Behaviour                              |
| ------------------------------------ | -------------------------------------- |
| Click contract row (status=complete) | Navigate to detail screen              |
| Click nav link                       | Switch screen, clear selected contract |
| Click "+ Upload"                     | Navigate to upload screen              |
| Submit upload form                   | Navigate to processing screen          |
| Expand risk flag                     | Accordion open/close                   |
| Resolve flag                         | Flag opacity 0.5, label "✓ Resolved"   |
| Dismiss flag                         | Flag removed from list                 |
| Mark note resolved                   | "✓ Resolved" label appears             |
| Playbook edit position               | Inline textarea; save writes to state  |
| Renewals row click                   | Toggle detail panel                    |
| Tweaks panel                         | Accent/nav colour + font size controls |

---

## Animations

| Element                    | Animation                                            |
| -------------------------- | ---------------------------------------------------- |
| Processing spinner         | `@keyframes spin` 2s linear infinite on SVG circle   |
| Processing queued pulse    | `@keyframes pulse` 1.4s infinite, staggered per file |
| Contracts processing badge | `@keyframes pulse` 1.2s infinite                     |
| Nav/button hover states    | `transition: all 0.15s`                              |
| Flag expand/collapse       | Instant (no animation in prototype)                  |

---

## Files in This Bundle

| File                        | Purpose                                                                                                            |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| `ContractIntel Lloyds.html` | Entry point — loads all scripts                                                                                    |
| `components-v4-lloyds.jsx`  | Design tokens + shared components (TopNav, WBtn, WModal, WTabs, RiskBar, WRiskBadge, WTypePill, WFlags, PageShell) |
| `screens-v4-contracts.jsx`  | ContractsScreen + ContractDetailScreen4                                                                            |
| `screens-v4-other.jsx`      | Portfolio, Playbook, Renewals, Settings, Upload, Processing screens                                                |
| `app-v4-lloyds.jsx`         | Root app component + state routing                                                                                 |
| `data.js`                   | Sample data (9 contracts, 5 team members, 6 renewals)                                                              |
| `tweaks-panel.jsx`          | Design-time tweaks panel (not needed in production)                                                                |
