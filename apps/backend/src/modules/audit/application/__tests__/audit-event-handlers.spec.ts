import { CommandBus } from '@nestjs/cqrs';
import { UserLoggedInAuditHandler } from '../events/user-logged-in-audit.handler';
import { SessionInvalidatedAuditHandler } from '../events/session-invalidated-audit.handler';
import { DocumentUploadedAuditHandler } from '../events/document-uploaded-audit.handler';
import { RecordAuditEventCommand } from '../commands/record-audit-event.command';
import { AuditActionEnum } from '../../domain/audit-action.vo';
import { UserLoggedInEvent } from '../../../auth/domain/events/user.events';
import { SessionInvalidatedEvent } from '../../../auth/domain/events/session.events';
import { DocumentUploadCompletedEvent } from '../../../documents/domain/events/document.events';

describe('Audit Domain Event Handlers', () => {
  let mockCommandBus: jest.Mocked<CommandBus>;

  beforeEach(() => {
    mockCommandBus = {
      execute: jest.fn().mockResolvedValue(undefined),
    } as unknown as jest.Mocked<CommandBus>;
  });

  describe('UserLoggedInAuditHandler', () => {
    let handler: UserLoggedInAuditHandler;

    beforeEach(() => {
      handler = new UserLoggedInAuditHandler(mockCommandBus);
    });

    it('should dispatch RecordAuditEventCommand with USER_LOGGED_IN action', async () => {
      const event = new UserLoggedInEvent(
        'user-abc',
        'user@example.com',
        '192.168.1.1',
        'Mozilla/5.0',
      );

      await handler.handle(event);

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
      expect(command).toBeInstanceOf(RecordAuditEventCommand);
      expect(command.actorId).toBe('user-abc');
      expect(command.action).toBe(AuditActionEnum.USER_LOGGED_IN);
      expect(command.resourceType).toBe('user');
      expect(command.resourceId).toBe('user-abc');
    });

    it('should include email and IP in metadata', async () => {
      const event = new UserLoggedInEvent('user-abc', 'user@example.com', '10.0.0.1', 'Chrome');

      await handler.handle(event);

      const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
      expect(command.metadata).toMatchObject({
        email: 'user@example.com',
        ipAddress: '10.0.0.1',
        userAgent: 'Chrome',
      });
    });

    it('should handle event without optional IP/userAgent', async () => {
      const event = new UserLoggedInEvent('user-abc', 'user@example.com');

      await expect(handler.handle(event)).resolves.toBeUndefined();
      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
    });
  });

  describe('SessionInvalidatedAuditHandler', () => {
    let handler: SessionInvalidatedAuditHandler;

    beforeEach(() => {
      handler = new SessionInvalidatedAuditHandler(mockCommandBus);
    });

    it('should dispatch RecordAuditEventCommand with USER_LOGGED_OUT action', async () => {
      const event = new SessionInvalidatedEvent('session-xyz', 'user-abc', 'logout');

      await handler.handle(event);

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
      expect(command).toBeInstanceOf(RecordAuditEventCommand);
      expect(command.actorId).toBe('user-abc');
      expect(command.action).toBe(AuditActionEnum.USER_LOGGED_OUT);
      expect(command.resourceType).toBe('session');
      expect(command.resourceId).toBe('session-xyz');
    });

    it('should include invalidation reason in metadata', async () => {
      const event = new SessionInvalidatedEvent('session-xyz', 'user-abc', 'expired');

      await handler.handle(event);

      const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
      expect(command.metadata).toMatchObject({ reason: 'expired' });
    });

    it('should handle all invalidation reasons', async () => {
      const reasons: Array<'logout' | 'expired' | 'revoked' | 'replaced'> = [
        'logout',
        'expired',
        'revoked',
        'replaced',
      ];

      for (const reason of reasons) {
        mockCommandBus.execute.mockClear();
        const event = new SessionInvalidatedEvent('session-1', 'user-1', reason);
        await handler.handle(event);
        const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
        expect(command.metadata).toMatchObject({ reason });
      }
    });
  });

  describe('DocumentUploadedAuditHandler', () => {
    let handler: DocumentUploadedAuditHandler;

    beforeEach(() => {
      handler = new DocumentUploadedAuditHandler(mockCommandBus);
    });

    it('should dispatch RecordAuditEventCommand with DOCUMENT_UPLOADED action', async () => {
      const completedAt = new Date('2024-06-01T12:00:00Z');
      const event = new DocumentUploadCompletedEvent(
        'doc-123',
        'org-456',
        'storage/docs/doc-123.pdf',
        completedAt,
      );

      await handler.handle(event);

      expect(mockCommandBus.execute).toHaveBeenCalledTimes(1);
      const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
      expect(command).toBeInstanceOf(RecordAuditEventCommand);
      expect(command.actorId).toBe('org-456');
      expect(command.action).toBe(AuditActionEnum.DOCUMENT_UPLOADED);
      expect(command.resourceType).toBe('document');
      expect(command.resourceId).toBe('doc-123');
    });

    it('should include storageKey and completedAt in metadata', async () => {
      const completedAt = new Date('2024-06-01T12:00:00Z');
      const event = new DocumentUploadCompletedEvent(
        'doc-123',
        'org-456',
        'storage/docs/doc-123.pdf',
        completedAt,
      );

      await handler.handle(event);

      const command = mockCommandBus.execute.mock.calls[0][0] as RecordAuditEventCommand;
      expect(command.metadata).toMatchObject({
        storageKey: 'storage/docs/doc-123.pdf',
        completedAt: completedAt.toISOString(),
      });
    });
  });
});
