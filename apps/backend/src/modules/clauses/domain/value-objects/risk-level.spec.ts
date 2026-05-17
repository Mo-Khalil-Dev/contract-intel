import { RiskLevel, RiskLevelValue } from './risk-level.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('RiskLevel', () => {
  it.each([
    [0, RiskLevelValue.LOW],
    [25, RiskLevelValue.LOW],
    [26, RiskLevelValue.MEDIUM],
    [50, RiskLevelValue.MEDIUM],
    [51, RiskLevelValue.HIGH],
    [75, RiskLevelValue.HIGH],
    [76, RiskLevelValue.CRITICAL],
    [100, RiskLevelValue.CRITICAL],
  ])('fromScore(%i) → %s', (score, expected) => {
    expect(RiskLevel.fromScore(score).value).toBe(expected);
  });

  it('rejects negative scores', () => {
    expect(() => RiskLevel.fromScore(-1)).toThrow(DomainException);
  });

  it('rejects scores above 100', () => {
    expect(() => RiskLevel.fromScore(101)).toThrow(DomainException);
  });

  it('rejects non-integer scores', () => {
    expect(() => RiskLevel.fromScore(50.5)).toThrow(DomainException);
    expect(() => RiskLevel.fromScore(NaN)).toThrow(DomainException);
  });

  it('fromValue accepts each enum value', () => {
    for (const v of Object.values(RiskLevelValue)) {
      expect(RiskLevel.fromValue(v).value).toBe(v);
    }
  });

  it('fromValue rejects unknown levels', () => {
    expect(() => RiskLevel.fromValue('extreme')).toThrow(DomainException);
  });
});
