import { TextQualityScore } from './text-quality-score.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('TextQualityScore', () => {
  it('accepts boundary values 0 and 1', () => {
    expect(TextQualityScore.fromNumber(0).value).toBe(0);
    expect(TextQualityScore.fromNumber(1).value).toBe(1);
  });

  it('accepts a typical native-extraction score', () => {
    expect(TextQualityScore.fromNumber(0.82).value).toBe(0.82);
  });

  it('rejects out-of-range values', () => {
    expect(() => TextQualityScore.fromNumber(-0.01)).toThrow(DomainException);
    expect(() => TextQualityScore.fromNumber(1.01)).toThrow(DomainException);
  });

  it('rejects NaN and Infinity', () => {
    expect(() => TextQualityScore.fromNumber(NaN)).toThrow(DomainException);
    expect(() => TextQualityScore.fromNumber(Infinity)).toThrow(DomainException);
  });

  describe('isBelow', () => {
    it('returns true when below the threshold', () => {
      expect(TextQualityScore.fromNumber(0.3).isBelow(0.5)).toBe(true);
    });

    it('returns false at exactly the threshold', () => {
      expect(TextQualityScore.fromNumber(0.5).isBelow(0.5)).toBe(false);
    });

    it('returns false when above the threshold', () => {
      expect(TextQualityScore.fromNumber(0.9).isBelow(0.5)).toBe(false);
    });
  });
});
