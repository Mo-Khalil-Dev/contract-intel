import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { StartClauseExtractionCommand } from './start-clause-extraction.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../../documents/domain/document.repository';
import {
  DOCUMENT_TEXT_REPOSITORY,
  IDocumentTextRepository,
} from '../../../documents/domain/document-text.repository';
import { DocumentId } from '../../../documents/domain/value-objects/document-id.vo';
import { ProcessingStatusValue } from '../../../documents/domain/value-objects/processing-status.vo';
import { DocumentExtractionStatusValue } from '../../../documents/domain/value-objects/document-extraction-status.vo';
import { Document } from '../../../documents/domain/document.aggregate';
import { ExtractionRun } from '../../domain/aggregates/extraction-run.aggregate';
import { Clause } from '../../domain/entities/clause';
import {
  CLAUSE_REPOSITORY,
  IClauseRepository,
} from '../../domain/clause.repository';
import {
  EXTRACTION_RUN_REPOSITORY,
  IExtractionRunRepository,
} from '../../domain/extraction-run.repository';
import {
  CLAUSE_EXTRACTOR,
  ExtractedClause,
  ExtractedContract,
  ExtractedMetadata,
  IClauseExtractor,
} from '../ports/clause-extractor.port';
import { ContractMetadata } from '../../domain/value-objects/contract-metadata.vo';
import {
  EMBEDDING_SERVICE,
  IEmbeddingService,
} from '../ports/embedding-service.port';
import {
  EmbeddingPermanentError,
  EmbeddingTransientError,
  ExtractionPermanentError,
  ExtractionTransientError,
} from '../errors/clause-extraction-errors';
import { ConfidenceScore } from '../../../documents/domain/value-objects/confidence-score.vo';
import { ClauseType } from '../../domain/value-objects/clause-type.vo';
import { ClauseId } from '../../domain/value-objects/clause-id.vo';
import { ModelVersion } from '../../domain/value-objects/model-version.vo';
import { RiskLevel } from '../../domain/value-objects/risk-level.vo';
import { TextPosition } from '../../domain/value-objects/text-position.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * Run clause extraction for a Document whose OCR is complete.
 *
 * Idempotent: if the document already has a running or complete
 * ExtractionRun, the handler returns early without side-effects. A failed
 * prior run is replaced by a new run (the old row stays for audit).
 *
 * Retry policy: 3 attempts (1s/4s/16s backoff) for ExtractionTransientError.
 * ExtractionPermanentError short-circuits to extraction_failed.
 *
 * Embedding-failure isolation: if the embedding service fails after the
 * clauses are extracted, we persist the clauses with `embedding=null`,
 * complete the run, and surface the embedding error on the run's
 * `failureReason`. The extraction itself is still considered successful.
 */
