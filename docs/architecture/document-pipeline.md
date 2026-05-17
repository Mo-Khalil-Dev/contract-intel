# Document Pipeline — End-to-End

How a PDF becomes a searchable, classified, risk-scored, embedding-indexed
contract. Plain-English walkthrough of every stage and the *why* behind it.

For the formal specs see:
- [requirements.md](../../.kiro/specs/contract-analysis-platform/requirements.md)
- [design.md](../../.kiro/specs/contract-analysis-platform/design.md)
- [ocr-design.md](../../.kiro/specs/contract-analysis-platform/ocr-design.md)
- [clause-extraction-design.md](../../.kiro/specs/contract-analysis-platform/clause-extraction-design.md)

---

## The whole flow at a glance

```
┌─────────────────────────────────────────────────────────────────────┐
│  1. UPLOAD            (Phase 5)                                     │
│     User picks a PDF → presigned URL → bytes land in object storage │
│     Result: Document row with status=complete, blob in GCS/local FS │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ DocumentUploadCompletedEvent
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  2. OCR / TEXT EXTRACTION   (Phase 7)                               │
│     PDF → per-page text                                              │
│       • Native pdfjs for digital pages (free, fast)                  │
│       • Google Document AI for scanned pages ($0.0015/page)          │
│       • Hybrid: per-page routing + quality-demotion fallback         │
│     Result: DocumentText (full text + per-page metadata)             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ DocumentOcrCompletedEvent
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  3. CLAUSE EXTRACTION + CLASSIFICATION + RISK SCORING   (Phase 8)   │
│     One Claude call returns clauses[] with:                          │
│       • type        ← one of 15 categories                           │
│       • confidence  ← 0–1                                            │
│       • text        ← verbatim slice                                 │
│       • riskScore   ← 0–100                                          │
│       • riskLevel   ← low | medium | high | critical                 │
│       • riskFlags   ← e.g. ["uncapped_liability"]                    │
│     Server resolves char-offsets via indexOf; hallucinations dropped.│
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  4. EMBEDDING                   (Phase 8, Task 8.5)                 │
│     For each clause, Voyage `voyage-law-2` returns a 1024-dim       │
│     vector — the clause's "meaning fingerprint."                    │
│     Stored alongside the clause in a pgvector column.               │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  5. PERSISTENCE                (Phase 8)                            │
│     One Postgres transaction:                                       │
│       • ExtractionRun row (status=complete, counts, model versions) │
│       • Clause rows (parents first, then children with FK resolved) │
│       • Document.extractionStatus → extraction_complete             │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  6. UI                        (Phase 8.6, upcoming)                 │
│     /results/:documentId — clauses grouped by type, click to see    │
│     in the PDF, filter by type / confidence / risk level.           │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  7. SEMANTIC SEARCH           (Phase 10, future)                    │
│     User types query → embed query → pgvector finds nearest-vector  │
│     clauses across ALL documents. Powered by the column built in 4. │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Stage details

### 1. Upload

- File-size guard (≤50 MB) enforced at the value-object layer.
- Storage abstraction: `LocalStorageDriver` in dev, `GcsStorageDriver` in prod. Browser PUTs the bytes directly via a presigned URL — the backend never streams the file body.
- `DocumentUploadCompletedEvent` published on completion; nothing downstream is coupled to upload internals.

### 2. OCR / Text extraction

- **Per-page classification** decides how each page is processed:
  - "digital" (extractable text layer) → pdfjs native path. Free.
  - "scanned" (image-only) → Google Document AI sync (≤15 pages) or batch path (>15 pages).
  - "blank" → emit empty page.
- **Quality demotion**: digital pages with `textQualityScore < 0.5` (broken cmaps, garbled text) re-run through Document AI.
- A document's `driver` ends up as `native_pdf | google_document_ai | hybrid` depending on page mix.
- 200-page cap and English-only language gate keep costs predictable.
- Output blob (`{documentId}.text.json`) stores full text + per-page metadata; only thin metadata lives in Postgres.

### 3. Clause extraction + classification + risk scoring

A single Claude Opus 4.7 call does three jobs in one tool-use invocation:

| Job              | Output field              |
|------------------|---------------------------|
| Segment          | `text` (verbatim slice)   |
| Classify         | `type` + `confidence`     |
| Risk score       | `riskScore` + `riskLevel` + `riskFlags` + `riskExplanation` |

**Why one call**: ~50% cheaper and ~50% lower latency than three calls; Claude already understands the clause when classifying, so adding risk reasoning to the same prompt is nearly free.

**Server-side guardrails**:
- LLM returns `text` verbatim; the server resolves byte offsets via `indexOf` on the full document text.
- Clauses whose text isn't found are dropped (logged + counted as `droppedClauseCount`). This catches hallucinations.
- Parent-child links are LLM-supplied `clientRef`s; the handler resolves them to real `ClauseId`s in a two-pass insert.
- Documents above 200k chars are chunked on page boundaries and run in parallel.

**Risk rubric is DRAFT** — Phase 9 prerequisite: legal-SME validation against a labelled ground-truth set before risk fields are surfaced in the UI. See `clause-extraction-design.md` §6.2.

### 4. Embedding

For each clause, the embedding service produces a 1024-float vector. Stored in a pgvector column on the same row as the clause text.

> Why this matters: see the next section.

### 5. Persistence

- pgvector extension declared in the Prisma schema; vector binding uses `$executeRaw` with `::vector` casts because Prisma can't natively type `vector(N)`.
- All clauses for an `ExtractionRun` are inserted in **one transaction**, parents before children, so the self-FK `parentClauseId` resolves cleanly.
- `ON DELETE SET NULL` on the parent FK preserves orphaned children rather than cascading deletion.
- Re-extraction creates a new `ExtractionRun` row; the old run is retained for audit and `Document.currentExtractionRunId` points at the newest.

### 6. UI

`/processing/:id` shows the document rolling forward through OCR → extracting → results. `/results/:id` shows the extracted clauses grouped by type, with confidence pills, page anchors, and click-to-highlight in the PDF.

### 7. Semantic search (Phase 10)

User-facing endpoint embeds the query text → pgvector `<=>` cosine similarity → returns top-K clauses across the whole corpus, regardless of exact wording. This unlocks "find clauses like this one" workflows.

---

# Why we embed every clause

## What an embedding is, in one line

**An embedding is a list of numbers representing the *meaning* of a piece of text.** Voyage's `voyage-law-2` produces 1024 floats per clause; similar meanings produce similar number patterns.

## The benefit, made concrete

Consider two clauses across two different contracts:

```
Contract A:
  "Neither party shall be liable for indirect, incidental, or
   consequential damages arising under this Agreement."

