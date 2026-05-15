# OCR Pipeline — Requirements & Design

**Status:** Draft (2026-05-15)
**Phase:** Targeted for Phase 7 (after Phase 6 Audit Service).
**Source requirements:** [requirements.md §Requirement 2](./requirements.md), [design.md L34/L242/L432](./design.md).

This doc takes the abstract OCR requirement from the platform spec and converts it into something concrete enough to build against, in the same shape as Phase 5 (domain → application → infrastructure → wiring).

---

## 1. Scope

### In scope (v1 of OCR)

- **Input:** Single PDF, ≤50 MB, already uploaded via the Phase 5 flow and persisted to `IStorageService` (local disk or GCS) with `UploadStatus = complete`.
- **Three tracks**, decided **per page** by an upfront classifier (see §5):
  - **Born-digital page** (has substantive text-showing operators with usable cmap) → native PDF extractor (pdfjs).
  - **Scanned page** (image-only, or text-bearing but text-quality demoted) → Document AI.
  - **Hybrid document** (mix of digital and scanned pages) → run both, merge by `pageNumber` preserving order.
- **Output:** A `DocumentText` artifact per document containing:
  - Full extracted text.
  - Per-page text with page numbers preserved.
  - Aggregate confidence score (0.0–1.0). Born-digital = `1.0`.
  - Detected language (default `en`).
  - Driver used (`native_pdf` | `google_document_ai` | `mock`).
- **Driver port abstraction** (`IOcrService`), same swap pattern as `IStorageService`.
  - Env: `OCR_DRIVER ∈ { mock, google-document-ai }`.
- **State machine:** Reintroduce `processing` and add OCR-specific terminal events on the Document aggregate (see §3).
- **Retry:** 3 attempts with exponential backoff for transient OCR failures.
- **Persistence of extracted text:** Stored as an artifact under the same `IStorageService` (key: `{documentId}.text.json`), with metadata rows in Prisma.
- **Failure notification:** Domain event `DocumentOCRFailedEvent`; surfacing to the user is via the existing `/processing/:documentId` polling endpoint (no email in v1).

### Out of scope (v1 of OCR)

1. DOCX, PPTX, image standalones (still PDF-only at the upload boundary).
2. Languages other than English. Detection runs **up front** (via `franc` / `cld3`) and non-English documents are rejected before OCR, not silently mis-processed.
3. Real-time streaming progress (per-page %). v1 reports binary `processing → complete/failed`.
4. Manual OCR re-run UI. (Re-run is a CLI/admin op in v1.)
5. Async queue infrastructure (BullMQ/PubSub). v1 runs the pipeline **in-process** via NestJS event handlers on `DocumentUploadCompletedEvent`, with a single worker. Queue is introduced when the pipeline gets a second consumer.

---

## 2. Acceptance criteria (EARS, derived from Req 2)

1. WHEN `DocumentUploadCompletedEvent` is published, THE OCR pipeline SHALL transition the Document to `processing` within 1 second.
2. WHEN a PDF has an embedded text layer covering ≥95% of pages, THE pipeline SHALL use the native text extractor and record `driver = native_pdf`, `confidence = 1.0`.
3. WHEN a PDF lacks a sufficient text layer, THE pipeline SHALL invoke the configured OCR driver and extract text from every page.
4. WHEN extraction succeeds, THE pipeline SHALL persist a `DocumentText` artifact (text + per-page text + confidence + language + driver) and publish `DocumentOCRCompletedEvent`.
5. WHEN extraction fails with a transient error, THE pipeline SHALL retry up to 3 times with exponential backoff (1s, 4s, 16s).
6. WHEN extraction fails permanently (3 retries exhausted, or non-retryable error), THE pipeline SHALL set status to `failed`, publish `DocumentOCRFailedEvent`, and persist the failure reason.
7. WHEN extracted text is persisted, THE artifact SHALL preserve page boundaries with a `pages: { pageNumber, text }[]` structure.
8. THE pipeline SHALL record a confidence score in `[0.0, 1.0]` for every successful extraction.
9. THE pipeline SHALL be language-configurable via env (`OCR_LANGUAGES`, default `en`).
10. THE OCR driver SHALL be swappable via `OCR_DRIVER` env without code changes.

