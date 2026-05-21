# US-010: Similar Clauses

**Epic:** Clause Intelligence (Phase 11)
**Priority:** P0
**Story Points:** 8
**Status:** Ready for Implementation
**Target demo:** 2026-05-22

---

## User Story

As a **legal reviewer**, when I'm reading a clause in a contract, I want to see the most similar clauses we've signed across our portfolio so that I can use precedent to decide whether the clause is acceptable, unusual, or needs pushback.

---

## Why this matters

The portfolio embeddings produced in Phase 8 are invisible to users today. This story makes them tangible: one click on any clause surfaces precedent. It's the smallest possible feature that turns the embedding asset into customer-visible value, and it lays the infrastructure (HNSW index, result-row components, drawer pattern) that Semantic Search (US-011), Outlier Detection (Phase 12), and Playbook Matching (Phase 13) all build on.

---

## Scope summary

- **In:** same-type kNN over portfolio clauses; drawer UI launched from a button on every embedded clause; click-through navigation with highlight; loading / empty / error / single-result states; keyboard support.
- **Out:** cross-type matches; filters (counterparty, date, deal size); accepted/rejected status; outlier scoring; bulk operations.

See [docs/design/similar-clauses-visual.md](../docs/design/similar-clauses-visual.md) for the visual spec and [docs/design/similar-clauses-impl-plan.md](../docs/design/similar-clauses-impl-plan.md) for the implementation plan.

---

## Acceptance Criteria

### Backend

- [ ] HNSW index exists on `clauses.embedding` using `vector_cosine_ops`
- [ ] `GET /api/v1/clauses/:id/similar?limit=5` endpoint returns the response shape defined in §API Contract below
- [ ] Endpoint excludes the source clause itself and any other clauses from the same `documentId`
- [ ] Endpoint filters to the same `clause.type` as the source
- [ ] Endpoint returns 404 if the source clause does not exist
- [ ] Endpoint returns 409 with a clear error code if the source clause has `embedding IS NULL`
- [ ] Endpoint returns ≤ `limit` results, default 5, max 20
- [ ] p95 latency < 300ms on a portfolio of ≥ 10,000 clauses
- [ ] Handler unit test covers: happy path, no-results, missing source, null-embedding source, type filter, self/document exclusion
- [ ] e2e test against a real pgvector instance covers shape and ordering

### Frontend — Trigger

- [ ] `Find similar` button appears on every clause card where `clause.embedding` is non-null
- [ ] Button is hidden (not disabled) for clauses without embeddings
- [ ] Button shows a loading spinner and is disabled while the request is in flight
- [ ] Pressing `F` when a clause is focused opens the drawer for that clause
- [ ] Tooltip on hover: *"Find 5 most similar clauses across your portfolio (F)"*

### Frontend — Drawer

- [ ] Drawer slides in from the right (480px wide, 180ms ease-out)
- [ ] Backdrop dims the main content to ~20% opacity; clicking the backdrop closes the drawer
- [ ] `Esc` closes the drawer
- [ ] Header shows title "Similar clauses" and a close `✕` button
- [ ] **Source block** at the top shows the user's clause (type, contract + section, 2-line snippet), visually de-emphasised
- [ ] Source block remains visible/sticky while results scroll
- [ ] Results section header: `{n} similar clauses` (or `1 similar clause` when n=1)

### Frontend — Result Rows

- [ ] Each row contains, top to bottom: similarity bar + `{n}% match`, clause type, `{document title} · {month YYYY}`, 2–3 line snippet, arrow icon
- [ ] Similarity bar visually fills proportional to the score
- [ ] Hovering a row elevates it and brightens the arrow
- [ ] Entire row is a single click target
- [ ] Clicking a row scrolls the main content to the target clause and applies a 2-second highlight ring
- [ ] After click, the row becomes `active` (filled border / accent state); the drawer stays open
- [ ] Drawer header gains a breadcrumb: `Similar clauses › {Contract name} §{section}`
- [ ] Clicking the source block at the top returns navigation to the source clause and clears the active row

### Frontend — States

- [ ] **Loading:** skeleton rows render within the drawer; no spinner
- [ ] **Empty (no results):** centred empty-state card with icon, headline ("No similar clauses found yet") and explanation copy per visual spec
- [ ] **Single result:** header reads "1 similar clause"; otherwise identical to multi-result layout
- [ ] **Error:** plain message ("Couldn't load similar clauses") with a `Retry` button
- [ ] No "you've viewed this" indicator on the trigger button (intentional simplicity)

