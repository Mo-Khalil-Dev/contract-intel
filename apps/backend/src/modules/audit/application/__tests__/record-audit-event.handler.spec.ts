import { RecordAuditEventHandler } from '../commands/record-audit-event.handler';
import { RecordAuditEventCommand } from '../commands/record-audit-event.command';
import { IAuditEventRepository } from '../../domain/audit-event.repository';
import { AuditActionEnum } from '../../domain/audit-action.vo';
import { AuditEvent } from '../../domain/audit-event.aggregate';
import { InfrastructureException } from '../../../../shared/exceptions/app-error';

describe('RecordAuditEventHandler', () => {
  let handler: RecordAuditEventHandler;
  let mockRepository: jest.Mocked<IAuditEventRepository>;

  beforeEach(() => {
    mockRepository = {
      save: jest.fn(),
      findAll: jest.fn(),
      findById: jest.fn(),
      getNextSequenceNumber: jest.fn(),
    };
    handler = new RecordAuditEventHandler(mockRepository);
  });

  describe('execute — happy path', () => {
    it('should get next sequence number, create event, and save it', async () => {
      mockRepository.getNextSequenceNumber.mockResolvedValue(1);
      mockRepository.save.mockResolvedValue(undefined);

      const command = new RecordAuditEventCommand(
        'user-123',
        AuditActionEnum.USER_LOGGED_IN,
        'user',
        'user-123',
        { ipAddress: '127.0.0.1' },
      );

      await handler.execute(command);

      expect(mockRepository.getNextSequenceNumber).toHaveBeenCalledTimes(1);
      expect(mockRepository.save).toHaveBeenCalledTimes(1);

      const savedEvent: AuditEvent = mockRepository.save.mock.calls[0][0];
      expect(savedEvent.actorId.value).toBe('user-123');
      expect(savedEvent.action.value).toBe(AuditActionEnum.USER_LOGGED_IN);
      expect(savedEvent.sequenceNumber.value).toBe(1);
    });

    it('should encode resourceType and resourceId into the resourceId field', async () => {
      mockRepository.getNextSequenceNumber.mockResolvedValue(5);
      mockRepository.save.mockResolvedValue(undefined);

      const command = new RecordAuditEventCommand(
        'user-abc',
        AuditActionEnum.DOCUMENT_UPLOADED,
        'document',
        'doc-xyz',
      );

      await handler.execute(command);

      const savedEvent: AuditEvent = mockRepository.save.mock.calls[0][0];
      expect(savedEvent.resourceId.value).toBe('document:doc-xyz');
    });

    it('should work without optional metadata', async () => {
      mockRepository.getNextSequenceNumber.mockResolvedValue(0);
      mockRepository.save.mockResolvedValue(undefined);

      const command = new RecordAuditEventCommand(
        'user-abc',
        AuditActionEnum.AUDIT_LOG_EXPORTED,
        'audit',
        'export-1',
      );

      await expect(handler.execute(command)).resolves.toBeUndefined();
    });
  });

  describe('execute — error propagation', () => {
    it('should propagate error when getNextSequenceNumber fails', async () => {
      const error = new InfrastructureException(
        'DB_ERROR',
        'Failed to get sequence number',
      );
      mockRepository.getNextSequenceNumber.mockRejectedValue(error);

      const command = new RecordAuditEventCommand(
        'user-123',
        AuditActionEnum.USER_LOGGED_IN,
        'user',
        'user-123',
      );

      await expect(handler.execute(command)).rejects.toThrow(error);
      expect(mockRepository.save).not.toHaveBeenCalled();
    });

    it('should propagate error when save fails', async () => {
      mockRepository.getNextSequenceNumber.mockResolvedValue(1);
      const error = new InfrastructureException('DB_ERROR', 'Failed to save audit event');
      mockRepository.save.mockRejectedValue(error);

      const command = new RecordAuditEventCommand(
        'user-123',
        AuditActionEnum.USER_LOGGED_IN,
        'user',
        'user-123',
      );

      await expect(handler.execute(command)).rejects.toThrow(error);
    });
  });
});
