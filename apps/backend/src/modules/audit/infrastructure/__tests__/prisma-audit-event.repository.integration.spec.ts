/**
 * Integration tests for PrismaAuditEventRepository.
 *
 * Uses the real PostgreSQL test database (DATABASE_URL from .env.test).
 * Each test suite cleans up its own data to avoid cross-test pollution.
 *
 * Run with: AUDIT_INTEGRATION_TEST=1 npm test --workspace=apps/backend
 *
 * **Validates: Requirements 7.1, 7.2, 7.3, 7.4, 7.5**
 */
import { PrismaClient } from '@prisma/client';
import { PrismaAuditEventRepository } from '../prisma-audit-event.repository';
import { PrismaService } from '../../../../shared/infrastructure/prisma/prisma.service';
import { AuditEventFactory } from '../../domain/audit-event.factory';
import { AuditEventId } from '../../domain/audit-event-id.vo';
import { AuditActionEnum } from '../../domain/audit-action.vo';

const RUN_INTEGRATION = process.env.AUDIT_INTEGRATION_TEST === '1';
const describeOrSkip = RUN_INTEGRATION ? describe : describe.skip;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Build a PrismaService-compatible object backed by a real PrismaClient. */
function buildPrismaService(): PrismaService {
  const client = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } },
  });
  // Attach the lifecycle methods NestJS would call
  (client as unknown as PrismaService).onModuleInit = async () => {
    await client.$connect();
  };
  (client as unknown as PrismaService).onModuleDestroy = async () => {
    await client.$disconnect();
  };
  return client as unknown as PrismaService;
}

