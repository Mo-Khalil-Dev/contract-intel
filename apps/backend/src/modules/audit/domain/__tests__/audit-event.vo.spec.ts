import { AuditEventId } from '../audit-event-id.vo';
import { AuditAction, AuditActionEnum } from '../audit-action.vo';
import { ActorId } from '../actor-id.vo';
import { ResourceId } from '../resource-id.vo';
import { Checksum } from '../checksum.vo';
import { SequenceNumber } from '../sequence-number.vo';
import { DomainException } from '../../../../shared/exceptions/app-error';

// ── AuditEventId ─────────────────────────────────────────────────────────────

describe('AuditEventId', () => {
  it('creates a valid UUID', () => {
    const id = AuditEventId.create();
    expect(id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('creates unique IDs on each call', () => {
    const a = AuditEventId.create();
    const b = AuditEventId.create();
    expect(a.value).not.toBe(b.value);
  });

  it('accepts a valid UUID string', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const id = AuditEventId.fromString(raw);
    expect(id.value).toBe(raw);
  });

  it('rejects a non-UUID string', () => {
    expect(() => AuditEventId.fromString('not-a-uuid')).toThrow(DomainException);
  });

  it('rejects an empty string', () => {
    expect(() => AuditEventId.fromString('')).toThrow(DomainException);
  });

  it('toString returns the UUID value', () => {
    const id = AuditEventId.create();
    expect(id.toString()).toBe(id.value);
  });

  it('equals returns true for same value', () => {
    const raw = '550e8400-e29b-41d4-a716-446655440000';
    const a = AuditEventId.fromString(raw);
    const b = AuditEventId.fromString(raw);
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different values', () => {
    const a = AuditEventId.create();
    const b = AuditEventId.create();
    expect(a.equals(b)).toBe(false);
  });
});

// ── AuditAction ──────────────────────────────────────────────────────────────

describe('AuditAction', () => {
  it.each(Object.values(AuditActionEnum))('accepts valid action "%s"', (action) => {
    const vo = AuditAction.of(action);
    expect(vo.value).toBe(action);
  });

  it('creates from string for all valid actions', () => {
    for (const action of Object.values(AuditActionEnum)) {
      const vo = AuditAction.fromString(action);
      expect(vo.value).toBe(action);
    }
  });

  it('rejects an unknown action string', () => {
    expect(() => AuditAction.fromString('UNKNOWN_ACTION')).toThrow(DomainException);
  });

  it('rejects an empty string', () => {
    expect(() => AuditAction.fromString('')).toThrow(DomainException);
  });

  it('toString returns the action string', () => {
    const vo = AuditAction.of(AuditActionEnum.USER_LOGGED_IN);
    expect(vo.toString()).toBe('USER_LOGGED_IN');
  });

  it('equals returns true for same action', () => {
    const a = AuditAction.of(AuditActionEnum.DOCUMENT_UPLOADED);
    const b = AuditAction.of(AuditActionEnum.DOCUMENT_UPLOADED);
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different actions', () => {
    const a = AuditAction.of(AuditActionEnum.USER_LOGGED_IN);
    const b = AuditAction.of(AuditActionEnum.USER_LOGGED_OUT);
    expect(a.equals(b)).toBe(false);
  });
});

// ── ActorId ───────────────────────────────────────────────────────────────────

describe('ActorId', () => {
  it('accepts a non-empty string', () => {
    const vo = ActorId.fromString('user-123');
    expect(vo.value).toBe('user-123');
  });

  it('trims surrounding whitespace', () => {
    const vo = ActorId.fromString('  user-123  ');
    expect(vo.value).toBe('user-123');
  });

  it('rejects an empty string', () => {
    expect(() => ActorId.fromString('')).toThrow(DomainException);
  });

  it('rejects a whitespace-only string', () => {
    expect(() => ActorId.fromString('   ')).toThrow(DomainException);
  });

  it('toString returns the value', () => {
    const vo = ActorId.fromString('actor-abc');
    expect(vo.toString()).toBe('actor-abc');
  });

  it('equals returns true for same value', () => {
    const a = ActorId.fromString('actor-1');
    const b = ActorId.fromString('actor-1');
    expect(a.equals(b)).toBe(true);
  });

  it('equals returns false for different values', () => {
    const a = ActorId.fromString('actor-1');
    const b = ActorId.fromString('actor-2');
    expect(a.equals(b)).toBe(false);
  });
});

// ── ResourceId ────────────────────────────────────────────────────────────────

describe('ResourceId', () => {
  it('accepts a non-empty string', () => {
    const vo = ResourceId.fromString('doc-456');
    expect(vo.value).toBe('doc-456');
  });

  it('trims surrounding whitespace', () => {
    const vo = ResourceId.fromString('  doc-456  ');
    expect(vo.value).toBe('doc-456');
  });

  it('rejects an empty string', () => {
    expect(() => ResourceId.fromString('')).toThrow(DomainException);
  });

  it('rejects a whitespace-only string', () => {
    expect(() => ResourceId.fromString('   ')).toThrow(DomainException);
  });

  it('toString returns the value', () => {
    const vo = ResourceId.fromString('resource-xyz');
    expect(vo.toString()).toBe('resource-xyz');
  });
});

// ── SequenceNumber ────────────────────────────────────────────────────────────

describe('SequenceNumber', () => {
  it('accepts zero', () => {
    const vo = SequenceNumber.fromNumber(0);
    expect(vo.value).toBe(0);
  });

  it('accepts positive integers', () => {
    const vo = SequenceNumber.fromNumber(42);
    expect(vo.value).toBe(42);
  });

  it('rejects negative numbers', () => {
    expect(() => SequenceNumber.fromNumber(-1)).toThrow(DomainException);
  });

  it('rejects non-integer values', () => {
    expect(() => SequenceNumber.fromNumber(1.5)).toThrow(DomainException);
  });

  it('rejects NaN', () => {
    expect(() => SequenceNumber.fromNumber(NaN)).toThrow(DomainException);
  });

  it('isAfter returns true when this > other', () => {
    const a = SequenceNumber.fromNumber(5);
    const b = SequenceNumber.fromNumber(3);
    expect(a.isAfter(b)).toBe(true);
  });

  it('isAfter returns false when this === other', () => {
    const a = SequenceNumber.fromNumber(5);
    const b = SequenceNumber.fromNumber(5);
    expect(a.isAfter(b)).toBe(false);
  });

  it('isAfter returns false when this < other', () => {
    const a = SequenceNumber.fromNumber(3);
    const b = SequenceNumber.fromNumber(5);
    expect(a.isAfter(b)).toBe(false);
  });

  it('toString returns the numeric string', () => {
    const vo = SequenceNumber.fromNumber(7);
    expect(vo.toString()).toBe('7');
  });
});

// ── Checksum ──────────────────────────────────────────────────────────────────

describe('Checksum', () => {
  const PARAMS = {
    id: '550e8400-e29b-41d4-a716-446655440000',
    timestamp: new Date('2026-01-01T00:00:00.000Z'),
    actorId: 'user-123',
    action: 'USER_LOGGED_IN',
    resourceId: 'session-abc',
  };

  it('computes a 64-character hex string', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.value).toMatch(/^[a-f0-9]{64}$/);
  });

  it('produces the same hash for the same inputs', () => {
    const a = Checksum.compute(PARAMS);
    const b = Checksum.compute(PARAMS);
    expect(a.value).toBe(b.value);
  });

  it('produces different hashes for different ids', () => {
    const a = Checksum.compute({ ...PARAMS, id: 'id-1' });
    const b = Checksum.compute({ ...PARAMS, id: 'id-2' });
    expect(a.value).not.toBe(b.value);
  });

  it('produces different hashes for different timestamps', () => {
    const a = Checksum.compute({ ...PARAMS, timestamp: new Date('2026-01-01T00:00:00.000Z') });
    const b = Checksum.compute({ ...PARAMS, timestamp: new Date('2026-01-02T00:00:00.000Z') });
    expect(a.value).not.toBe(b.value);
  });

  it('produces different hashes for different actorIds', () => {
    const a = Checksum.compute({ ...PARAMS, actorId: 'actor-1' });
    const b = Checksum.compute({ ...PARAMS, actorId: 'actor-2' });
    expect(a.value).not.toBe(b.value);
  });

  it('produces different hashes for different actions', () => {
    const a = Checksum.compute({ ...PARAMS, action: 'USER_LOGGED_IN' });
    const b = Checksum.compute({ ...PARAMS, action: 'USER_LOGGED_OUT' });
    expect(a.value).not.toBe(b.value);
  });

  it('produces different hashes for different resourceIds', () => {
    const a = Checksum.compute({ ...PARAMS, resourceId: 'res-1' });
    const b = Checksum.compute({ ...PARAMS, resourceId: 'res-2' });
    expect(a.value).not.toBe(b.value);
  });

  it('verify returns true for matching fields', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.verify(PARAMS)).toBe(true);
  });

  it('verify returns false when id is tampered', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.verify({ ...PARAMS, id: 'tampered-id' })).toBe(false);
  });

  it('verify returns false when actorId is tampered', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.verify({ ...PARAMS, actorId: 'tampered-actor' })).toBe(false);
  });

  it('verify returns false when action is tampered', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.verify({ ...PARAMS, action: 'TAMPERED_ACTION' })).toBe(false);
  });

  it('verify returns false when resourceId is tampered', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.verify({ ...PARAMS, resourceId: 'tampered-resource' })).toBe(false);
  });

  it('verify returns false when timestamp is tampered', () => {
    const cs = Checksum.compute(PARAMS);
    expect(cs.verify({ ...PARAMS, timestamp: new Date('2099-01-01T00:00:00.000Z') })).toBe(false);
  });

  it('fromString accepts a valid 64-char hex string', () => {
    const cs = Checksum.compute(PARAMS);
    const restored = Checksum.fromString(cs.value);
    expect(restored.value).toBe(cs.value);
  });

  it('fromString rejects a string that is not 64 hex chars', () => {
    expect(() => Checksum.fromString('not-a-checksum')).toThrow(DomainException);
  });

  it('fromString rejects uppercase hex', () => {
    const upper = 'A'.repeat(64);
    expect(() => Checksum.fromString(upper)).toThrow(DomainException);
  });
});
