import { OcrDriver, OcrDriverValue } from './ocr-driver.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('OcrDriver', () => {
  it('exposes a factory per enum value', () => {
    expect(OcrDriver.nativePdf().value).toBe(OcrDriverValue.NATIVE_PDF);
    expect(OcrDriver.googleDocumentAi().value).toBe(OcrDriverValue.GOOGLE_DOCUMENT_AI);
    expect(OcrDriver.mock().value).toBe(OcrDriverValue.MOCK);
    expect(OcrDriver.hybrid().value).toBe(OcrDriverValue.HYBRID);
  });

  it('round-trips through fromValue', () => {
    expect(OcrDriver.fromValue('native_pdf').value).toBe(OcrDriverValue.NATIVE_PDF);
    expect(OcrDriver.fromValue('google_document_ai').value).toBe(
      OcrDriverValue.GOOGLE_DOCUMENT_AI,
    );
  });

  it('rejects unknown values', () => {
    expect(() => OcrDriver.fromValue('tesseract')).toThrow(DomainException);
    expect(() => OcrDriver.fromValue('')).toThrow(DomainException);
  });

  describe('isPageLevel', () => {
    it('returns true for concrete drivers', () => {
      expect(OcrDriver.nativePdf().isPageLevel()).toBe(true);
      expect(OcrDriver.googleDocumentAi().isPageLevel()).toBe(true);
      expect(OcrDriver.mock().isPageLevel()).toBe(true);
    });

    it('returns false for hybrid (document-level only)', () => {
      expect(OcrDriver.hybrid().isPageLevel()).toBe(false);
    });
  });
});
