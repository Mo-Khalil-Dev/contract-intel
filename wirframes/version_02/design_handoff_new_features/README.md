# Handoff: ContractIntel — New Features

This package covers **two new features** added to the existing ContractIntel workspace:

1. **Similar Clauses** — a new "Clauses" tab on the contract Results screen, plus a right-side drawer that surfaces the 5 most similar precedent clauses elsewhere in the portfolio (kNN-style semantic search).
2. **Semantic Search** — a global plain-English search bar in the top nav (⌘K / Ctrl+K from anywhere), a slide-down overlay with the top contract and clause matches, and a dedicated `/search` results page with tabs, filters, and sort.

Both features extend the existing ContractIntel Redesign. They share visual primitives (`SimilarityBar`, `PrecedentRow`) that should be implemented once and reused across both flows.

## About the design files

The files in this bundle are **design references created in HTML/JSX** — interactive prototypes built with React via Babel-in-the-browser. They show the intended look, layout, copy, and behavior. **They are not production code to copy directly.**

The task is to **recreate these designs in the ContractIntel codebase's environment** (React + your existing routing / state / styling), using the same component primitives already established in the prior handoff (`Btn`, `Badge`, `PageShell`, `TopNav`, etc.). Treat the JSX as a faithful spec: lift the structure, copy strings, colors, and pixel values verbatim — but reimplement styling in your codebase's idiom (Tailwind / CSS modules / styled-components / whatever is in use).

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy, animations, and keyboard behavior are committed.

- Type: **DM Sans** for UI, **DM Mono** for numerals / percentage labels / section pins, **Georgia italic** for clause snippets (this is a new choice scoped to these features — it makes legal text feel like quoted source material rather than UI chrome).
- Drawer width: **480 px** (max-width `92vw` on small screens).
- Overlay max-height: **85vh**, slides down from the top with a 50% dark backdrop.
- Density: medium. Card padding 12–18 px. Row gap inside lists 8 px.
- Border-radius: 6 px (chips/kbd) · 7–8 px (filter chips, search bar) · 10 px (rows, cards).
- Shadow: very restrained. Drawer uses a soft `−2px 0 16px rgba(15,23,42,0.04)`; overlay uses `0 16px 40px rgba(15,23,42,0.12)`.

Accent color (canonical): `#2563EB`. Strong-match accent (≥ 90%): `#1D4ED8`. Medium-match: `#60A5FA`.

---

## Feature 1 — Similar Clauses

### Where it lives

- A **Clauses tab** is added to the existing Results screen tab strip (`Overview · Risk Flags · Clauses · Document · History`). Tab is positioned **third**, after Risk Flags.
- The tab body lists every clause extracted from the contract. Each clause is rendered as a `ClauseCard` with a **Find similar** affordance in the top-right.
- Clicking **Find similar** (or pressing **F** with a card focused) opens a right-side `SimilarClausesDrawer`.

### ClauseCard

`max-width: 720 px` for the clause list column.

Visual structure (top to bottom):
1. **Severity stripe** — 4 px left border. Color comes from clause severity (`red` `#EF4444` / `orange` `#F59E0B` / `green` `#10B981`), falling back to the default border (`#E2E8F0`) when the clause has no risk flag attached.
2. **Title row** — Clause label (e.g. "Limitation of Liability") in 14 px / 700 / DM Sans / `-0.01em`, plus an optional severity `Badge` (e.g. "High risk", "Caution", "Low risk"), plus the **Find similar** button on the right.
3. **Snippet** — Up to **3 lines** of the clause text in Georgia 13 px italic, line-height 1.6, color `#334155`. Truncated with `-webkit-line-clamp: 3`.
4. **Meta** — `§9.2 · Page 7` in DM Mono 11 px, color `#64748B`.

**Highlighted state** (when this clause is the source of the currently-open drawer):
- Border becomes `#2563EB`.
- Outer ring: `box-shadow: 0 0 0 3px rgba(37,99,235,0.10)`.
- Eyebrow label "IN COMPARISON" (top-right, 11 px / 700 / `#2563EB` / uppercase).
- One-shot pulse animation `ci-clause-ring` (1.8 s ease-out) when first set.

### FindSimilarButton

