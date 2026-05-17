import { ClauseId } from './clause-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('ClauseId', () => {
  it('create() produces a valid UUID', () => {
    const id = ClauseId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );
  });

  it('fromString accepts a valid UUID', () => {
    const uuid = '550e8400-e29b-41d4-a716-446655440000';
    expect(ClauseId.fromString(uuid).value).toBe(uuid);
  });

  it('fromString rejects non-UUID strings', () => {
    expect(() => ClauseId.fromString('not-a-uuid')).toThrow(DomainException);
  });

  it('two ids with same value are equal', () => {
    const a = ClauseId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const b = ClauseId.fromString('550e8400-e29b-41d4-a716-446655440000');
    expect(a.equals(b)).toBe(true);
  });
});
