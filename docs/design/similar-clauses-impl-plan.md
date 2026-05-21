# Similar Clauses — Implementation Plan

**Target:** demo-ready Friday.
**Today:** Wed 2026-05-20. Two working days (Thu, Fri AM).
**Owner:** one full-stack engineer.

This plan assumes the existing stack: NestJS CQRS backend, Prisma + Postgres + pgvector (1024-dim, voyage-law-2), React frontend with v2 component style, `clauses` module already extracts and embeds clauses on ingest.

---

## 0. Pre-flight (15 min, Wed evening)

Confirm before starting:

- `clauses.embedding` is populated for the demo dataset. Run:
  ```sql
  SELECT type, COUNT(*) FILTER (WHERE embedding IS NOT NULL) AS embedded,
                       COUNT(*) AS total
  FROM clauses GROUP BY type ORDER BY total DESC;
  ```
  If any clause type used in the demo has <5 embedded rows, fix in step 5 (demo data).
- Confirm a pgvector index exists on `clauses.embedding`. If not, add it as the first migration in step 1.

---

## 1. Backend — vector index + query (Thu AM, ~3 hrs)

### 1.1 Migration: pgvector index

If not present, add an IVFFlat or HNSW index on `clauses.embedding` for cosine distance:

```sql
-- apps/backend/prisma/migrations/{date}_clause_embedding_index/migration.sql
CREATE INDEX IF NOT EXISTS clauses_embedding_cosine_idx
  ON clauses USING hnsw (embedding vector_cosine_ops);
```

HNSW preferred over IVFFlat — no training step, better recall at our scale.

### 1.2 Query handler

New CQRS query in `apps/backend/src/modules/clauses/application/queries/`:

- `get-similar-clauses.query.ts` — `{ clauseId, limit?: number = 5, minSimilarity?: number = 0.5 }`
- `get-similar-clauses.handler.ts`
- `get-similar-clauses.handler.spec.ts`

**Handler logic:**
1. Load source clause by id; fail with 404 if not found or `embedding IS NULL`.
2. Raw SQL via Prisma (`$queryRaw`) — Prisma doesn't natively support pgvector operators:
   ```sql
   SELECT
     c.id, c.type, c.text, c."documentId", c."pageNumber", c."sectionRef",
     d.title          AS document_title,
     d."uploadedAt"   AS document_uploaded_at,
     1 - (c.embedding <=> $1::vector) AS similarity
   FROM clauses c
   JOIN documents d ON d.id = c."documentId"
   WHERE c.id != $2
     AND c."documentId" != $3
     AND c.type = $4
     AND c.embedding IS NOT NULL
     AND (1 - (c.embedding <=> $1::vector)) >= $5
   ORDER BY c.embedding <=> $1::vector
   LIMIT $6;
   ```
3. Map rows → `SimilarClauseDto[]` (define DTO; see 1.3).
4. Return alongside source clause summary for the drawer's source block.

**Why same-type-only in v1:** noise reduction. Cross-type matches are usually spurious. Flag for v2 to relax.

### 1.3 DTO + mapper

`get-similar-clauses.dto.ts`:

```ts
export interface SimilarClauseDto {
  id: string;
  type: string;
  textSnippet: string;   // first 240 chars
  similarity: number;    // 0..1
  document: {
    id: string;
    title: string;
    uploadedAt: string;  // ISO
  };
  pageNumber: number | null;
  sectionRef: string | null;
}

export interface SimilarClausesResponse {
  source: { id: string; type: string; textSnippet: string; documentId: string };
  results: SimilarClauseDto[];
}
```

### 1.4 Controller route

In the existing clauses controller (or create one if absent):

```
GET /api/v1/clauses/:id/similar?limit=5
```

Auth: same guard as other clause endpoints. Returns `SimilarClausesResponse`.

### 1.5 Tests

- Handler spec: mocks repository, asserts SQL parameters, ordering, self-exclusion, same-document exclusion, type filter.
- Controller e2e: hits a seeded dataset with 3 known-similar clauses, asserts ordering and shape.
- One integration test against a real pgvector instance (docker-compose) to catch SQL syntax issues — these don't surface in unit tests.

---

## 2. Frontend — API client + hook (Thu PM, ~1.5 hrs)

### 2.1 Service

`apps/frontend/src/services/similarClausesService.ts`:

```ts
export async function getSimilarClauses(clauseId: string, limit = 5)
  : Promise<SimilarClausesResponse>;
```

Thin wrapper over the existing axios/fetch client. Error mapping consistent with other services.

### 2.2 Hook

`apps/frontend/src/hooks/useSimilarClauses.ts`:

