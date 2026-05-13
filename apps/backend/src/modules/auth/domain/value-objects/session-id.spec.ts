import { SessionId } from './session-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('SessionId', () => {
  it('generates a valid UUID', () => {
    const id = SessionId.create();

    expect(id.value).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i);
  });

  it('accepts a valid UUID via fromString()', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    expect(SessionId.fromString(raw).value).toBe(raw);
  });

  it('rejects a non-UUID string', () => {
    expect(() => SessionId.fromString('abc')).toThrow(DomainException);
  });
});
