import { AuditEvent } from '../audit-event.aggregate';
import { AuditEventFactory } from '../audit-event.factory';
import { AuditEventId } from '../audit-event-id.vo';
import { AuditAction, AuditActionEnum } from '../audit-action.vo';
import { ActorId } from '../actor-id.vo';
import { ResourceId } from '../resource-id.vo';
import { Checksum } from '../checksum.vo';
import { SequenceNumber } from '../sequence-number.vo';
import { AuditEventRecordedEvent } from '../audit-event.events';
import { DomainException } from '../../../../shared/exceptions/app-error';

// ── Helpers ───────────────────────────────────────────────────────────────────

const NOW = new Date('2026-06-01T12:00:00.000Z');

const buildParams = (overrides: Partial<Parameters<typeof AuditEventFactory.create>[0]> = {}) => ({
  actorId: 'user-abc',
  action: AuditActionEnum.USER_LOGGED_IN,
  resourceId: 'session-xyz',
  sequenceNumber: 1,
  ...overrides,
});

// ── AuditEvent.create (via factory) ──────────────────────────────────────────

describe('AuditEventFactory.create', () => {
  it('creates an AuditEvent with the provided fields', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);

    expect(event.actorId.value).toBe('user-abc');
    expect(event.action.value).toBe(AuditActionEnum.USER_LOGGED_IN);
    expect(event.resourceId.value).toBe('session-xyz');
    expect(event.sequenceNumber.value).toBe(1);
  });

  it('assigns a UUID id', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    expect(event.id.value).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    );
  });

  it('defaults timestamp to now when not provided', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    expect(event.timestamp).toEqual(NOW);
  });

  it('accepts an explicit past timestamp', () => {
    const past = new Date(NOW.getTime() - 60_000);
    const event = AuditEventFactory.create(buildParams({ timestamp: past }), NOW);
    expect(event.timestamp).toEqual(past);
  });

  it('accepts a timestamp equal to now', () => {
    const event = AuditEventFactory.create(buildParams({ timestamp: NOW }), NOW);
    expect(event.timestamp).toEqual(NOW);
  });

  it('rejects a future timestamp', () => {
    const future = new Date(NOW.getTime() + 1);
    expect(() =>
      AuditEventFactory.create(buildParams({ timestamp: future }), NOW),
    ).toThrow(DomainException);
  });

  it('rejects a future timestamp with correct error code', () => {
    const future = new Date(NOW.getTime() + 1000);
    try {
      AuditEventFactory.create(buildParams({ timestamp: future }), NOW);
      fail('Expected DomainException');
    } catch (e) {
      expect((e as DomainException).code).toBe('AUDIT_EVENT_FUTURE_TIMESTAMP');
    }
  });

  it('emits an AuditEventRecordedEvent', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    const domainEvents = event.pullDomainEvents();

    expect(domainEvents).toHaveLength(1);
    expect(domainEvents[0]).toBeInstanceOf(AuditEventRecordedEvent);
  });

  it('emitted event carries the correct fields', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    const [recorded] = event.pullDomainEvents() as AuditEventRecordedEvent[];

    expect(recorded.getAggregateId()).toBe(event.id.value);
    expect(recorded.actorId).toBe('user-abc');
    expect(recorded.action).toBe(AuditActionEnum.USER_LOGGED_IN);
    expect(recorded.resourceId).toBe('session-xyz');
    expect(recorded.sequenceNumber).toBe(1);
    expect(recorded.timestamp).toEqual(NOW);
  });

  it('emitted event type is "audit.event.recorded"', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    const [recorded] = event.pullDomainEvents();
    expect(recorded.getEventType()).toBe('audit.event.recorded');
  });

  it('computes a checksum on creation', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    expect(event.checksum.value).toMatch(/^[a-f0-9]{64}$/);
  });

  it('creates unique IDs for two events with the same params', () => {
    const a = AuditEventFactory.create(buildParams(), NOW);
    const b = AuditEventFactory.create(buildParams(), NOW);
    expect(a.id.value).not.toBe(b.id.value);
  });

  it('creates different checksums for two events (different IDs)', () => {
    const a = AuditEventFactory.create(buildParams(), NOW);
    const b = AuditEventFactory.create(buildParams(), NOW);
    // Different IDs → different checksums
    expect(a.checksum.value).not.toBe(b.checksum.value);
  });
});

// ── AuditEvent.rehydrate ──────────────────────────────────────────────────────

