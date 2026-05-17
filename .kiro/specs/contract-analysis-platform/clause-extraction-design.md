 # Clause Extraction & Classification — Design

**Phase**: 8
**Requirement**: 3 — "As a Reviewer, I want the Platform to automatically identify and classify contractual clauses…"
**Status**: Draft — ready for implementation
**Sibling to**: [ocr-design.md](./ocr-design.md)

---

## 1. Goal

Turn a `DocumentText` artifact (Phase 7 output) into a versioned set of classified, position-anchored, embedding-equipped `Clause` rows. Output feeds:

- Phase 9 — Risk scoring (already produced inline in Phase 8 via combined Claude call; Phase 9 lights up business logic + UI)
- Phase 10 — Semantic search (uses embeddings)
- Phase 11 — Reviewer workflows (read clauses, annotate, escalate)

---

## 2. Locked decisions

| # | Decision | Rationale |
|---|---|---|
| D1 | **LLM-driven segmentation + classification** (Claude single call returns clauses[]) | Heuristic segmenters miss ~30% of contract structures. design.md commits to combined call. |
| D2 | **Combined call**: extract + classify + risk score + **document metadata** in one Claude invocation | Honors design.md §"Document Processing Pipeline". 50% cheaper than splitting; latency win. Metadata (parties, key dates, financial terms) added Task 8.4.1 — same Claude call, ~$0.003 extra. |
| D3 | **Global char offsets** into `DocumentText.text`, with derived `pageNumber` | Blob is single source of truth; offsets round-trip cleanly across page breaks. |
| D4 | **Nesting via self-FK `parentClauseId`**, max 2 levels | Matches design.md §API design `:280`. Two-pass insert resolves `clientRef → id`. |
| D5 | **ON DELETE SET NULL** for parent FK | Orphaned children become roots; preserves data on accidental parent delete. |
| D6 | **Embedding model**: Voyage `voyage-law-2`, 1024-dim | Legal-pretrained, Anthropic-recommended, strong MTEB-Retrieval scores. |
| D7 | **pgvector** for storage; no separate vector DB | Already in Postgres stack. Scale fits comfortably (proven to ~10M vectors). |
| D8 | **Vector dim locked at 1024** | Swapping embedding model later requires migration + backfill. Accepted. |
| D9 | **Versioned extraction runs** via `ExtractionRun` aggregate | Re-extraction creates a new run; old runs retained for audit. |
| D10 | **Two model-version columns**: `classifierModelVersion`, `embeddingModelVersion` | Models rev independently; lets us query mixed-version clause sets. |
| D11 | **In-process event trigger** (`DocumentOCRCompletedHandler`) | Mirrors Phase 7 pattern. Crash recovery deferred to Phase 9 (outbox or queue). |
| D12 | **Chunking** above 200k input chars by page boundary; offsets shifted on merge | Cost cap; safety net mirroring Phase 7's 200-page cap. |
| D13 | **Hallucinated clause text dropped server-side** | If LLM-returned `text` isn't found in `DocumentText.text`, the clause is discarded and counted. |
| D14 | **`extracting` state surfaced** on `/processing/:id` as a second progress band | One screen rolls forward through OCR → extraction → results. |
| D15 | **Phase 8 persists risk fields; UI ignores them** | Phase 9 introduces events, thresholds, escalation, and risk UI. |
| D16 | **Risk rubric is DRAFT** in this doc | Phase 9 prerequisite: SME interview + rubric validation against ground-truth clause set. |

---

## 3. Aggregate model

### 3.1 `ExtractionRun` (aggregate root)

```
ExtractionRun
├── id: ExtractionRunId
├── documentId: DocumentId
├── classifierModelVersion: ModelVersion   // e.g. "anthropic/claude-opus-4-7@2026-05"
├── embeddingModelVersion: ModelVersion    // e.g. "voyage/voyage-law-2@2026-05"
├── startedAt: DateTime
├── completedAt: DateTime?
├── status: ExtractionStatus               // running | complete | failed
├── failureReason: string?
├── clauseCount: int (default 0)
├── droppedClauseCount: int                // hallucinated-text drops
├── metadata: ContractMetadata?            // Task 8.4.1 — document-level snapshot
└── clauses: Clause[]                      // owned children
```

**Metadata snapshot** (Task 8.4.1) — populated by the same Claude call that
produces clauses. Persisted as `jsonb` on `ExtractionRun` (no field-level
queries yet — promotion to columns deferred to Phase 10 if needed). All
fields freeform strings; Claude returns text verbatim from the document:

