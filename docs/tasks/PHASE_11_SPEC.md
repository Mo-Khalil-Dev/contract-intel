# Phase 11 — Clause Intelligence (Similar Clauses + Semantic Search)

**Status:** Planning
**Start:** 2026-05-21
**Target demo:** 2026-05-22 (Similar Clauses), follow-on date TBD for Semantic Search
**Depends on:** Phase 8 (clause extraction + embeddings) — done
**Builds toward:** Phase 12 (Outlier Detection), Phase 13 (Playbook)

---

## 1. Phase goal

Make the clause embeddings produced in Phase 8 visible and useful to end users, by shipping two clause-intelligence features that share the same retrieval infrastructure:

1. **Similar Clauses** (US-010) — given any clause in any contract, surface the most semantically similar clauses across the user's portfolio.
2. **Semantic Search** (US-011) — given a natural-language query, surface the most relevant contracts and clauses across the portfolio.

Both reduce to the same primitive: kNN over `clauses.embedding` via pgvector. Building #1 first lays the index, the DTO shape, the result-row components, and the result-navigation pattern — all of which #2 reuses.

---

## 2. Why this phase, why now

The embeddings are in the database but **invisible to users**. Until something on screen reads from `clauses.embedding`, the cost (Voyage API calls, pgvector storage) earns zero ROI. Phase 11 turns the asset into product surface.

This phase is also a **prerequisite for the negotiation suite** (Phases 12–13). Outlier detection and playbook matching both depend on cohort-aware kNN. We need the infrastructure, the index, and the result-row component vocabulary in place before either is buildable.

---

## 3. In scope

### US-010: Similar Clauses (primary, ship first)

- `GET /api/v1/clauses/:id/similar` endpoint returning top-k same-type clauses by cosine similarity, excluding self and same-document
- pgvector HNSW index on `clauses.embedding`
- Frontend drawer launched from a `Find similar` button on every clause card
- Source-clause anchor + 5 ranked precedent rows with similarity bars
- Click-through navigation to the matched clause in its source contract, with highlight
- Empty / loading / error / single-result states
- Keyboard support (`F` to open, `Esc` to close, arrow keys, `Enter`)

### US-011: Semantic Search (secondary, ship after US-010 lands)

- `GET /api/v1/search?q=...` endpoint with HyDE query rewriting + kNN over all clauses
- Global `⌘K` overlay with two sections (Top contracts, Top clauses)
- Dedicated `/search` page with tabs, filters (counterparty + date range), sort, infinite scroll
- Suggested-search empty state, low-confidence banner, no-results state
- Result rows reuse `SimilarityBar` and `PrecedentRow` from US-010

---

## 4. Out of scope (call out explicitly to prevent scope creep)

- Outlier detection (Phase 12)
- Playbook matching (Phase 13)
- Cross-type clause search (v1 filters to same type)
- Accepted vs. redlined status on results (we don't track this yet)
- Saved searches, boolean operators, advanced query syntax
- Document-level embeddings (clause-level only)
- Highlighting matched phrases inside snippets (matches are semantic, not lexical)
- Cross-tenant or cross-workspace search

---

## 5. Sequencing

Strict gate between the two stories: **US-011 does not start until US-010 reaches "Definition of Done"**, because US-011's components and infrastructure depend on US-010.

```
Day 1 (Thu 2026-05-21)  → US-010 backend (index + handler + endpoint + tests)
                          US-010 frontend service + hook
                          US-010 component build begins

Day 2 (Fri 2026-05-22)  → US-010 components finished + integrated
                          US-010 demo data prep + QA pass
                          US-010 DEMO CHECKPOINT (noon)

If US-010 ships:
Day 3+                  → US-011 backend (HyDE + search endpoint)
                          US-011 overlay component
                          US-011 /search page
                          US-011 QA pass + demo
```

---

## 6. Success criteria

### Functional

- A user reviewing any clause can find similar clauses across their portfolio in one click, returning in <300ms p95.
- A user can search their portfolio in plain English and get relevant contracts + clauses returning in <1.5s p95.

### Quality

- Similarity ranking is *credible* on demo data: top result is genuinely the most similar clause by lawyer judgement, not a near-random match.
- Empty / low-confidence states explain *why*, not just *that*, no result is shown.
- Result navigation lands the user on the right clause, scrolled into view, visually highlighted.

### Engineering

- Single HNSW index serves both features (no duplicated infrastructure).
- `SimilarityBar` and `PrecedentRow` are reused by US-011 without modification beyond props extension.
- Test coverage matches project standard (handler unit + e2e for the new endpoints; component unit + integration for new UI).

---

## 7. Risks and mitigations

| Risk | Mitigation |
|---|---|
| Demo dataset is sparse for some clause types → empty results during demo | Pre-flight audit (see US-010 §0); hand-pick 2–3 supplemental contracts if needed |
| HyDE query rewriting produces poor matches for vague queries | Low-confidence banner UX safety valve; reserve a half-day for prompt tuning in US-011 |
| `pgvector` cosine ops not yet enabled in some environments | Verified in Phase 8; sanity-check in US-010 §0 pre-flight |
| Drawer + main-content navigation pattern is new to the codebase | Build `SimilarClausesDrawer` against a minimal portal primitive; document the pattern so US-011 overlay can copy it |
| US-010 slips past Friday → no demo | Cuts list defined in implementation plan; never cut source block, similarity bar, or click-to-navigate |

---

## 8. Deliverables

| # | Deliverable | Owner | Done when |
|---|---|---|---|
| 1 | `PHASE_11_SPEC.md` (this doc) | PM | Reviewed by eng lead |
| 2 | `US-010_Similar_Clauses.md` | PM | Acceptance criteria signed off |
| 3 | `US-011_Semantic_Search.md` | PM | Acceptance criteria signed off |
| 4 | US-010 implementation | Eng | All AC met, demo passes |
| 5 | US-011 implementation | Eng | All AC met, demo passes |
| 6 | `phase11_status.md` memory note | PM | At end of phase |

---

## 9. Open questions

1. Should the `Find similar` button appear only on clauses with `embedding IS NOT NULL`, or always (with a disabled state)? **Recommendation:** only show on embedded clauses; legacy un-embedded clauses get nothing rather than a broken affordance.
2. Should similarity scores below a threshold (e.g. <0.5) be hidden, or shown with a "weak match" label? **Recommendation:** hide in US-010 (results are pre-filtered server-side); show with the low-confidence banner in US-011 where the user controls the query.
3. Should `⌘K` from inside a contract bias the search toward that contract's counterparty/type? **Recommendation:** no — global search stays global in v1; we add scoped search in a later phase.