- Inputs: `clauseId | null` (null = drawer closed, don't fetch), `limit`
- Returns: `{ data, isLoading, error, refetch }`
- Use TanStack Query (or whatever pattern the project already uses — check `useDocumentList`).
- Stale time: 5 min (results are stable for a session).

---

## 3. Frontend — components (Thu PM → Fri AM, ~5 hrs)

Build in this order so each is testable on its own:

### 3.1 `SimilarityBar` (~30 min)
`apps/frontend/src/components/features/similar-clauses/SimilarityBar.tsx`
- Props: `value: number` (0..1)
- Renders horizontal bar + `{Math.round(value*100)}% match` label
- Storybook entry or a small dev playground route for visual check

### 3.2 `PrecedentRow` (~1 hr)
- Props: `clause: SimilarClauseDto, isActive: boolean, onClick: () => void`
- Composition: `SimilarityBar` · clause type · `{document.title} · {formattedDate}` · 2-line snippet · arrow icon
- Hover and active states per the visual spec

### 3.3 `SourceClauseCard` (~30 min)
Muted/compact card for drawer header. Reuses typography of the existing clause card but lighter background and reduced padding.

### 3.4 `EmptyPrecedentState` (~30 min)
Icon + headline + body copy per the visual spec.

### 3.5 `SimilarClausesDrawer` (~2 hrs)
`apps/frontend/src/components/features/similar-clauses/SimilarClausesDrawer.tsx`
- Props: `clauseId: string | null, onClose: () => void, onNavigateToClause: (target) => void`
- Internally uses `useSimilarClauses(clauseId)`
- Renders: header · source block · either skeletons / list / empty / error
- 480px wide right slide-over. Use existing portal/drawer primitive if one exists; otherwise add a minimal one with a backdrop + `Esc` handler.
- Animations: 180ms ease-out slide.

### 3.6 `FindSimilarButton` (~30 min)
Small button placed on the existing clause card. Loading state, tooltip with `(F)` hint.

---

## 4. Integration into existing clause view (Fri AM, ~1.5 hrs)

- Locate the clauses tab on the contract detail page (`pages/ResultsPage/tabs` likely).
- Add `FindSimilarButton` to the clause card actions area.
- Lift drawer state to the tab/page level: `const [openForClauseId, setOpenForClauseId] = useState<string | null>(null)`.
- Wire button onClick → `setOpenForClauseId(clause.id)`.
- Pass `onNavigateToClause` to drawer: when fired, scroll the main content to the target clause and apply the highlight ring (2s timeout, then persistent left-border until drawer closes).
- Keyboard: `F` when a clause has focus opens the drawer; `Esc` closes.

---

## 5. Demo data prep (Fri AM, ~1 hr)

This is where demos die. Treat as a real task, not an afterthought.

- Identify the 2–3 contracts you'll click during the demo.
- For each clause you'll click, confirm the API returns ≥3 results with similarity > 0.7.
- If a clause type is sparse, upload 2–3 hand-picked contracts that contain plausible variants of that clause. Re-run extraction so embeddings populate.
- Write a `scripts/check-demo-readiness.ts` that asserts: for each `(documentId, clauseId)` in a fixture list, similar-clauses endpoint returns ≥3 results.

---

## 6. QA pass (Fri AM, ~1 hr)

Run through the demo script end-to-end:

- Open contract A, click first 3 clauses, hit Find similar on each — all return well.
- Click into a result, confirm navigation + highlight.
- Click source block, confirm return.
- Trigger empty state by picking a clause type with no precedent (have one queued).
- Esc closes drawer; F opens it.
- Throttle network to 3G in devtools — confirm skeletons appear, then results in <1s.

---

## 7. Cuts list (if running behind)

In order of what to drop first:

1. Keyboard shortcut `F` — nice-to-have, not demo-critical.
2. Persistent left-border on highlighted target clause — keep the 2s ring, drop the persistent.
3. Active-row styling in the drawer — nice but not essential.
4. Tests beyond the handler unit test.
5. Empty state — only matters if a demo click might hit it; otherwise stub.

**Never cut:**
- Source block in drawer (orients the user)
- Similarity bar (the visual hero)
- Smooth scroll + highlight on result click (the "aha" moment)

---

## 8. Definition of done (Friday noon checkpoint)

- [ ] `GET /api/v1/clauses/:id/similar` returns 5 results in <300ms p95 on demo data
- [ ] Find similar button visible on every clause card
- [ ] Drawer opens, shows source + 5 results with similarity bars
- [ ] Clicking a result navigates and highlights
- [ ] Empty state renders cleanly when no matches
- [ ] Demo script run end-to-end without surprises

---

## 9. Hand-off to feature #14 (Semantic Search)

If #2 lands by Friday noon, feature #14 can start immediately and reuse:

- The pgvector HNSW index (same index works for both)
- The DTO shape (semantic search returns clauses too, just from a different query)
- `SimilarityBar` and `PrecedentRow` components (renamed and slightly extended)
- The hook pattern (`useSimilarClauses` → `useSemanticSearch`)

The marginal cost of #14 after #2 lands is one new endpoint with HyDE query rewriting, one new page (search), and a query input component. See `semantic-search-visual.md` for the UI prep.
