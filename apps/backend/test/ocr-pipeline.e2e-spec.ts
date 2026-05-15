import { CommandBus, EventBus } from '@nestjs/cqrs';
import { promises as fs, createReadStream } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { Readable } from 'stream';

import { StartOcrProcessingHandler } from '../src/modules/documents/application/commands/start-ocr-processing.handler';
import { StartOcrProcessingCommand } from '../src/modules/documents/application/commands/start-ocr-processing.command';
import { RetryOcrProcessingHandler } from '../src/modules/documents/application/commands/retry-ocr-processing.handler';
import { RetryOcrProcessingCommand } from '../src/modules/documents/application/commands/retry-ocr-processing.command';
import { Document } from '../src/modules/documents/domain/document.aggregate';
import { DocumentText } from '../src/modules/documents/domain/document-text.aggregate';
import { IDocumentRepository } from '../src/modules/documents/domain/document.repository';
import { IDocumentTextRepository } from '../src/modules/documents/domain/document-text.repository';
import {
  IStorageService,
  UploadUrlGrant,
} from '../src/modules/documents/domain/ports/storage-service.port';
import { IOcrService, OcrInput, OcrOutput } from '../src/modules/documents/domain/ports/ocr-service.port';
import { DocumentId } from '../src/modules/documents/domain/value-objects/document-id.vo';
import { DocumentName } from '../src/modules/documents/domain/value-objects/document-name.vo';
import { DocumentType } from '../src/modules/documents/domain/value-objects/document-type.vo';
import { FileSize } from '../src/modules/documents/domain/value-objects/file-size.vo';
import { OrgId } from '../src/modules/documents/domain/value-objects/org-id.vo';
import { StorageKey } from '../src/modules/documents/domain/value-objects/storage-key.vo';
import { UploadedBy } from '../src/modules/documents/domain/value-objects/uploaded-by.vo';

import { ClassifierThenRouter } from '../src/modules/documents/infrastructure/ocr/classifier-then-router';
import { LanguageDetector } from '../src/modules/documents/infrastructure/ocr/language-detector';
import { MockOcrDriver } from '../src/modules/documents/infrastructure/ocr/mock-ocr.driver';
import { NativePdfExtractor } from '../src/modules/documents/infrastructure/ocr/native-pdf-extractor';
import { PdfClassifier } from '../src/modules/documents/infrastructure/ocr/pdf-classifier';
import { OcrPermanentError, OcrTransientError } from '../src/modules/documents/application/ocr/ocr-errors';

/**
 * Full OCR pipeline e2e — every layer above persistence is exercised
 * against real implementations:
 *
 *   StartOcrProcessingHandler  →  ClassifierThenRouter
 *     → PdfClassifier (real pdfjs)
 *     → LanguageDetector (real franc-min)
 *     → NativePdfExtractor (real pdfjs + textQualityScore)
 *     → MockOcrDriver (fills the cloud slot for the scanned-page track)
 *   → DocumentText aggregate built from real OcrOutput
 *   → persisted via IDocumentTextRepository (in-memory fake — Prisma
 *      coverage lives in its own integration test)
 *
 * IStorageService is a tmp-dir fake that streams bytes off disk so the
 * pipeline reads the same way it does in production. Fixtures generated
 * by `test/fixtures/ocr/generate-fixtures.ts` cover every classifier
 * outcome (digital, scanned, hybrid, corrupt).
 *
 * The retry path stubs IOcrService directly to keep the test
 * deterministic (otherwise it'd need a transient-failure-then-recovery
 * fixture, which is awkward to construct).
 */

const FIXTURES_DIR = join(__dirname, 'fixtures/ocr');
const USER_ID = '11111111-2222-4333-8444-555555555555';

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
  saved = 0;

  async findByDocumentId(id: DocumentId): Promise<DocumentText | null> {
    return this.byId.get(id.value) ?? null;
  }
  async save(text: DocumentText): Promise<void> {
    this.byId.set(text.documentId.value, text);
    this.saved += 1;
  }
}

/** Tiny storage driver that points at a tmpdir + lets us pre-seed bytes. */
class TmpStorage implements IStorageService {
  constructor(private readonly root: string) {}

  generateUploadUrl(): Promise<UploadUrlGrant> {
    return Promise.resolve({
      url: 'unused-in-this-test',
      expiresAt: new Date(Date.now() + 60_000),
      method: 'PUT' as const,
    });
  }
  async writeStream(key: StorageKey, source: Readable): Promise<{ bytesWritten: number }> {
    const target = join(this.root, key.value);
    const chunks: Buffer[] = [];
    await new Promise<void>((resolve, reject) => {
      source.on('data', (c: Buffer) => chunks.push(c));
      source.on('end', () => resolve());
      source.on('error', reject);
    });
    await fs.writeFile(target, Buffer.concat(chunks));
    const stat = await fs.stat(target);
    return { bytesWritten: stat.size };
  }
  async openReadStream(key: StorageKey): Promise<Readable> {
    return createReadStream(join(this.root, key.value));
  }
}