---

## 3. Domain model changes

### Document aggregate (delta from Phase 5)

**State machine — extended:**

```
pending → uploading → complete
                    └─→ failed (upload)

complete → processing → ocr_complete
                      └─→ failed (ocr)
```

`complete` here is the **upload-complete** state from Phase 5. Adding `processing` and `ocr_complete` brings the state machine back in line with the original design.md transitions (`uploaded → queued → ocr_processing → ocr_complete | failed`), simplified to fit our existing VO.

`UploadStatus` value object stays; we either extend it to cover `processing`/`ocr_complete`/`ocr_failed`, or — cleaner — introduce a separate `ProcessingStatus` VO and let `UploadStatus` stay focused on upload lifecycle. **Recommendation:** separate `ProcessingStatus` VO; the two lifecycles are conceptually different and forcing one machine over both will warp the upload semantics.

### New aggregate: `DocumentText`

- One per Document.
- Fields: `documentId`, `text: string`, `pages: PageText[]`, `confidence: ConfidenceScore`, `minPageConfidence: ConfidenceScore`, `language: Language`, `driver: OcrDriver`, `extractedAt`.
- Value objects:
  - `ConfidenceScore` (0..1)
  - `TextQualityScore` (0..1) — see §5 detection heuristics; orthogonal to OCR confidence.
  - `Language` (ISO 639-1)
  - `OcrDriver` enum: `native_pdf | google_document_ai | mock`
  - `PageText { pageNumber: 1..N, text: string, confidence: ConfidenceScore, textQualityScore: TextQualityScore, driver: OcrDriver }` — per-page driver lets us record the chosen track in hybrid documents.

### New domain events

- `DocumentOCRStartedEvent { documentId, driver, startedAt }`
- `DocumentOCRCompletedEvent { documentId, confidence, language, driver, pageCount, completedAt }`
- `DocumentOCRFailedEvent { documentId, reason, retryCount, failedAt }`

---

## 4. Application layer

### Commands

- `StartOcrProcessingCommand { documentId }` — handler transitions to `processing`, invokes driver, persists artifact, transitions to `ocr_complete`. Rejects if `pageCount > 200`.
- `FailOcrProcessingCommand { documentId, reason }` — handler transitions to `ocr_failed`.
- `RetryOcrProcessingCommand { documentId }` — handler asserts current status is `ocr_failed` and user-retry-count `< 3`, increments the counter, transitions back to `processing`, re-runs pipeline.

### Queries

- `GetDocumentTextQuery { documentId }` → `DocumentTextDto` (used by future Clause Extraction phase).
- `GetProcessingStatusQuery { documentId }` → `{ status, confidence?, error? }` (replaces the stub on the processing screen).

### Event handler

`DocumentUploadCompletedHandler` listens for the Phase 5 `DocumentUploadCompletedEvent` and dispatches `StartOcrProcessingCommand`. This handler is the **only** wiring point — keeps OCR as a vertical slice, no upload module changes.

---

## 5. Infrastructure

### Ports

```ts
interface IOcrService {
  extractText(input: OcrInput): Promise<OcrOutput>;
}

type OcrInput = {
  documentId: string;
  source: NodeJS.ReadableStream;        // streamed from IStorageService
  mimeType: 'application/pdf';
  languages: string[];                  // ['en']
};

type OcrOutput = {
  text: string;
  pages: {
    pageNumber: number;
    text: string;
    confidence: number;             // 0..1
    textQualityScore: number;       // 0..1
    driver: 'native_pdf' | 'google_document_ai' | 'mock';
  }[];
  confidence: number;               // 0..1, char-length-weighted mean across pages
  minPageConfidence: number;        // 0..1
  language: string;
  driver: 'native_pdf' | 'google_document_ai' | 'mock' | 'hybrid';
};
```