Compact secondary button with a small compass icon.
- Default: transparent bg, `#2563EB` text, `1px #E2E8F0` border, radius 7, padding `4px 10px`, 12 px / 600.
- Hover: bg `#DBEAFE`, border `#93C5FD`.
- Loading: spinner (10 px, 1.5px border, blue) + label "Finding…", cursor `wait`.
- Tooltip: `"Find 5 most similar clauses across your portfolio (F)"`.

### SimilarClausesDrawer

A right-side panel that mounts **below the 56-px top nav** (`top: 56px; bottom: 0; right: 0`). 480 px wide. `z-index` above content but below the nav.

**Backdrop**: 18% black (`rgba(15,23,42,0.18)`), click-to-dismiss, sits at `top: 56px` so the nav stays interactive.

**Slide-in animation** (`ci-slide-in`): 180 ms, `cubic-bezier(0.22,1,0.36,1)`, from `translateX(16px)` + 40% opacity to 0/100%.

#### Drawer layout (top → bottom)

1. **Header** (`14px 18px 12px`, 1 px bottom border).
   - Title: "Similar clauses" 15 px / 700 / `-0.02em`.
   - When a precedent is selected, an inline breadcrumb appears: `Similar clauses › <Contract name (3 words)>` — contract name 13 px / 500 / `#334155`, max-width 220 px, ellipsis-truncated.
   - Close button (right): 28×28, radius 6, hover bg `#F4F3F1`.

2. **Source clause card** (`SourceClauseCard`) — pinned at top of body, padding `14px 18px 6px`.
   - Background `#F8F8F7` (or `#FAFAF9` when "active" = no precedent selected).
   - Eyebrow row: clause label left (12 px / 700 / `#64748B`), `"SOURCE"` right (10 px / 700 / `#94A3B8` / uppercase / 0.06em letter-spacing).
   - Meta line: `<contract name> · §<section>` in DM Mono 11 px / `#64748B`.
   - Snippet: 2 lines, Georgia 12 px italic.
   - The card is itself a button — clicking it deselects any active precedent (returns to "source view").

3. **Results header** (`14px 18px 8px`).
   - Left: count label, e.g. `"5 SIMILAR CLAUSES"` (11 px / 700 / `#94A3B8` / uppercase / 0.08em letter-spacing). For 1 result: `"1 similar clause"`. For empty/error states: hidden.
   - Right: `"≥ 50% threshold"` (10 px / 600 / `#94A3B8` / DM Mono).

4. **Results body** (`0 18px 18px`, vertical gap 8 px). Contains either skeletons, the precedent list, an empty state, or an error state.

5. **Footer hint** (inside the scroll container, after the list).
   - `↑↓ navigate · Enter compare · Esc close` — 11 px / `#94A3B8`, using `<Kbd>` chips.

#### PrecedentRow (the heart of the drawer)

Each row is `10px` radius, `12px 14px` padding, border `1px solid #E2E8F0`, with a relative-positioned arrow chevron at the bottom-right.

