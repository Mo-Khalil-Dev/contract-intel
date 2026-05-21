# Similar Clauses — Visual Design Spec

**Feature:** From any clause in any contract, surface the most semantically similar clauses across the portfolio.
**Scope of this doc:** layout, states, components, copy, interactions. Lo-fi wireframes (ASCII) — visual designer to apply the v2 style system.
**Out of scope:** filters, accepted/rejected status, bulk ops (v2).

---

## 1. Entry points

The feature has **two entry points**, both into the same drawer:

1. **Inline button on a clause card** (primary) — on the existing Clauses tab of a contract.
2. **Keyboard shortcut** — `F` (for "find") when a clause is focused.

No standalone page. The feature lives *next to* the clause being researched, never away from it.

---

## 2. Inline trigger — on the clause card

The existing clause card gains one affordance: a small `Find similar` button in the card's top-right action area, next to existing actions.

```
┌─────────────────────────────────────────────────────────────────┐
│ Limitation of Liability                    [Find similar]  ⋯    │
│ ─────────────────────────────────────────────────────────────── │
│ Each party's total liability under this Agreement shall not    │
│ exceed the fees paid by Customer in the twelve (12) months     │
│ preceding the event giving rise to the claim...                │
│                                                                 │
│ Risk: ●●○ Moderate         Page 7  ·  Section 9.2              │
└─────────────────────────────────────────────────────────────────┘
```

**Button states:**
- Default: `Find similar` with a small compass/search icon
- Hover: subtle background, tooltip *"Find 5 most similar clauses across your portfolio (F)"*
- Loading (after click): button text → `Finding…` with spinner, disabled
- After viewing once: stays the same (no "viewed" state — too noisy)

---

## 3. The drawer — primary surface

Right-side slide-over drawer, **480px wide**, slides in over the contract content (does not push). The contract stays visible behind, dimmed slightly (overlay at 20% opacity, click-to-dismiss).

```
                                    ┌────────────────────────────────────┐
                                    │  Similar clauses              ✕    │
                                    │  ───────────────────────────────── │
   [Contract view dimmed behind]    │                                    │
                                    │  Source                            │
                                    │  ┌──────────────────────────────┐  │
                                    │  │ Limitation of Liability       │  │
                                    │  │ Acme MSA · §9.2               │  │
                                    │  │ "Each party's total liability │  │
                                    │  │  shall not exceed the fees…"  │  │
                                    │  └──────────────────────────────┘  │
                                    │                                    │
                                    │  5 similar clauses                 │
                                    │                                    │
                                    │  ┌──────────────────────────────┐  │
                                    │  │  ████████████░░  94% match    │  │
                                    │  │  Limitation of Liability      │  │
                                    │  │  Globex MSA · Mar 2025        │  │
                                    │  │  "Each party's aggregate      │  │
                                    │  │   liability shall not exceed  │  │
                                    │  │   the amounts paid in the…"   │  │
                                    │  │                          [→]  │  │
                                    │  └──────────────────────────────┘  │
                                    │                                    │
                                    │  ┌──────────────────────────────┐  │
                                    │  │  ██████████░░░░  82% match    │  │
                                    │  │  Limitation of Liability      │  │
                                    │  │  Initech Order Form · Jan '25 │  │
                                    │  │  "Neither party's liability   │  │
                                    │  │   shall exceed twelve months…"│  │
                                    │  │                          [→]  │  │
                                    │  └──────────────────────────────┘  │
                                    │                                    │
                                    │  [ ... 3 more ... ]                │
                                    │                                    │
                                    └────────────────────────────────────┘
```

### 3.1 Drawer header

- Title: **Similar clauses**
- Close: `✕` in top-right, also `Esc` to dismiss
- No tabs, no filters in v1 — keep ruthlessly simple

### 3.2 Source block (pinned at top)

A compact card showing the clause the user is researching. Why it's there:
- Confirms the user clicked the right clause
- Keeps the source visible while scrolling results (sticky)
- Provides anchor text the eye returns to when comparing

**Components:** clause type label · contract name + section · 2-line truncated text. Visually de-emphasised (lighter background, slightly muted text) so it doesn't compete with results.

### 3.3 Results list

Each result row contains, top-to-bottom:

1. **Similarity bar + score** — visual bar (filled portion = similarity), then `94% match` in monospace-feeling weight. The bar is the primary scannable signal.
2. **Clause type** — should always match source's type in v1 (we filter to same type). Still shown for confirmation.
3. **Meta line** — `{Contract name} · {Month YYYY}`. Counterparty name = contract name in most cases.
4. **Snippet** — 2–3 lines of the matched clause text, ellipsised. *No diff highlighting in v1.*
5. **Open affordance** — arrow icon on the right (`→`); whole row is clickable.

### 3.4 Row interaction

- **Hover:** subtle elevation, arrow icon brightens
- **Click anywhere on row:** drawer stays open; main content area navigates to the target contract, scrolled to and highlighting the target clause. Drawer becomes a "comparison" view (user can flip back to source by clicking the source block at top).
- **Right-click / `⋯` menu (deferred to v2):** open in new tab, copy clause text

---

## 4. States

### 4.1 Loading

