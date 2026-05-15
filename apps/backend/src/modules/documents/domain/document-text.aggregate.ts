import { AggregateRoot } from '../../../shared/domain/aggregate-root';
import { DomainException } from '../../../shared/exceptions/app-error';
import { ConfidenceScore } from './value-objects/confidence-score.vo';
import { DocumentId } from './value-objects/document-id.vo';
import { Language } from './value-objects/language.vo';
import { OcrDriver, OcrDriverValue } from './value-objects/ocr-driver.vo';
import { PageText } from './value-objects/page-text.vo';

interface DocumentTextProps {
  text: string;
  pages: PageText[];
  confidence: ConfidenceScore;
  minPageConfidence: ConfidenceScore;
  language: Language;
  driver: OcrDriver;
  extractedAt: Date;
}

/**
 * Per-document OCR artifact — one DocumentText per Document.
 *
 * The DocumentText aggregate stores extracted text, per-page metadata,
 * confidence scores, and the driver(s) used. Identity is the parent
 * DocumentId; there is no separate text id.
 *
 * The blob (full text + per-page text) lives in IStorageService; the Prisma
 * row carries only metadata. The mapper round-trips through this aggregate.
 */
export class DocumentText extends AggregateRoot<DocumentId> {
  private props: DocumentTextProps;

  private constructor(id: DocumentId, props: DocumentTextProps) {
    super(id);
    this.props = props;
  }

  /**
   * Build from a finished pipeline OcrOutput. Recomputes document-level
   * confidence and minPageConfidence from pages so the aggregate stays
   * the source of truth — callers can't pass inconsistent aggregates.
   */
  static fromOcrOutput(params: {
    documentId: DocumentId;
    text: string;
    pages: PageText[];
    language: Language;
    extractedAt?: Date;
  }): DocumentText {
    if (params.pages.length === 0) {
      throw new DomainException(
        'EMPTY_DOCUMENT_TEXT',
        'DocumentText must have at least one page',
      );
    }
    assertContiguousPages(params.pages);

    const driver = computeDocumentDriver(params.pages);
    const confidence = ConfidenceScore.fromNumber(
      weightedMeanConfidence(params.pages),
    );
    const minPageConfidence = ConfidenceScore.fromNumber(
      Math.min(...params.pages.map((p) => p.confidence.value)),
    );

    return new DocumentText(params.documentId, {
      text: params.text,
      pages: params.pages,
      confidence,
      minPageConfidence,
      language: params.language,
      driver,
      extractedAt: params.extractedAt ?? new Date(),
    });
  }

  static rehydrate(id: DocumentId, props: DocumentTextProps): DocumentText {
    return new DocumentText(id, props);
  }

  get documentId(): DocumentId {
    return this.id;
  }
  get text(): string {
    return this.props.text;
  }
  get pages(): readonly PageText[] {
    return this.props.pages;
  }
  get pageCount(): number {
    return this.props.pages.length;
  }
  get confidence(): ConfidenceScore {
    return this.props.confidence;
  }
  get minPageConfidence(): ConfidenceScore {
    return this.props.minPageConfidence;
  }
  get language(): Language {
    return this.props.language;
  }
  get driver(): OcrDriver {
    return this.props.driver;
  }
  get extractedAt(): Date {
    return this.props.extractedAt;
  }
}

// ── Helpers ─────────────────────────────────────────────────────────

function assertContiguousPages(pages: PageText[]): void {
  const sorted = [...pages].map((p) => p.pageNumber).sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    if (sorted[i] !== i + 1) {
      throw new DomainException(
        'NON_CONTIGUOUS_PAGES',
        `Pages must be a contiguous 1..N sequence (got ${sorted.join(', ')})`,
      );
    }
  }
}

function computeDocumentDriver(pages: PageText[]): OcrDriver {
  const drivers = new Set(pages.map((p) => p.driver.value));
  if (drivers.size === 1) {
    return OcrDriver.fromValue([...drivers][0] as string);
  }
  // Blank pages don't carry meaningful driver info, but at the page level
  // they reuse whichever driver the orchestrator emitted (commonly the
  // native extractor with empty text). Mixed pages → hybrid.
  return OcrDriver.fromValue(OcrDriverValue.HYBRID);
}

/**
 * Char-length-weighted mean of per-page confidences. A noisy single-char
 * cover page can't drag down a 100-page contract — weighting by text length
 * gives a faithful document-level summary. Empty pages contribute zero
 * weight (their confidence neither helps nor hurts the score).
 */
function weightedMeanConfidence(pages: PageText[]): number {
  let weightedSum = 0;
  let totalWeight = 0;
  for (const p of pages) {
    const weight = p.charCount;
    weightedSum += p.confidence.value * weight;
    totalWeight += weight;
  }
  // All-blank document — confidence is conventionally 1.0 (we extracted
  // everything there was to extract, which was nothing).
  return totalWeight === 0 ? 1 : weightedSum / totalWeight;
}