Layout (top → bottom):
1. **Similarity bar row** (`marginBottom: 10`): `<SimilarityBar score>` filling left flex, plus `"XX% match"` (12 px / 700 / DM Mono / `tabular-nums`, color `#0F172A` normally and `#1D4ED8` when ≥ 90%, min-width 64 px, right-aligned).
2. **Clause label** (13 px / 700 / `-0.01em` / `#0F172A`).
3. **Meta line**: `<contract name truncated 240px> · <Mon YYYY>` (11 px / `#64748B`, separator is a 1-char `·` in `#CBD5E1`).
4. **Snippet**: 3 lines, Georgia 12.5 px italic, line-height 1.55, `#334155`, right padding 24 px (so the arrow doesn't overlap).
5. **Arrow chevron** (bottom-right, 14×14, `#94A3B8` default, `#2563EB` when active).

**States**:
- Default: `#FFFFFF` bg, `#E2E8F0` border, arrow at 55% opacity.
- Hover: bg `#F4F3F1`.
- Keyboard-focused: bg `#F4F3F1`, border `#CBD5E1`, `transform: translateY(-1px)`, soft shadow `0 4px 12px rgba(15,23,42,0.06)`, arrow at 100% opacity.
- **Active (this precedent is selected for comparison)**: bg `#DBEAFE`, border `#2563EB` (1.5 px effect via colored bg + colored border), arrow color `#2563EB`. Similarity bar track switches to a slightly more saturated `#DBEAFE`.

#### SimilarityBar

The new primary scannable signal. 6 px tall, full-width, radius 6.
- **Track**: `#F4F3F1` default. `#DBEAFE` when the row is active.
- **Fill**: width = `score × 100%`. Color thresholds:
  - `≥ 0.90` → `#1D4ED8` (blueDark)
  - `≥ 0.75` → `#2563EB` (blue)
  - `≥ 0.50` → `#60A5FA`
  - `<  0.50` → `#94A3B8`
- **Transition**: `width 0.4s cubic-bezier(0.22, 1, 0.36, 1)`.
- **Ticks**: 1-px vertical marks at **50%, 75%, 90%** (`top: -2; bottom: -2;` so they extend slightly beyond the bar). Tick color: `#CBD5E1` when below threshold, `rgba(255,255,255,0.5)` when overlaid by the fill.

`<SimilarityBar score={0.86} height={6} showTicks strong={false} />`

Use this same component in the search overlay and search page. **Do not** invent a different progress widget for those surfaces.

#### Drawer states

- **`loading`** (380 ms minimum): 4 × `SkeletonRow`. Each skeleton replicates the precedent row layout: bar, percent strip, label, meta line, 2 snippet lines. Pulsing `ci-shimmer` 90° gradient sweeps left→right (1.3 s linear infinite).
- **`loaded`**: list of 5 precedents.
- **`single`**: list of 1 precedent. Label changes to "1 similar clause".
- **`empty`**: centered illustration (56-px circle with crossed-out magnifier), title `"No similar clauses found yet"`, body explaining either there's only one such clause in the portfolio or none are close enough. Max-width 280 px, body 12.5 px / 1.6.
- **`error`**: centered, title `"Couldn't load similar clauses"`, body `"Something went wrong searching your portfolio. This is usually transient."`, `<Btn size="sm" variant="secondary">Retry</Btn>`.

#### Keyboard

- **F** (with a `ClauseCard` focused, or no input focused) opens the drawer for the focused (or first) clause.
- **↑ / ↓** moves keyboard focus across `PrecedentRow`s.
- **Enter** on a focused row sets it as the active comparison.
- **Esc** closes the drawer.

The host page wraps these in a single global `keydown` listener — ignore the shortcut when `event.target` is an `input` or `textarea`.

---

## Feature 2 — Semantic Search

### Where it lives

- **`GlobalSearchBar`** is rendered as the **center slot** of the existing `TopNav` (the slot the previous handoff described as "center: nav links"). On any screen, it's always visible at 36 px tall, max-width 480 px, with a `⌘K` / `Ctrl+K` hint.
- **`⌘K` / `Ctrl+K`** opens the `SearchOverlay` from anywhere in the app (including text inputs).
- Clicking either the bar OR pressing the shortcut focuses the overlay's full-width input.
- "See all (N)" inside the overlay navigates to the dedicated `/search` page (`SearchPage`).

### GlobalSearchBar (top-nav bar)

A button (not an input) that mimics an input. Looks like a flat search input embedded in the dark nav.
- Height 36, padding `0 12px 0 36px`, radius 8.
- Background `rgba(255,255,255,0.06)`, border `1px solid rgba(255,255,255,0.12)`.
- Placeholder text: `"Search your contracts in plain English…"` in `rgba(255,255,255,0.55)`, 13 px.
- Magnifier icon left (14×14, currentColor).
- Right side: two `<kbd>` chips showing the shortcut (`⌘` `K` on macOS, `Ctrl` `K` elsewhere). Background `rgba(255,255,255,0.08)`, 1-px white-12% border, radius 4.
- Hover: bg `rgba(255,255,255,0.10)`, border `rgba(255,255,255,0.18)`, text 85% white.
- If the user has a query staged, the placeholder is replaced by the query text (truncated with ellipsis).

`flex: 1; max-width: 480px; margin-left: 24px; margin-right: 16px;`

### SearchOverlay

Slide-down panel pinned to the top of the viewport. Backdrop is **50% black** (`rgba(15,23,42,0.5)`) — stronger than the drawer's because this overlay is a focused mode, not a side surface.

- Position: `fixed; top: 0; left: 0; right: 0`. `max-height: 85vh`. `z-index: 300` (above drawer, above tweaks panel).
- Animation: `ci-slide-down` 200 ms, `translateY(-16px)` + 40% opacity → 0/100%.
- Shadow: `0 16px 40px rgba(15,23,42,0.12)`.
- Bottom 1-px border `#E2E8F0`.

#### Overlay layout

1. **Input row** (`14px 20px`, 1 px bottom border).
   - Large `SearchInput`: 52 px tall, radius 12, padding `0 56px 0 48px`, 16 px / `-0.01em` text. Magnifier icon left, clear `✕` button right (when text exists), spinner replaces magnifier while loading.
   - Right side: `Esc` `<kbd>` chip (acts as both label and close button).

2. **Body** (`18px 20px 22px`, scrollable). Contents depend on state.

#### Overlay states

- **`idle`** (empty query): `<SuggestedSearches>` — eyebrow `"TRY SEARCHING…"`, then a column of 4 italic-Georgia "quote" buttons, each in a card row with a magnifier icon. The four canned queries are exactly:
  1. `"contracts with unlimited liability"`
  2. `"auto-renewal clauses with short notice periods"`
  3. `"NDAs signed in the last 90 days"`
  4. `"termination rights that favour the counterparty"`
  Clicking one sets the query — do not auto-submit; let the debounce kick in.

- **`loading`**: Two section heads ("TOP CONTRACTS", "TOP CLAUSES (ACROSS CONTRACTS)") each followed by 2–3 `SkeletonRow`s.

- **`loaded`** / **`low`**:
  - If `lowConfidence` (top score < 0.55), prepend a `LowConfidenceBanner` (orange, full-width, 8-radius, amber-warning icon, copy: `"We didn't find a strong match. Showing closest results."`).
  - **Top contracts** section (up to 3 `ContractResultRow`s).
    - Header: `"TOP CONTRACTS"` left, `"See all (N) →"` link right (`#2563EB`, 12 px / 600).
  - **Top clauses (across contracts)** section (up to 5 `PrecedentRow`s — yes, the exact same component as the drawer).
    - Header: `"TOP CLAUSES (ACROSS CONTRACTS)"` left, `"See all (N) →"` right.
  - Footer hint: `↑↓ navigate · Enter open · Esc close`, plus right-aligned total count in DM Mono (`12 results`).

- **`empty`**: centered crossed-out magnifier, title `Nothing matched "<query>"` (query shown in Georgia italic), body `"Try rephrasing, or browse contracts directly."`, `Browse all contracts` button → navigates to Portfolio.

- **`error`**: centered, title `"Something went wrong"`, body `"The search service is unavailable. Try again in a moment."`, `Retry` button.

#### ContractResultRow

Same overall geometry as `PrecedentRow` but tuned for whole-contract results:

1. Similarity bar + `XX% match` (same as PrecedentRow).
2. **Title row**: contract name (15 px / 700 / `-0.01em`) + `<TypePill>` (existing component).
3. **Meta line**: `Signed <Mon YYYY> · <£X> · Counterparty: <strong>Name</strong>` (12 px / `#64748B`).
4. **"Matched on" chip** — explainability anchor. Inline, `3px 8px` padding, bg `#DBEAFE`, 1-px `rgba(147,197,253,0.33)` border, radius 5. Contains:
   - Eyebrow `"MATCHED ON"` (10 px / 700 / `#1D4ED8` / uppercase / 0.06em).
   - Clause label (11 px / 600 / `#1D4ED8`).
   - Section pin `§9.2` (10 px / DM Mono / `#1D4ED8` / 75% opacity).
   This is the row's main differentiator from a generic search result — it tells the user **why** a contract ranked highly.
5. **Snippet**: 2 lines, Georgia 12.5 px italic, `#334155`.

#### Debounce

Query input → result list: **600 ms** debounce. Spinner shown during in-flight searches. Clear the timer on every keystroke; clear the state to `idle` when the input is emptied.

### SearchPage (dedicated `/search`)

Renders inside the existing `PageShell`. Title `"Search"`, subtitle either `'<N> results for "<query>"'` or fallback `"Search your contracts in plain English"`.

Layout column max-width: **1080 px**. Padding `24px 32px` (collapses to 20/16 px per existing responsive rules).

Top to bottom:

1. **Large `SearchInput`** (52 px, same as overlay). Auto-focus when no query is set.

2. **Tabs** (segmented chip-style — different from the existing `Tabs` component on the Results screen because this is a primary filter, not navigation):
   - `Contracts` and `Clauses`, each with a count badge.
   - Inactive: bg `#FFFFFF`, border `#E2E8F0`, text `#334155`. Count badge bg `#F4F3F1` / DM Mono 11.
   - Active: bg `#0F172A`, border `#0F172A`, text white. Count badge bg `rgba(255,255,255,0.18)` / white.
   - Radius 8, padding `8px 14px`, 13 px / 600.
   - Switching tabs resets the visible-row limit to 20.

3. **`SearchFiltersBar`** — eyebrow `"FILTERS"` + dropdown chips:
   - **Counterparty** — `Any` + every distinct `parties[0]` value across contracts.
   - **Date range** — `Any · Last 30 days · Last 90 days · Last year`.
   - Each `FilterDropdown` is a 7-radius white chip showing `"<Label>: <Value>"`, with a 10-px chevron. Click to toggle a 180-px menu of options.
   - Reserved third slot for **Contract type** + **Deal size** in v2 (not implemented yet — placeholder returns null).

4. **Sort row** (1-px bottom border).
   - Left: `Showing <N> of <Total> <tab>` (13 px / `#64748B`).
   - Right: `Sort:` label + native `<select>` (`Best match · Most recent · Largest deal`).

5. **Result list** — gap 8 px column.
   - Contracts tab → `ContractResultRow` (same component as overlay).
   - Clauses tab → `PrecedentRow` (same component as drawer + overlay).
   - Initial limit 20, **Load more** button (secondary, sm) appears at the bottom of the list while more remain — increments limit by 20.
   - Empty query → `SuggestedSearches`.
   - Empty result set → `NoResultsState`.

### Routing

Add one new route to the existing scheme:

```
/search?q=<query>&tab=<contracts|clauses>   →  SearchPage
```

In the prototype this is just `screen === 'search'` with `searchInitial` state holding `{ query, tab }`. In production, parse from the query string and pass as props/state.

Click handlers:
- `onOpenContract(result)` → navigate to `/contracts/:id` (Results screen).
- `onOpenClause(result)` → also navigates to `/contracts/:id`. (In v2, deep-link to the clause within the Clauses tab — `/contracts/:id?tab=clauses&clause=:key`.)

### Keyboard (Search)

- **⌘K / Ctrl+K** — open overlay from anywhere (respects native `metaKey` / `ctrlKey`). Override any in-input native behavior; this is global.
- **Esc** — close overlay.
- **↑ / ↓** — navigate across the flat result list (contracts then clauses).
- **Enter** — open the focused result.

---

## Shared design tokens (deltas from the prior handoff)

The base palette / radii / spacing scale from the existing redesign handoff still applies. These are the **additions** specific to these features:

```
/* New: similarity-bar palette */
sim-fill-strong   #1D4ED8   /* ≥ 90% match */
sim-fill-strong-bg#DBEAFE   /* row background when active */
sim-fill-mid      #2563EB   /* 75–89% */
sim-fill-low      #60A5FA   /* 50–74% */
sim-fill-vlow     #94A3B8   /* < 50% */
sim-track         #F4F3F1   /* default bar background */
sim-tick          #CBD5E1
sim-tick-overlaid rgba(255,255,255,0.5)

/* New: search overlay backdrop */
overlay-scrim     rgba(15,23,42,0.5)

/* New: drawer backdrop */
drawer-scrim      rgba(15,23,42,0.18)

/* New: serif used for clause snippets */
snippet-family    Georgia, serif (italic)
```

### Animations (additions)

```css
@keyframes ci-spin       { to { transform: rotate(360deg); } }
@keyframes ci-slide-in   { from { transform: translateX(16px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
@keyframes ci-slide-down { from { transform: translateY(-16px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
@keyframes ci-fade-in    { from { opacity: 0; } to { opacity: 1; } }
@keyframes ci-shimmer    { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
@keyframes ci-clause-ring {
  0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.55); }
  40%  { box-shadow: 0 0 0 6px rgba(37,99,235,0.25); }
  100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
}
```

---

## State management & API surface

### Similar Clauses

State held in `ClausesTab`:
- `clauses` — derived once per contract from `getContractClauses(contract)`. In production: replace with a real `GET /contracts/:id/clauses` call returning an array of `{ id, key, label, section, page, severity, text, flagId }`.
- `drawerOpen` — boolean.
- `activeClause` — clause currently feeding the drawer.
- `focusedClauseId` — keyboard focus tracker on the main list.
- `loadingClauseId` — short-lived (~180 ms) state for the per-card spinner.
- `comparedClauseId` — drives the "in comparison" highlight on the source card.

State held in `SimilarClausesDrawer`:
- `state` — `loading | loaded | empty | single | error`.
- `results` — `[{ id, score, contractName, contractDate, label, text }]`, ranked descending.
- `activeId` — currently-comparing precedent (drives bg colour + breadcrumb).
- `focusIdx` — keyboard focus index inside the list.

**Server interactions** (replace the synthetic data in `screens-clauses.jsx`):
- `GET /contracts/:id/clauses` → clause list with severities (matched against existing risk flags).
- `GET /contracts/:id/clauses/:key/similar?n=5` → top-N precedents across the portfolio. Response shape:
  ```ts
  {
    results: Array<{
      id: string;            // contract id + clause key
      score: number;         // 0..1
      contractId: number;
      contractName: string;
      contractDate: string;  // ISO; format on the client
      label: string;         // clause type label
      section: string;
      text: string;          // snippet (~3-line target)
    }>;
    threshold: 0.5;          // surfaced as "≥ 50% threshold" label
  }
  ```

### Semantic Search

State held in `GlobalSearch`:
- `open` — overlay visible.
- `query` — current input.
- `state` — `idle | loading | loaded | low | empty | error`.
- `results` — `{ contracts: ContractResult[], clauses: ClauseResult[], total }`.
- `focusIdx` — flat-list keyboard focus across [contracts..., clauses...].
- 600 ms debounce timer via `useRef`.

State held in `SearchPage`:
- `query`, `tab` (`'contracts' | 'clauses'`), `sort`, `counterparty`, `dateRange`, `limit`.

**Server interactions**:
- `POST /search` body `{ q, limit: { contracts: 3, clauses: 5 } }` (or `GET /search?q=…` if you prefer). Response:
  ```ts
  {
    contracts: Array<{
      id: string;
      score: number;          // 0..1
      contract: {              // hydrated for the row
        id, name, type,
        parties: string[],
        effectiveDate: string,
        uploadDate: string,
        paymentAmount: string
      };
      matchedOn: {             // "matched on" chip data
        label: string;         // clause type
        section: string;
        text: string;          // snippet
      };
    }>;
    clauses: Array<{
      id: string;
      score: number;
      label: string;
      section: string;
      text: string;
      contract: { id, name, uploadDate };
    }>;
    total: number;
  }
  ```
- `GET /search?…` for the dedicated page accepts the same `q` plus `tab`, `sort`, `counterparty`, `dateRange`, `limit`, `offset`. The prototype runs all of this client-side over the synthetic data — in production, push these to the server.

### Result-row reuse

`PrecedentRow` is used in **three places**:
1. Inside the `SimilarClausesDrawer` (with `active` state for the selected comparison).
2. Inside the `SearchOverlay`'s "Top clauses" section (no active state needed).
3. Inside the `SearchPage`'s Clauses tab (no active state needed).

Implement it once. It's deliberately portable — it takes a result object and renders the bar, percent, label, meta, and snippet identically everywhere.

`ContractResultRow` is used in **two places**: search overlay top section + search page Contracts tab.

`SimilarityBar` is used everywhere both rows are used. Tick markers at 50/75/90 are non-negotiable — they make the score scannable without reading numerals.

---

## Copy reference

These exact strings appear in the design and should ship as-is unless your PM has called out a change:

### Similar Clauses
- Tab label: `Clauses`
- Find similar button: `Find similar` (loading: `Finding…`)
- Find similar tooltip: `Find 5 most similar clauses across your portfolio (F)`
- Drawer title: `Similar clauses`
- Source card eyebrow: `SOURCE`
- Comparison highlight eyebrow: `IN COMPARISON`
- Results count: `5 similar clauses` / `1 similar clause` / hidden
- Threshold label: `≥ 50% threshold`
- Per-row match label: `<N>% match`
- Footer hints: `navigate`, `compare`, `close`
- Empty title: `No similar clauses found yet`
- Empty body: `This is the first <strong>{clauseLabel}</strong> clause in your portfolio, or none of your existing ones are close enough to compare meaningfully.`
- Empty footer: `As you add more contracts, precedents will appear here.`
- Error title: `Couldn't load similar clauses`
- Error body: `Something went wrong searching your portfolio. This is usually transient.`
- Header info bar: `{N} clauses extracted · Press F on any clause to find precedents`
- Header right pin: `kNN search across portfolio`

### Semantic Search
- Global bar placeholder: `Search your contracts in plain English…`
- Overlay section titles: `Top contracts`, `Top clauses (across contracts)`
- See-all link: `See all (N) →`
- Suggested searches eyebrow: `Try searching…`
- Low confidence banner: `We didn't find a strong match. Showing closest results.`
- No results title: `Nothing matched "<query>"`
- No results body: `Try rephrasing, or browse contracts directly.`
- No results CTA: `Browse all contracts`
- Error title: `Something went wrong`
- Error body: `The search service is unavailable. Try again in a moment.`
- Matched-on chip eyebrow: `MATCHED ON`
- Page subtitle (with query): `{N} results for "{query}"`
- Page subtitle (no query): `Search your contracts in plain English`
- Showing-row label: `Showing {N} of {Total} {tab}`
- Sort options: `Best match`, `Most recent`, `Largest deal`
- Load more button: `Load more`
- Suggested queries (canonical, do not paraphrase):
  - `contracts with unlimited liability`
  - `auto-renewal clauses with short notice periods`
  - `NDAs signed in the last 90 days`
  - `termination rights that favour the counterparty`

---

## Files in this bundle

```
design_handoff_new_features/
├── README.md                       ← you are here
├── ContractIntel Redesign.html     ← open in a browser to run the full prototype
├── tokens.js                       ← shared design tokens (window.T)
├── data.js                         ← mock contracts / parties / risk flags (window.APP_DATA)
├── components.jsx                  ← shared primitives (Btn, Badge, TypePill, TopNav with center slot, etc.)
├── app.jsx                         ← App shell + routing + GlobalSearch wiring
├── screens-a.jsx                   ← Results screen (contains the Clauses tab integration)
├── screens-b.jsx                   ← other screens (here so the prototype runs end-to-end)
├── screens-clauses.jsx             ← NEW: Similar Clauses feature (ClausesTab, drawer, SimilarityBar, PrecedentRow, etc.)
├── screens-search.jsx              ← NEW: Semantic Search feature (GlobalSearch, SearchOverlay, SearchPage, ContractResultRow, etc.)
└── tweaks-panel.jsx                ← prototype-only review UI (do not ship — strip on port)
```

**The two files that matter most for this handoff are `screens-clauses.jsx` and `screens-search.jsx`.** Everything else is the host environment they plug into. The prototype is preserved in full so you can interact with the features in context.

### How to view

Open `ContractIntel Redesign.html` directly in a browser — everything runs client-side. To see the new features:

- **Similar Clauses**: from the Tweaks panel quick-nav, jump to `Results (Contract 1)`. Click the **Clauses** tab. Click **Find similar** on any clause, or focus a card and press **F**.
- **Semantic Search**: press **⌘K** (or **Ctrl+K**) on any screen. Or click the search bar in the top nav. Try one of the suggested queries.

The Tweaks panel also exposes demo states (Loading / Empty / Single / Error / Low confidence) that let you drive the components into any of their states without doing real query timing.

### Notes for the developer

1. **Build `SimilarityBar` and `PrecedentRow` first**, then `ContractResultRow`. Once those three primitives are right, everything else falls into place — they're the most-reused pieces in this surface.
2. **Discard `demoState` props.** They're prototype scaffolding for design review; the production components should expose just their real state machines.
3. **Discard the in-file synthetic engines** (`getSimilarClauses`, `runSemanticSearch`, `SIMILAR_VARIANTS`, `SUGGESTED_QUERIES`'s use of in-line scoring). Wire to your real search service; keep the **shape** of what's passed to the row components.
4. **`SUGGESTED_QUERIES` itself should remain** — it's the curated empty-state list. Move it into config / CMS rather than hard-coding in the component.
5. **Keep `PrecedentRow` strictly portable** — no contract-specific assumptions. The drawer adds an "active" comparison concept that the search surfaces don't need; that's already gated behind the `active` prop.
6. The `ci-*` keyframes are scoped to these features. If your codebase has a global animation registry, register them there once; otherwise the components inject their own `<style>` tag idempotently (see the bottom of each JSX file).
7. **Z-index reservation**: drawer at 50/51 (above content, below top nav at 100); overlay backdrop at 290 and panel at 300 (above everything else, including drawer if both somehow opened).
