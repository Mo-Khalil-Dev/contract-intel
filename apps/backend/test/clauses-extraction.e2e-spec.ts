import { CommandBus, EventBus } from '@nestjs/cqrs';

import { StartClauseExtractionHandler } from '../src/modules/clauses/application/commands/start-clause-extraction.handler';
import { StartClauseExtractionCommand } from '../src/modules/clauses/application/commands/start-clause-extraction.command';
import { RetryClauseExtractionHandler } from '../src/modules/clauses/application/commands/retry-clause-extraction.handler';
import { RetryClauseExtractionCommand } from '../src/modules/clauses/application/commands/retry-clause-extraction.command';
import { FailClauseExtractionHandler } from '../src/modules/clauses/application/commands/fail-clause-extraction.handler';
import { FailClauseExtractionCommand } from '../src/modules/clauses/application/commands/fail-clause-extraction.command';

import {
  ExtractedContract,
  IClauseExtractor,
} from '../src/modules/clauses/application/ports/clause-extractor.port';
import {
  EmbeddingResult,
  IEmbeddingService,
} from '../src/modules/clauses/application/ports/embedding-service.port';
import {
  EmbeddingPermanentError,
  EmbeddingTransientError,
  ExtractionPermanentError,
  ExtractionTransientError,
} from '../src/modules/clauses/application/errors/clause-extraction-errors';

import { ExtractionRun } from '../src/modules/clauses/domain/aggregates/extraction-run.aggregate';
import { Clause, EMBEDDING_DIM } from '../src/modules/clauses/domain/entities/clause';
import { IClauseRepository } from '../src/modules/clauses/domain/clause.repository';
import { IExtractionRunRepository } from '../src/modules/clauses/domain/extraction-run.repository';
import { ExtractionRunId } from '../src/modules/clauses/domain/value-objects/extraction-run-id.vo';
import { ClauseId } from '../src/modules/clauses/domain/value-objects/clause-id.vo';

import { MockClauseExtractor } from '../src/modules/clauses/infrastructure/extraction/mock-clause-extractor';
import { MockEmbeddingService } from '../src/modules/clauses/infrastructure/embeddings/mock-embedding-service';

import { Document } from '../src/modules/documents/domain/document.aggregate';
import { DocumentText } from '../src/modules/documents/domain/document-text.aggregate';
import { IDocumentRepository } from '../src/modules/documents/domain/document.repository';
import { IDocumentTextRepository } from '../src/modules/documents/domain/document-text.repository';
import { DocumentId } from '../src/modules/documents/domain/value-objects/document-id.vo';
import { DocumentName } from '../src/modules/documents/domain/value-objects/document-name.vo';
import { DocumentType } from '../src/modules/documents/domain/value-objects/document-type.vo';
import { FileSize } from '../src/modules/documents/domain/value-objects/file-size.vo';
import { OrgId } from '../src/modules/documents/domain/value-objects/org-id.vo';
import { StorageKey } from '../src/modules/documents/domain/value-objects/storage-key.vo';
import { UploadedBy } from '../src/modules/documents/domain/value-objects/uploaded-by.vo';
import { ConfidenceScore } from '../src/modules/documents/domain/value-objects/confidence-score.vo';
import { Language } from '../src/modules/documents/domain/value-objects/language.vo';
import { OcrDriver } from '../src/modules/documents/domain/value-objects/ocr-driver.vo';
import { PageText } from '../src/modules/documents/domain/value-objects/page-text.vo';
import { TextQualityScore } from '../src/modules/documents/domain/value-objects/text-quality-score.vo';

/**
 * Full clause-extraction pipeline e2e.
 *
 * Every layer above persistence is exercised against real
 * implementations:
 *
 *   StartClauseExtractionHandler  →  IClauseExtractor (mock by default,
 *                                       swappable for failure-injection)
 *                                  →  IEmbeddingService (mock)
 *                                  → in-memory repos
 *
 * The Document is pre-seeded with completed OCR (DocumentText
 * artifact) — that's the integration boundary Phase 8 starts from.
 * The OCR pipeline itself has its own e2e (`ocr-pipeline.e2e-spec.ts`).
 *
 * Scenarios covered:
 *   - Happy path: full Claude → Voyage → persist roundtrip
 *   - Hallucinated text drop
 *   - Permanent extraction failure → run + document fail
 *   - Transient retry → eventual success
 *   - Retries exhausted → run + document fail
 *   - Embedding failure → clauses persist with embedding=null,
 *     run still completes (isolation property)
 *   - Idempotency: in-flight + complete runs skip
 *   - Retry after failed run: creates a new run, old retained
 *   - 5-document concurrent smoke
 */