interface Harness {
  start: StartOcrProcessingHandler;
  retry: RetryOcrProcessingHandler;
  docs: InMemoryDocumentRepository;
  texts: InMemoryDocumentTextRepository;
  events: { publishAll: jest.Mock };
  ocr: IOcrService;
  storage: TmpStorage;
  cleanup: () => Promise<void>;
}

/** Test-time subclass — sleep is a no-op so retries don't take 21 s. */
class FastStartHandler extends StartOcrProcessingHandler {
  protected sleep(): Promise<void> {
    return Promise.resolve();
  }
}

async function buildHarness(opts: { ocrOverride?: IOcrService } = {}): Promise<Harness> {
  const root = await fs.mkdtemp(join(tmpdir(), 'ocr-e2e-'));
  const storage = new TmpStorage(root);
  const docs = new InMemoryDocumentRepository();
  const texts = new InMemoryDocumentTextRepository();
  const events = { publishAll: jest.fn() };

  const ocr: IOcrService =
    opts.ocrOverride ??
    new ClassifierThenRouter(
      new PdfClassifier(),
      new LanguageDetector(),
      new NativePdfExtractor(),
      new MockOcrDriver(),
      /* pageLimit */ 200,
      /* qualityThreshold */ 0.5,
      /* languageConfidenceThreshold */ 0.1,
    );

  const start = new FastStartHandler(
    docs,
    texts,
    ocr,
    storage,
    events as unknown as EventBus,
  );

  // RetryOcrProcessingHandler needs a CommandBus that forwards to start.
  const commandBus = {
    execute: jest.fn((cmd: unknown) => start.execute(cmd as StartOcrProcessingCommand)),
  } as unknown as CommandBus;
  const retry = new RetryOcrProcessingHandler(docs, events as unknown as EventBus, commandBus);

  return {
    start,
    retry,
    docs,
    texts,
    events,
    ocr,
    storage,
    cleanup: () => fs.rm(root, { recursive: true, force: true }),
  };
}

async function seedDocument(h: Harness, fixturePath: string): Promise<Document> {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  const key = StorageKey.forDocument(id, type);

  // Park the fixture bytes under the document's storage key.
  const bytes = await fs.readFile(fixturePath);
  await h.storage.writeStream(key, Readable.from([bytes]));

  const doc = Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(bytes.length),
    storageKey: key,
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
  // Drive through the upload state machine; the pipeline only runs from
  // `complete`.
  doc.markComplete();
  doc.pullDomainEvents();
  await h.docs.save(doc);
  return doc;
}

