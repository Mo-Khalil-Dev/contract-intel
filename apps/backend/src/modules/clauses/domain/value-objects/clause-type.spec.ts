import { ClauseType, ClauseTypeValue } from './clause-type.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ClauseType', () => {
  it('accepts every value in the 15-value taxonomy', () => {
    for (const v of Object.values(ClauseTypeValue)) {
      expect(ClauseType.fromValue(v).value).toBe(v);
    }
  });

  it('rejects unknown types', () => {
    expect(() => ClauseType.fromValue('indemnity')).toThrow(DomainException);
    expect(() => ClauseType.fromValue('')).toThrow(DomainException);
  });

  it('has exactly 15 values', () => {
    expect(Object.values(ClauseTypeValue)).toHaveLength(15);
  });
});
