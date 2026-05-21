# US-011: Semantic Contract Search

**Epic:** Clause Intelligence (Phase 11)
**Priority:** P1
**Story Points:** 13
**Status:** Blocked on US-010
**Target demo:** TBD (after US-010 ships)

---

## User Story

As a **legal reviewer or contracts manager**, I want to search my contracts in plain English so that I can find relevant contracts and clauses by meaning, not by keyword, even when I don't know the exact wording.

---

## Why this matters

Today, finding "the contract with the unusual indemnification" requires either remembering the counterparty name or grepping through PDFs. With clause embeddings already in place, a natural-language search bar turns the portfolio into something the user can interrogate conversationally. It's the headline feature for the embeddings investment.

---

## Scope summary

- **In:** global `⌘K` overlay; `/search` page with tabs and filters; HyDE query rewriting; result rows reused from US-010.
- **Out:** highlighted match phrases; saved searches; boolean syntax; cross-tenant search; in-context (scoped) search.

See [docs/design/semantic-search-visual.md](../docs/design/semantic-search-visual.md) for the visual spec.

---

## Acceptance Criteria

### Backend

- [ ] `GET /api/v1/search?q=...&limit=50` endpoint exists and is auth-guarded
- [ ] Query pipeline: HyDE rewrite (LLM call) → embed rewritten text → kNN over `clauses.embedding`
- [ ] Response returns both:
  - `contracts`: top N documents ranked by max clause similarity within the document; each carries the best-matching clause as evidence
  - `clauses`: top M clauses by raw similarity, regardless of document
