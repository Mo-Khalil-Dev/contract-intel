import { CommandBus } from '@nestjs/cqrs';
import { DocumentUploadCompletedHandler } from './document-upload-completed.handler';
import { DocumentUploadCompletedEvent } from '../../domain/events/document.events';
import { StartOcrProcessingCommand } from '../commands/start-ocr-processing.command';

function fakeCommandBus(): jest.Mocked<CommandBus> {
  return { execute: jest.fn().mockResolvedValue(undefined) } as unknown as jest.Mocked<CommandBus>;
}

describe('DocumentUploadCompletedHandler', () => {
  it('dispatches StartOcrProcessingCommand with the aggregate id', async () => {
    const bus = fakeCommandBus();
    const handler = new DocumentUploadCompletedHandler(bus);
    const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18';
    const event = new DocumentUploadCompletedEvent(
      documentId,
      'org-abc',
      `${documentId}.pdf`,
      new Date(),
    );

    await handler.handle(event);

    expect(bus.execute).toHaveBeenCalledTimes(1);
    const dispatched = bus.execute.mock.calls[0][0] as StartOcrProcessingCommand;
    expect(dispatched).toBeInstanceOf(StartOcrProcessingCommand);
    expect(dispatched.documentId).toBe(documentId);
    expect(event.getAggregateId()).toBe(documentId);
  });
});
