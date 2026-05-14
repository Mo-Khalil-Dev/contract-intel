import { DocumentId } from './document-id.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

describe('DocumentId', () => {
  it('mints a fresh UUID via create()', () => {
    const a = DocumentId.create();
    const b = DocumentId.create();
    expect(a.value).not.toEqual(b.value);
    expect(a.value).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('rehydrates a valid UUID via fromString()', () => {
    const id = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
    expect(id.value).toBe('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
  });

  it('rejects a non-UUID string', () => {
    expect(() => DocumentId.fromString('not-a-uuid')).toThrow(DomainException);
  });

  it('equality is value-based', () => {
    const a = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
    const b = DocumentId.fromString('5a0eef1d-4433-454e-a1a5-7ca51bf48955');
    expect(a.equals(b)).toBe(true);
  });
});