- [ ] Response includes a `confidence` field per the top result; if `< 0.55`, frontend renders the low-confidence banner
- [ ] Results respect the auth scope (only the user's own portfolio)
- [ ] p95 latency < 1.5s on a portfolio of ≥ 10,000 clauses
- [ ] Handler unit test covers: happy path, no-results, low-confidence, HyDE call failure (graceful degradation to embedding the raw query)
- [ ] e2e test against pgvector + a stubbed HyDE rewriter

### Frontend — Top-Bar Input

- [ ] Persistent search input lives in the app header on every page
- [ ] Placeholder: "Search your contracts in plain English…"
- [ ] Right-aligned `⌘K` keyboard hint when unfocused
- [ ] Focus state: subtle accent border, hint hidden
- [ ] Clear `✕` icon appears when input has content
- [ ] Loading spinner replaces magnifier icon while a request is in flight
- [ ] `⌘K` / `Ctrl+K` from anywhere opens the overlay with input focused

### Frontend — Overlay

- [ ] Slides down from the search bar with a strong backdrop (~50% opacity)
- [ ] Closes on `Esc`, backdrop click, or `✕`
- [ ] Renders **two sections**: "Top contracts" (3 rows) and "Top clauses (across contracts)" (5 rows)
- [ ] Each section has a `See all ({n}) →` link that opens `/search?q=...&tab={contracts|clauses}`
- [ ] Debounces input by 600ms before firing a request
- [ ] Keyboard navigation: `↓` / `↑` move focus across all rows in both sections; `Enter` activates focused row
- [ ] Contract row anatomy: similarity bar · contract title · meta (signed date · deal size · counterparty) · "Matched on: {clause type} §{section}" · 2-line snippet
- [ ] Clause row reuses `PrecedentRow` from US-010 unchanged

### Frontend — Overlay States

- [ ] **Empty (no query):** shows "Try searching…" with 3 example queries; clicking one populates the input and fires the search
- [ ] **Loading:** skeleton rows in both sections
- [ ] **Low confidence:** banner above results: *"We didn't find a strong match. Showing closest results."*
- [ ] **No results:** centred empty-state with icon, headline, and a "Browse all contracts" CTA
- [ ] **Error:** plain message with `Retry` button

### Frontend — `/search` Page

- [ ] Reachable via `See all →` from the overlay and via direct nav
- [ ] URL is the source of truth: `?q=...&tab=contracts|clauses&counterparty=...&from=...&to=...&sort=...`
- [ ] Top of page: same search input (larger variant); below it, two tabs: `Contracts ({n})` and `Clauses ({n})`
- [ ] Filter chip row: `Counterparty` (multi-select) and `Date range` (preset + custom). Other filters deferred to v2
- [ ] Sort dropdown: `Best match` (default) · `Most recent` · `Largest deal`
- [ ] Results list paginated by "Load more" infinite scroll, 20 items per page
- [ ] Direct-linkable: opening `/search?q=foo` loads results without further user action
- [ ] Empty filters state: when filters return zero, show a "Clear filters" CTA, not just the no-results card

### Keyboard & Accessibility

- [ ] `⌘K` / `Ctrl+K` opens overlay from anywhere; documented in a `?` shortcut help (deferred if needed)
- [ ] Overlay has `role="dialog"` and `aria-modal="true"`
- [ ] Focus is trapped in the overlay; returns to header input on close
- [ ] Tabs on `/search` are keyboard-navigable (`←` / `→`); follow WAI-ARIA tabs pattern
- [ ] All result rows are focusable buttons with proper labels
- [ ] Search input on `/search` uses `role="searchbox"` and is wired to URL state
- [ ] Color contrast ≥ 4.5:1 across all states

### Performance

- [ ] Overlay opens in < 100ms (no network)
- [ ] First result paint after debounce: < 1.5s p95
- [ ] `/search` infinite scroll page load: < 800ms p95

### Telemetry

- [ ] `search.opened` `{ surface: 'overlay' | 'page' }`
- [ ] `search.query_submitted` `{ query, length, surface }`
- [ ] `search.result_clicked` `{ query, resultType: 'contract' | 'clause', rank, similarity }`
- [ ] `search.low_confidence_shown` `{ query }`
- [ ] `search.empty_state_shown` `{ query }`
- [ ] `search.suggested_query_clicked` `{ suggestion }`

---

## API Contract

### Endpoint

```
GET /api/v1/search?q={text}&limit=50&counterparty={id}&from={iso}&to={iso}
```

### Response (200)

```json
{
  "query": "unlimited liability indemnification",
  "rewrittenQuery": "A clause where the parties accept unlimited liability for indemnification claims…",
  "confidence": 0.81,
  "contracts": [
    {
      "id": "doc_456",
      "title": "Globex MSA",
      "uploadedAt": "2025-03-14T00:00:00.000Z",
      "counterparty": "Globex Inc.",
      "dealSize": 2400000,
      "matchedClause": {
        "id": "clause_xyz",
        "type": "limitation_of_liability",
        "sectionRef": "9.2",
        "textSnippet": "…aggregate liability shall not exceed…",
        "similarity": 0.91
      }
    }
  ],
  "clauses": [
    {
      "id": "clause_xyz",
      "type": "limitation_of_liability",
      "textSnippet": "Each party's total liability…",
      "similarity": 0.89,
      "document": { "id": "doc_456", "title": "Globex MSA", "uploadedAt": "..." },
      "pageNumber": 7,
      "sectionRef": "9.2"
    }
  ]
}
```

### Errors

| Status | Code | When |
|---|---|---|
| 400 | `query_too_short` | `q.length < 3` |
| 502 | `hyde_unavailable` | HyDE LLM call failed and raw-query fallback also failed |

---

## Component Inventory

New components under `apps/frontend/src/components/features/search/`:

| Component | Purpose | Reused? |
|---|---|---|
| `SearchInput` | Top-bar variant + large variant for `/search` page | new |
| `SearchOverlay` | Slide-down container with backdrop | new |
| `ContractResultRow` | Row with contract meta + "Matched on" + clause snippet | new |
| `SuggestedSearches` | Empty-state list of example queries | new |
| `SearchFiltersBar` | Chip row for `/search` page | new |
| `SearchPage` | Dedicated `/search` route | new |
| `SimilarityBar` | — | ✓ reused from US-010 |
| `PrecedentRow` | — | ✓ reused from US-010 (clause section) |

---

## Definition of Done

- [ ] All acceptance criteria met
- [ ] Backend tests pass including HyDE-failure fallback
- [ ] Frontend unit + integration tests pass
- [ ] Demo dataset audit: 4–5 showcase queries return strong results
- [ ] HyDE prompt tuned and reviewed
- [ ] End-to-end demo script run without surprises
- [ ] `phase11_status.md` memory note updated marking US-011 complete

---

## Notes for Implementation

1. **HyDE is the quality lever.** Reserve a half-day for prompt tuning before declaring this story done — the difference between a great demo and a mediocre one lives in the rewrite prompt.
2. **Graceful degradation:** if the HyDE call fails, embed the raw query directly. Don't fail the request.
3. **Reuse `SimilarityBar` and `PrecedentRow` unchanged.** If they need props changes, do those in US-010 and bring them forward.
4. **URL state on `/search` page** is non-negotiable — users will share search links.
5. **The suggested queries in the empty overlay state** are the first impression of the feature. Pick three that show off the feature's capability on the demo dataset.
