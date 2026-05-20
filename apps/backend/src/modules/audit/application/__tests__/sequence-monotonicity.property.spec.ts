/**
 * Property test: Sequence number monotonicity
 *
 * **Validates: Requirements 7.1, 7.3**
 *
 * Given N sequential RecordAuditEventCommand executions with incrementing
 * sequence numbers, each resulting event has sequenceNumber.isAfter(previous).
 *
 * This property ensures the audit log maintains a strictly monotonically
 * increasing sequence, which is required for tamper detection and ordering.
 */
import { RecordAuditEventHandler } from '../commands/record-audit-event.handler';
import { RecordAuditEventCommand } from '../commands/record-audit-event.command';
import { IAuditEventRepository } from '../../domain/audit-event.repository';
import { AuditActionEnum } from '../../domain/audit-action.vo';
import { AuditEvent } from '../../domain/audit-event.aggregate';
import { SequenceNumber } from '../../domain/sequence-number.vo';

/**
 * Creates a mock repository that returns incrementing sequence numbers
 * starting from `startSeq`, and captures all saved events.
 */
function createMockRepository(startSeq: number): {
  repository: jest.Mocked<IAuditEventRepository>;
  savedEvents: AuditEvent[];
} {
  const savedEvents: AuditEvent[] = [];
  let currentSeq = startSeq;

  const repository: jest.Mocked<IAuditEventRepository> = {
    save: jest.fn().mockImplementation(async (event: AuditEvent) => {
      savedEvents.push(event);
    }),
    findAll: jest.fn(),
    findById: jest.fn(),
    getNextSequenceNumber: jest.fn().mockImplementation(async () => currentSeq++),
  };

  return { repository, savedEvents };
}

describe('Sequence Number Monotonicity (Property Test)', () => {
  /**
   * Core property: for any N ≥ 2 sequential command executions,
   * each event's sequenceNumber is strictly greater than the previous.
   */
  async function runMonotonicityCheck(n: number, startSeq: number): Promise<void> {
    const { repository, savedEvents } = createMockRepository(startSeq);
    const handler = new RecordAuditEventHandler(repository);

    // Execute N commands sequentially
    for (let i = 0; i < n; i++) {
      await handler.execute(
        new RecordAuditEventCommand(
          `user-${i}`,
          AuditActionEnum.USER_LOGGED_IN,
          'user',
          `user-${i}`,
        ),
      );
    }

    expect(savedEvents).toHaveLength(n);

    // Verify strict monotonic increase: each event's seq > previous event's seq
    for (let i = 1; i < savedEvents.length; i++) {
      const prev: SequenceNumber = savedEvents[i - 1].sequenceNumber;
      const curr: SequenceNumber = savedEvents[i].sequenceNumber;

      expect(curr.isAfter(prev)).toBe(true);
    }
  }

  it('should maintain monotonicity for N=2 events starting at seq=0', async () => {
    await runMonotonicityCheck(2, 0);
  });

  it('should maintain monotonicity for N=5 events starting at seq=0', async () => {
    await runMonotonicityCheck(5, 0);
  });

  it('should maintain monotonicity for N=10 events starting at seq=0', async () => {
    await runMonotonicityCheck(10, 0);
  });

  it('should maintain monotonicity for N=50 events starting at seq=0', async () => {
    await runMonotonicityCheck(50, 0);
  });

  it('should maintain monotonicity starting from a non-zero sequence', async () => {
    await runMonotonicityCheck(5, 100);
  });

  it('should maintain monotonicity starting from a large sequence number', async () => {
    await runMonotonicityCheck(5, 999_999);
  });

  /**
   * Property: sequence numbers form a strictly increasing sequence
   * across a range of N values (2..20) and starting points (0, 1, 50, 1000).
   */
  it('should hold the monotonicity property across varied N and start values', async () => {
    const nValues = [2, 3, 5, 10, 15, 20];
    const startValues = [0, 1, 50, 1000];

    for (const n of nValues) {
      for (const start of startValues) {
        await runMonotonicityCheck(n, start);
      }
    }
  });

  it('should produce strictly increasing sequence numbers (not just non-decreasing)', async () => {
    const { repository, savedEvents } = createMockRepository(0);
    const handler = new RecordAuditEventHandler(repository);

    // Execute 3 commands
    for (let i = 0; i < 3; i++) {
      await handler.execute(
        new RecordAuditEventCommand('user-1', AuditActionEnum.USER_LOGGED_IN, 'user', 'user-1'),
      );
    }

    // Verify strictly increasing (not equal)
    expect(savedEvents[0].sequenceNumber.value).toBe(0);
    expect(savedEvents[1].sequenceNumber.value).toBe(1);
    expect(savedEvents[2].sequenceNumber.value).toBe(2);

    expect(savedEvents[1].sequenceNumber.isAfter(savedEvents[0].sequenceNumber)).toBe(true);
    expect(savedEvents[2].sequenceNumber.isAfter(savedEvents[1].sequenceNumber)).toBe(true);
    // Transitivity: last is after first
    expect(savedEvents[2].sequenceNumber.isAfter(savedEvents[0].sequenceNumber)).toBe(true);
  });
});