/** Create a test AuditEvent using the factory. */
function makeEvent(
  actorId: string,
  action: AuditActionEnum,
  resourceId: string,
  sequenceNumber: number,
  timestamp?: Date,
) {
  return AuditEventFactory.create({
    actorId,
    action,
    resourceId,
    sequenceNumber,
    timestamp: timestamp ?? new Date(Date.now() - 1000), // 1 s in the past
  });
}

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describeOrSkip('PrismaAuditEventRepository (integration)', () => {
  let prisma: PrismaService;
  let repository: PrismaAuditEventRepository;

  // Track IDs inserted by each test so we can clean up afterwards.
  const insertedIds: string[] = [];

  beforeAll(async () => {
    prisma = buildPrismaService();
    await (prisma as unknown as PrismaClient).$connect();
    repository = new PrismaAuditEventRepository(prisma);
  });

  afterAll(async () => {
    // Clean up all rows created during this test run.
    if (insertedIds.length > 0) {
      await (prisma as unknown as PrismaClient).auditEvent.deleteMany({
        where: { id: { in: insertedIds } },
      });
    }
    await (prisma as unknown as PrismaClient).$disconnect();
  });

  // ── save + findById round-trip ────────────────────────────────────────────

  describe('save + findById round-trip', () => {
    it('should persist an event and retrieve it by ID', async () => {
      const event = makeEvent(
        'actor-roundtrip',
        AuditActionEnum.USER_LOGGED_IN,
        'user:actor-roundtrip',
        0,
      );
      insertedIds.push(event.id.value);

      await repository.save(event);

      const found = await repository.findById(event.id);

      expect(found).not.toBeNull();
      expect(found!.id.value).toBe(event.id.value);
      expect(found!.actorId.value).toBe('actor-roundtrip');
      expect(found!.action.value).toBe(AuditActionEnum.USER_LOGGED_IN);
      expect(found!.sequenceNumber.value).toBe(0);
    });

    it('should preserve the checksum through persistence', async () => {
      const event = makeEvent(
        'actor-checksum',
        AuditActionEnum.DOCUMENT_UPLOADED,
        'document:doc-abc',
        1,
      );
      insertedIds.push(event.id.value);

      await repository.save(event);
      const found = await repository.findById(event.id);

      expect(found!.checksum.value).toBe(event.checksum.value);
      expect(found!.verifyIntegrity()).toBe(true);
    });

    it('should return null for a non-existent ID', async () => {
      const nonExistentId = AuditEventId.fromString(
        '00000000-0000-0000-0000-000000000000',
      );
      const result = await repository.findById(nonExistentId);
      expect(result).toBeNull();
    });
  });

  // ── findAll filters ───────────────────────────────────────────────────────

  describe('findAll — filters', () => {
    const ACTOR_A = 'filter-actor-a';
    const ACTOR_B = 'filter-actor-b';
    const filterIds: string[] = [];

    beforeAll(async () => {
      // Insert a known set of events for filter tests.
      const base = Date.now() - 10_000;
      const events = [
        makeEvent(ACTOR_A, AuditActionEnum.USER_LOGGED_IN, `user:${ACTOR_A}`, 100, new Date(base)),
        makeEvent(ACTOR_A, AuditActionEnum.DOCUMENT_UPLOADED, `document:doc-1`, 101, new Date(base + 1000)),
        makeEvent(ACTOR_B, AuditActionEnum.USER_LOGGED_IN, `user:${ACTOR_B}`, 102, new Date(base + 2000)),
        makeEvent(ACTOR_B, AuditActionEnum.SESSION_INVALIDATED, `user:${ACTOR_B}`, 103, new Date(base + 3000)),
      ];

      for (const e of events) {
        filterIds.push(e.id.value);
        insertedIds.push(e.id.value);
        await repository.save(e);
      }
    });

    it('should filter by actorId', async () => {
      const result = await repository.findAll({ actorId: ACTOR_A });
      const ids = result.events.map((e) => e.id.value);
      expect(ids).toEqual(expect.arrayContaining([filterIds[0], filterIds[1]]));
      // ACTOR_B events must not appear
      expect(ids).not.toContain(filterIds[2]);
      expect(ids).not.toContain(filterIds[3]);
    });

    it('should filter by action', async () => {
      const result = await repository.findAll({ action: AuditActionEnum.USER_LOGGED_IN });
      const ids = result.events.map((e) => e.id.value);
      expect(ids).toContain(filterIds[0]);
      expect(ids).toContain(filterIds[2]);
      expect(ids).not.toContain(filterIds[1]); // DOCUMENT_UPLOADED
      expect(ids).not.toContain(filterIds[3]); // SESSION_INVALIDATED
    });

    it('should filter by resourceId substring', async () => {
      const result = await repository.findAll({ resourceId: 'doc-1' });
      const ids = result.events.map((e) => e.id.value);
      expect(ids).toContain(filterIds[1]);
    });

    it('should filter by fromDate', async () => {
      const base = Date.now() - 10_000;
      const fromDate = new Date(base + 1500); // after first two events
      const result = await repository.findAll({ actorId: ACTOR_B, fromDate });
      const ids = result.events.map((e) => e.id.value);
      expect(ids).toContain(filterIds[2]);
      expect(ids).toContain(filterIds[3]);
    });

    it('should filter by toDate', async () => {
      const base = Date.now() - 10_000;
      const toDate = new Date(base + 500); // only the first event
      const result = await repository.findAll({ actorId: ACTOR_A, toDate });
      const ids = result.events.map((e) => e.id.value);
      expect(ids).toContain(filterIds[0]);
      expect(ids).not.toContain(filterIds[1]);
    });

    it('should return events ordered by sequenceNumber ascending', async () => {
      const result = await repository.findAll({ actorId: ACTOR_A });
      const seqs = result.events.map((e) => e.sequenceNumber.value);
      const sorted = [...seqs].sort((a, b) => a - b);
      expect(seqs).toEqual(sorted);
    });
  });

  // ── findAll pagination ────────────────────────────────────────────────────

  describe('findAll — pagination', () => {
    const ACTOR_PAGE = 'pagination-actor';
    const pageIds: string[] = [];

    beforeAll(async () => {
      // Insert 5 events for pagination tests.
      for (let i = 0; i < 5; i++) {
        const e = makeEvent(
          ACTOR_PAGE,
          AuditActionEnum.CLAUSE_REVIEWED,
          `clause:clause-${i}`,
          200 + i,
          new Date(Date.now() - 5000 + i * 100),
        );
        pageIds.push(e.id.value);
        insertedIds.push(e.id.value);
        await repository.save(e);
      }
    });

    it('should return the correct page and pageSize', async () => {
      const result = await repository.findAll(
        { actorId: ACTOR_PAGE },
        { page: 1, pageSize: 2 },
      );
      expect(result.events).toHaveLength(2);
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(2);
      expect(result.total).toBe(5);
      expect(result.totalPages).toBe(3);
    });

    it('should return the second page correctly', async () => {
      const page1 = await repository.findAll(
        { actorId: ACTOR_PAGE },
        { page: 1, pageSize: 2 },
      );
      const page2 = await repository.findAll(
        { actorId: ACTOR_PAGE },
        { page: 2, pageSize: 2 },
      );

      const page1Ids = page1.events.map((e) => e.id.value);
      const page2Ids = page2.events.map((e) => e.id.value);

      // No overlap between pages
      const overlap = page1Ids.filter((id) => page2Ids.includes(id));
      expect(overlap).toHaveLength(0);
    });

    it('should return an empty array for a page beyond the last', async () => {
      const result = await repository.findAll(
        { actorId: ACTOR_PAGE },
        { page: 99, pageSize: 10 },
      );
      expect(result.events).toHaveLength(0);
      expect(result.total).toBe(5);
    });

    it('should default to page 1 and pageSize 20 when not specified', async () => {
      const result = await repository.findAll({ actorId: ACTOR_PAGE });
      expect(result.page).toBe(1);
      expect(result.pageSize).toBe(20);
    });
  });

  // ── getNextSequenceNumber ─────────────────────────────────────────────────

  describe('getNextSequenceNumber', () => {
    it('should return a non-negative integer', async () => {
      const seq = await repository.getNextSequenceNumber();
      expect(Number.isInteger(seq)).toBe(true);
      expect(seq).toBeGreaterThanOrEqual(0);
    });

    it('should return an incrementing value on successive calls', async () => {
      const seq1 = await repository.getNextSequenceNumber();
      const seq2 = await repository.getNextSequenceNumber();
      expect(seq2).toBeGreaterThan(seq1);
    });

    it('should increment after saving an event with the returned sequence number', async () => {
      const seq = await repository.getNextSequenceNumber();

      const event = makeEvent(
        'actor-seq-test',
        AuditActionEnum.USER_LOGGED_IN,
        `user:actor-seq-test`,
        seq,
      );
      insertedIds.push(event.id.value);
      await repository.save(event);

      const nextSeq = await repository.getNextSequenceNumber();
      expect(nextSeq).toBeGreaterThan(seq);
    });
  });

  // ── Property test: immutability (no update/delete methods) ───────────────

  /**
   * Property test: PrismaAuditEventRepository has no update/delete/upsert methods.
   *
   * **Validates: Requirements 7.2**
   *
   * The audit log must be append-only. This test verifies at the structural
   * level that the repository class does not expose any mutation methods
   * beyond `save` (INSERT only).
   */
  describe('Property: Immutable audit log — no update/delete/upsert methods', () => {
    it('should not have an "update" method', () => {
      expect(typeof (repository as unknown as Record<string, unknown>)['update']).toBe('undefined');
    });

    it('should not have a "delete" method', () => {
      expect(typeof (repository as unknown as Record<string, unknown>)['delete']).toBe('undefined');
    });

    it('should not have an "upsert" method', () => {
      expect(typeof (repository as unknown as Record<string, unknown>)['upsert']).toBe('undefined');
    });

    it('should not have a "deleteMany" method', () => {
      expect(typeof (repository as unknown as Record<string, unknown>)['deleteMany']).toBe('undefined');
    });

    it('should not have an "updateMany" method', () => {
      expect(typeof (repository as unknown as Record<string, unknown>)['updateMany']).toBe('undefined');
    });

    it('should only expose the four IAuditEventRepository methods', () => {
      const publicMethods = Object.getOwnPropertyNames(
        Object.getPrototypeOf(repository),
      ).filter((name) => name !== 'constructor' && !name.startsWith('_'));

      // The only public methods should be the four interface methods + buildWhereClause (private helper)
      const allowedMethods = new Set(['save', 'findAll', 'findById', 'getNextSequenceNumber']);
      const unexpectedMethods = publicMethods.filter(
        (m) => !allowedMethods.has(m) && !m.startsWith('build'),
      );

      expect(unexpectedMethods).toHaveLength(0);
    });
  });
});