| Field | Example |
|---|---|
| `contractType` | "Vendor", "NDA", "SaaS" |
| `parties[]` | `[{role: "Provider", name: "Acme Corp"}, {role: "Client", name: "Our Ltd"}]` |
| `effectiveDate` | "2024-01-15" |
| `terminationDate` | "2025-01-14" |
| `noticePeriod` | "60 days" |
| `autoRenewal` | "Yes, 1-year terms" |
| `paymentAmount` | "£50,000" |
| `currency` | "GBP" |
| `paymentSchedule` | "Quarterly" |
| `priceEscalation` | "2% annual" |
| `paymentTerms` | "Net 30 days" |

**Transitions**: `running → complete | failed`. `failed` is terminal — retry creates a new `ExtractionRun`.

**Invariants**:
- `startedAt ≤ completedAt`
- `status = complete ⇒ completedAt != null`
- `clauseCount = clauses.length` (post-persist)

### 3.2 `Clause` (entity within run)

```
Clause
├── id: ClauseId                           // server-generated, UUID
├── extractionRunId: ExtractionRunId
├── documentId: DocumentId                 // denormalized for fast doc-scoped queries
├── parentClauseId: ClauseId?              // self-FK, max 2 levels deep
├── type: ClauseType                       // 15-value enum
├── confidence: ConfidenceScore            // 0..1
├── position: TextPosition                 // { startOffset, endOffset, pageNumber }
├── text: string                           // ≤32k chars, verbatim from DocumentText.text
├── embedding: Float32Array(1024)?         // null until embed step done
├── riskScore: int?                        // 0..100 — persisted, unused in Phase 8 UI
├── riskLevel: RiskLevel?                  // low | medium | high | critical
├── riskFlags: string[]                    // ["uncapped_liability", ...]
├── riskExplanation: string?
└── createdAt: DateTime
```

**Invariants**:
- `position.startOffset < position.endOffset`
- `position.startOffset ≥ 0`
- `position.pageNumber ≥ 1`
- `confidence ∈ [0.0, 1.0]`
- `riskScore ∈ [0, 100]` when present
- `parentClauseId` (if set) refers to a `Clause` in the same `ExtractionRun`
- `text` length ≤ 32_000 chars

### 3.3 Value Objects

- `ClauseId` — UUID
- `ExtractionRunId` — UUID
- `ClauseType` — enum of 15: `indemnification | limitation_of_liability | termination | governing_law | dispute_resolution | intellectual_property | confidentiality | payment_terms | representations_warranties | force_majeure | assignment | change_of_control | non_compete | data_protection | other`
- `ConfidenceScore` — reuse from Phase 7
- `TextPosition` — `{ startOffset, endOffset, pageNumber }` with invariants
- `ExtractionStatus` — `running | complete | failed`
- `ModelVersion` — string, format `<vendor>/<name>@<yyyy-mm | api-version>`
- `RiskLevel` — `low | medium | high | critical` (derived from `riskScore`: 0–25, 26–50, 51–75, 76–100)

### 3.4 Domain events

- `ClauseExtractionStartedEvent { documentId, extractionRunId, startedAt }`
- `ClausesExtractedEvent { documentId, extractionRunId, clauseCount }` — batched, one per run (not one per clause)
- `ClauseExtractionCompletedEvent { documentId, extractionRunId, clauseCount, completedAt }`
- `ClauseExtractionFailedEvent { documentId, extractionRunId, reason, failedAt }`

`Document` aggregate gains:
- `extractionStatus: ExtractionStatus` (default `not_started`; values include `not_started | extracting | extraction_complete | extraction_failed`)
- `currentExtractionRunId: ExtractionRunId?`
- Methods: `startExtraction()`, `completeExtraction(runId, count)`, `failExtraction(reason)`

---

## 4. Ports

```ts
// clauses/application/ports/clause-extractor.port.ts
export interface IClauseExtractor {
  extract(input: ExtractInput): Promise<ExtractedClause[]>;
}

export interface ExtractInput {
  documentId: string;
  text: string;                 // full DocumentText.text
  pages: { pageNumber: number; startOffset: number; endOffset: number }[];
  language: string;
}

export interface ExtractedClause {
  clientRef: string;             // LLM-supplied temp ID for parent linking
  parentClientRef: string | null;
  type: ClauseType;
  confidence: number;
  text: string;                  // verbatim slice expected to be findable in input.text
  // risk fields — persisted in Phase 8, unused in Phase 8 UI
  riskScore: number;
  riskLevel: RiskLevel;
  riskFlags: string[];
  riskExplanation: string;
}
```