### Pipeline walkthrough (developer narrative)

The composite service is `ClassifierThenRouter`. The full sequence, start to finish, for a single uploaded PDF:

#### Step 0 — Trigger

`DocumentUploadCompletedHandler` hears the Phase 5 `DocumentUploadCompletedEvent` and dispatches `StartOcrProcessingCommand(documentId)`. `Document.processingStatus` flips `not_started → processing`. `DocumentOCRStartedEvent` fires. The frontend `/processing/:id` polling sees the status change and renders "Extracting text…".

#### Step 1 — Open the PDF, sample some text

Stream the PDF from `IStorageService` and parse with `pdfjs-dist`. **No rendering** — pdfjs is being used as a parser only. Pull text content for pages 1–2 via `page.getTextContent()`, concatenate into a sample string.

Outcomes by PDF type:
- Born-digital → sample is real text, hundreds to thousands of characters.
- Pure-scanned → sample is empty or near-empty.
- Searchable-scanned → sample is whatever the scanner's built-in OCR produced.

#### Step 2 — Language detection

Pass the sample to `franc-min` (see §5 "Language detection — how it actually works" for the full rules). Branches:

- Sample <200 chars: skip detection, proceed (downstream `textQualityScore` is the safety net).
- English with any confidence: accept, set `Document.language = 'en'`.
- Non-English with confidence ≥ 0.10: **reject.** `failProcessing("unsupported_language:fra")`. No OCR call made; no money spent.
- Non-English with confidence < 0.10 (ambiguous): accept with warning; let downstream checks decide.

#### Step 3 — Page count check

Read `pageCount` from pdfjs. If `> OCR_PAGE_LIMIT` (default 200), throw `DocumentTooLargeError` and fail. The cost ceiling: 200 scanned pages = $0.30 worst case.

#### Step 4 — Per-page classification

For each page, run two cheap pdfjs queries:
- `getTextContent()` → count non-whitespace characters in the text layer.
- `getOperatorList()` → look for `paintImageXObject` / `paintJpegXObject` operators indicating a large embedded image.

Tag each page:
- **`digital`** — ≥100 substantive text characters present.
- **`scanned`** — <100 text characters and a large image XObject.
- **`blank`** — <100 text characters and no significant image (cover page, separator). Emits empty text with `confidence = 1.0`.

Worked examples:
- 30-page born-digital contract → `[digital × 30]`
- Scanned signed contract → `[scanned × 30]`
- Born-digital body with appended scanned signature page → `[digital × 28, scanned × 2]`

#### Step 5 — Route each page

Walk the per-page tags and dispatch:

- **`digital` pages → `NativePdfExtractor`** (pdfjs)
  - Walks text operators, decodes via font cmaps, infers spaces/line breaks from positioning.
  - Returns `{ text, confidence: 1.0, driver: 'native_pdf' }`.
  - **Cost: $0. Latency: ~50ms/page.**
- **`scanned` pages → `GoogleDocAiDriver`**
  - Sync API if total scanned subset is ≤15 pages and ≤20 MB (response in 1–3s/page).
  - Batch API otherwise (10–30s startup, then 0.5–2s/page; no page cap).
  - Returns `{ text, confidence: <token-weighted-mean>, driver: 'google_document_ai' }`.
  - **Cost: $0.0015/page. Latency: 1–3s/page sync, 0.5–2s/page batch.**
- **`blank` pages → no driver call.**

The 28-digital-2-scanned example costs ~$0.003 total.

#### Step 6 — Quality demotion (the broken-cmap safety net)

For each `digital` page, compute `textQualityScore`:
- Dictionary-word ratio (against `wordlist-english`).
- Unicode-block sanity (Basic Latin vs Private Use Area).
- Replacement-character (`U+FFFD`) density.

Clean English contract page → 0.7–0.9. Broken-cmap garbage → <0.2.

