import { DocumentType, DocumentTypeValue } from './document-type.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('DocumentType', () => {
  describe('fromValue', () => {
    it('accepts PDF', () => {
      expect(DocumentType.fromValue('PDF').value).toBe(DocumentTypeValue.PDF);
    });

    it('rejects DOCX (deferred until extraction pipeline ships)', () => {
      expect(() => DocumentType.fromValue('DOCX')).toThrow(DomainException);
    });

    it('rejects unknown values', () => {
      expect(() => DocumentType.fromValue('xls')).toThrow(DomainException);
    });
  });

  describe('fromMimeType', () => {
    it('maps application/pdf to PDF', () => {
      expect(DocumentType.fromMimeType('application/pdf').value).toBe(DocumentTypeValue.PDF);
    });

    it('is case-insensitive', () => {
      expect(DocumentType.fromMimeType('Application/PDF').value).toBe(DocumentTypeValue.PDF);
    });

    it('rejects DOCX MIME type in v1', () => {
      expect(() =>
        DocumentType.fromMimeType(
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        ),
      ).toThrow(DomainException);
    });
  });

  describe('fromFilename', () => {
    it('extracts a PDF extension', () => {
      expect(DocumentType.fromFilename('contract.pdf').value).toBe(DocumentTypeValue.PDF);
      expect(DocumentType.fromFilename('CONTRACT.PDF').value).toBe(DocumentTypeValue.PDF);
    });

    it('rejects unknown extensions', () => {
      expect(() => DocumentType.fromFilename('contract.docx')).toThrow(DomainException);
      expect(() => DocumentType.fromFilename('readme.md')).toThrow(DomainException);
    });

    it('rejects a filename with no extension', () => {
      expect(() => DocumentType.fromFilename('no-extension')).toThrow(DomainException);
    });
  });

  it('exposes a lowercase extension', () => {
    expect(DocumentType.fromValue('PDF').extension).toBe('pdf');
  });
});
