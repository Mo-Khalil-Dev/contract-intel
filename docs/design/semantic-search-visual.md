# Semantic Contract Search — Visual Design Spec

**Feature:** A search bar where the user types natural language and gets back ranked contracts and clauses by meaning, not keywords.
**Scope:** layout, states, components, copy, interactions. Lo-fi ASCII wireframes; designer applies v2 style.
**Built after:** Similar Clauses (#2) — reuses `SimilarityBar` and result-row patterns.

---

## 1. Entry points

1. **Top-bar global search** — a persistent search input in the app header, present on every page. Default placeholder: *"Search your contracts in plain English…"*. Clicking it focuses; typing opens a results overlay.
2. **Keyboard shortcut** — `⌘K` (mac) / `Ctrl+K` (win) from anywhere opens the search overlay with input focused.
3. **Dedicated `/search` page** — for deeper exploration, deep-linkable, shareable URL with query params. The overlay has a "See all results" link that navigates here.

Two surfaces, one feature: a **quick overlay** for in-flow lookups, a **full page** for serious research.

---

## 2. Top-bar search input

```
┌────────────────────────────────────────────────────────────────────────┐
│  [Contract Intel logo]   🔍 Search your contracts in plain English…  ⌘K │
└────────────────────────────────────────────────────────────────────────┘
```

States:
- **Default:** muted placeholder, `⌘K` hint right-aligned
- **Focused:** subtle border accent, hint hidden, cursor in input
- **With query:** clear `✕` icon on the right
- **Loading:** small spinner replaces magnifier; placeholder shows nothing

The input is typeahead but **does not autocomplete keywords** — there are no keywords. Instead, after ~600ms of typing pause, the overlay below shows live results.

---

## 3. Quick-overlay results (the keyboard-driven surface)

Slides down from the search bar, full-width, max-height ~70vh. Backdrop dims the rest of the page.

```
┌────────────────────────────────────────────────────────────────────────┐
│  🔍 unlimited liability indemnification                          ✕ ⌘K │
├────────────────────────────────────────────────────────────────────────┤
│                                                                        │
│  Top contracts                                          See all (12) → │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ████████████░░  91% match                                       │ │
│  │  Globex MSA                                                       │ │
│  │  Signed Mar 2025  ·  $2.4M  ·  Counterparty: Globex Inc.          │ │
│  │  Matched on: Limitation of Liability §9.2                         │ │
│  │  "…aggregate liability shall not exceed the amounts paid in the   │ │
│  │   twelve months preceding the claim, except in cases of…"        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ██████████░░░░  84% match                                       │ │
│  │  Initech Order Form                                               │ │
│  │  Signed Jan 2025  ·  $480K  ·  Counterparty: Initech LLC          │ │
│  │  Matched on: Indemnification §11.1                                │ │
│  │  "…each party shall indemnify and hold harmless the other from…" │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  Top clauses (across contracts)                          See all (24)→│
│                                                                        │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  ████████████░  89% match · Limitation of Liability               │ │
│  │  Acme MSA · §9.2 · Signed Apr 2025                                │ │
│  │  "Each party's total liability under this Agreement shall not    │ │
│  │   exceed the fees paid by Customer in the twelve months…"        │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                        │
│  [ ... 4 more clause rows ... ]                                       │
│                                                                        │
└────────────────────────────────────────────────────────────────────────┘
```

### Sections

The overlay has **two sections** stacked vertically:

1. **Top contracts** (default 3 shown) — ranked by max clause similarity within the contract. Each row shows the contract + the single highest-matching clause as evidence.
2. **Top clauses** (default 5 shown) — ranked by raw clause similarity, regardless of which contract. Useful when the user is hunting a specific clause type.

Both sections have a `See all (n) →` link that opens the full search page filtered to that section.

### Row anatomy

**Contract row:**
- Similarity bar + `% match` (max clause similarity in that contract)
- Contract title (large)
- Meta: signed date · deal size · counterparty
- *Matched on:* clause type + section ref (key explainability)
- Snippet from the matched clause (2 lines)

**Clause row:** identical pattern to the `PrecedentRow` from the Similar Clauses feature — reuse the component.

---

## 4. Dedicated `/search` page

For when the user wants to filter, sort, page deeper. Reached via `See all →` or direct nav.

```
┌────────────────────────────────────────────────────────────────────────┐
│  Search                                                                │
│                                                                        │
│  🔍 unlimited liability indemnification                          ✕    │
│                                                                        │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐  ┌────────────┐       │
│  │ Contracts  │  │ Clauses    │  │ Counterpty │  │ Date range │       │
│  │ (12)       │  │ (24)       │  │ Any   ▾    │  │ Any   ▾    │       │
│  └────────────┘  └────────────┘  └────────────┘  └────────────┘       │
│                                                                        │
│  ────────────────────────────────────────────────────────────────────  │
│                                                                        │
│  Showing 12 contracts                          Sort: Best match  ▾     │
│                                                                        │
│  [ contract row ]                                                      │
│  [ contract row ]                                                      │
│  [ contract row ]                                                      │
│  …                                                                     │
│                                                                        │
│              [ Load more ]                                             │
└────────────────────────────────────────────────────────────────────────┘
```

### Layout

- Search input at top (same component as the bar input, larger here)
- **Two tabs** at the top of results: `Contracts (12)` and `Clauses (24)` — same data as the overlay sections, but full lists
- **Filters** as a horizontal chip row: counterparty (multi-select dropdown), date range, contract type, deal size band. v1 ships with counterparty + date range only.
- **Sort:** `Best match` (default) · `Most recent` · `Largest deal`
- **Pagination:** "Load more" infinite scroll, 20 at a time

---

## 5. States

### 5.1 Empty (no query yet)

When the overlay is open but the input is empty, show **suggested searches** — three example queries that work well on the user's portfolio. Helps users discover the feature's capability.

```
│  Try searching…                                                        │
│                                                                        │
│   "contracts with unlimited liability"                                 │
│   "auto-renewal clauses with short notice periods"                     │
│   "NDAs signed in the last 90 days"                                    │
```

These can be hardcoded in v1, or generated from common clause types in the portfolio.

### 5.2 Loading

After 600ms typing pause, skeleton rows fill both sections. Total response target: **<1.5s** (HyDE call + embedding + kNN).

### 5.3 No results

```
│              ┌──────────────┐                                          │
│              │      ⊘       │                                          │
│              └──────────────┘                                          │
│                                                                        │
│       Nothing matched "unlimited liability indemnification"            │
│                                                                        │
│   Try rephrasing, or browse contracts directly.                        │
│                                                                        │
│   [Browse all contracts]                                               │
```

### 5.4 Low-confidence results

If the top result's similarity is below 0.55, show a banner above results:

> *We didn't find a strong match. Showing closest results.*

Better than silently surfacing irrelevant matches.

### 5.5 Error

Plain "Something went wrong. Retry." in the overlay; don't dump errors.

---

## 6. Interactions

| Action | Result |
|---|---|
| `⌘K` from anywhere | Overlay opens, input focused |
| Type query | After 600ms pause, results load |
| `↓` / `↑` | Navigate results list |
| `Enter` on focused row | Open that contract / clause |
| `Esc` | Close overlay; restore prior page |
| Click `See all` | Navigate to `/search?q=...&tab=contracts|clauses` |
| Click contract row | Navigate to contract detail, scrolled to matched clause |
| Click clause row | Same as Similar Clauses navigation |
| Clear `✕` | Empty input, show suggested searches |

---

## 7. Components to add

Many reusable from #2 (Similar Clauses):

| Component | Reused? | Notes |
|---|---|---|
| `SimilarityBar` | ✓ from #2 | Same |
| `PrecedentRow` | ✓ from #2 | Becomes the clause row |
| `SearchInput` | new | Top-bar variant + large variant |
| `SearchOverlay` | new | Slide-down container with backdrop |
| `ContractResultRow` | new | Like `PrecedentRow` but with contract-level meta + "matched on" |
| `SuggestedSearches` | new | Empty-state list of example queries |
| `SearchFiltersBar` | new | Chip row for `/search` page |
| `SearchPage` | new | The dedicated page |

---

## 8. Copy reference

| Where | Copy |
|---|---|
| Top-bar placeholder | `Search your contracts in plain English…` |
| Overlay empty title | `Try searching…` |
| Section headers | `Top contracts` / `Top clauses (across contracts)` |
| Match unit | `{n}% match` |
| Matched-on label | `Matched on: {clause type} §{section}` |
| Low confidence banner | `We didn't find a strong match. Showing closest results.` |
| No results title | `Nothing matched "{query}"` |
| No results body | `Try rephrasing, or browse contracts directly.` |
| `See all` link | `See all ({n}) →` |
| Sort options | `Best match` / `Most recent` / `Largest deal` |
| Page title | `Search` |
| Shortcut hint | `⌘K` |

---

## 9. Visual direction

- Search input is the **single most prominent element** in the app header. Generous height (~44px), clear placeholder, visible shortcut hint.
- Overlay uses a **strong backdrop** (50% opacity) so the overlay reads as a focused mode, not a dropdown menu.
- Each result row's **left edge owns the similarity bar** — first thing the eye lands on. Consistent with `PrecedentRow` from #2.
- "Matched on" is the explainability anchor — it must be *immediately* visible without scanning the snippet. Use a distinct label style (muted, small caps, or a chip).
- The `/search` page should feel **research-grade, not consumer-grade** — list density, monospace match scores, clear filter affordances. Closer to a SQL workbench than a Google search page.

---

## 10. Out of scope for v1

- Highlighting matched phrases in the snippet (the matches are semantic, not lexical — there's nothing literal to highlight; can be added as v2 with attention extraction)
- Saved searches
- Boolean operators / advanced syntax
- Cross-workspace / cross-tenant search
- Search analytics dashboard

---

## 11. Deliverables for the designer

1. Comp of the **top-bar input** in all four states (default, focused, with query, loading)
2. Comp of the **overlay** in loaded state (with both sections populated), empty state with suggested searches, no-results state, low-confidence banner
3. Comp of the dedicated **`/search` page** with tabs, filters, results, and an empty state
4. The **contract result row** as a distinct component (vs the clause row reused from #2)
5. Motion notes: overlay slide-down (200ms ease-out), backdrop fade (same), shortcut chord visualisation when `⌘K` is pressed (briefly highlight the input)
6. Component specs for the 6 new components in §7