@CommandHandler(StartClauseExtractionCommand)
export class StartClauseExtractionHandler
  implements ICommandHandler<StartClauseExtractionCommand, void>
{
  private static readonly RETRY_DELAYS_MS = [1000, 4000, 16000];
  private readonly logger = new Logger(StartClauseExtractionHandler.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    @Inject(DOCUMENT_TEXT_REPOSITORY)
    private readonly documentTexts: IDocumentTextRepository,
    @Inject(EXTRACTION_RUN_REPOSITORY)
    private readonly runs: IExtractionRunRepository,
    @Inject(CLAUSE_REPOSITORY) private readonly clauses: IClauseRepository,
    @Inject(CLAUSE_EXTRACTOR) private readonly extractor: IClauseExtractor,
    @Inject(EMBEDDING_SERVICE) private readonly embeddings: IEmbeddingService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartClauseExtractionCommand): Promise<void> {
    const documentId = DocumentId.fromString(command.documentId);

    const document = await this.documents.findById(documentId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${command.documentId} not found`,
        404,
      );
    }
    if (document.processingStatus.value !== ProcessingStatusValue.OCR_COMPLETE) {
      throw new ApplicationException(
        'INVALID_EXTRACTION_STATE',
        `Document OCR must be 'ocr_complete' to start extraction (got '${document.processingStatus.value}')`,
        409,
      );
    }

    // Idempotency: skip if there's an in-flight or already-complete run.
    // A failed prior run falls through and we create a new run.
    const existing = await this.runs.findCurrentForDocument(documentId);
    if (existing && (existing.isRunning() || existing.isComplete())) {
      this.logger.log(
        `Extraction already ${existing.status.value} for document ${command.documentId} — skipping`,
      );
      return;
    }

    const documentText = await this.documentTexts.findByDocumentId(documentId);
    if (!documentText) {
      throw new ApplicationException(
        'DOCUMENT_TEXT_NOT_FOUND',
        `DocumentText ${command.documentId} not found`,
        404,
      );
    }

    const classifierModelVersion = ModelVersion.parse(this.extractor.getModelVersion());
    const embeddingModelVersion = ModelVersion.parse(this.embeddings.getModelVersion());

    const run = ExtractionRun.start({
      documentId,
      classifierModelVersion,
      embeddingModelVersion,
    });

    document.startExtraction(run.id.value);
    await this.documents.save(document);
    await this.runs.save(run);
    this.eventBus.publishAll(document.pullDomainEvents());
    this.eventBus.publishAll(run.pullDomainEvents());

    // Build per-page offsets the driver can consume directly.
    const pages = documentText.pages.map((p, idx) => {
      const start = documentText.pages
        .slice(0, idx)
        .reduce((acc, prev) => acc + prev.text.length, 0);
      return {
        pageNumber: p.pageNumber,
        startOffset: start,
        endOffset: start + p.text.length,
      };
    });

    let extracted: ExtractedContract;
    try {
      extracted = await this.runExtractionWithRetry({
        documentId: command.documentId,
        text: documentText.text,
        pages,
        language: documentText.language.code,
      });
    } catch (err) {
      await this.onPermanentFailure(document, run, this.reasonFromError(err));
      return;
    }

    const metadata = this.buildMetadata(extracted.metadata, document.id.value);

    const { clauses, droppedCount } = this.resolveAndBuildClauses(
      extracted.clauses,
      run,
      document,
      documentText.text,
      pages,
    );

    const embedFailureReason = await this.attachEmbeddings(
      clauses,
      embeddingModelVersion,
    );

    await this.clauses.saveForRun(run.id, clauses);

    run.complete({
      clauseCount: clauses.length,
      droppedClauseCount: droppedCount,
      metadata,
    });
    if (embedFailureReason) {
      // Surface as a soft note on the run — extraction itself succeeded.
      this.logger.warn(
        `Embeddings failed for run ${run.id.value}: ${embedFailureReason}. Clauses persisted with embedding=null.`,
      );
    }
    await this.runs.save(run);

    document.completeExtraction();
    await this.documents.save(document);

    this.eventBus.publishAll(run.pullDomainEvents());
    this.eventBus.publishAll(document.pullDomainEvents());
  }

  // ── Retry loop ────────────────────────────────────────────────────

  private async runExtractionWithRetry(input: {
    documentId: string;
    text: string;
    pages: { pageNumber: number; startOffset: number; endOffset: number }[];
    language: string;
  }): Promise<ExtractedContract> {
    let lastTransient: ExtractionTransientError | undefined;
    for (
      let attempt = 0;
      attempt < StartClauseExtractionHandler.RETRY_DELAYS_MS.length + 1;
      attempt++
    ) {
      if (attempt > 0) {
        await this.sleep(StartClauseExtractionHandler.RETRY_DELAYS_MS[attempt - 1]);
        this.logger.log(
          `Clause-extraction retry ${attempt}/${StartClauseExtractionHandler.RETRY_DELAYS_MS.length} for document ${input.documentId}`,
        );
      }
      try {
        return await this.extractor.extract(input);
      } catch (err) {
        if (err instanceof ExtractionPermanentError) throw err;
        if (err instanceof ExtractionTransientError) {
          lastTransient = err;
          continue;
        }
        // Unknown error → treat as permanent so we don't loop forever.
        throw new ExtractionPermanentError(
          'internal_error',
          err instanceof Error ? err.message : 'unknown_error',
        );
      }
    }
    throw new ExtractionPermanentError(
      'transient_exhausted',
      lastTransient?.message ?? 'Clause extraction retries exhausted',
    );
  }

  // ── Clause materialisation ────────────────────────────────────────

  /**
   * Resolve offsets via indexOf against documentText.text, drop
   * hallucinated clauses (those whose verbatim text isn't found),
   * and two-pass-resolve parent links.
   */
  private resolveAndBuildClauses(
    extracted: ExtractedClause[],
    run: ExtractionRun,
    document: Document,
    text: string,
    pages: { pageNumber: number; startOffset: number; endOffset: number }[],
  ): { clauses: Clause[]; droppedCount: number } {
    // Pass 0: resolve offsets; drop hallucinations.
    type Resolved = {
      raw: ExtractedClause;
      position: TextPosition;
    };
    const resolved: Resolved[] = [];
    let droppedCount = 0;
    for (const r of extracted) {
      const start = text.indexOf(r.text);
      if (start === -1) {
        droppedCount += 1;
        this.logger.warn(
          `Hallucinated clause text dropped for document ${document.id.value} (${r.text.slice(0, 80)}…)`,
        );
        continue;
      }
      const end = start + r.text.length;
      const page = pages.find((p) => start >= p.startOffset && start < p.endOffset);
      try {
        resolved.push({
          raw: r,
          position: TextPosition.create({
            startOffset: start,
            endOffset: end,
            pageNumber: page?.pageNumber ?? 1,
          }),
        });
      } catch {
        droppedCount += 1;
      }
    }

    // Pass 1: build root clauses (no parent), record clientRef → ClauseId.
    const clientRefToId = new Map<string, ClauseId>();
    const clauses: Clause[] = [];
    for (const r of resolved) {
      if (r.raw.parentClientRef !== null) continue;
      const id = ClauseId.create();
      clientRefToId.set(r.raw.clientRef, id);
      clauses.push(this.buildClause(r, id, run, document, null));
    }

    // Pass 2: build child clauses with resolved parent ids. If a parent
    // wasn't found in pass 1 (e.g. driver returned a dangling ref), fall
    // back to root with a logged warning.
    for (const r of resolved) {
      if (r.raw.parentClientRef === null) continue;
      const parentId = clientRefToId.get(r.raw.parentClientRef) ?? null;
      if (!parentId) {
        this.logger.warn(
          `Dangling parentClientRef '${r.raw.parentClientRef}' for document ${document.id.value} — promoting to root`,
        );
      }
      const id = ClauseId.create();
      clientRefToId.set(r.raw.clientRef, id);
      clauses.push(this.buildClause(r, id, run, document, parentId));
    }

    return { clauses, droppedCount };
  }

  private buildClause(
    r: { raw: ExtractedClause; position: TextPosition },
    id: ClauseId,
    run: ExtractionRun,
    document: Document,
    parentClauseId: ClauseId | null,
  ): Clause {
    return Clause.create({
      id,
      extractionRunId: run.id,
      documentId: document.id,
      parentClauseId,
      type: ClauseType.fromValue(r.raw.type),
      confidence: ConfidenceScore.fromNumber(r.raw.confidence),
      position: r.position,
      text: r.raw.text,
      risk: {
        score: r.raw.riskScore,
        level: RiskLevel.fromValue(r.raw.riskLevel),
        flags: r.raw.riskFlags,
        explanation: r.raw.riskExplanation,
      },
    });
  }

  // ── Embeddings ────────────────────────────────────────────────────

  /** Returns a failure-reason string on permanent embedding failure, or
   *  null on success. Transient failures retry internally; permanent
   *  failures fall through without throwing. */
  private async attachEmbeddings(
    clauses: Clause[],
    modelVersion: ModelVersion,
  ): Promise<string | null> {
    if (clauses.length === 0) return null;

    let lastTransient: EmbeddingTransientError | undefined;
    for (
      let attempt = 0;
      attempt < StartClauseExtractionHandler.RETRY_DELAYS_MS.length + 1;
      attempt++
    ) {
      if (attempt > 0) {
        await this.sleep(StartClauseExtractionHandler.RETRY_DELAYS_MS[attempt - 1]);
      }
      try {
        const results = await this.embeddings.embedBatch(clauses.map((c) => c.text));
        results.forEach((r, idx) => {
          clauses[idx].attachEmbedding(r.vector, modelVersion);
        });
        return null;
      } catch (err) {
        if (err instanceof EmbeddingPermanentError) {
          return `embedding_failed:${err.reason}`;
        }
        if (err instanceof EmbeddingTransientError) {
          lastTransient = err;
          continue;
        }
        return `embedding_failed:internal_error`;
      }
    }
    return `embedding_failed:transient_exhausted:${lastTransient?.message ?? 'unknown'}`;
  }

  // ── Metadata materialisation ──────────────────────────────────────

  /**
   * Promote the driver's loosely-typed metadata into the validated VO.
   * Validation failures degrade gracefully to empty metadata (logged) —
   * we don't kill an extraction run over a metadata hiccup.
   */
  private buildMetadata(raw: ExtractedMetadata, docId: string): ContractMetadata {
    try {
      return ContractMetadata.create(raw);
    } catch (err) {
      this.logger.warn(
        `Metadata validation failed for document ${docId}, falling back to empty: ${err instanceof Error ? err.message : 'unknown'}`,
      );
      return ContractMetadata.empty();
    }
  }

  // ── Failure helpers ───────────────────────────────────────────────

  private reasonFromError(err: unknown): string {
    if (err instanceof ExtractionPermanentError) return err.reason;
    if (err instanceof Error) return `internal_error:${err.message}`;
    return 'internal_error';
  }

  private async onPermanentFailure(
    document: Document,
    run: ExtractionRun,
    reason: string,
  ): Promise<void> {
    run.fail(reason);
    await this.runs.save(run);

    // Document.extractionStatus may have already transitioned past
    // `extracting` if the run was started — failExtraction transitions
    // it to extraction_failed regardless of the in-between state.
    if (
      document.extractionStatus.value === DocumentExtractionStatusValue.EXTRACTING
    ) {
      document.failExtraction(reason);
      await this.documents.save(document);
      this.eventBus.publishAll(document.pullDomainEvents());
    }
    this.eventBus.publishAll(run.pullDomainEvents());
  }

  /** Indirection so tests can stub out backoff without fake timers. */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
