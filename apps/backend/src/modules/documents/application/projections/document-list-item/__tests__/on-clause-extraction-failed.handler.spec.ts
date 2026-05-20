import { OnClauseExtractionFailedHandler } from '../handlers/on-clause-extraction-failed.handler';
import { ClauseExtractionFailedEvent } from '../../../../../clauses/domain/events/clause.events';
import type { IDocumentListItemRepository } from '../document-list-item.repository';

const RUN_ID = 'run-aaaabbbbcccc';
const DOC_ID = 'doc-aaaabbbbcccc';

function makeEvent() {
  return new ClauseExtractionFailedEvent(RUN_ID, DOC_ID, 'claude_timeout', new Date());
}

function makeListRepo(): jest.Mocked<IDocumentListItemRepository> {
  return {
    insert: jest.fn(),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    summary: jest.fn(),
  };
}

describe('OnClauseExtractionFailedHandler', () => {
  it('updates the DocumentListItem status to failed', async () => {
    const listRepo = makeListRepo();
    const handler = new OnClauseExtractionFailedHandler(listRepo);

    await handler.handle(makeEvent());

    expect(listRepo.update).toHaveBeenCalledTimes(1);
    expect(listRepo.update).toHaveBeenCalledWith(DOC_ID, { status: 'failed' });
  });

  it('propagates repository errors', async () => {
    const listRepo = makeListRepo();
    listRepo.update.mockRejectedValue(new Error('DB write failed'));
    const handler = new OnClauseExtractionFailedHandler(listRepo);

    await expect(handler.handle(makeEvent())).rejects.toThrow('DB write failed');
  });
});
