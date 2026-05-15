import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { Inject, Logger } from '@nestjs/common';
import { StartOcrProcessingCommand } from './start-ocr-processing.command';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import {
  DOCUMENT_TEXT_REPOSITORY,
  IDocumentTextRepository,
} from '../../domain/document-text.repository';
import { IOcrService, OCR_SERVICE } from '../../domain/ports/ocr-service.port';
import {
  IStorageService,
  STORAGE_SERVICE,
} from '../../domain/ports/storage-service.port';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { ConfidenceScore } from '../../domain/value-objects/confidence-score.vo';
import { Language } from '../../domain/value-objects/language.vo';
import { OcrDriver } from '../../domain/value-objects/ocr-driver.vo';
import { PageText } from '../../domain/value-objects/page-text.vo';
import { ProcessingStatusValue } from '../../domain/value-objects/processing-status.vo';
import { TextQualityScore } from '../../domain/value-objects/text-quality-score.vo';
import { Document } from '../../domain/document.aggregate';
import { DocumentText } from '../../domain/document-text.aggregate';
import { OcrPermanentError, OcrTransientError } from '../ocr/ocr-errors';
import { ApplicationException } from '../../../../shared/exceptions/app-error';
import type { OcrOutput } from '../../domain/ports/ocr-service.port';

/**
 * Runs the OCR pipeline for a Document already in `processing` state.
 *
 * Two callers transition the aggregate into `processing` before dispatching
 * this command:
 *   - `DocumentUploadCompletedHandler` (first run, on upload completion).
 *   - `RetryOcrProcessingHandler` (user-initiated retry from `ocr_failed`).
 *
 * The handler itself is **idempotent on the transition** — if it sees a
 * Document still in `not_started` (no upstream transition happened), it
 * calls `startProcessing()` itself. Anything else is rejected.
 *
 * Retry policy: 3 attempts with exponential backoff (1s, 4s, 16s) for
 * `OcrTransientError`. `OcrPermanentError` short-circuits to `ocr_failed`.
 */
@CommandHandler(StartOcrProcessingCommand)
export class StartOcrProcessingHandler
  implements ICommandHandler<StartOcrProcessingCommand, void>
{
  private static readonly RETRY_DELAYS_MS = [1000, 4000, 16000];
  private readonly logger = new Logger(StartOcrProcessingHandler.name);

  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    @Inject(DOCUMENT_TEXT_REPOSITORY)
    private readonly documentTexts: IDocumentTextRepository,
    @Inject(OCR_SERVICE) private readonly ocr: IOcrService,
    @Inject(STORAGE_SERVICE) private readonly storage: IStorageService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(command: StartOcrProcessingCommand): Promise<void> {
    const documentId = DocumentId.fromString(command.documentId);
    const document = await this.documents.findById(documentId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${command.documentId} not found`,
        404,
      );
    }

    // Self-heal the transition for the upload-completed path. The retry
    // path has already moved us into `processing`, so we leave it alone.
    if (document.processingStatus.value === ProcessingStatusValue.NOT_STARTED) {
      document.startProcessing();
      await this.documents.save(document);
      this.eventBus.publishAll(document.pullDomainEvents());
    } else if (
      document.processingStatus.value !== ProcessingStatusValue.PROCESSING
    ) {
      throw new ApplicationException(
        'INVALID_OCR_STATE',
        `Cannot run OCR pipeline from processingStatus '${document.processingStatus.value}'`,
        409,
      );
    }

    // Run the pipeline with retry. We rebuild a fresh stream each attempt
    // because Readable streams aren't re-consumable.
    let lastTransient: OcrTransientError | undefined;
    for (let attempt = 0; attempt < StartOcrProcessingHandler.RETRY_DELAYS_MS.length + 1; attempt++) {
      if (attempt > 0) {
        await this.sleep(StartOcrProcessingHandler.RETRY_DELAYS_MS[attempt - 1]);
        this.logger.log(
          `OCR retry ${attempt}/${StartOcrProcessingHandler.RETRY_DELAYS_MS.length} for document ${command.documentId}`,
        );
      }

      try {
        const source = await this.storage.openReadStream(document.storageKey);
        const result = await this.ocr.extractText({
          documentId: command.documentId,
          source,
          mimeType: 'application/pdf',
          languages: ['en'],
        });
        await this.onSuccess(document, result);
        return;
      } catch (err) {
        if (err instanceof OcrPermanentError) {
          await this.onPermanentFailure(document, err);
          return;
        }
        if (err instanceof OcrTransientError) {
          lastTransient = err;
          continue;
        }
        // Unknown error — treat as permanent so we don't loop forever.
        const reason = err instanceof Error ? err.message : 'unknown_error';
        await this.onPermanentFailure(
          document,
          new OcrPermanentError('internal_error', reason),
        );
        return;
      }
    }

    // Retries exhausted.
    await this.onPermanentFailure(
      document,
      new OcrPermanentError(
        'transient_exhausted',
        lastTransient?.message ?? 'OCR retries exhausted',
      ),
    );
  }

  private async onSuccess(document: Document, result: OcrOutput): Promise<void> {
    const pages = result.pages.map((p) =>
      PageText.create({
        pageNumber: p.pageNumber,
        text: p.text,
        confidence: ConfidenceScore.fromNumber(p.confidence),
        textQualityScore: TextQualityScore.fromNumber(p.textQualityScore),
        driver: OcrDriver.fromValue(p.driver),
      }),
    );
    const textArtifact = DocumentText.fromOcrOutput({
      documentId: document.id,
      text: result.text,
      pages,
      language: Language.fromCode(result.language),
    });
    await this.documentTexts.save(textArtifact);

    document.completeProcessing({
      driver: result.driver,
      language: result.language,
      confidence: result.confidence,
      pageCount: result.pages.length,
    });
    await this.documents.save(document);
    this.eventBus.publishAll(document.pullDomainEvents());
  }

  private async onPermanentFailure(
    document: Document,
    err: OcrPermanentError,
  ): Promise<void> {
    document.failProcessing(err.reason);
    await this.documents.save(document);
    this.eventBus.publishAll(document.pullDomainEvents());
  }

  /** Indirection so tests can stub out the wait without fake timers. */
  protected sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