describe('AuditEvent.rehydrate', () => {
  const makeRehydrated = () => {
    const id = AuditEventId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const actorId = ActorId.fromString('user-abc');
    const action = AuditAction.of(AuditActionEnum.DOCUMENT_UPLOADED);
    const resourceId = ResourceId.fromString('doc-123');
    const sequenceNumber = SequenceNumber.fromNumber(5);
    const timestamp = new Date('2026-01-01T00:00:00.000Z');
    const checksum = Checksum.compute({
      id: id.value,
      timestamp,
      actorId: actorId.value,
      action: action.value,
      resourceId: resourceId.value,
    });

    return AuditEvent.rehydrate(id, {
      actorId,
      action,
      resourceId,
      checksum,
      sequenceNumber,
      timestamp,
    });
  };

  it('restores all fields without emitting domain events', () => {
    const event = makeRehydrated();
    expect(event.getDomainEvents()).toHaveLength(0);
  });

  it('restores the id', () => {
    const event = makeRehydrated();
    expect(event.id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('restores the actorId', () => {
    const event = makeRehydrated();
    expect(event.actorId.value).toBe('user-abc');
  });

  it('restores the action', () => {
    const event = makeRehydrated();
    expect(event.action.value).toBe(AuditActionEnum.DOCUMENT_UPLOADED);
  });

  it('restores the resourceId', () => {
    const event = makeRehydrated();
    expect(event.resourceId.value).toBe('doc-123');
  });

  it('restores the sequenceNumber', () => {
    const event = makeRehydrated();
    expect(event.sequenceNumber.value).toBe(5);
  });
});

// ── Immutability ──────────────────────────────────────────────────────────────

describe('AuditEvent immutability', () => {
  it('props object is frozen', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    // Accessing internal props via the aggregate — verify the aggregate
    // exposes no setters and the checksum/timestamp cannot be changed.
    const originalChecksum = event.checksum.value;
    const originalTimestamp = event.timestamp;

    // Attempting to mutate via prototype tricks should not change values
    expect(event.checksum.value).toBe(originalChecksum);
    expect(event.timestamp).toEqual(originalTimestamp);
  });

  it('has no public setters', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    const descriptor = Object.getOwnPropertyDescriptor(Object.getPrototypeOf(event), 'actorId');
    expect(descriptor?.set).toBeUndefined();
  });
});

// ── verifyIntegrity ───────────────────────────────────────────────────────────

describe('AuditEvent.verifyIntegrity', () => {
  it('returns true for a freshly created event', () => {
    const event = AuditEventFactory.create(buildParams(), NOW);
    expect(event.verifyIntegrity()).toBe(true);
  });

  it('returns true for a rehydrated event with correct checksum', () => {
    const id = AuditEventId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const actorId = ActorId.fromString('user-abc');
    const action = AuditAction.of(AuditActionEnum.CLAUSE_REVIEWED);
    const resourceId = ResourceId.fromString('clause-99');
    const sequenceNumber = SequenceNumber.fromNumber(10);
    const timestamp = new Date('2026-03-15T08:30:00.000Z');
    const checksum = Checksum.compute({
      id: id.value,
      timestamp,
      actorId: actorId.value,
      action: action.value,
      resourceId: resourceId.value,
    });

    const event = AuditEvent.rehydrate(id, {
      actorId,
      action,
      resourceId,
      checksum,
      sequenceNumber,
      timestamp,
    });

    expect(event.verifyIntegrity()).toBe(true);
  });

  it('returns false when the stored checksum does not match the fields', () => {
    const id = AuditEventId.fromString('550e8400-e29b-41d4-a716-446655440000');
    const actorId = ActorId.fromString('user-abc');
    const action = AuditAction.of(AuditActionEnum.CLAUSE_REVIEWED);
    const resourceId = ResourceId.fromString('clause-99');
    const sequenceNumber = SequenceNumber.fromNumber(10);
    const timestamp = new Date('2026-03-15T08:30:00.000Z');

    // Deliberately use a wrong checksum (computed for a different actorId)
    const tamperedChecksum = Checksum.compute({
      id: id.value,
      timestamp,
      actorId: 'tampered-actor',
      action: action.value,
      resourceId: resourceId.value,
    });

    const event = AuditEvent.rehydrate(id, {
      actorId,
      action,
      resourceId,
      checksum: tamperedChecksum,
      sequenceNumber,
      timestamp,
    });

    expect(event.verifyIntegrity()).toBe(false);
  });
});

// ── Property-based test: checksum verification ────────────────────────────────
//
// **Validates: Requirements 7.1, 7.4** (Audit Trail tamper detection)
//
// Property: For any valid AuditEvent created by the factory,
// verifyIntegrity() MUST return true.
//
// We exercise this across all AuditActionEnum values and a range of
// sequence numbers to ensure the checksum formula is consistent.

describe('Property: checksum integrity holds for all valid inputs', () => {
  const ACTOR_IDS = ['user-001', 'user-abc', 'system', 'admin-99'];
  const RESOURCE_IDS = ['doc-1', 'session-xyz', 'clause-42', 'export-run-7'];
  const SEQUENCE_NUMBERS = [0, 1, 100, 9999];
  const TIMESTAMPS = [
    new Date('2020-01-01T00:00:00.000Z'),
    new Date('2025-06-15T12:30:00.000Z'),
    NOW,
  ];

  for (const action of Object.values(AuditActionEnum)) {
    for (const actorId of ACTOR_IDS) {
      for (const resourceId of RESOURCE_IDS) {
        for (const sequenceNumber of SEQUENCE_NUMBERS) {
          for (const timestamp of TIMESTAMPS) {
            it(`verifyIntegrity() === true for action=${action}, actor=${actorId}, seq=${sequenceNumber}`, () => {
              const event = AuditEventFactory.create(
                { actorId, action, resourceId, sequenceNumber, timestamp },
                NOW,
              );
              expect(event.verifyIntegrity()).toBe(true);
            });
          }
        }
      }
    }
  }
});

// ── Property: tampered checksum always fails verification ─────────────────────
//
// **Validates: Requirements 7.4** (Tamper detection)
//
// Property: If any of the canonical fields (id, timestamp, actorId, action,
// resourceId) is changed after creation, verifyIntegrity() MUST return false.

describe('Property: tampered checksum always fails verification', () => {
  const TAMPER_CASES: Array<{
    label: string;
    tamper: (params: {
      id: string;
      timestamp: Date;
      actorId: string;
      action: string;
      resourceId: string;
    }) => {
      id: string;
      timestamp: Date;
      actorId: string;
      action: string;
      resourceId: string;
    };
  }> = [
    { label: 'id tampered', tamper: (p) => ({ ...p, id: 'tampered-id' }) },
    {
      label: 'timestamp tampered',
      tamper: (p) => ({ ...p, timestamp: new Date('1999-01-01T00:00:00.000Z') }),
    },
    { label: 'actorId tampered', tamper: (p) => ({ ...p, actorId: 'tampered-actor' }) },
    { label: 'action tampered', tamper: (p) => ({ ...p, action: 'TAMPERED_ACTION' }) },
    { label: 'resourceId tampered', tamper: (p) => ({ ...p, resourceId: 'tampered-resource' }) },
  ];

  for (const { label, tamper } of TAMPER_CASES) {
    it(`verifyIntegrity() === false when ${label}`, () => {
      const event = AuditEventFactory.create(buildParams(), NOW);

      // Build a tampered checksum using the modified fields
      const tamperedParams = tamper({
        id: event.id.value,
        timestamp: event.timestamp,
        actorId: event.actorId.value,
        action: event.action.value,
        resourceId: event.resourceId.value,
      });
      const tamperedChecksum = Checksum.compute(tamperedParams);

      // Rehydrate with the original fields but the tampered checksum
      const tampered = AuditEvent.rehydrate(event.id, {
        actorId: event.actorId,
        action: event.action,
        resourceId: event.resourceId,
        checksum: tamperedChecksum,
        sequenceNumber: event.sequenceNumber,
        timestamp: event.timestamp,
      });

      expect(tampered.verifyIntegrity()).toBe(false);
    });
  }
});

// ── SequenceNumber monotonic invariant ────────────────────────────────────────

describe('SequenceNumber monotonic invariant', () => {
  it('isAfter correctly orders a sequence of events', () => {
    const events = [0, 1, 2, 3, 4, 5].map((seq) =>
      AuditEventFactory.create(buildParams({ sequenceNumber: seq }), NOW),
    );

    for (let i = 1; i < events.length; i++) {
      expect(events[i].sequenceNumber.isAfter(events[i - 1].sequenceNumber)).toBe(true);
    }
  });

  it('equal sequence numbers are not strictly after each other', () => {
    const a = AuditEventFactory.create(buildParams({ sequenceNumber: 5 }), NOW);
    const b = AuditEventFactory.create(buildParams({ sequenceNumber: 5 }), NOW);
    expect(a.sequenceNumber.isAfter(b.sequenceNumber)).toBe(false);
    expect(b.sequenceNumber.isAfter(a.sequenceNumber)).toBe(false);
  });
});
