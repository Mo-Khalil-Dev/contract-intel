import { EventBus } from '@nestjs/cqrs';
import { StartClauseExtractionHandler } from './start-clause-extraction.handler';
import { StartClauseExtractionCommand } from './start-clause-extraction.command';
import { IDocumentRepository } from '../../../documents/domain/document.repository';
import { IDocumentTextRepository } from '../../../documents/domain/document-text.repository';
import { IClauseRepository } from '../../domain/clause.repository';
import { IExtractionRunRepository } from '../../domain/extraction-run.repository';
import {
  ExtractedClause,
  IClauseExtractor,
} from '../ports/clause-extractor.port';
import {
  EmbeddingResult,
  IEmbeddingService,
} from '../ports/embedding-service.port';
import {
  EmbeddingPermanentError,
  EmbeddingTransientError,
  ExtractionPermanentError,
  ExtractionTransientError,
} from '../errors/clause-extraction-errors';
import { Document } from '../../../documents/domain/document.aggregate';
import { DocumentText } from '../../../documents/domain/document-text.aggregate';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { DocumentName } from '../../../documents/domain/value-objects/document-name.vo';
import { DocumentType } from '../../../documents/domain/value-objects/document-type.vo';
import { FileSize } from '../../../documents/domain/value-objects/file-size.vo';
import { OrgId } from '../../../documents/domain/value-objects/org-id.vo';
import { StorageKey } from '../../../documents/domain/value-objects/storage-key.vo';
import { UploadedBy } from '../../../documents/domain/value-objects/uploaded-by.vo';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { Language } from '../../../documents/domain/value-objects/language.vo';
import { OcrDriver } from '../../../documents/domain/value-objects/ocr-driver.vo';
import { PageText } from '../../../documents/domain/value-objects/page-text.vo';
import { TextQualityScore } from '../../../documents/domain/value-objects/text-quality-score.vo';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { ModelVersion } from '../../domain/value-objects/model-version.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';
import { EMBEDDING_DIM } from '../../domain/entities/clause';

const USER_ID = '5a0eef1d-4433-454e-a1a5-7ca51bf48955';
const SAMPLE_TEXT =
  'Indemnification. Vendor shall defend and indemnify Customer for IP claims. ' +
  'Limitation of Liability. Liability is capped at fees paid in the prior 12 months. ' +
  'Termination. Either party may terminate for material breach with 30 days notice.';

function ocrCompleteDoc(): Document {
  const id = DocumentId.create();
  const type = DocumentType.fromValue('PDF');
  const uploadedBy = UploadedBy.fromUserId(USER_ID);
  const doc = Document.create({
    id,
    name: DocumentName.create('contract.pdf'),
    type,
    size: FileSize.fromBytes(1000),
    storageKey: StorageKey.forDocument(id, type),
    uploadedBy,
    orgId: OrgId.fromUploader(uploadedBy),
  });
  doc.markComplete();
  doc.startProcessing();
  doc.completeProcessing({
    driver: 'native_pdf',
    language: 'en',
    confidence: 1,
    pageCount: 1,
  });
  doc.pullDomainEvents();
  return doc;
}

