# Handoff: ContractIntel Redesign

## Overview

ContractIntel is an internal contract-review workspace for Northwind Holdings' Legal Operations team. Users upload vendor / licence / partnership contracts (PDF or DOCX); an AI pass extracts clauses, scores risk, and flags problem terms against the company's playbook; a human reviewer then signs off on each flag, leaves notes for the business owner, and files the contract for approval. The product also tracks renewals, lets reviewers compare contracts side-by-side, and supports redlined exports back to Word.

This handoff covers a full redesign of the workspace — **11 screens** spanning the core flow (Upload → Processing → Results → Deep Dive) plus tooling (Portfolio, Compare, Playbook, Export, Renewals, Home, Settings).

## About the Design Files

The files in this bundle are **design references created in HTML** — interactive prototypes built with React via Babel-in-the-browser. They demonstrate the intended look, layout, copy, and behavior of each screen. **They are not production code to copy directly.**

The task is to **recreate these designs in the target codebase's existing environment** (React, Vue, SwiftUI, etc.) using its established component library, styling system, routing, and state management. If no environment exists yet, pick the most appropriate framework for the project and implement there. Treat the HTML/JSX as a faithful spec — copy values from it (colors, spacing, copy strings, layout structure) but rebuild components in your stack's idioms.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, and interactions are committed. Pixel-perfect targets where possible:

- Type: **DM Sans** for UI, **DM Mono** for numbers / labels / risk scores. Letter-spacing `-0.01em` to `-0.02em` on most headings.
- Layout: max-width content column **1120 px** for most screens (1200 px on Portfolio table). 32 px horizontal padding desktop, 20 px tablet, 16 px mobile.
- Density: medium. Card padding 18–24 px. Row height ~52 px in tables.
- Border-radius: 6 px (chips/badges) · 8 px (buttons) · 10–14 px (cards).
- Shadow: very restrained — `0 4px 16px -8px rgba(15, 23, 42, .18)` on hover-elevated cards only.

The accent color is exposed as a tweak in the prototype; **the canonical accent is `#2563EB`** (Tailwind blue-600).

## Screens / Views

Open `screens/index.html` for live thumbnail previews of every screen. Each screen is also exported as a standalone HTML file under `screens/`.

| # | File | Name | Purpose |
|---|---|---|---|
| 01 | `screens/home.html` | **Home** | Landing surface. Workspace banner, portfolio KPIs (avg risk, total reds, in-progress count), 4-step "how the flow works" explainer, recent contracts list, urgent renewals strip, team activity. |
| 02 | `screens/upload.html` | **Upload** | Drag-and-drop zone for new PDFs / DOCX. Optional metadata capture (counterparty, contract type, owner). Tweakable variant: `default` (compact zone) vs `simple` (large zone). |
| 03 | `screens/processing.html` | **Processing** | Live extraction state shown while AI parses the contract. Progressive step list: pages OCR'd → clauses extracted → playbook compared → flags scored. Animated pulse on the active step. |
| 04 | `screens/results.html` | **Results** | The core review surface. Risk score mega-number, flag breakdown (red / amber / green counts), full flag list as **accordion** or **cards** (tweakable), contract metadata side panel, action bar (Export, Deep Dive, Approve). |
| 05 | `screens/deepdive.html` | **Deep Dive** | One flag, full context. Severity header, original clause text (with citation: page + section), market-standard comparison list, suggested replacement language with copy-to-clipboard, reviewer notes. |
| 06 | `screens/compare.html` | **Compare** | Side-by-side compare of two contracts. Diff highlighting. Used to spot off-playbook terms across vendors. |
| 07 | `screens/portfolio.html` | **Portfolio** | All contracts in one list. Tweakable: `table` (dense data view), `card` (chunkier), `minimal` (text-forward). Search, filter by status / risk / owner, sort by date / risk / value. |
| 08 | `screens/playbook.html` | **Playbook** | Reusable clause library. Cards for each standard clause (liability cap, indemnity, IP, termination, etc.) with the "ideal" language and acceptable fallbacks. |
| 09 | `screens/export.html` | **Export** | Configure an export. Choose format (redlined Word, summary PDF, CSV), audience (internal / counterparty), include sections (executive summary, flags, suggested language, market standards). |
| 10 | `screens/renewals.html` | **Renewals** | Upcoming renewals timeline. Cards grouped by urgency (next 30 / 60 / 90 days). Each card shows counterparty, value, days remaining, owner. |
| 11 | `screens/settings.html` | **Settings** | Workspace, user, and integration preferences. |

### Top-level chrome (shared across all screens)

- **Top nav** (`<TopNav>` in `components.jsx`): dark bar (`#0F172A`), 56 px tall. Left: `CI` logo block (28 px square, white text on `#2563EB`) + "ContractIntel" wordmark. Center: nav links (Home, Portfolio, Compare, Renewals). Right: search icon, notifications dot, avatar. Mobile: links collapse to a hamburger that opens a drawer.
- **PageShell** wraps every non-Home screen: title (32 px, weight 600), optional subtitle (14 px, `#64748B`), right-aligned action button area, breadcrumb row above it.

