import { FileSize, MAX_FILE_SIZE_BYTES, MIN_FILE_SIZE_BYTES } from './file-size.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('FileSize', () => {
  it('accepts a typical file size', () => {
    const size = FileSize.fromBytes(1_500_000);
    expect(size.bytes).toBe(1_500_000);
    expect(size.megabytes).toBeCloseTo(1.43, 1);
  });

  it('accepts exactly 1 byte (minimum)', () => {
    expect(() => FileSize.fromBytes(MIN_FILE_SIZE_BYTES)).not.toThrow();
  });

  it('accepts exactly 50 MB (max)', () => {
    expect(() => FileSize.fromBytes(MAX_FILE_SIZE_BYTES)).not.toThrow();
  });

  it('rejects 0 bytes', () => {
    expect(() => FileSize.fromBytes(0)).toThrow(DomainException);
  });

  it('rejects negative byte counts', () => {
    expect(() => FileSize.fromBytes(-1)).toThrow(DomainException);
  });

  it('rejects sizes above 50 MB with FILE_TOO_LARGE', () => {
    try {
      FileSize.fromBytes(MAX_FILE_SIZE_BYTES + 1);
      fail('expected FileSize to throw');
    } catch (e) {
      expect(e).toBeInstanceOf(DomainException);
      expect((e as DomainException).code).toBe('FILE_TOO_LARGE');
    }
  });

  it('rejects non-integer values', () => {
    expect(() => FileSize.fromBytes(1.5)).toThrow(DomainException);
  });

  it('rejects NaN / Infinity', () => {
    expect(() => FileSize.fromBytes(NaN)).toThrow(DomainException);
    expect(() => FileSize.fromBytes(Infinity)).toThrow(DomainException);
  });
});
