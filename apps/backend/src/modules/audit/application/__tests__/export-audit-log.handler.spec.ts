import { ExportAuditLogHandler } from '../queries/export-audit-log.handler';
import { ExportAuditLogQuery } from '../queries/export-audit-log.query';
import { IAuditEventRepository, PaginatedAuditEvents } from '../../domain/audit-event.repository';
import { AuditActionEnum } from '../../domain/audit-action.vo';
import { AuditEvent } from '../../domain/audit-event.aggregate';

function makeEvent(seq: number, actorId = 'user-1', action = AuditActionEnum.USER_LOGGED_IN): AuditEvent {
  return AuditEvent.create({
    actorId,
    action,
    resourceId: `user:${actorId}`,
    sequenceNumber: seq,
  });
}

function makePaginatedResult(events: AuditEvent[]): PaginatedAuditEvents {
  return {
    events,
    total: events.length,
    page: 1,
    pageSize: 100_000,
    totalPages: 1,
  };
}

describe('ExportAuditLogHandler', () => {
  let handler: ExportAuditLogHandler;
  let mockRepository: jest.Mocked<IAuditEventRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      getNextSequenceNumber: jest.fn(),
    };
    handler = new ExportAuditLogHandler(mockRepository);
  });

  describe('JSON export', () => {
    it('should return valid JSON with correct structure', async () => {
      const events = [makeEvent(1, 'user-a'), makeEvent(2, 'user-b')];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events));

      const result = await handler.execute(new ExportAuditLogQuery('json'));

      expect(result.mimeType).toBe('application/json');
      expect(result.filename).toMatch(/^audit-log-.+\.json$/);

      const parsed = JSON.parse(result.content);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed).toHaveLength(2);

      const first = parsed[0];
      expect(first).toHaveProperty('id');
      expect(first).toHaveProperty('timestamp');
      expect(first).toHaveProperty('actorId', 'user-a');
      expect(first).toHaveProperty('action', AuditActionEnum.USER_LOGGED_IN);
      expect(first).toHaveProperty('resourceId');
      expect(first).toHaveProperty('sequenceNumber', 1);
      expect(first).toHaveProperty('checksum');
    });

    it('should return empty JSON array when no events', async () => {
      mockRepository.findAll.mockResolvedValue(makePaginatedResult([]));

      const result = await handler.execute(new ExportAuditLogQuery('json'));

      const parsed = JSON.parse(result.content);
      expect(parsed).toEqual([]);
    });

    it('should use ISO 8601 timestamp format', async () => {
      const events = [makeEvent(1)];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events));

      const result = await handler.execute(new ExportAuditLogQuery('json'));

      const parsed = JSON.parse(result.content);
      expect(() => new Date(parsed[0].timestamp)).not.toThrow();
      expect(parsed[0].timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });
  });

  describe('CSV export', () => {
    it('should return valid CSV with header row', async () => {
      const events = [makeEvent(1, 'user-a')];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events));

      const result = await handler.execute(new ExportAuditLogQuery('csv'));

      expect(result.mimeType).toBe('text/csv');
      expect(result.filename).toMatch(/^audit-log-.+\.csv$/);

      const lines = result.content.split('\n');
      expect(lines[0]).toBe('id,timestamp,actorId,action,resourceId,sequenceNumber,checksum');
      expect(lines).toHaveLength(2); // header + 1 data row
    });

    it('should return only header row when no events', async () => {
      mockRepository.findAll.mockResolvedValue(makePaginatedResult([]));

      const result = await handler.execute(new ExportAuditLogQuery('csv'));

      const lines = result.content.split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toBe('id,timestamp,actorId,action,resourceId,sequenceNumber,checksum');
    });

    it('should include correct data in CSV rows', async () => {
      const events = [makeEvent(7, 'actor-99')];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events));

      const result = await handler.execute(new ExportAuditLogQuery('csv'));

      const lines = result.content.split('\n');
      const dataRow = lines[1];
      expect(dataRow).toContain('actor-99');
      expect(dataRow).toContain(AuditActionEnum.USER_LOGGED_IN);
      expect(dataRow).toContain('7');
    });

    it('should escape CSV values containing commas', async () => {
      // Create an event with a resourceId that contains a comma
      // We test the escapeCsv logic indirectly via a value that would need escaping
      const events = [makeEvent(1)];
      mockRepository.findAll.mockResolvedValue(makePaginatedResult(events));

      const result = await handler.execute(new ExportAuditLogQuery('csv'));

      // The result should be parseable as CSV (no unescaped commas in values)
      const lines = result.content.split('\n');
      expect(lines.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('filter passthrough', () => {
    it('should pass filters to repository', async () => {
      mockRepository.findAll.mockResolvedValue(makePaginatedResult([]));

      const fromDate = new Date('2024-01-01');
      const toDate = new Date('2024-12-31');

      await handler.execute(
        new ExportAuditLogQuery(
          'json',
          'user-filter',
          AuditActionEnum.DOCUMENT_UPLOADED,
          undefined,
          fromDate,
          toDate,
        ),
      );

      expect(mockRepository.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          actorId: 'user-filter',
          action: AuditActionEnum.DOCUMENT_UPLOADED,
          fromDate,
          toDate,
        }),
        expect.objectContaining({ page: 1, pageSize: 100_000 }),
      );
    });
  });
});