function docText(documentId: DocumentId, text = SAMPLE_TEXT): DocumentText {
  return DocumentText.fromOcrOutput({
    documentId,
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
}

function fakeExtracted(text: string, overrides: Partial<ExtractedClause> = {}): ExtractedClause {
  return {
    clientRef: overrides.clientRef ?? 'c1',
    parentClientRef: overrides.parentClientRef ?? null,
    type: overrides.type ?? 'indemnification',
    confidence: overrides.confidence ?? 0.9,
    text,
    riskScore: overrides.riskScore ?? 50,
    riskLevel: overrides.riskLevel ?? 'medium',
    riskFlags: overrides.riskFlags ?? [],
    riskExplanation: overrides.riskExplanation ?? 'standard',
  };
}

function fakeBus(): jest.Mocked<EventBus> {
  return { publishAll: jest.fn() } as unknown as jest.Mocked<EventBus>;
}

function fakeDocRepo(doc: Document | null): jest.Mocked<IDocumentRepository> {
  return {
    findByIdForOrg: jest.fn(),
    findById: jest.fn().mockResolvedValue(doc),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function fakeTextRepo(text: DocumentText | null): jest.Mocked<IDocumentTextRepository> {
  return {
    findByDocumentId: jest.fn().mockResolvedValue(text),
    save: jest.fn().mockResolvedValue(undefined),
  };
}

function fakeRunRepo(
  initialFind: ExtractionRun | null = null,
): jest.Mocked<IExtractionRunRepository> {
  return {
    save: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findCurrentForDocument: jest.fn().mockResolvedValue(initialFind),
  };
}

function fakeClauseRepo(): jest.Mocked<IClauseRepository> {
  return {
    saveForRun: jest.fn().mockResolvedValue(undefined),
    findByDocumentId: jest.fn(),
    findById: jest.fn(),
  };
}

function fakeExtractor(
  impl: ExtractedClause[] | jest.Mock,
  modelVersion = 'anthropic/claude-opus-4-7@2026-05',
): jest.Mocked<IClauseExtractor> {
  return {
    extract:
      typeof impl === 'function'
        ? (impl)
        : jest.fn().mockResolvedValue(impl),
    getModelVersion: jest.fn().mockReturnValue(modelVersion),
  };
}

function fakeEmbedder(
  impl?: EmbeddingResult[] | jest.Mock,
  modelVersion = 'voyage/voyage-law-2@2026-05',
): jest.Mocked<IEmbeddingService> {
  const result = (count: number): EmbeddingResult[] =>
    Array.from({ length: count }, () => ({
      vector: new Array(EMBEDDING_DIM).fill(0.1),
    }));
  return {
    embedBatch:
      typeof impl === 'function'
        ? (impl)
        : jest
            .fn()
            .mockImplementation((texts: string[]) =>
              Promise.resolve(impl ?? result(texts.length)),
            ),
    getModelVersion: jest.fn().mockReturnValue(modelVersion),
  };
}

class NoSleepHandler extends StartClauseExtractionHandler {
  protected sleep(): Promise<void> {
    return Promise.resolve();
  }
}

function build(parts: {
  doc: Document | null;
  text?: DocumentText | null;
  run?: ExtractionRun | null;
  extracted?: ExtractedClause[] | jest.Mock;
  embedded?: EmbeddingResult[] | jest.Mock;
}) {
  const docRepo = fakeDocRepo(parts.doc);
  const textRepo = fakeTextRepo(
    parts.text === undefined && parts.doc ? docText(parts.doc.id) : parts.text ?? null,
  );
  const runRepo = fakeRunRepo(parts.run ?? null);
  const clauseRepo = fakeClauseRepo();
  const extractor = fakeExtractor(parts.extracted ?? []);
  const embedder = fakeEmbedder(parts.embedded);
  const bus = fakeBus();
  const handler = new NoSleepHandler(
    docRepo,
    textRepo,
    runRepo,
    clauseRepo,
    extractor,
    embedder,
    bus,
  );
  return { handler, docRepo, textRepo, runRepo, clauseRepo, extractor, embedder, bus };
}

describe('StartClauseExtractionHandler', () => {
  it('happy path: extracts, persists run + clauses, transitions document', async () => {
    const doc = ocrCompleteDoc();
    const { handler, docRepo, runRepo, clauseRepo, embedder } = build({
      doc,
      extracted: [
        fakeExtracted('Indemnification. Vendor shall defend and indemnify Customer for IP claims.'),
        fakeExtracted(
          'Limitation of Liability. Liability is capped at fees paid in the prior 12 months.',
          { clientRef: 'c2', type: 'limitation_of_liability' },
        ),
      ],
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(runRepo.save).toHaveBeenCalledTimes(2);
    expect(clauseRepo.saveForRun).toHaveBeenCalledTimes(1);
    expect(clauseRepo.saveForRun.mock.calls[0][1]).toHaveLength(2);
    expect(embedder.embedBatch).toHaveBeenCalledTimes(1);
    expect(docRepo.save).toHaveBeenCalledTimes(2);
    expect(doc.extractionStatus.value).toBe('extraction_complete');
  });

  it('idempotency: skips if a running run already exists', async () => {
    const doc = ocrCompleteDoc();
    const existing = ExtractionRun.start({
      documentId: doc.id,
      classifierModelVersion: ModelVersion.parse('anthropic/claude-opus-4-7@2026-05'),
      embeddingModelVersion: ModelVersion.parse('voyage/voyage-law-2@2026-05'),
    });
    const { handler, clauseRepo, extractor } = build({ doc, run: existing });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(extractor.extract).not.toHaveBeenCalled();
    expect(clauseRepo.saveForRun).not.toHaveBeenCalled();
  });

  it('idempotency: skips if a complete run already exists', async () => {
    const doc = ocrCompleteDoc();
    const existing = ExtractionRun.start({
      documentId: doc.id,
      classifierModelVersion: ModelVersion.parse('anthropic/claude-opus-4-7@2026-05'),
      embeddingModelVersion: ModelVersion.parse('voyage/voyage-law-2@2026-05'),
    });
    existing.complete({ clauseCount: 3, droppedClauseCount: 0 });
    const { handler, extractor } = build({ doc, run: existing });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(extractor.extract).not.toHaveBeenCalled();
  });

  it('creates a new run after a failed prior run', async () => {
    const doc = ocrCompleteDoc();
    doc.startExtraction('old-run');
    doc.failExtraction('previous_failure');
    doc.pullDomainEvents();
    const prior = ExtractionRun.start({
      documentId: doc.id,
      classifierModelVersion: ModelVersion.parse('anthropic/claude-opus-4-7@2026-05'),
      embeddingModelVersion: ModelVersion.parse('voyage/voyage-law-2@2026-05'),
    });
    prior.fail('previous_failure');
    const { handler, runRepo, clauseRepo } = build({
      doc,
      run: prior,
      extracted: [fakeExtracted('Indemnification. Vendor shall defend and indemnify Customer for IP claims.')],
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    // 2 saves: initial running + final complete (the prior failed run is left alone).
    expect(runRepo.save).toHaveBeenCalledTimes(2);
    expect(clauseRepo.saveForRun).toHaveBeenCalledTimes(1);
    expect(doc.extractionStatus.value).toBe('extraction_complete');
  });

  it('rejects when OCR is not complete', async () => {
    const id = DocumentId.create();
    const type = DocumentType.fromValue('PDF');
    const uploadedBy = UploadedBy.fromUserId(USER_ID);
    const doc = Document.create({
      id,
      name: DocumentName.create('contract.pdf'),
      type,
      size: FileSize.fromBytes(1000),
      storageKey: StorageKey.forDocument(id, type),
      uploadedBy,
      orgId: OrgId.fromUploader(uploadedBy),
    });
    const { handler } = build({ doc });

    await expect(
      handler.execute(new StartClauseExtractionCommand(doc.id.value)),
    ).rejects.toBeInstanceOf(ApplicationException);
  });

  it('throws 404 when document is missing', async () => {
    const { handler } = build({ doc: null });
    await expect(
      handler.execute(
        new StartClauseExtractionCommand('00000000-0000-4000-8000-000000000000'),
      ),
    ).rejects.toBeInstanceOf(ApplicationException);
  });

  it('drops hallucinated clauses and counts them on the run', async () => {
    const doc = ocrCompleteDoc();
    const { handler, runRepo, clauseRepo } = build({
      doc,
      extracted: [
        fakeExtracted('Indemnification. Vendor shall defend and indemnify Customer for IP claims.'),
        fakeExtracted('This text is not in the document', { clientRef: 'c2', type: 'other' }),
      ],
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(clauseRepo.saveForRun.mock.calls[0][1]).toHaveLength(1);
    // Second runRepo.save call carries the completed run.
    const savedRun = runRepo.save.mock.calls[1][0];
    expect(savedRun.droppedClauseCount).toBe(1);
    expect(savedRun.clauseCount).toBe(1);
  });

  it('resolves nested parent/child links via clientRef', async () => {
    const doc = ocrCompleteDoc();
    const { handler, clauseRepo } = build({
      doc,
      extracted: [
        fakeExtracted('Termination. Either party may terminate for material breach with 30 days notice.', {
          clientRef: 'parent',
          type: 'termination',
        }),
        fakeExtracted('material breach', {
          clientRef: 'child',
          parentClientRef: 'parent',
          type: 'termination',
        }),
      ],
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    const saved = clauseRepo.saveForRun.mock.calls[0][1];
    expect(saved).toHaveLength(2);
    const parent = saved.find((c) => c.parentClauseId === null);
    const child = saved.find((c) => c.parentClauseId !== null);
    expect(parent).toBeDefined();
    expect(child).toBeDefined();
    expect(child!.parentClauseId!.value).toBe(parent!.id.value);
  });

  it('promotes child with dangling parentClientRef to root', async () => {
    const doc = ocrCompleteDoc();
    const { handler, clauseRepo } = build({
      doc,
      extracted: [
        fakeExtracted('material breach', {
          clientRef: 'orphan',
          parentClientRef: 'nope',
        }),
      ],
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    const saved = clauseRepo.saveForRun.mock.calls[0][1];
    expect(saved).toHaveLength(1);
    expect(saved[0].parentClauseId).toBeNull();
  });

  it('transient extraction error retries then succeeds', async () => {
    const doc = ocrCompleteDoc();
    const text =
      'Indemnification. Vendor shall defend and indemnify Customer for IP claims.';
    const extract = jest
      .fn()
      .mockRejectedValueOnce(new ExtractionTransientError('429'))
      .mockResolvedValueOnce([fakeExtracted(text)]);
    const { handler, clauseRepo } = build({ doc, extracted: extract });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(extract).toHaveBeenCalledTimes(2);
    expect(clauseRepo.saveForRun).toHaveBeenCalledTimes(1);
    expect(doc.extractionStatus.value).toBe('extraction_complete');
  });

  it('permanent extraction error → extraction_failed (no retry)', async () => {
    const doc = ocrCompleteDoc();
    const extract = jest
      .fn()
      .mockRejectedValue(new ExtractionPermanentError('invalid_input', 'bad'));
    const { handler, runRepo, clauseRepo } = build({ doc, extracted: extract });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(extract).toHaveBeenCalledTimes(1);
    expect(clauseRepo.saveForRun).not.toHaveBeenCalled();
    const failedRun = runRepo.save.mock.calls[1][0];
    expect(failedRun.isFailed()).toBe(true);
    expect(failedRun.failureReason).toBe('invalid_input');
    expect(doc.extractionStatus.value).toBe('extraction_failed');
  });

  it('retries-exhausted → extraction_failed', async () => {
    const doc = ocrCompleteDoc();
    const extract = jest
      .fn()
      .mockRejectedValue(new ExtractionTransientError('timeout'));
    const { handler, runRepo } = build({ doc, extracted: extract });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(extract).toHaveBeenCalledTimes(4); // 1 + 3 retries
    const failedRun = runRepo.save.mock.calls[1][0];
    expect(failedRun.isFailed()).toBe(true);
    expect(failedRun.failureReason).toBe('transient_exhausted');
  });

  it('embedding permanent failure → clauses persisted with embedding=null, run still completes', async () => {
    const doc = ocrCompleteDoc();
    const embed = jest
      .fn()
      .mockRejectedValue(new EmbeddingPermanentError('forbidden', 'no key'));
    const { handler, clauseRepo, runRepo } = build({
      doc,
      extracted: [
        fakeExtracted('Indemnification. Vendor shall defend and indemnify Customer for IP claims.'),
      ],
      embedded: embed,
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(embed).toHaveBeenCalledTimes(1);
    const saved = clauseRepo.saveForRun.mock.calls[0][1];
    expect(saved).toHaveLength(1);
    expect(saved[0].embedding).toBeNull();
    const completedRun = runRepo.save.mock.calls[1][0];
    expect(completedRun.isComplete()).toBe(true);
    expect(doc.extractionStatus.value).toBe('extraction_complete');
  });

  it('embedding transient failure retries then succeeds', async () => {
    const doc = ocrCompleteDoc();
    const embed = jest
      .fn()
      .mockRejectedValueOnce(new EmbeddingTransientError('429'))
      .mockResolvedValueOnce([
        { vector: new Array(EMBEDDING_DIM).fill(0.3) },
      ]);
    const { handler, clauseRepo } = build({
      doc,
      extracted: [
        fakeExtracted('Indemnification. Vendor shall defend and indemnify Customer for IP claims.'),
      ],
      embedded: embed,
    });

    await handler.execute(new StartClauseExtractionCommand(doc.id.value));

    expect(embed).toHaveBeenCalledTimes(2);
    const saved = clauseRepo.saveForRun.mock.calls[0][1];
    expect(saved[0].embedding).toHaveLength(EMBEDDING_DIM);
  });
});
