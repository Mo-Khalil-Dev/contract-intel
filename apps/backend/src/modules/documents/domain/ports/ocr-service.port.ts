import type { Readable } from 'stream';

export const OCR_SERVICE = Symbol('OCR_SERVICE');

/**
 * Outbound port to the OCR pipeline.
 *
 * The single in-tree implementation in Phase 7 is `ClassifierThenRouter`
 * (Task 7.3): it classifies pages, runs the native extractor on digital
 * pages and the cloud driver on scanned ones, applies the text-quality
 * demotion, and merges results. Callers don't see any of that — they
 * just hand it a PDF stream and get an `OcrOutput` back.
 *
 * Errors must be one of `OcrTransientError` or `OcrPermanentError`
 * (see `application/ocr/ocr-errors.ts`). The handler's retry loop
 * relies on that taxonomy.
 */
export interface IOcrService {
  extractText(input: OcrInput): Promise<OcrOutput>;
}

export interface OcrInput {
  documentId: string;
  /** Streamed from `IStorageService`. The driver consumes it once. */
  source: Readable;
  mimeType: 'application/pdf';
  /** Allowlist of acceptable languages (ISO 639-1). Non-matching docs
   *  fail with `OcrPermanentError('unsupported_language:<code>')`. */
  languages: string[];
  /**
   * Hints used by the Document AI driver to pick between the sync
   * (`processDocument`, ≤15 pages / ≤20 MB) and batch (`batchProcessDocuments`)
   * paths. Optional — when absent, the driver assumes batch.
   */
  pageCountHint?: number;
  byteSizeHint?: number;
}

export interface OcrPageOutput {
  pageNumber: number;
  text: string;
  /** 0..1. Driver-specific semantics — see `OCR_CONF_THRESHOLD` env note. */
  confidence: number;
  /** 0..1. Dictionary-word ratio + Unicode-block sanity + replacement-char density. */
  textQualityScore: number;
  driver: 'native_pdf' | 'google_document_ai' | 'mock';
}

export interface OcrOutput {
  text: string;
  pages: OcrPageOutput[];
  /** Char-length-weighted mean across pages. */
  confidence: number;
  minPageConfidence: number;
  language: string;
  /** Document-level driver. `hybrid` when pages span multiple drivers. */
  driver: 'native_pdf' | 'google_document_ai' | 'mock' | 'hybrid';
}