const USER_ID = '11111111-2222-4333-8444-555555555555';

const SAMPLE_TEXT =
  'Indemnification. Vendor shall defend and indemnify Customer for IP claims. ' +
  'Limitation of Liability. Liability is capped at fees paid in the prior 12 months. ' +
  'Termination. Either party may terminate for material breach with 30 days notice. ' +
  'Payment shall be due net-30 from invoice date.';

class InMemoryDocumentRepository implements IDocumentRepository {
  private byId = new Map<string, Document>();
  saved = 0;

  async findById(id: DocumentId): Promise<Document | null> {
    return this.byId.get(id.value) ?? null;
  }
  async findByIdForOrg(id: DocumentId): Promise<Document | null> {
    return this.byId.get(id.value) ?? null;
  }
  async save(doc: Document): Promise<void> {
    this.byId.set(doc.id.value, doc);
    this.saved += 1;
  }
}

class InMemoryDocumentTextRepository implements IDocumentTextRepository {
  private byId = new Map<string, DocumentText>();
  async findByDocumentId(id: DocumentId): Promise<DocumentText | null> {
    return this.byId.get(id.value) ?? null;
  }
  async save(text: DocumentText): Promise<void> {
    this.byId.set(text.documentId.value, text);
  }
}

class InMemoryExtractionRunRepository implements IExtractionRunRepository {
  private byId = new Map<string, ExtractionRun>();
  private latestByDoc = new Map<string, string>();
  saved = 0;

  async save(run: ExtractionRun): Promise<void> {
    this.byId.set(run.id.value, run);
    this.latestByDoc.set(run.documentId.value, run.id.value);
    this.saved += 1;
  }
  async findById(id: ExtractionRunId): Promise<ExtractionRun | null> {
    return this.byId.get(id.value) ?? null;
  }
  async findCurrentForDocument(documentId: DocumentId): Promise<ExtractionRun | null> {
    const runId = this.latestByDoc.get(documentId.value);
    return runId ? this.byId.get(runId) ?? null : null;
  }
  /** Helper for tests: returns every saved run for a document, oldest first. */
  allForDocument(documentId: DocumentId): ExtractionRun[] {
    return [...this.byId.values()].filter(
      (r) => r.documentId.value === documentId.value,
    );
  }
}

class InMemoryClauseRepository implements IClauseRepository {
  private byRun = new Map<string, Clause[]>();
  saveCallCount = 0;

  async saveForRun(runId: ExtractionRunId, clauses: Clause[]): Promise<void> {
    this.byRun.set(runId.value, clauses);
    this.saveCallCount += 1;
  }
  async findByDocumentId(documentId: DocumentId): Promise<Clause[]> {
    const all: Clause[] = [];
    for (const clauses of this.byRun.values()) {
      all.push(...clauses.filter((c) => c.documentId.equals(documentId)));
    }
    return all;
  }
  async findById(id: ClauseId): Promise<Clause | null> {
    for (const clauses of this.byRun.values()) {
      const found = clauses.find((c) => c.id.equals(id));
      if (found) return found;
    }
    return null;
  }
  /** Helper for tests: clauses for a specific run, in saved order. */
  forRun(runId: ExtractionRunId): Clause[] {
    return this.byRun.get(runId.value) ?? [];
  }
}

class FastStartHandler extends StartClauseExtractionHandler {
  protected sleep(): Promise<void> {
    return Promise.resolve();
  }
}

interface Harness {
  start: StartClauseExtractionHandler;
  retry: RetryClauseExtractionHandler;
  fail: FailClauseExtractionHandler;
  docs: InMemoryDocumentRepository;
  texts: InMemoryDocumentTextRepository;
  runs: InMemoryExtractionRunRepository;
  clauses: InMemoryClauseRepository;
  events: { publishAll: jest.Mock };
}