describe('OCR pipeline (E2E)', () => {
  describe('happy paths — real pipeline against synthetic fixtures', () => {
    it('born-digital PDF → driver=native_pdf, confidence=1.0', async () => {
      const h = await buildHarness();
      try {
        const doc = await seedDocument(h, join(FIXTURES_DIR, 'born-digital-sample.pdf'));
        await h.start.execute(new StartOcrProcessingCommand(doc.id.value));

        const reloaded = await h.docs.findById(doc.id);
        expect(reloaded!.processingStatus.value).toBe('ocr_complete');

        const text = await h.texts.findByDocumentId(doc.id);
        expect(text).not.toBeNull();
        expect(text!.driver.value).toBe('native_pdf');
        expect(text!.confidence.value).toBe(1);
        expect(text!.pageCount).toBeGreaterThan(0);
        expect(text!.text.length).toBeGreaterThan(100);
        expect(text!.language.code).toBe('en');
      } finally {
        await h.cleanup();
      }
    }, 15_000);

    it('scanned PDF → cloud-track driver (mock) handles every page', async () => {
      const h = await buildHarness();
      try {
        const doc = await seedDocument(h, join(FIXTURES_DIR, 'scanned-sample.pdf'));
        await h.start.execute(new StartOcrProcessingCommand(doc.id.value));

        const text = await h.texts.findByDocumentId(doc.id);
        expect(text!.driver.value).toBe('mock'); // MockOcrDriver returned the cloud-page output
        expect(text!.pageCount).toBe(1);
        // Mock-supplied confidence (0.85) is what landed.
        expect(text!.confidence.value).toBeCloseTo(0.85, 2);
      } finally {
        await h.cleanup();
      }
    }, 15_000);

    it('hybrid PDF → document-level driver=hybrid, per-page drivers mixed', async () => {
      const h = await buildHarness();
      try {
        const doc = await seedDocument(h, join(FIXTURES_DIR, 'hybrid-sample.pdf'));
        await h.start.execute(new StartOcrProcessingCommand(doc.id.value));

        const text = await h.texts.findByDocumentId(doc.id);
        expect(text!.driver.value).toBe('hybrid');
        const perPageDrivers = new Set<string>(text!.pages.map((p) => p.driver.value as string));
        expect(perPageDrivers.has('native_pdf')).toBe(true);
        expect(perPageDrivers.has('mock')).toBe(true);
      } finally {
        await h.cleanup();
      }
    }, 15_000);
  });

  describe('failure paths', () => {
    it('corrupt PDF → ocr_failed, no DocumentText written', async () => {
      const h = await buildHarness();
      try {
        const doc = await seedDocument(h, join(FIXTURES_DIR, 'corrupt-sample.pdf'));
        await h.start.execute(new StartOcrProcessingCommand(doc.id.value));

        const reloaded = await h.docs.findById(doc.id);
        expect(reloaded!.processingStatus.value).toBe('ocr_failed');
        expect(reloaded!.failureReason).not.toBeNull();

        const text = await h.texts.findByDocumentId(doc.id);
        expect(text).toBeNull();
      } finally {
        await h.cleanup();
      }
    }, 15_000);

    it('transient OCR errors retry then succeed on attempt 2', async () => {
      const flaky: IOcrService = {
        extractText: jest
          .fn<Promise<OcrOutput>, [OcrInput]>()
          .mockRejectedValueOnce(new OcrTransientError('upstream 503'))
          .mockResolvedValueOnce({
            text: 'recovered',
            pages: [
              {
                pageNumber: 1,
                text: 'recovered',
                confidence: 0.95,
                textQualityScore: 0.9,
                driver: 'mock',
              },
            ],
            confidence: 0.95,
            minPageConfidence: 0.95,
            language: 'en',
            driver: 'mock',
          }),
      };
      const h = await buildHarness({ ocrOverride: flaky });
      try {
        const doc = await seedDocument(h, join(FIXTURES_DIR, 'born-digital-sample.pdf'));
        await h.start.execute(new StartOcrProcessingCommand(doc.id.value));

        const reloaded = await h.docs.findById(doc.id);
        expect(reloaded!.processingStatus.value).toBe('ocr_complete');
        expect(flaky.extractText).toHaveBeenCalledTimes(2);
      } finally {
        await h.cleanup();
      }
    });

    it('user retry path: fail → user clicks retry → succeed; userRetryCount increments', async () => {
      // First attempt fails permanently; we then retry against a successful service.
      let callCount = 0;
      const moodySvc: IOcrService = {
        extractText: jest.fn<Promise<OcrOutput>, [OcrInput]>().mockImplementation(() => {
          callCount += 1;
          if (callCount === 1) {
            throw new OcrPermanentError('invalid_pdf', 'first-time failure');
          }
          return Promise.resolve({
            text: 'second-time-lucky',
            pages: [
              {
                pageNumber: 1,
                text: 'second-time-lucky',
                confidence: 0.9,
                textQualityScore: 0.9,
                driver: 'mock',
              },
            ],
            confidence: 0.9,
            minPageConfidence: 0.9,
            language: 'en',
            driver: 'mock',
          });
        }),
      };
      const h = await buildHarness({ ocrOverride: moodySvc });
      try {
        const doc = await seedDocument(h, join(FIXTURES_DIR, 'born-digital-sample.pdf'));
        await h.start.execute(new StartOcrProcessingCommand(doc.id.value));
        expect((await h.docs.findById(doc.id))!.processingStatus.value).toBe('ocr_failed');

        await h.retry.execute(new RetryOcrProcessingCommand(doc.id.value, USER_ID));

        const reloaded = await h.docs.findById(doc.id);
        expect(reloaded!.processingStatus.value).toBe('ocr_complete');
        expect(reloaded!.userRetryCount).toBe(1);
      } finally {
        await h.cleanup();
      }
    });
  });

  describe('concurrent load smoke', () => {
    it('5 documents run through the pipeline in parallel without choking', async () => {
      const h = await buildHarness();
      try {
        // Seed 5 distinct documents pointing at the same fixture bytes.
        const docs = await Promise.all(
          Array.from({ length: 5 }, () =>
            seedDocument(h, join(FIXTURES_DIR, 'born-digital-sample.pdf')),
          ),
        );

        await Promise.all(
          docs.map((d) => h.start.execute(new StartOcrProcessingCommand(d.id.value))),
        );

        for (const d of docs) {
          const reloaded = await h.docs.findById(d.id);
          expect(reloaded!.processingStatus.value).toBe('ocr_complete');
          const text = await h.texts.findByDocumentId(d.id);
          expect(text!.text.length).toBeGreaterThan(100);
        }
        // 5 documents × 1 native_pdf save each → 5 DocumentTexts persisted.
        expect(h.texts.saved).toBe(5);
      } finally {
        await h.cleanup();
      }
    }, 30_000);
  });
});