```ts
// clauses/application/ports/embedding-service.port.ts
export interface IEmbeddingService {
  embedBatch(texts: string[]): Promise<EmbeddingResult[]>;
}

export interface EmbeddingResult {
  vector: number[];              // length 1024 for voyage-law-2
  modelVersion: string;
}
```

```ts
// clauses/application/ports/clause-repository.port.ts
export interface IClauseRepository {
  saveRun(run: ExtractionRun, clauses: Clause[]): Promise<void>;
  findByDocumentId(documentId: string): Promise<Clause[]>;
  findById(clauseId: string): Promise<Clause | null>;
}

export interface IExtractionRunRepository {
  save(run: ExtractionRun): Promise<void>;
  findById(id: string): Promise<ExtractionRun | null>;
  findCurrentForDocument(documentId: string): Promise<ExtractionRun | null>;
}
```

---

## 5. Pipeline

```
DocumentOCRCompletedEvent
        │
        ▼
DocumentOCRCompletedHandler  (clauses module)
        │
        ▼
StartClauseExtractionCommand { documentId }
        │
        ▼
StartClauseExtractionHandler
        │
        ├─ Load DocumentText via IDocumentTextRepository
        ├─ Idempotency check: existing running/complete run → return
        ├─ document.startExtraction()  → DocumentExtractionStartedEvent
        ├─ Create ExtractionRun (status=running)  → ClauseExtractionStartedEvent
        │
        ├─ IClauseExtractor.extract(input)
        │     ├─ Chunk if input.text > 200k chars
        │     ├─ Parallel Claude calls per chunk
        │     ├─ Merge + offset-shift
        │     └─ Drop clauses whose text isn't findable in input.text (count, log)
        │
        ├─ Server-side: resolve offsets via text search; build TextPosition
        ├─ Server-side: resolve parentClientRef → ClauseId (two-pass)
        │
        ├─ IEmbeddingService.embedBatch(clauses.map(c => c.text))
        │     └─ Attach vectors to clauses (modelVersion recorded)
        │
        ├─ Single Prisma TX:
        │     ├─ Insert ExtractionRun (status=complete, completedAt set, counts)
        │     ├─ Insert parent clauses first
        │     ├─ Insert child clauses with resolved parentClauseId
        │     └─ Update Document.extractionStatus = extraction_complete
        │         + Document.currentExtractionRunId = run.id
        │
        ├─ Publish ClausesExtractedEvent + ClauseExtractionCompletedEvent
        │
        └─ Failure path:
              ├─ Transient error → retry 3× (1s/4s/16s backoff)
              └─ Permanent or retries-exhausted:
                    ├─ ExtractionRun.status = failed
                    ├─ document.failExtraction(reason)
                    └─ ClauseExtractionFailedEvent
```

---

## 6. Claude prompt contract

### 6.1 System prompt (cached — static across all docs)

```
You are a senior contracts attorney extracting and classifying clauses from
commercial agreements. For each meaningful clause, return a JSON object with
the schema below. Be exhaustive: extract every distinct clause, including
nested sub-clauses (numbered sub-paragraphs).

ClauseType (choose one):
  indemnification, limitation_of_liability, termination, governing_law,
  dispute_resolution, intellectual_property, confidentiality, payment_terms,
  representations_warranties, force_majeure, assignment, change_of_control,
  non_compete, data_protection, other

Confidence: 0.0–1.0, your certainty in the type classification.

Position: do NOT compute offsets. Return clause text verbatim (must match the
input character-for-character — no paraphrasing, no whitespace normalization).
The server resolves offsets by string-matching your output back into the input.

Nesting: assign each clause a temporary clientRef ("c1", "c2", ...). If a
clause is a sub-clause of another, set its parentClientRef to the parent's
clientRef. Max nesting depth = 2.

Risk scoring (rubric in §6.2 below — DRAFT for Phase 8, will be refined in
Phase 9 with SME validation):

  riskScore: 0–100 integer
  riskLevel: derived band (0–25 low, 26–50 medium, 51–75 high, 76–100 critical)
  riskFlags: short tag strings (e.g. "uncapped_liability", "unilateral_termination")
  riskExplanation: 1–2 sentence justification

Return via the extract_clauses tool. No prose outside the tool call.
```

