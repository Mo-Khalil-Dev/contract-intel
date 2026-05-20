import { QueryAuditEventsHandler } from '../queries/query-audit-events.handler';
import { QueryAuditEventsQuery } from '../queries/query-audit-events.query';
import { IAuditEventRepository, PaginatedAuditEvents } from '../../domain/audit-event.repository';
import { AuditActionEnum } from '../../domain/audit-action.vo';
import { AuditEvent } from '../../domain/audit-event.aggregate';

function makeEvent(seq: number, actorId = 'user-1'): AuditEvent {
  return AuditEvent.create({
    actorId,
    action: AuditActionEnum.USER_LOGGED_IN,
    resourceId: `user:${actorId}`,
    sequenceNumber: seq,
  });
}

function makePaginatedResult(
  events: AuditEvent[],
  total: number,
  page = 1,
  pageSize = 20,
): PaginatedAuditEvents {
  return {
    events,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

describe('QueryAuditEventsHandler', () => {
  let handler: QueryAuditEventsHandler;
  let mockRepository: jest.Mocked<IAuditEventRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      getNextSequenceNumber: jest.fn(),
    };
    handler = new QueryAuditEventsHandler(mockRepository);
  });

  describe('execute — filtering', () => {
    it('should pass filters to repository and map results to view', async () => {
      const events = [makeEvent(1), makeEvent(2)];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events, 2));

      const query = new QueryAuditEventsQuery(
        'user-1',
        AuditActionEnum.USER_LOGGED_IN,
        undefined,
        new Date('2024-01-01'),
        new Date('2024-12-31'),
      );

      const result = await handler.execute(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        {
          actorId: 'user-1',
          action: AuditActionEnum.USER_LOGGED_IN,
          resourceId: undefined,
          fromDate: new Date('2024-01-01'),
          toDate: new Date('2024-12-31'),
        },
        { page: undefined, pageSize: undefined },
      );

      expect(result.events).toHaveLength(2);
      expect(result.events[0].actorId).toBe('user-1');
      expect(result.events[0].action).toBe(AuditActionEnum.USER_LOGGED_IN);
      expect(result.events[0].sequenceNumber).toBe(1);
    });

    it('should return empty events array when no results', async () => {
      mockRepository.findAll.mockResolvedValue(makePaginatedResult([], 0));

      const result = await handler.execute(new QueryAuditEventsQuery());

      expect(result.events).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe('execute — pagination', () => {
    it('should pass pagination params to repository', async () => {
      const events = [makeEvent(1)];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events, 50, 2, 10));

      const query = new QueryAuditEventsQuery(
        undefined,
        undefined,
        undefined,
        undefined,
        undefined,
        2,
        10,
      );

      const result = await handler.execute(query);

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.any(Object),
        { page: 2, pageSize: 10 },
      );

      expect(result.page).toBe(2);
      expect(result.pageSize).toBe(10);
      expect(result.total).toBe(50);
      expect(result.totalPages).toBe(5);
    });

    it('should correctly map all pagination metadata', async () => {
      mockRepository.findAll.mockResolvedValue(makePaginatedResult([], 100, 3, 20));

      const result = await handler.execute(new QueryAuditEventsQuery());

      expect(result.total).toBe(100);
      expect(result.page).toBe(3);
      expect(result.pageSize).toBe(20);
      expect(result.totalPages).toBe(5);
    });
  });

  describe('execute — view mapping', () => {
    it('should map all AuditEvent fields to view correctly', async () => {
      const event = makeEvent(42, 'actor-xyz');
      mockRepository.findAll.mockResolvedValue(makePaginatedResult([event], 1));

      const result = await handler.execute(new QueryAuditEventsQuery());

      const view = result.events[0];
      expect(view.id).toBe(event.id.value);
      expect(view.actorId).toBe('actor-xyz');
      expect(view.action).toBe(AuditActionEnum.USER_LOGGED_IN);
      expect(view.resourceId).toBe(event.resourceId.value);
      expect(view.checksum).toBe(event.checksum.value);
      expect(view.sequenceNumber).toBe(42);
      expect(view.timestamp).toBeInstanceOf(Date);
    });
  });
});
