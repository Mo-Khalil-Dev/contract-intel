import type { DocumentText as DocumentTextRow } from '@prisma/client';
import { DocumentText } from '../domain/document-text.aggregate';
import { ConfidenceScore } from '../domain/value-objects/confidence-score.vo';
import { DocumentId } from '../domain/value-objects/document-id.vo';
import { Language } from '../domain/value-objects/language.vo';
import { OcrDriver } from '../domain/value-objects/ocr-driver.vo';
import { PageText } from '../domain/value-objects/page-text.vo';
import { TextQualityScore } from '../domain/value-objects/text-quality-score.vo';

/**
 * Persisted blob shape (JSON stored at `{documentId}.text.json`).
 *
 * Kept loose (plain types, not VOs) because it crosses the trust
 * boundary at deserialization time. Round-trips through `toDomain`,
 * which runs every VO's validation again — a corrupt blob fails fast.
 */
export interface DocumentTextBlob {
  text: string;
  pages: Array<{
    pageNumber: number;
    text: string;
    confidence: number;
    textQualityScore: number;
    driver: 'native_pdf' | 'google_document_ai' | 'mock';
  }>;
  language: string;
  driver: string;
  confidence: number;
  minPageConfidence: number;
  extractedAt: string;
}

export class DocumentTextMapper {
  /**
   * Build the persistence pair (Prisma row + storage blob) for an aggregate
   * fresh out of the pipeline. Caller writes the blob first, then the row —
   * the row's `storageKey` is the source of truth for where the blob lives.
   */
  static toPersistence(
    text: DocumentText,
    storageKey: string,
  ): { row: DocumentTextRow; blob: DocumentTextBlob } {
    const blob: DocumentTextBlob = {
      text: text.text,
      pages: text.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        confidence: p.confidence.value,
        textQualityScore: p.textQualityScore.value,
        // The page-level driver enum on PageText excludes 'hybrid' — see VO.
        driver: p.driver.value as 'native_pdf' | 'google_document_ai' | 'mock',
      })),
      language: text.language.code,
      driver: text.driver.value,
      confidence: text.confidence.value,
      minPageConfidence: text.minPageConfidence.value,
      extractedAt: text.extractedAt.toISOString(),
    };

    const now = new Date();
    const row: DocumentTextRow = {
      documentId: text.documentId.value,
      storageKey,
      textLength: text.text.length,
      confidence: text.confidence.value,
      minPageConfidence: text.minPageConfidence.value,
      language: text.language.code,
      driver: text.driver.value,
      pageCount: text.pageCount,
      extractedAt: text.extractedAt,
      createdAt: now,
      updatedAt: now,
    };

    return { row, blob };
  }

  /**
   * Reconstruct the aggregate from a stored blob. The Prisma row is not
   * required for read — the blob is the authoritative copy. The row exists
   * for fast listing/filtering without touching storage.
   */
  static toDomain(documentId: string, blob: DocumentTextBlob): DocumentText {
    const pages = blob.pages.map((p) =>
      PageText.create({
        pageNumber: p.pageNumber,
        text: p.text,
        confidence: ConfidenceScore.fromNumber(p.confidence),
        textQualityScore: TextQualityScore.fromNumber(p.textQualityScore),
        driver: OcrDriver.fromValue(p.driver),
      }),
    );
    return DocumentText.rehydrate(DocumentId.fromString(documentId), {
      text: blob.text,
      pages,
      confidence: ConfidenceScore.fromNumber(blob.confidence),
      minPageConfidence: ConfidenceScore.fromNumber(blob.minPageConfidence),
      language: Language.fromCode(blob.language),
      driver: OcrDriver.fromValue(blob.driver),
      extractedAt: new Date(blob.extractedAt),
    });
  }

  /** Conventional storage key for the OCR text blob. */
  static storageKeyFor(documentId: DocumentId): string {
    return `${documentId.value}.text.json`;
  }
}
