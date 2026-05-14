import { UploadStatus, UploadStatusValue } from './upload-status.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('UploadStatus', () => {
  const pending = UploadStatus.pending();
  const uploading = UploadStatus.fromValue('uploading');
  const complete = UploadStatus.fromValue('complete');
  const failed = UploadStatus.fromValue('failed');

  it('pending() creates the initial state', () => {
    expect(pending.value).toBe(UploadStatusValue.PENDING);
  });

  it('rejects values outside the enum', () => {
    expect(() => UploadStatus.fromValue('processing')).toThrow(DomainException);
    expect(() => UploadStatus.fromValue('garbage')).toThrow(DomainException);
  });

  it('rejects "processing" — explicitly deferred for v1', () => {
    expect(() => UploadStatus.fromValue('processing')).toThrow(/processing/);
  });

  describe('transitions', () => {
    it('pending → uploading', () => {
      expect(pending.canTransitionTo(uploading)).toBe(true);
      expect(pending.transitionTo(uploading).value).toBe(UploadStatusValue.UPLOADING);
    });

    it('pending → failed', () => {
      expect(pending.canTransitionTo(failed)).toBe(true);
    });

    it('uploading → complete', () => {
      expect(uploading.canTransitionTo(complete)).toBe(true);
    });

    it('uploading → failed', () => {
      expect(uploading.canTransitionTo(failed)).toBe(true);
    });

    it('rejects pending → complete (must upload first)', () => {
      expect(pending.canTransitionTo(complete)).toBe(false);
      expect(() => pending.transitionTo(complete)).toThrow(DomainException);
    });

    it('rejects complete → anything (terminal)', () => {
      expect(complete.canTransitionTo(uploading)).toBe(false);
      expect(complete.canTransitionTo(failed)).toBe(false);
      expect(complete.isTerminal()).toBe(true);
    });

    it('rejects failed → anything (terminal)', () => {
      expect(failed.canTransitionTo(complete)).toBe(false);
      expect(failed.isTerminal()).toBe(true);
    });
  });
});