function buildHarness(
  opts: {
    extractor?: IClauseExtractor;
    embedder?: IEmbeddingService;
  } = {},
): Harness {
  const docs = new InMemoryDocumentRepository();
  const texts = new InMemoryDocumentTextRepository();
  const runs = new InMemoryExtractionRunRepository();
  const clauses = new InMemoryClauseRepository();
  const events = { publishAll: jest.fn() };

  const extractor = opts.extractor ?? new MockClauseExtractor();
  const embedder = opts.embedder ?? new MockEmbeddingService();

  const start = new FastStartHandler(
    docs,
    texts,
    runs,
    clauses,
    extractor,
    embedder,
    events as unknown as EventBus,
  );

  // RetryClauseExtractionHandler delegates back to StartClauseExtraction
  // via the CommandBus. Wire a fake bus that routes the command.
  const commandBus = {
    execute: jest.fn((cmd: unknown) =>
      start.execute(cmd as StartClauseExtractionCommand),
    ),
  } as unknown as CommandBus;

  const retry = new RetryClauseExtractionHandler(docs, commandBus);
  const fail = new FailClauseExtractionHandler(
    docs,
    runs,
    events as unknown as EventBus,
  );

  return { start, retry, fail, docs, texts, runs, clauses, events };
}

async function seedOcrCompleteDocument(
  h: Harness,
  text = SAMPLE_TEXT,
): Promise<Document> {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);

  const doc = Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(1024),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
  // Drive through the state machine to ocr_complete.
  doc.markComplete();
  doc.startProcessing();
  doc.completeProcessing({
    driver: 'native_pdf',
    language: 'en',
    confidence: 1,
    pageCount: 1,
  });
  doc.pullDomainEvents();
  await h.docs.save(doc);

  // Build the matching DocumentText artifact.
  const documentText = DocumentText.fromOcrOutput({
    documentId: id,
    text,
    pages: [
      PageText.create({
        pageNumber: 1,
        text,
        confidence: ConfidenceScore.fromNumber(1),
        textQualityScore: TextQualityScore.fromNumber(0.95),
        driver: OcrDriver.fromValue('native_pdf'),
      }),
    ],
    language: Language.fromCode('en'),
  });
  await h.texts.save(documentText);

  return doc;
}