```
│  5 similar clauses                 │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  ░░░░░░░░░░░░░░░░             │  │
│  │  ░░░░░░░░░░░                   │  │
│  │  ░░░░░░░░░░░░░░░░░░░░░         │  │
│  └──────────────────────────────┘  │
│  [3 more skeleton rows]            │
```

Skeleton rows. Total time-to-first-result target: **<400ms** (it's just a kNN). If slower, keep skeletons; don't show a spinner.

### 4.2 Empty — no precedent

When the cohort has fewer than ~3 matches above a quality threshold (e.g. cosine sim > 0.5):

```
│  Similar clauses              ✕    │
│  ───────────────────────────────── │
│                                    │
│  Source                            │
│  [source card]                     │
│                                    │
│                                    │
│         ┌──────────────┐           │
│         │      ⊘       │           │
│         └──────────────┘           │
│                                    │
│   No similar clauses found yet     │
│                                    │
│   This is the first Limitation     │
│   of Liability clause in your      │
│   portfolio, or none of your       │
│   existing ones are close enough   │
│   to compare meaningfully.         │
│                                    │
│   As you add more contracts,       │
│   precedents will appear here.     │
│                                    │
```

Tone: explains *why*, sets expectation, doesn't apologise.

### 4.3 Error

```
│   Couldn't load similar clauses    │
│   [Retry]                          │
```

Plain. One retry button. No stack traces.

### 4.4 Single result

Don't special-case the layout — show one row. Add a subtle label *"1 similar clause found"* at the top instead of "5 similar clauses".

---

## 5. Comparison mode (after clicking a result)

When the user clicks a row, the main content area scrolls to the target clause. To make the comparison obvious:

- The **target clause** in the main view gets a **highlight ring** (2px, accent colour) for ~2 seconds, then fades to a persistent left-border accent until drawer closes.
- The **drawer** marks the clicked row as `active` (filled bar, accent border on the row).
- The **source block** at top of drawer remains visible — user can click it to return to source.
- A small breadcrumb in the drawer header changes: `Similar clauses › Globex MSA §8.1`.

This turns the drawer into a tiny navigator without adding new UI.

---

## 6. Component inventory (for the designer)

New components to define in the v2 style:

| Component | Description | Used in |
|---|---|---|
| `FindSimilarButton` | Compact secondary button, icon + text, with loading state | Clause card |
| `SimilarClausesDrawer` | 480px right-side slide-over with header, source block, scrollable list | This feature |
| `SourceClauseCard` | Muted/compact variant of the existing clause card | Drawer source block |
| `SimilarityBar` | Horizontal bar 0–100%, paired with `%` text | Result row |
| `PrecedentRow` | Row component: similarity bar · type · meta · snippet · arrow | Drawer results |
| `EmptyPrecedentState` | Empty-state composition with icon, headline, explanation copy | Drawer empty |

---

## 7. Copy reference

| Where | Copy |
|---|---|
| Trigger button | `Find similar` |
| Trigger tooltip | `Find 5 most similar clauses across your portfolio (F)` |
| Drawer title | `Similar clauses` |
| Source label | `Source` |
| Results header (n) | `{n} similar clauses` / `1 similar clause` |
| Similarity unit | `{n}% match` |
| Empty state title | `No similar clauses found yet` |
| Empty state body | `This is the first {clause type} clause in your portfolio, or none of your existing ones are close enough to compare meaningfully. As you add more contracts, precedents will appear here.` |
| Error | `Couldn't load similar clauses` / `Retry` |
| Loading | (no copy — skeletons only) |

---

## 8. Visual direction notes for the designer

- Continue v2 from-scratch component style (no Shadcn).
- **Density-first** — legal users scan many items; favour compact rows over generous padding.
- The **similarity bar is the most important visual element** — it must be instantly scannable. Suggest accent colour for the filled portion; consider a slight gradient or step at common thresholds (e.g. tick marks at 50% / 75% / 90%) to make magnitudes comparable across rows.
- The **drawer should never feel like a modal** — no heavy shadow, no "OK/Cancel" semantics. It's a research panel, not a dialog.
- **No counterparty avatars or logos in v1** — text-only meta line. Adds noise without earning it.
- Source block uses the same component vocabulary as the result rows but with reduced contrast — visually it should feel like "the row you came from."

---

## 9. Interaction summary

| Action | Result |
|---|---|
| Click `Find similar` on a clause | Drawer opens, results load |
| Press `F` while a clause is focused | Same as above |
| Click a result row | Main view navigates + highlights target clause; drawer stays open with row marked active |
| Click source block in drawer | Main view returns to source clause |
| Press `Esc` or click ✕ | Drawer closes; main view returns to source clause; highlights cleared |
| Press `↓` / `↑` while drawer open | Move focus between result rows |
| Press `Enter` on focused row | Same as clicking it |

---

## 10. Deliverables for the designer

1. Polished comp of the **clause card with the new `Find similar` button** (default + hover + loading)
2. Polished comp of the **drawer** in: loaded state (5 results), loading state (skeletons), empty state, single-result state
3. The **active result row** appearance and the **highlighted target clause** treatment in the main view
4. Component specs (paddings, type ramp, colour tokens) for the 6 new components in §6
5. A short Loom or note describing the open/close motion (suggested: 180ms ease-out slide from right; backdrop fades to 20% over the same duration)