### 6.2 Risk rubric (DRAFT — Phase 9 SME validation required)

> **⚠ DRAFT** — this rubric was authored without legal-SME input. Phase 9 must
> validate it against ground-truth scoring from senior reviewers on ≥50 real
> clauses before risk fields are surfaced in the UI.

```
RISK FACTORS to weigh:
- Unbounded liability (no cap on damages)
- One-sided obligations (only one party bears the burden)
- Broad indemnification scope (third-party IP, gross negligence carve-outs)
- Short notice periods (<30 days for termination)
- Auto-renewal without opt-out
- Governing law in unfavorable jurisdiction
- Vague or undefined key terms
- Waiver of important rights (jury trial, class action)
- MFN clauses
- Aggressive non-compete scope (geography, duration)

SCORING ANCHORS:
  0–25   LOW       Standard market terms; balanced; mutual
  26–50  MEDIUM    Minor deviation from standard; manageable
  51–75  HIGH      Meaningful exposure; requires negotiation
  76–100 CRITICAL  Unacceptable as written; must be renegotiated

CALIBRATION EXAMPLES (3 shipped in prompt; full set in fixtures/):
  "Liability capped at fees paid in prior 12 months" → 20 LOW
  "Either party may terminate for material breach with 30 days' cure" → 30 LOW
  "Vendor's liability is unlimited for any breach" → 85 CRITICAL
```

### 6.3 Tool schema (Anthropic tool-use JSON schema)

```json
{
  "name": "extract_clauses",
  "description": "Submit extracted and classified clauses.",
  "input_schema": {
    "type": "object",
    "properties": {
      "clauses": {
        "type": "array",
        "items": {
          "type": "object",
          "required": ["clientRef", "type", "confidence", "text",
                       "riskScore", "riskLevel", "riskFlags", "riskExplanation"],
          "properties": {
            "clientRef":        { "type": "string" },
            "parentClientRef":  { "type": ["string", "null"] },
            "type":             { "enum": [/* 15 ClauseType values */] },
            "confidence":       { "type": "number", "minimum": 0, "maximum": 1 },
            "text":             { "type": "string" },
            "riskScore":        { "type": "integer", "minimum": 0, "maximum": 100 },
            "riskLevel":        { "enum": ["low", "medium", "high", "critical"] },
            "riskFlags":        { "type": "array", "items": { "type": "string" } },
            "riskExplanation":  { "type": "string" }
          }
        }
      }
    },
    "required": ["clauses"]
  }
}
```

### 6.4 Prompt caching

The system prompt (§6.1) + tool schema + few-shot examples are static across all documents → mark with `cache_control: { type: "ephemeral" }`. Per-doc message (the contract text) is not cached.

Expected savings: ~75% of input-token cost on every call after the first.

---

## 7. Chunking strategy