Contract B:
  "In no event will either side be responsible for indirect or
   consequential losses resulting from this contract."
```

**Keyword search comparing these two finds almost no overlap.** Different words, same meaning.

**Embedding search nails it.** The vectors for the two clauses are very close together in the 1024-dimensional space because Voyage was trained to put semantically similar legal text near each other.

That single property — *closeness in vector space = similarity in meaning* — unlocks all of the following features.

## What it lets us do

### a) Semantic search across the portfolio (Phase 10)

A reviewer asks:
> "Find me all clauses about damage caps."

1. Embed the query: `"damage caps"` → 1024 numbers
2. Postgres runs: `ORDER BY embedding <=> $queryVector LIMIT 20`
3. Get back the 20 most semantically similar clauses across **every** contract in the system.

Crucially, this returns clauses that **don't contain the words "damage cap"** — they say "limitation of liability", "aggregate liability shall not exceed", "capped at fees paid", etc.

### b) Find clauses like *this one*

On any clause card in the UI, a "Find similar" button:
> "Show me clauses across our portfolio that resemble this risky indemnification."

Same mechanism — embed the source clause, find its neighbors. Now reviewers can see how a clause has been negotiated in past contracts without remembering keywords.

### c) Boilerplate detection and dedupe

Clauses with near-identical vectors are functionally the same. Auto-flag:
> "This confidentiality clause is identical to the one in 127 other contracts — standard boilerplate."

vs.
> "This indemnification clause has no neighbours — bespoke language, review carefully."

### d) Clustering and portfolio analytics

Project all clauses to 2D via UMAP and you get a map: indemnification clauses cluster together, governing-law clauses cluster together, payment terms cluster together. **Outliers within each cluster** are the unusual ones — exactly what a senior reviewer wants to flag.

### e) Recommendation: "if you liked this clause language…"

Negotiation tooling: "You inserted this fallback indemnification language in 12 prior contracts — here are the 5 most similar clauses we have on file."

### f) Building blocks for Phase 11+ AI features

Almost any "smart" feature you'd want — anomaly detection, clause drift analysis, suggested edits, similarity-based negotiation playbooks — sits on top of embeddings. Once every clause has one, those features become hours of work instead of months.

---

## How embeddings DON'T affect risk scoring

This came up — worth being explicit.

**Risk scores come from Claude's reasoning, not from embeddings.**

When Claude reads a clause, the same prompt that asks for `type` and `confidence` also asks for `riskScore`, `riskLevel`, `riskFlags`, `riskExplanation`. The model reads the clause text, applies the rubric we provided in the system prompt, and returns a numeric score.

Embeddings are a *separate, downstream* artifact. They never feed into how Claude scores risk. They're for **finding** clauses, not for **judging** them.

So you can think of the two as orthogonal:

| Question                                          | Answered by   |
|---------------------------------------------------|---------------|
| "How risky is *this* clause?"                     | Claude        |
| "What clauses *like this* exist in the portfolio?"| Embeddings    |
| "Is this clause boilerplate or unusual?"          | Embeddings    |
| "Is this risk score reasonable?"                  | Claude        |

A future enhancement *could* feed embeddings back into risk scoring — e.g. "this clause is 99% similar to one a senior reviewer marked critical, so bump its risk." That's a Phase 11+ enrichment, not Phase 8.

---

## TL;DR

- **Risk scoring is done in Phase 8.3/8.4 already** — Claude returns it inline.
- **Embeddings exist to power features that don't ship in Phase 8** — semantic search, similarity, clustering. We build them now because the schema is already in place, the cost is ~1 day, and skipping them leaves the Phase 8 acceptance criterion (AC7) unmet.
- **They're not magic and they don't interact with risk** — they're a coordinate in meaning space for every clause, sitting in a pgvector column waiting for Phase 10 to light up search.
