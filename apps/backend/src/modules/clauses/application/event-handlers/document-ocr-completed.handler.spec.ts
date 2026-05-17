import { CommandBus } from '@nestjs/cqrs';
import { DocumentOcrCompletedHandler } from './document-ocr-completed.handler';
import { DocumentOcrCompletedEvent } from '../../../documents/domain/events/document.events';
import { StartClauseExtractionCommand } from '../commands/start-clause-extraction.command';

function fakeCommandBus(): jest.Mocked<CommandBus> {
  return {
    execute: jest.fn().mockResolvedValue(undefined),
  } as unknown as jest.Mocked<CommandBus>;
}

describe('DocumentOcrCompletedHandler', () => {
  it('dispatches StartClauseExtractionCommand with the aggregate id', async () => {
    const bus = fakeCommandBus();
    const handler = new DocumentOcrCompletedHandler(bus);
    const documentId = 'b47a490b-fb31-4031-b740-82f8d568dd18';
    const event = new DocumentOcrCompletedEvent(
      documentId,
      'org-abc',
      'native_pdf',
      'en',
      1.0,
      5,
      new Date(),
    );

    await handler.handle(event);

    expect(bus.execute).toHaveBeenCalledTimes(1);
    const dispatched = bus.execute.mock.calls[0][0] as StartClauseExtractionCommand;
    expect(dispatched).toBeInstanceOf(StartClauseExtractionCommand);
    expect(dispatched.documentId).toBe(documentId);
  });
});
