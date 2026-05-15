import { PageText } from './page-text.vo';
import { ConfidenceScore } from './confidence-score.vo';
import { TextQualityScore } from './text-quality-score.vo';
import { OcrDriver } from './ocr-driver.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

const validParams = () => ({
  pageNumber: 1,
  text: 'Section 1. Indemnification.',
  confidence: ConfidenceScore.fromNumber(0.97),
  textQualityScore: TextQualityScore.fromNumber(0.85),
  driver: OcrDriver.nativePdf(),
});

describe('PageText', () => {
  it('constructs a valid page', () => {
    const p = PageText.create(validParams());
    expect(p.pageNumber).toBe(1);
    expect(p.text).toBe('Section 1. Indemnification.');
    expect(p.driver.value).toBe('native_pdf');
    expect(p.charCount).toBe('Section 1. Indemnification.'.length);
  });

  it('accepts empty text (blank page)', () => {
    const p = PageText.create({ ...validParams(), text: '' });
    expect(p.charCount).toBe(0);
  });

  it('rejects pageNumber < 1', () => {
    expect(() => PageText.create({ ...validParams(), pageNumber: 0 })).toThrow(
      DomainException,
    );
  });

  it('rejects non-integer pageNumber', () => {
    expect(() => PageText.create({ ...validParams(), pageNumber: 1.5 })).toThrow(
      DomainException,
    );
  });

  it("rejects 'hybrid' at the page level", () => {
    expect(() =>
      PageText.create({ ...validParams(), driver: OcrDriver.hybrid() }),
    ).toThrow(/hybrid is document-level only/);
  });
});
