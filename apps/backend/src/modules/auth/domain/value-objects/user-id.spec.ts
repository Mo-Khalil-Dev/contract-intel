import { UserId } from './user-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('UserId', () => {
  it('generates a new UUID via create()', () => {
    const id = UserId.create();

    expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('generates unique ids', () => {
    const a = UserId.create();
    const b = UserId.create();

    expect(a.value).not.toBe(b.value);
  });

  it('accepts a valid UUID via fromString()', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = UserId.fromString(raw);

    expect(id.value).toBe(raw);
  });

  it('rejects a non-UUID string', () => {
    expect(() => UserId.fromString('not-a-uuid')).toThrow(DomainException);
  });

  it('equals another UserId with the same value', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    expect(UserId.fromString(raw).equals(UserId.fromString(raw))).toBe(true);
  });

  it('does not equal a UserId with a different value', () => {
    expect(UserId.create().equals(UserId.create())).toBe(false);
  });
});
