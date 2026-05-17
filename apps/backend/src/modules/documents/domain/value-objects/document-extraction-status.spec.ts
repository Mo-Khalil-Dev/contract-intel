import {
  DocumentExtractionStatus,
  DocumentExtractionStatusValue,
} from './document-extraction-status.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('DocumentExtractionStatus', () => {
  it('notStarted() is the start state', () => {
    expect(DocumentExtractionStatus.notStarted().value).toBe(
      DocumentExtractionStatusValue.NOT_STARTED,
    );
  });

  it('allows not_started → extracting', () => {
    const next = DocumentExtractionStatus.notStarted().transitionTo(
      DocumentExtractionStatus.fromValue('extracting'),
    );
    expect(next.value).toBe(DocumentExtractionStatusValue.EXTRACTING);
  });

  it('allows extracting → extraction_complete', () => {
    const s = DocumentExtractionStatus.fromValue('extracting').transitionTo(
      DocumentExtractionStatus.fromValue('extraction_complete'),
    );
    expect(s.value).toBe(DocumentExtractionStatusValue.EXTRACTION_COMPLETE);
  });

  it('allows extracting → extraction_failed', () => {
    const s = DocumentExtractionStatus.fromValue('extracting').transitionTo(
      DocumentExtractionStatus.fromValue('extraction_failed'),
    );
    expect(s.value).toBe(DocumentExtractionStatusValue.EXTRACTION_FAILED);
  });

  it('allows extraction_failed → extracting (retry)', () => {
    const s = DocumentExtractionStatus.fromValue('extraction_failed').transitionTo(
      DocumentExtractionStatus.fromValue('extracting'),
    );
    expect(s.value).toBe(DocumentExtractionStatusValue.EXTRACTING);
  });

  it('allows extraction_complete → extracting (re-extraction)', () => {
    const s = DocumentExtractionStatus.fromValue(
      'extraction_complete',
    ).transitionTo(DocumentExtractionStatus.fromValue('extracting'));
    expect(s.value).toBe(DocumentExtractionStatusValue.EXTRACTING);
  });

  it('rejects not_started → extraction_complete', () => {
    expect(() =>
      DocumentExtractionStatus.notStarted().transitionTo(
        DocumentExtractionStatus.fromValue('extraction_complete'),
      ),
    ).toThrow(DomainException);
  });

  it('rejects unknown values', () => {
    expect(() => DocumentExtractionStatus.fromValue('done')).toThrow(DomainException);
  });
});