## Interactions & Behavior

### Navigation
The prototype uses a single React state machine (`screen` enum + `contractId` + `flagId`). In your codebase, map these to routes:

```
/                           → home
/upload                     → upload
/contracts/:id/processing   → processing
/contracts/:id              → results
/contracts/:id/flags/:fid   → deepdive
/compare                    → compare
/portfolio                  → portfolio
/playbook                   → playbook
/contracts/:id/export       → export
/renewals                   → renewals
/settings                   → settings
```

### Key transitions
- **Upload → Processing**: on drop, files are staged in local state, user hits "Start analysis", screen transitions immediately. No real upload in the prototype.
- **Processing → Results**: after the simulated pipeline completes (~5 s in the mock), auto-navigates to results for `contractId: 1`. In production, poll / subscribe to a job status endpoint.
- **Results → Deep Dive**: clicking any flag row opens that flag's full detail page. Back button returns preserving scroll/state.
- **Results → Export**: opens the export configurator with the current contract preselected.

### Micro-interactions
- Buttons: `transition: all 0.15s`. No transforms on press.
- Cards on Home / Portfolio: on hover, border darkens (`#E5E7EB` → `#CBD5E1`), shadow appears (`0 4px 16px -8px rgba(15,23,42,.18)`), `translateY(-2px)`.
- Processing step list: active step pulses (`@keyframes ciPulse` — opacity 1 → 0.3 → 1, 1.4s ease-in-out infinite).
- Copy-to-clipboard on Deep Dive's suggested language: button label swaps to "Copied ✓" for 2 s.
- Tabs on Results (Flags / Clauses / Metadata): underline slides; on narrow screens row becomes horizontally scrollable (`overflow-x: auto`).

### Form validation
- Upload requires at least one file before "Start analysis" enables.
- Export requires at least one section selected.

### Responsive behavior
Breakpoints are codified in `ContractIntel Redesign.html`'s `<style id="ci-responsive">` block:

- **≤ 1100 px** (tablet landscape) — minor reflows; sidebars narrow.
- **≤ 860 px** (tablet) — center nav links hide, hamburger appears. 4-col stat grids collapse to 2. Results split (main / side) becomes vertical stack. Tables scroll horizontally.
- **≤ 640 px** (phone) — padding shrinks to 16 px. Stat grids → 2 cols. Risk-snapshot row stacks. Detail-row labels shrink. Page H1 → 24 px.
- **≤ 420 px** (small phone) — stat grids → 1 col.

## State Management

In the prototype, state is held in `App` (`app.jsx`):

| State | Type | Notes |
|---|---|---|
| `screen` | string enum | Current view |
| `contractId` | number / null | Active contract for Results / Deep Dive / Export |
| `flagId` | number / null | Active flag for Deep Dive |
| `uploadedFiles` | File[] / null | Staged for Processing |
| `tweaks` | object | Layout variant, risk style, upload style, accent color — these are **design tweaks for review**, not production settings. Drop the Tweaks panel entirely in your build. |

For production: model `Contract`, `RiskFlag`, `Clause`, `Renewal`, `TeamMember`, `Playbook`, `PlaybookClause`. Sample shapes are in `data.js`.

Server interactions you'll need to wire up:
- Upload: multipart POST → returns `contractId`, starts an analysis job.
- Processing: poll `GET /contracts/:id/status` or subscribe via SSE / websocket.
- Results: `GET /contracts/:id` (with embedded flags + clauses).
- Deep Dive: `GET /contracts/:id/flags/:fid`.
- Export: `POST /contracts/:id/exports` with format + sections; returns a download URL.
- Compare: `GET /contracts/compare?a=:id&b=:id`.

## Design Tokens

All tokens are in `tokens.js`. Reproduced here for convenience:

### Colors

```
/* Surfaces */
bg          #FAFAF9   /* app background */
bgAlt       #F4F3F1   /* recessed strips */
surface     #FFFFFF   /* cards */
surfaceAlt  #F8F8F7   /* nested / inset cards */

/* Text */
ink         #0F172A   /* primary */
inkMid      #334155   /* body */
inkSoft     #64748B   /* secondary / metadata */
inkMute     #94A3B8   /* tertiary / hints */

/* Lines */
border      #E2E8F0   /* default */
borderMid   #CBD5E1   /* hover / strong */

/* Accent (brand) */
blue        #2563EB
blueDark    #1D4ED8
blueLight   #DBEAFE
blueMid     #93C5FD

/* Semantic — Success / Approved / Low risk */
green       #10B981
greenDark   #059669
greenBg     #ECFDF5
greenBorder #6EE7B7

/* Semantic — Caution / Medium risk */
orange      #F59E0B
orangeDark  #D97706
orangeBg    #FFFBEB
orangeBorder#FCD34D

/* Semantic — Danger / High risk */
red         #EF4444
redDark     #DC2626
redBg       #FEF2F2
redBorder   #FCA5A5

/* Nav */
nav         #0F172A
navBorder   #1E293B
```

