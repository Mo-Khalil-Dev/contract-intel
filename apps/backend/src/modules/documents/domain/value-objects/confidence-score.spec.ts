import { ConfidenceScore } from './confidence-score.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ConfidenceScore', () => {
  it('accepts 0 and 1 (inclusive boundaries)', () => {
    expect(ConfidenceScore.fromNumber(0).value).toBe(0);
    expect(ConfidenceScore.fromNumber(1).value).toBe(1);
  });

  it('accepts mid-range values', () => {
    expect(ConfidenceScore.fromNumber(0.85).value).toBe(0.85);
  });

  it('rejects values below 0', () => {
    expect(() => ConfidenceScore.fromNumber(-0.0001)).toThrow(DomainException);
  });

  it('rejects values above 1', () => {
    expect(() => ConfidenceScore.fromNumber(1.0001)).toThrow(DomainException);
  });

  it('rejects NaN', () => {
    expect(() => ConfidenceScore.fromNumber(NaN)).toThrow(DomainException);
  });

  it('rejects Infinity', () => {
    expect(() => ConfidenceScore.fromNumber(Infinity)).toThrow(DomainException);
    expect(() => ConfidenceScore.fromNumber(-Infinity)).toThrow(DomainException);
  });

  it('exposes certain() and zero() factories', () => {
    expect(ConfidenceScore.certain().value).toBe(1);
    expect(ConfidenceScore.zero().value).toBe(0);
  });
});
