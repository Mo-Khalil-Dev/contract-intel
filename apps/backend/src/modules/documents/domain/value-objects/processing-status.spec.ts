import { ProcessingStatus, ProcessingStatusValue } from './processing-status.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ProcessingStatus', () => {
  const notStarted = ProcessingStatus.notStarted();
  const processing = ProcessingStatus.fromValue('processing');
  const ocrComplete = ProcessingStatus.fromValue('ocr_complete');
  const ocrFailed = ProcessingStatus.fromValue('ocr_failed');

  it('notStarted() creates the initial state', () => {
    expect(notStarted.value).toBe(ProcessingStatusValue.NOT_STARTED);
  });

  it('rejects values outside the enum', () => {
    expect(() => ProcessingStatus.fromValue('garbage')).toThrow(DomainException);
    expect(() => ProcessingStatus.fromValue('complete')).toThrow(DomainException);
  });

  describe('transitions', () => {
    it('not_started → processing', () => {
      expect(notStarted.canTransitionTo(processing)).toBe(true);
      expect(notStarted.transitionTo(processing).value).toBe(
        ProcessingStatusValue.PROCESSING,
      );
    });

    it('processing → ocr_complete', () => {
      expect(processing.canTransitionTo(ocrComplete)).toBe(true);
    });

    it('processing → ocr_failed', () => {
      expect(processing.canTransitionTo(ocrFailed)).toBe(true);
    });

    it('ocr_failed → processing (retry edge)', () => {
      expect(ocrFailed.canTransitionTo(processing)).toBe(true);
      expect(ocrFailed.transitionTo(processing).value).toBe(
        ProcessingStatusValue.PROCESSING,
      );
    });

    it('rejects not_started → ocr_complete (must pass through processing)', () => {
      expect(notStarted.canTransitionTo(ocrComplete)).toBe(false);
      expect(() => notStarted.transitionTo(ocrComplete)).toThrow(DomainException);
    });

    it('rejects not_started → ocr_failed', () => {
      expect(notStarted.canTransitionTo(ocrFailed)).toBe(false);
    });

    it('rejects processing → not_started', () => {
      expect(processing.canTransitionTo(notStarted)).toBe(false);
    });

    it('rejects ocr_complete → anything (terminal)', () => {
      expect(ocrComplete.canTransitionTo(processing)).toBe(false);
      expect(ocrComplete.canTransitionTo(ocrFailed)).toBe(false);
      expect(ocrComplete.isTerminal()).toBe(true);
    });

    it('ocr_failed is NOT terminal (retry allowed)', () => {
      expect(ocrFailed.isTerminal()).toBe(false);
    });

    it('rejects ocr_failed → ocr_complete (must go via processing)', () => {
      expect(ocrFailed.canTransitionTo(ocrComplete)).toBe(false);
    });
  });
});