### Risk score → color (thresholds)

```
score >= 7   → red       (High Risk)
score >= 4   → orange    (Medium Risk)
score <  4   → green     (Low Risk)
```

### Typography

```
Family    DM Sans (UI), DM Mono (numbers, scores, labels, eyebrows)
Weights   400, 500, 600, 700, 800

Sizes
  Page H1            32px / 600 / -0.02em
  Page H1 large      40px / 700 / -0.02em
  Page H2            22px / 600 / -0.01em
  Section heading    16px / 600 / -0.01em
  Body               14px / 400
  Body small         13px / 400
  Caption / meta     12px / 500
  Eyebrow / label    11px / 500 / 0.08-0.12em / UPPERCASE / DM Mono
  Risk mega number   48-64px / 700 / DM Mono
```

### Spacing scale

Use 4 px base. Common values used: `4, 6, 8, 10, 12, 14, 16, 20, 24, 28, 32, 40, 48, 56`.

### Radii

```
Chips / badges      6px
Buttons             8px
Cards               10–14px
Drop-zone           14px
Modal               16px
```

### Shadows

Single elevation only:
```
hover-elevation: 0 4px 16px -8px rgba(15, 23, 42, 0.18)
```

### Buttons (`<Btn>` in `components.jsx`)

| Variant | Background | Color | Border |
|---|---|---|---|
| `primary` | `#2563EB` | `#FFFFFF` | none |
| `secondary` | `#FFFFFF` | `#334155` | `1px #CBD5E1` |
| `ghost` | transparent | `#64748B` | none |
| `danger` | `#FEF2F2` | `#EF4444` | `1px #FCA5A5` |
| `success` | `#ECFDF5` | `#059669` | `1px #6EE7B7` |
| `dark` | `#0F172A` | `#FFFFFF` | none |

Sizes: `sm` (6×14 / 13px), `md` (10×20 / 14px), `lg` (14×28 / 16px).

## Assets

No raster images are required by the design — all visuals are CSS / inline SVG. Icons are inline SVGs in the component files (small, monochrome, 14–16 px). Replace with your codebase's icon library (Lucide, Phosphor, Heroicons — any of these match the visual weight).

The only external dependencies fetched at runtime:
- **Google Fonts**: DM Sans + DM Mono (`https://fonts.googleapis.com/css2?family=DM+Sans...&family=DM+Mono...`)
- **React 18** + **Babel** (only because the prototype is in-browser JSX — do not ship these to production).

Mock data lives in `data.js` (`window.APP_DATA`): a `CONTRACTS` list with realistic names, counterparties, risk scores, and `riskFlags` per contract; plus `RENEWALS` and `TEAM_MEMBERS`. Use these names and copy as the seed for fixtures / Storybook stories.

## Files

```
design_handoff_ci_redesign/
├── README.md                          ← you are here
├── ContractIntel Redesign.html        ← full prototype, all screens (run this first)
├── app.jsx                            ← React shell, routing, top-level state
├── components.jsx                     ← shared primitives (Btn, Badge, RiskBadge, TopNav, PageShell, etc.)
├── screens-a.jsx                      ← Home, Upload, Processing, Results
├── screens-b.jsx                      ← Deep Dive, Compare, Portfolio, Playbook, Export, Renewals, Settings
├── tokens.js                          ← design tokens (window.T)
├── data.js                            ← mock data (window.APP_DATA)
├── tweaks-panel.jsx                   ← prototype-only tweaks UI (do not ship)
└── screens/
    ├── index.html                     ← directory of all 11 screens (thumbnails + links)
    ├── home.html
    ├── upload.html
    ├── processing.html
    ├── results.html
    ├── deepdive.html
    ├── compare.html
    ├── portfolio.html
    ├── playbook.html
    ├── export.html
    ├── renewals.html
    └── settings.html
```

### How to view the designs locally

Open `ContractIntel Redesign.html` directly in a browser — everything runs client-side. To view individual screens, open `screens/index.html` and click any thumbnail.

### How to read the JSX

The JSX files are vanilla React function components, compiled in the browser by Babel. There's no build step, no TypeScript, no CSS modules. Styles are inline (the `T` token object is referenced directly). When porting:

1. Pull the structure / hierarchy of JSX as a layout reference.
2. Lift colors / sizes / copy verbatim.
3. Reimplement styling in your codebase's idiom (Tailwind, CSS modules, styled-components, vanilla-extract — whichever you use).
4. Swap inline SVG icons for your icon library.
5. Replace the screen-switching state machine with your router.
6. Discard `tweaks-panel.jsx` and all `tweaks.*` references — they're prototype-only.

### A note on the visual system

Everything leans on a tight set of primitives — **`Btn`, `Badge`, `RiskBadge`, `PageShell`, `TopNav`, `Card` (implicit)** — so the design should map cleanly onto an existing component library. Recreate these as your first task, validate against the Home and Results screens, then everything else falls into place.