If a page scores `< TEXT_QUALITY_THRESHOLD` (default 0.5), **demote** it: rerun through `GoogleDocAiDriver`. Costs $0.0015 to recover garbage that would otherwise land in the final artifact.

#### Step 7 — Merge

Assemble per-page results in `pageNumber` order. Document-level `driver`:
- All pages used `native_pdf` → `'native_pdf'`
- All pages used `google_document_ai` → `'google_document_ai'`
- Mix → `'hybrid'`

Document-level `confidence` = page-length-weighted mean across pages (so a noisy 1-page cover doesn't drag down a 100-page doc). `minPageConfidence` stashed as a triage signal.

#### Step 8 — Persist

Two writes:
- **Blob:** full `DocumentText` JSON to `IStorageService` at `{documentId}.text.json`.
- **Prisma row:** thin metadata (`documentId`, `storageKey`, `textLength`, `confidence`, `minPageConfidence`, `language`, `driver`, `extractedAt`). No `text` column; that lives in the blob.

#### Step 9 — Complete

`Document.processingStatus` transitions `processing → ocr_complete`. `DocumentOCRCompletedEvent` fires. Polling `/processing/:id` sees the terminal state and auto-redirects to `/results/:id`.

#### What the user actually experiences

| Scenario                            | Time on `/processing/:id` | Cost  | Outcome |
|-------------------------------------|---------------------------|-------|---------|
| 30-page born-digital contract       | ~5s                       | $0    | Auto-redirect to results |
| 100-page scanned contract           | ~2min                     | $0.15 | Auto-redirect to results |
| 30-page hybrid (28 digital + 2 scan) | ~7s                      | $0.003 | Auto-redirect to results |
| French contract                     | ~3s                       | $0    | Error: "We only support English contracts. Detected: French" |
| Corrupt PDF                         | ~25s                      | $0    | Error: 3 auto-retries failed; user has 3 manual retries |
| 201-page PDF                        | <1s                       | $0    | Error: "Maximum 200 pages" |

#### Error path summary

| Where  | What | Status | Retry? |
|--------|------|--------|--------|
| Step 1 | pdfjs can't open (corrupt/encrypted PDF) | `ocr_failed: invalid_pdf` | yes (won't help) |
| Step 2 | Non-English detected, confidence ≥ 0.10 | `ocr_failed: unsupported_language:<code>` | no (CTA: upload another) |
| Step 3 | `pageCount > 200` | `ocr_failed: too_many_pages` | no |
| Step 5 | Document AI transient (429/503/timeout) | In-handler retry 3× (1s/4s/16s), then `ocr_failed` | yes |
| Step 5 | Document AI permanent (`INVALID_ARGUMENT`/`PERMISSION_DENIED`) | Immediate `ocr_failed` | yes (won't help) |
| Step 8 | Storage write fails | In-handler retry, then `ocr_failed` | yes |

#### File map

| Step | File |
|------|------|
| 0    | `application/event-handlers/document-upload-completed.handler.ts` |
| 1, 4 | `infrastructure/ocr/pdf-classifier.ts` |
| 2    | `infrastructure/ocr/language-detector.ts` |
| 3    | `application/commands/start-ocr-processing.handler.ts` |
| 5a   | `infrastructure/ocr/native-pdf-extractor.ts` |
| 5b   | `infrastructure/ocr/google-doc-ai-driver.ts` |
| 1–7  | `infrastructure/ocr/classifier-then-router.ts` (orchestrator) |
| 6    | `infrastructure/ocr/text-quality-score.ts` |
| 8    | `infrastructure/persistence/prisma-document-text.repository.ts` |
| 9    | Polling endpoint: `application/queries/get-processing-status.handler.ts` |
| 9    | Frontend: `apps/frontend/src/pages/ProcessingPage/` |

### Pipeline summary (one-glance reference)

`Trigger → Open & sample → Language detect → Page-count gate → Classify pages → Route (digital→native, scanned→cloud, blank→empty) → Quality-demote dodgy digital pages → Merge → Persist (blob + row) → Complete`

### Language detection — how it actually works

Language detection is Step 1 of the pipeline. It's first because:

- Every downstream step costs more if we run it on a non-English document.
- OCR engines need to be told what language to expect; running an English processor on a French PDF produces worse text than running a French processor.
- We can fail fast with a clear user error ("only English contracts are supported in v1") instead of producing low-quality output and burning the user's trust.

But it has a chicken-and-egg problem: **you need text to detect language, and our pipeline exists to extract text.** Resolution below.

#### The bootstrap problem

We can't run language detection on raw PDF bytes. We need a text sample, even a small one. Two cases:

- **Born-digital PDF** — pdfjs gets a text sample for free in <100ms; no problem.
- **Scanned PDF** — there's no text yet. We'd have to OCR a page just to detect language, which defeats the "fail fast" goal.

Solution: **always start with a pdfjs text-content probe of the first 1–2 pages, even on otherwise-scanned PDFs.**

- For born-digital PDFs this returns the real text.
- For pure-scanned PDFs this returns empty (or very few characters from incidental text — page numbers, watermarks).
- For searchable-scanned PDFs (scanner ran its own OCR) this returns whatever the scanner produced. Imperfect but usually enough to tell English from non-English.

The rule:

```
sampleText = pdfjs.textContentOfPages(1..2)
if len(stripWhitespace(sampleText)) < 200 chars:
  → can't reliably detect, ACCEPT and proceed
    (decision below: §"Confidence and accept thresholds")
else:
  → run franc on sampleText, apply confidence rules below
```

If the sample is too small (pure-scanned PDF with no incidental text), we skip language detection and proceed optimistically — the OCR processor is configured for English, and downstream `textQualityScore` (which compares against an English wordlist) will catch obviously non-English documents and fail them. This is a deliberate trade-off: false-rejecting a valid English scan because language detection got <200 chars is worse than letting a non-English scan slip through and fail later.

#### Package: `franc-min`

[`franc`](https://github.com/wooorm/franc) is the production-grade pure-JS language detector. We use **`franc-min`**, the variant that includes only the ~80 most common languages — ~10 KB vs the full 200+ language ~1 MB build. English is in `-min`; that's what matters.

Why not Google's `cld3` (the alternative)? It's a native Node binding. Installing a native binding on a serverless platform (Cloud Run, Railway) means cold-start compilation pain. `franc-min` is pure JS, zero native deps, accuracy on contract-length text is indistinguishable.

API: `franc(text, options)` returns an ISO 639-3 code (e.g. `'eng'`) — note **639-3, not 639-1.** We map to 639-1 (`'en'`) ourselves; the mapping table is small.

```ts
import { franc } from 'franc-min';
import { iso6393To1 } from 'iso-639-3';  // or hand-roll a 3-entry map for v1

function detect(sample: string): { language: string; confidence: number } {
  const result = franc(sample, { minLength: 50 });
  if (result === 'und') return { language: 'und', confidence: 0 };
  return {
    language: iso6393To1[result] ?? result,
    confidence: francConfidence(sample, result),  // see below
  };
}
```

`franc` itself doesn't return a confidence number from the simple `franc()` call — it picks the top match. To get a confidence, use `francAll(text)` which returns `[['eng', 1.0], ['fra', 0.78], ...]` (scores normalized 0..1, top result always 1.0; *relative* scores are what matter). Our confidence is the **gap** between top and second:

```ts
function francConfidence(text: string, topCode: string): number {
  const scores = francAll(text, { minLength: 50 }).slice(0, 2);
  if (scores.length < 2) return 1.0;
  return scores[0][1] - scores[1][1];  // 0..1, higher = more confident
}
```

A clean English contract scores `eng: 1.0, deu: 0.62` → confidence 0.38. A mixed-language document scores `eng: 1.0, fra: 0.95` → confidence 0.05.

#### Confidence and accept thresholds

| `sample length` | `top language` | `confidence (gap)` | Action |
|-----------------|----------------|---------------------|--------|
| < 200 chars     | (anything)     | (n/a)               | **Accept** (skip detection — see bootstrap problem) |
| ≥ 200 chars     | not in `OCR_LANGUAGES` | ≥ 0.10      | **Reject** with `UnsupportedLanguageError(detectedLanguage)` |
| ≥ 200 chars     | not in `OCR_LANGUAGES` | < 0.10      | **Accept with warning** — ambiguous, let `textQualityScore` decide downstream |
| ≥ 200 chars     | in `OCR_LANGUAGES`     | (any)       | **Accept**, set `Document.language` to the detected code |

The 0.10 threshold is conservative — we'd rather over-accept than reject a valid English contract that scored close to a similar language. Numbers can be tuned once we have real-world data; encode as `OCR_LANGUAGE_CONFIDENCE_THRESHOLD` (default `0.10`).

#### What gets persisted

- On `Document.language` (the field on the aggregate, set by `StartOcrProcessingCommand`): the detected ISO 639-1 code, or `'und'` if we accepted without detection.
- On `DocumentText.language`: same value, copied for convenience so downstream consumers don't have to join.
- The detection event itself does not get its own domain event — it's an internal pipeline step. If a document is rejected at this step, the failure surfaces as `DocumentOCRFailedEvent { reason: 'unsupported_language:fra' }`.

#### Edge cases worth knowing

- **Multi-language contracts** (e.g. English contract with a French addendum). `franc` returns the dominant language. If the gap is < 0.10 we accept and proceed; the French pages will OCR adequately (Document AI's `OCR_PROCESSOR` is reasonably language-agnostic for Latin scripts) but `textQualityScore` for those pages will be low against an English wordlist. They'll be flagged in metrics, not rejected. **Acceptable in v1.**
- **Encrypted PDFs.** pdfjs throws before we get a text sample. Detection never runs; the error propagates and the document is rejected as `OcrPermanentError`. Handled in §5 error taxonomy, not here.
- **PDFs whose first 2 pages are a cover image + table of contents.** The sample is mostly headings — short, often Latin proper nouns. `franc` may return `und`. We fall through the < 200 chars rule and accept; the rest of the document will be evaluated by `textQualityScore`.
- **Future:** when we add support for additional languages (French, German), the only change is appending to `OCR_LANGUAGES` and seeding a per-language wordlist for `textQualityScore`. The detector and pipeline don't need touching.

#### Tests

- `LanguageDetector` unit tests:
  - Clean English contract sample → returns `{ language: 'en', confidence > 0.1 }`
  - Clean French sample → returns `{ language: 'fr', confidence > 0.1 }`
  - 50-char sample → returns `{ language: 'und', confidence: 0 }`
  - Mixed English/French → returns top language with low confidence (< 0.1)
- `ClassifierThenRouter` integration tests:
  - Empty sample (pure-scanned PDF) → bypass detection, pipeline proceeds
  - French sample → throws `UnsupportedLanguageError`, no OCR call made
  - English with `confidence = 0.05` (ambiguous) → accepts with warning, proceeds

### Drivers

| Driver               | Implementation                                                                 | Use                                    |
|----------------------|--------------------------------------------------------------------------------|----------------------------------------|
| `MockOcrDriver`      | Returns deterministic fixture text, `confidence = 0.85`, `textQualityScore = 0.95` | Tests, local dev, demos            |
| `NativePdfExtractor` | `pdfjs-dist` — walks content stream operators, decodes via font cmaps, computes `textQualityScore` (dictionary-word ratio + Unicode-block sanity + replacement-char density) | Born-digital pages |
| `GoogleDocAiDriver`  | `@google-cloud/documentai`. Routes **internally** between sync (`processDocument`, ≤15 pages, ≤20 MB) and batch (`batchProcessDocuments`, larger) paths behind a single `extractText(...)` method. | Scanned pages, demoted pages |

**`GoogleDocAiDriver` batch path:** the batch API writes per-page `Document` JSON to a GCS prefix (e.g. `gs://{bucket}/ocr-output/{documentId}/`), returns an LRO; driver polls until done, reads the JSON files back via `IStorageService`, and assembles the `OcrOutput`. This requires extending `IStorageService` with `list(prefix)` and `readJson(key)` — or, pragmatically, going around the port for OCR output specifically and using `@google-cloud/storage` directly inside the driver. **Recommendation:** keep it inside the driver; OCR output is a Document AI concern, not a general storage concern.

### Driver factory

In `OcrModule`:

```ts
{ provide: IOcrService, useFactory: (cfg) => {
    const cloud = cfg.get('OCR_DRIVER') === 'google-document-ai'
      ? new GoogleDocAiDriver(cfg)
      : new MockOcrDriver();
    return new ClassifierThenRouter(
      new LanguageDetector(),
      new PdfClassifier(),
      new NativePdfExtractor(),
      cloud,
      { textQualityThreshold: cfg.get('TEXT_QUALITY_THRESHOLD', 0.5) },
    );
  }
}
```

### Persistence

- New Prisma model `DocumentText` with FK to `Document`.
- Full text stored in DB **or** as a JSON blob in `IStorageService` under key `{documentId}.text.json`. Default: **blob in storage** + small row in DB (text length, confidence, language, driver, key) to keep DB small and consistent with how we treat the source PDF.

### Retry

Use NestJS `@nestjs/event-emitter` + a simple in-handler retry loop with exponential backoff (1s, 4s, 16s) for transient errors. Non-retryable: invalid PDF, quota exceeded. When async queue lands, retries move to the queue's native mechanism.

---

## 6. Configuration

| Env var               | Values                                  | Default                |
|-----------------------|-----------------------------------------|------------------------|
| `OCR_DRIVER`          | `mock` \| `google-document-ai`          | `mock`                 |
| `OCR_LANGUAGES`       | CSV ISO 639-1 codes — detected language must be in this list | `en`     |
| `OCR_LANGUAGE_CONFIDENCE_THRESHOLD` | float, gap between top and second `franc` score above which we *trust* the detection enough to reject non-allowlisted languages | `0.10` |
| `OCR_GCP_PROJECT_ID`  | GCP project                             | inherits from storage  |
| `OCR_GCP_LOCATION`    | `us` \| `eu`                            | `eu`                   |
| `OCR_GCP_PROCESSOR_ID`| Document AI processor resource id       | (required when driver=google-document-ai) |
| `OCR_CONF_THRESHOLD`  | float, fail if below. **Driver-specific semantics** — Document AI clusters 0.95–1.00 on clear scans, 0.55–0.80 on poor scans; not portable across drivers. | `0.0` (don't fail) |
| `TEXT_QUALITY_THRESHOLD` | float, demote native page → cloud OCR if below | `0.5`              |
| `OCR_PAGE_LIMIT`      | int, reject documents above this page count | `200`              |

---

## 7. Frontend changes

- `/processing/:documentId` polls `GetProcessingStatusQuery` every 2s.
- States:
  - `processing` — spinner + "Extracting text…"
  - `ocr_complete` — auto-redirect to `/results/:id` (stub for now)
  - `ocr_failed` — error card with **"Retry OCR" button** (dispatches `RetryOcrProcessingCommand`) when `userRetryCount < 3`; falls back to "Upload another" once exhausted. Error reason displayed inline.
- No new UI components beyond status copy, spinner reuse, and one button.

---

## 8. Security & cost

- Document AI calls use the same service account as GCS (`contractintel-uploads-sa`) — needs `roles/documentai.apiUser` added on the project.
- PDF streams from GCS → backend → Document AI; **never** browser → Document AI.
- Cost guardrail: 50 MB cap + page-count cap (e.g. 200 pages) enforced in `StartOcrProcessingCommand` before driver dispatch.
- PII: extracted text contains contract content. Storage encryption at rest (GCS default) is sufficient for v1; CMEK comes with the compliance phase.

---

## 9. Test strategy

- **Domain unit tests:** `DocumentText` aggregate, all new VOs (`ConfidenceScore`, `TextQualityScore`, `Language`, `OcrDriver`), `ProcessingStatus` state machine — exhaustive transition table.
- **Application unit tests:** `StartOcrProcessingHandler` with mocked `IOcrService`, success / transient-fail-then-success / permanent-fail paths.
- **Infrastructure unit tests:** `MockOcrDriver`, `NativePdfExtractor` against fixture PDFs, `PdfClassifier` against fixtures (born-digital, scanned, hybrid, broken-cmap), `LanguageDetector`, `GoogleDocAiDriver` with `jest.mock('@google-cloud/documentai')` covering sync, batch, and LRO-poll paths.
- **Pipeline integration test:** `ClassifierThenRouter` with all four fixture types + a broken-cmap fixture that exercises the quality-demotion path.
- **E2E:** Upload → wait → assert `DocumentText` row exists, confidence > 0, page count matches fixture. Fixtures: born-digital (native track), scanned (mock cloud track), hybrid (both per-page drivers present).
- **Contract test:** `IOcrService` shape stable across all three driver implementations.

---

## 10. Task breakdown (proposed Phase 7)

| Task | Title                                       | Output                                                              |
|------|---------------------------------------------|---------------------------------------------------------------------|
| 7.1  | Domain layer                                | `DocumentText` aggregate, VOs, 3 events, `ProcessingStatus` VO, unit tests |
| 7.2  | Application layer                           | Commands, queries, `DocumentUploadCompletedHandler`, retry policy, unit tests |
| 7.3  | Infrastructure — Mock + Native PDF          | `MockOcrDriver`, `NativePdfExtractor`, `TwoTrackOcrService`, Prisma `DocumentText` model + migration, persistence |
| 7.4  | Infrastructure — Google Document AI driver  | `GoogleDocAiDriver`, factory wiring, IAM script update, env docs   |
| 7.5  | Frontend — processing screen wiring         | Real polling on `/processing/:id`, error UI, **Retry OCR button**   |
| 7.6  | E2E + load smoke                            | Real upload → real OCR (mock) → `DocumentText` asserted; 5-doc concurrent smoke |

---

## 11. Decisions locked (2026-05-15)

1. **Page-count cap = 200.** Enforced in `StartOcrProcessingCommand` before driver dispatch; documents above this are rejected with a domain error.
2. **Text storage = blob in `IStorageService`** under key `{documentId}.text.json` + thin metadata row in Prisma (`text_length`, `confidence`, `min_page_confidence`, `language`, `driver`, `storage_key`, `extracted_at`). Same pattern as the source PDF.
3. **Per-page confidence persisted** as a field on `PageText` inside the blob (no separate VO row). Cheap; useful for triage and future clause-extractor confidence weighting.
4. **Separate `ProcessingStatus` VO.** `UploadStatus` stays focused on upload lifecycle (`pending → uploading → complete | failed`). New `ProcessingStatus` covers `processing → ocr_complete | ocr_failed`. The two VOs co-exist on `Document`.
5. **Retry CTA shipped in v1.** `/processing/:id` failure state shows a "Retry OCR" button that dispatches `RetryOcrProcessingCommand { documentId }`. Handler transitions `ocr_failed → processing` and re-runs the pipeline. Retry count persists on the aggregate; capped at 3 user-initiated retries before the only CTA is "Upload another."

---

## 12. Dependencies

- Phase 5 ✅ (upload + storage + state machine + events)
- Phase 6 (Audit Service) — not a hard blocker, but `DocumentOCR*Event` should dispatch `RecordAuditEventCommand` once Phase 6 ships.
- No new infrastructure other than enabling Document AI API in the existing GCP project and granting one role to the existing service account.