**Threshold**: 200k chars (~50k tokens — well under Claude's 200k window, leaves room for instructions + tool schema).

**Algorithm**:
```
if text.length <= 200_000:
  one call, offsets stay as-is
else:
  split at page boundaries (use DocumentText.pages[])
  for each chunk:
    send chunk.text to Claude
    when results return:
      shift every clause's offsets by chunk.globalStartOffset
  merge clauses, dedupe by (type, startOffset, endOffset)
```

**Parent linking across chunks**: `clientRef`s are chunk-local. Cross-chunk parent links are not supported (max 2-level nesting + chunk-aligned-to-page boundaries makes this rare in practice). If detected, log warning and treat child as root.

---

## 8. Server-side offset resolution

LLM returns `text` verbatim, not offsets. Server resolves:

```ts
function resolveOffsets(clauseText: string, documentText: string): TextPosition | null {
  const start = documentText.indexOf(clauseText);
  if (start === -1) return null;  // hallucination — drop clause
  const end = start + clauseText.length;
  const pageNumber = pages.find(p => start >= p.startOffset && start < p.endOffset)?.pageNumber ?? 1;
  return { startOffset: start, endOffset: end, pageNumber };
}
```

**Hallucination handling**: if `indexOf === -1`, increment `droppedClauseCount`, log structured event `clause.hallucinated_text` with `{ documentId, clauseText.substring(0, 200) }`, continue.

**Duplicate matches**: prefer first occurrence. If a clause type appears multiple times (e.g., two indemnification clauses), Claude must include enough surrounding context in `text` to disambiguate; we'll observe and tune.

---

## 9. Parent-resolution algorithm

Two-pass insert because children reference parent IDs that don't exist yet:

```
clientRefToId = {}

// Pass 1: insert parents (parentClientRef == null)
for clause in clauses where clause.parentClientRef is null:
  id = uuid()
  clientRefToId[clause.clientRef] = id
  insert Clause(id, parentClauseId=null, ...)

// Pass 2: insert children (parentClientRef != null)
for clause in clauses where clause.parentClientRef is not null:
  parentId = clientRefToId[clause.parentClientRef]
  if parentId is undefined:
    log warning, insert as root (parentClauseId=null)
  else:
    insert Clause(uuid(), parentClauseId=parentId, ...)
```

Single Prisma transaction wraps both passes.

---

## 10. Persistence — Prisma schema

```prisma
// Phase 8 additions

model ExtractionRun {
  id                       String   @id @default(cuid())
  documentId               String
  classifierModelVersion   String
  embeddingModelVersion    String
  startedAt                DateTime @default(now())
  completedAt              DateTime?
  status                   String   // running | complete | failed
  failureReason            String?
  clauseCount              Int      @default(0)
  droppedClauseCount       Int      @default(0)

  document                 Document @relation(fields: [documentId], references: [id], onDelete: Cascade)
  clauses                  Clause[]

  @@index([documentId])
  @@index([status])
}

model Clause {
  id                String   @id
  extractionRunId   String
  documentId        String
  parentClauseId    String?
  type              String   // ClauseType (15 values)
  confidence        Float
  pageNumber        Int
  startOffset       Int
  endOffset         Int
  text              String   @db.Text
  embedding         Unsupported("vector(1024)")?

  // Phase 8 persists, Phase 8 UI ignores
  riskScore         Int?
  riskLevel         String?  // low | medium | high | critical
  riskFlags         String[] // PostgreSQL text[]
  riskExplanation   String?  @db.Text

  createdAt         DateTime @default(now())

  extractionRun     ExtractionRun @relation(fields: [extractionRunId], references: [id], onDelete: Cascade)
  parent            Clause?       @relation("ClauseHierarchy", fields: [parentClauseId], references: [id], onDelete: SetNull)
  children          Clause[]      @relation("ClauseHierarchy")

  @@index([documentId])
  @@index([extractionRunId])
  @@index([type])
  @@index([parentClauseId])
}

// Document extensions
model Document {
  // ... existing fields ...
  extractionStatus       String    @default("not_started") // not_started | extracting | extraction_complete | extraction_failed
  currentExtractionRunId String?

  @@index([extractionStatus])
}
```

**Migration** also runs:
```sql
CREATE EXTENSION IF NOT EXISTS vector;
```

**Indexes deferred** to a later phase (when row count justifies):
- `CREATE INDEX clauses_embedding_hnsw ON "Clause" USING hnsw (embedding vector_cosine_ops);`

Until then, sequential scan is fast enough at Phase 1 scale (<10k clauses).

---

## 11. Embedding driver — Voyage

**Config**:
```
EMBEDDING_DRIVER=voyage          # mock | voyage | openai
VOYAGE_API_KEY=...
VOYAGE_MODEL=voyage-law-2
```

**Adapter** (`infrastructure/embeddings/voyage-embedding-service.ts`):
- Batch size 128 (Voyage limit)
- Retry: 1s / 4s / 16s on `429 / 5xx`
- Maps `429 | 503 | timeout` → `EmbeddingTransientError`
- Maps `400 | 401 | 403` → `EmbeddingPermanentError`
- Records `modelVersion = "voyage/voyage-law-2@<X-Voyage-Model-Version>"`
- Cost telemetry: log `tokens_used` per call

**Failure isolation**: if embedding fails after clauses are persisted, the run still completes — clauses land with `embedding = null` and `ExtractionRun.failureReason` notes the partial state. A separate "re-embed" admin command (deferred) can backfill. Decision rationale: extraction success ≠ embedding success; we don't want a Voyage outage to kill the extraction.

---

## 12. Error taxonomy

```ts
class ExtractionTransientError extends Error {}   // 429, 5xx, timeout
class ExtractionPermanentError extends Error {}   // 400, context_overflow, invalid_request
class EmbeddingTransientError extends Error {}
class EmbeddingPermanentError extends Error {}
class HallucinatedClauseTextError extends Error {} // surfaced as logged warning, not thrown
```

Retry budget: 3 attempts per Claude call, 3 attempts per embedding batch.

---

## 13. Idempotency

`StartClauseExtractionCommand` is idempotent:

```ts
async execute({ documentId }) {
  const existing = await runRepo.findCurrentForDocument(documentId);
  if (existing?.status === 'running') return;       // in-flight, skip
  if (existing?.status === 'complete') return;      // already done
  // failed → fall through and create a new run
}
```

Re-runs after `failed` produce a new `ExtractionRun`. Old run retained.

---

## 14. Frontend — `/processing/:id` rolling state

`useProcessingStatus` (Phase 7) extends to also return `extractionStatus` + `currentExtractionRunId`.

State machine for the screen:

```
ocr_failed             → existing error UI (Phase 7)
processing             → "Extracting text from your contract…" + OCR spinner
ocr_complete && extraction_status == not_started     → transient — wait
ocr_complete && extraction_status == extracting      → "Identifying clauses…" + second spinner
extraction_complete    → auto-redirect to /results/:documentId
extraction_failed      → error card + Retry CTA (Phase 9 to implement; Phase 8 shows "Failed — contact support")
```

---

## 15. `/results/:id` — Phase 8 UI scope

- Left rail: PDF preview (pdfjs)
- Right rail: clauses list grouped by `type`
- Per-clause card: type chip, confidence pill, page anchor, expandable text
- Filters: type chips (multi-select), min-confidence slider
- Click → scroll PDF to page + highlight text range
- **Risk fields hidden** (rubric not yet validated)
- Custom components per pinned preference; not Shadcn

---

## 16. Testing strategy

- **Unit (~75)**: domain VOs, aggregate transitions, parent-resolution algorithm, offset-resolution, hallucination drop, chunk-merge offset-shift
- **Integration (~15)**: Prisma round-trip with real pgvector test DB, parent FK set-null on delete
- **Driver mocks**: `MockClauseExtractor` deterministic fixtures; `MockEmbeddingService` hash-based vectors
- **Claude adapter (`jest.mock('@anthropic-ai/sdk')`)**: happy, hallucinated drop, multi-chunk stitch, error mapping per class, prompt-cache header asserted
- **Voyage adapter (mocked HTTP)**: batch, retry, error mapping
- **E2E**: full Phase 5 → 7 → 8 against test DB + mock LLM + mock embeddings + 6 fixture scenarios + 5-doc concurrent smoke
- **Live gated** (`CLAUSE_EXTRACTOR_LIVE_TEST=1` / `EMBEDDINGS_LIVE_TEST=1`): one real call per provider on one fixture, cost-capped

---

## 17. Cost model

Per 50-page contract (~25k tokens of clause text, ~50 clauses extracted):

| Item | Calculation | Cost |
|---|---|---|
| Claude Opus call (extract+classify+risk, with caching) | ~30k input × $15/M (cached: 90% off after 1st call) + 5k output × $75/M | ~$0.10–0.30 |
| Voyage embeddings | 50 clauses × ~500 tokens × $0.12/M | ~$0.003 |
| Storage | 50 × (4 KB vector + ~2 KB row) ≈ 300 KB | negligible |
| **Total** | | **~$0.10–0.30 / contract** |

At 1000 contracts/month: ~$100–300/month for Phase 8 pipeline.

---

## 18. Deferred to later phases

| Item | Phase |
|---|---|
| Risk-rubric SME validation | 9 (prerequisite) |
| Risk UI (level badges, escalation flow) | 9 |
| `RiskScoredEvent`, threshold-driven escalation | 9 |
| Crash recovery (outbox or queue) | 9 |
| Semantic search endpoint + UI | 10 |
| HNSW index on `embedding` column | 10 (when row count >10k) |
| Reranker (Voyage rerank-2) | 10 (quality upgrade) |
| Admin re-extract / re-embed CLI → UI | 11 |
| Cross-chunk parent linking | 11 (if observed in real data) |
| Languages other than English | 12+ (OCR rejects upstream) |
| Self-hosted Llama / domain fine-tune | 12+ (when volume justifies) |

---

## 19. Success criteria

- Upload a born-digital contract → `/processing/:id` rolls through OCR → extracting → auto-redirect to `/results/:id` within ~30s for a 20-page PDF.
- `Clause` rows present with `embedding` populated, parent FK correct, model versions recorded.
- Re-extraction produces a second `ExtractionRun`; old run retained; `Document.currentExtractionRunId` points to new run.
- All tests green, 0 lint, axe clean, no live external API calls in default CI.
