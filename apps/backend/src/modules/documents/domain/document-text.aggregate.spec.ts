import { DocumentText } from './document-text.aggregate';
import { ConfidenceScore } from './value-objects/confidence-score.vo';
import { DocumentId } from './value-objects/document-id.vo';
import { Language } from './value-objects/language.vo';
import { OcrDriver, OcrDriverValue } from './value-objects/ocr-driver.vo';
import { PageText } from './value-objects/page-text.vo';
import { TextQualityScore } from './value-objects/text-quality-score.vo';
import { DomainException } from '../../../shared/exceptions/app-error';

function makePage(params: {
  pageNumber: number;
  text?: string;
  confidence?: number;
  driver?: OcrDriver;
}): PageText {
  return PageText.create({
    pageNumber: params.pageNumber,
    text: params.text ?? 'lorem ipsum',
    confidence: ConfidenceScore.fromNumber(params.confidence ?? 1),
    textQualityScore: TextQualityScore.fromNumber(0.9),
    driver: params.driver ?? OcrDriver.nativePdf(),
  });
}

describe('DocumentText.fromOcrOutput', () => {
  const documentId = DocumentId.create();

  it('builds a valid aggregate from one page', () => {
    const doc = DocumentText.fromOcrOutput({
      documentId,
      text: 'lorem ipsum',
      pages: [makePage({ pageNumber: 1 })],
      language: Language.fromCode('en'),
    });

    expect(doc.documentId.equals(documentId)).toBe(true);
    expect(doc.pageCount).toBe(1);
    expect(doc.driver.value).toBe(OcrDriverValue.NATIVE_PDF);
    expect(doc.confidence.value).toBe(1);
    expect(doc.minPageConfidence.value).toBe(1);
  });

  it('rejects an empty pages array', () => {
    expect(() =>
      DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [],
        language: Language.fromCode('en'),
      }),
    ).toThrow(/at least one page/);
  });

  it('rejects non-contiguous page numbers', () => {
    expect(() =>
      DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [makePage({ pageNumber: 1 }), makePage({ pageNumber: 3 })],
        language: Language.fromCode('en'),
      }),
    ).toThrow(DomainException);
  });

  describe('document-level driver', () => {
    it('native_pdf when all pages are native', () => {
      const doc = DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [
          makePage({ pageNumber: 1, driver: OcrDriver.nativePdf() }),
          makePage({ pageNumber: 2, driver: OcrDriver.nativePdf() }),
        ],
        language: Language.fromCode('en'),
      });
      expect(doc.driver.value).toBe(OcrDriverValue.NATIVE_PDF);
    });

    it('google_document_ai when all pages used cloud', () => {
      const doc = DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [
          makePage({ pageNumber: 1, driver: OcrDriver.googleDocumentAi() }),
          makePage({ pageNumber: 2, driver: OcrDriver.googleDocumentAi() }),
        ],
        language: Language.fromCode('en'),
      });
      expect(doc.driver.value).toBe(OcrDriverValue.GOOGLE_DOCUMENT_AI);
    });

    it('hybrid when pages span multiple drivers', () => {
      const doc = DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [
          makePage({ pageNumber: 1, driver: OcrDriver.nativePdf() }),
          makePage({ pageNumber: 2, driver: OcrDriver.googleDocumentAi() }),
        ],
        language: Language.fromCode('en'),
      });
      expect(doc.driver.value).toBe(OcrDriverValue.HYBRID);
    });
  });

  describe('confidence aggregation', () => {
    it('weights pages by character count', () => {
      // 1000-char page at 0.99, 10-char page at 0.50 → close to 0.99
      const doc = DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [
          makePage({ pageNumber: 1, text: 'x'.repeat(1000), confidence: 0.99 }),
          makePage({ pageNumber: 2, text: 'x'.repeat(10), confidence: 0.5 }),
        ],
        language: Language.fromCode('en'),
      });
      expect(doc.confidence.value).toBeGreaterThan(0.97);
      expect(doc.minPageConfidence.value).toBe(0.5);
    });

    it('defaults to 1.0 when every page is blank', () => {
      const doc = DocumentText.fromOcrOutput({
        documentId,
        text: '',
        pages: [
          makePage({ pageNumber: 1, text: '', confidence: 1 }),
          makePage({ pageNumber: 2, text: '', confidence: 1 }),
        ],
        language: Language.fromCode('en'),
      });
      expect(doc.confidence.value).toBe(1);
    });
  });
});