describe('Clause extraction pipeline (E2E)', () => {
  describe('happy path — real pipeline against mock drivers', () => {
    it('persists clauses with embeddings and transitions the document', async () => {
      const h = buildHarness();
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const reloaded = await h.docs.findById(doc.id);
      expect(reloaded!.extractionStatus.value).toBe('extraction_complete');

      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run).not.toBeNull();
      expect(run!.isComplete()).toBe(true);
      expect(run!.clauseCount).toBeGreaterThan(0);
      expect(run!.droppedClauseCount).toBe(0);

      const clauses = h.clauses.forRun(run!.id);
      expect(clauses.length).toBeGreaterThan(0);
      for (const c of clauses) {
        expect(c.embedding).not.toBeNull();
        expect(c.embedding).toHaveLength(EMBEDDING_DIM);
      }
    });

    it('attaches the metadata snapshot to the run', async () => {
      const h = buildHarness();
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.metadata).not.toBeNull();
      // MockClauseExtractor returns the wireframe fixture.
      expect(run!.metadata!.contractType).toBe('Vendor');
      expect(run!.metadata!.parties).toHaveLength(2);
    });

    it('resolves nested parent/child clauses via clientRef', async () => {
      const h = buildHarness();
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const run = await h.runs.findCurrentForDocument(doc.id);
      const clauses = h.clauses.forRun(run!.id);
      // MockClauseExtractor's rule set has a child under Termination.
      const children = clauses.filter((c) => c.parentClauseId !== null);
      expect(children.length).toBeGreaterThan(0);
      const parentIds = new Set(
        children.map((c) => c.parentClauseId!.value),
      );
      for (const pid of parentIds) {
        const parent = clauses.find((c) => c.id.value === pid);
        expect(parent).toBeDefined();
        expect(parent!.parentClauseId).toBeNull();
      }
    });
  });

  describe('hallucination drop', () => {
    it('drops clauses whose text is not present and counts them', async () => {
      // Custom extractor: returns one good clause + one hallucinated one.
      const extractor: IClauseExtractor = {
        getModelVersion: () => 'mock/test@v1',
        extract: () =>
          Promise.resolve<ExtractedContract>({
            clauses: [
              {
                clientRef: 'real',
                parentClientRef: null,
                type: 'indemnification',
                confidence: 0.9,
                text: 'Indemnification.',
                riskScore: 50,
                riskLevel: 'medium',
                riskFlags: [],
                riskExplanation: '',
              },
              {
                clientRef: 'fake',
                parentClientRef: null,
                type: 'other',
                confidence: 0.5,
                text: 'This sentence does not exist in the contract.',
                riskScore: 10,
                riskLevel: 'low',
                riskFlags: [],
                riskExplanation: '',
              },
            ],
            metadata: {
              contractType: null,
              parties: [],
              effectiveDate: null,
              terminationDate: null,
              noticePeriod: null,
              autoRenewal: null,
              paymentAmount: null,
              currency: null,
              paymentSchedule: null,
              priceEscalation: null,
              paymentTerms: null,
            },
          }),
      };

      const h = buildHarness({ extractor });
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.isComplete()).toBe(true);
      expect(run!.clauseCount).toBe(1);
      expect(run!.droppedClauseCount).toBe(1);
    });
  });

  describe('failure paths', () => {
    it('permanent extraction error → run + document marked failed', async () => {
      const extractor: IClauseExtractor = {
        getModelVersion: () => 'mock/test@v1',
        extract: () =>
          Promise.reject(
            new ExtractionPermanentError('context_overflow', 'too long'),
          ),
      };
      const h = buildHarness({ extractor });
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const reloaded = await h.docs.findById(doc.id);
      expect(reloaded!.extractionStatus.value).toBe('extraction_failed');

      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.isFailed()).toBe(true);
      expect(run!.failureReason).toBe('context_overflow');
      expect(h.clauses.forRun(run!.id)).toHaveLength(0);
    });

    it('transient error → retries → eventual success', async () => {
      let calls = 0;
      const mockOutput = await new MockClauseExtractor().extract({
        documentId: 'd',
        text: SAMPLE_TEXT,
        pages: [],
        language: 'en',
      });
      const extractor: IClauseExtractor = {
        getModelVersion: () => 'mock/test@v1',
        extract: () => {
          calls += 1;
          if (calls < 3) {
            return Promise.reject(new ExtractionTransientError('429'));
          }
          return Promise.resolve(mockOutput);
        },
      };
      const h = buildHarness({ extractor });
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      expect(calls).toBe(3);
      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.isComplete()).toBe(true);
    });

    it('retries exhausted → run + document marked failed', async () => {
      const extractor: IClauseExtractor = {
        getModelVersion: () => 'mock/test@v1',
        extract: () => Promise.reject(new ExtractionTransientError('timeout')),
      };
      const h = buildHarness({ extractor });
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.isFailed()).toBe(true);
      expect(run!.failureReason).toBe('transient_exhausted');
      const reloaded = await h.docs.findById(doc.id);
      expect(reloaded!.extractionStatus.value).toBe('extraction_failed');
    });

    it('embedding permanent failure → clauses persisted with embedding=null, run still completes', async () => {
      const embedder: IEmbeddingService = {
        getModelVersion: () => 'mock/test@v1',
        embedBatch: () =>
          Promise.reject(new EmbeddingPermanentError('forbidden', 'no key')),
      };
      const h = buildHarness({ embedder });
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.isComplete()).toBe(true);
      const clauses = h.clauses.forRun(run!.id);
      expect(clauses.length).toBeGreaterThan(0);
      for (const c of clauses) expect(c.embedding).toBeNull();
    });

    it('embedding transient failure retries and recovers', async () => {
      let calls = 0;
      const embedder: IEmbeddingService = {
        getModelVersion: () => 'mock/test@v1',
        embedBatch: (texts: string[]) => {
          calls += 1;
          if (calls < 3) {
            return Promise.reject(new EmbeddingTransientError('429'));
          }
          return Promise.resolve<EmbeddingResult[]>(
            texts.map(() => ({
              vector: new Array(EMBEDDING_DIM).fill(0.1),
            })),
          );
        },
      };
      const h = buildHarness({ embedder });
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      expect(calls).toBe(3);
      const run = await h.runs.findCurrentForDocument(doc.id);
      const clauses = h.clauses.forRun(run!.id);
      for (const c of clauses) {
        expect(c.embedding).toHaveLength(EMBEDDING_DIM);
      }
    });
  });

  describe('idempotency', () => {
    it('skips when a complete run already exists', async () => {
      const h = buildHarness();
      const doc = await seedOcrCompleteDocument(h);

      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));
      const savesAfterFirst = h.runs.saved;
      const clauseSavesAfterFirst = h.clauses.saveCallCount;

      // Second call should be a no-op — the document already has a
      // complete run.
      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      expect(h.runs.saved).toBe(savesAfterFirst);
      expect(h.clauses.saveCallCount).toBe(clauseSavesAfterFirst);
    });
  });

  describe('retry after failed run', () => {
    it('creates a new run; old failed run is retained', async () => {
      // First run: extractor always fails permanently.
      const failingExtractor: IClauseExtractor = {
        getModelVersion: () => 'mock/test@v1',
        extract: () =>
          Promise.reject(new ExtractionPermanentError('boom', 'bad')),
      };
      const goodExtractor = new MockClauseExtractor();

      const h = buildHarness({ extractor: failingExtractor });
      const doc = await seedOcrCompleteDocument(h);
      await h.start.execute(new StartClauseExtractionCommand(doc.id.value));

      const firstRun = await h.runs.findCurrentForDocument(doc.id);
      expect(firstRun!.isFailed()).toBe(true);

      // Swap extractor to a working one and rebuild only the parts that
      // depend on it.
      const h2 = buildHarness({ extractor: goodExtractor });
      // Move the seeded state across so the retry can find it.
      const seededDoc = (await h.docs.findById(doc.id))!;
      await h2.docs.save(seededDoc);
      await h2.texts.save((await h.texts.findByDocumentId(doc.id))!);
      // Carry the failed run across too so idempotency check sees it.
      await h2.runs.save(firstRun!);

      await h2.retry.execute(new RetryClauseExtractionCommand(doc.id.value));

      const allRuns = h2.runs.allForDocument(doc.id);
      expect(allRuns.length).toBe(2);
      const newRun = allRuns.find((r) => !r.id.equals(firstRun!.id))!;
      expect(newRun.isComplete()).toBe(true);
      expect(firstRun!.isFailed()).toBe(true);

      const reloaded = await h2.docs.findById(doc.id);
      expect(reloaded!.extractionStatus.value).toBe('extraction_complete');
    });
  });

  describe('admin FailClauseExtractionCommand', () => {
    it('fails an in-flight run and flips the document to extraction_failed', async () => {
      const h = buildHarness();
      const doc = await seedOcrCompleteDocument(h);

      // Manually transition the document into extracting + create a
      // running run, mimicking the state mid-pipeline.
      doc.startExtraction('run-stub');
      await h.docs.save(doc);
      const { ExtractionRun } = await import(
        '../src/modules/clauses/domain/aggregates/extraction-run.aggregate'
      );
      const { ModelVersion } = await import(
        '../src/modules/clauses/domain/value-objects/model-version.vo'
      );
      const stubRun = ExtractionRun.start({
        documentId: doc.id,
        classifierModelVersion: ModelVersion.parse(
          'mock/mock-clause-extractor@v1',
        ),
        embeddingModelVersion: ModelVersion.parse('mock/mock-embeddings@v1'),
      });
      await h.runs.save(stubRun);

      await h.fail.execute(
        new FailClauseExtractionCommand(doc.id.value, 'admin_abort'),
      );

      const reloaded = await h.docs.findById(doc.id);
      expect(reloaded!.extractionStatus.value).toBe('extraction_failed');
      const run = await h.runs.findCurrentForDocument(doc.id);
      expect(run!.isFailed()).toBe(true);
      expect(run!.failureReason).toBe('admin_abort');
    });
  });

  describe('concurrent extractions', () => {
    it('5 parallel documents all reach extraction_complete', async () => {
      const h = buildHarness();
      const docs = await Promise.all(
        Array.from({ length: 5 }, () => seedOcrCompleteDocument(h)),
      );

      await Promise.all(
        docs.map((d) =>
          h.start.execute(new StartClauseExtractionCommand(d.id.value)),
        ),
      );

      for (const d of docs) {
        const reloaded = await h.docs.findById(d.id);
        expect(reloaded!.extractionStatus.value).toBe('extraction_complete');
        const run = await h.runs.findCurrentForDocument(d.id);
        expect(run!.isComplete()).toBe(true);
        expect(h.clauses.forRun(run!.id).length).toBeGreaterThan(0);
      }
    }, 20_000);
  });
});