### Keyboard & Accessibility

- [ ] `F` opens the drawer for the currently focused clause
- [ ] `Esc` closes
- [ ] `↓` / `↑` move focus between result rows
- [ ] `Enter` on a focused row activates it
- [ ] Drawer has `role="dialog"` and `aria-modal="true"`
- [ ] Focus is trapped inside the drawer while open; focus returns to the trigger button on close
- [ ] Similarity bar exposes `aria-label="{n} percent match"`
- [ ] All interactive elements have visible 3px focus indicators
- [ ] Drawer container has an `aria-label="Similar clauses"`
- [ ] Color contrast ≥ 4.5:1 for all text in all states

### Performance

- [ ] Time from button click to first result paint: < 600ms p95 on demo data
- [ ] Drawer open animation completes in < 200ms
- [ ] Drawer scroll and row hover at 60fps on a 4-year-old laptop

### Telemetry (lightweight)

- [ ] Emit `clause.similar.opened` with `{ clauseId, clauseType }`
- [ ] Emit `clause.similar.result_clicked` with `{ sourceClauseId, targetClauseId, rank, similarity }`
- [ ] Emit `clause.similar.empty_state_shown` with `{ clauseId, clauseType }`

---

## API Contract

### Endpoint

```
GET /api/v1/clauses/:id/similar?limit=5
```

### Response (200)

```json
{
  "source": {
    "id": "clause_abc",
    "type": "limitation_of_liability",
    "textSnippet": "Each party's total liability under this Agreement…",
    "documentId": "doc_123"
  },
  "results": [
    {
      "id": "clause_xyz",
      "type": "limitation_of_liability",
      "textSnippet": "Each party's aggregate liability shall not exceed…",
      "similarity": 0.94,
      "document": {
        "id": "doc_456",
        "title": "Globex MSA",
        "uploadedAt": "2025-03-14T00:00:00.000Z"
      },
      "pageNumber": 7,
      "sectionRef": "9.2"
    }
  ]
}
```

### Errors

| Status | Code | When |
|---|---|---|
| 404 | `clause_not_found` | Source clause does not exist |
| 409 | `clause_not_embedded` | Source clause has `embedding IS NULL` |
| 400 | `invalid_limit` | `limit` outside [1, 20] |

---

## Component Inventory

All new components live under `apps/frontend/src/components/features/similar-clauses/`:

| Component | Purpose |
|---|---|
| `FindSimilarButton` | Trigger on the clause card; default / hover / loading states |
| `SimilarClausesDrawer` | 480px right slide-over with header, source block, results list, breadcrumb |
| `SourceClauseCard` | Muted compact card showing the source clause |
| `SimilarityBar` | Horizontal bar 0–100% with paired `% match` label |
| `PrecedentRow` | Result row: bar · type · meta · snippet · arrow; default / hover / active states |
| `EmptyPrecedentState` | Icon + headline + body for the no-results state |

`SimilarityBar` and `PrecedentRow` are flagged as reusable infrastructure — Phase 11 US-011 and Phases 12–13 will reuse them.

---

## Definition of Done

- [ ] All acceptance criteria above met
- [ ] Backend tests pass; e2e test against pgvector passes
- [ ] Frontend unit + integration tests pass
- [ ] Demo dataset audit script (`scripts/check-demo-readiness.ts`) reports green
- [ ] End-to-end demo script run without surprises (see implementation plan §6)
- [ ] No regressions on existing clauses tab
- [ ] `phase11_status.md` memory note updated marking US-010 complete

---

## Notes for Implementation

1. Use `$queryRaw` for the pgvector kNN query — Prisma doesn't natively support `<=>` operators. Be careful to pass the embedding as `$1::vector` and not as a string.
2. The drawer is **not** a modal in semantic terms — it's a research panel. Visual treatment must reflect this (no heavy shadow, no OK/Cancel semantics).
3. The "click-row-to-navigate" interaction is the demo "aha" — protect it. If anything else is cut, this stays.
4. Keep the cuts list (implementation plan §7) in mind; don't gold-plate when the deadline is tight.
