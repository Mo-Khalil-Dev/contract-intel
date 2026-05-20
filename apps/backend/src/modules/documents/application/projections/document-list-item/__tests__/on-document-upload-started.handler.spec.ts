import { OnDocumentUploadStartedHandler } from '../handlers/on-document-upload-started.handler';
import { DocumentUploadStartedEvent } from '../../../../domain/events/document.events';
import type { IDocumentListItemRepository, NewDocumentListItem } from '../document-list-item.repository';
import type { IDocumentRepository } from '../../../../domain/document.repository';
import type { Document } from '../../../../domain/document.aggregate';

const DOC_ID = 'f47ac10b-58cc-4372-a567-0e02b2c3d479';
const ORG_ID = 'org-001';

function makeEvent(overrides?: Partial<{ fileName: string }>) {
  return new DocumentUploadStartedEvent(
    DOC_ID,
    ORG_ID,
    'user-1',
    overrides?.fileName ?? 'Service Agreement.pdf',
    102400,
    `${DOC_ID}.pdf`,
  );
}

function makeDocument(type = 'vendor', createdAt = new Date('2026-05-20T10:00:00Z')): Document {
  return {
    type: { value: type },
    createdAt,
    orgId: { value: ORG_ID },
    name: { value: 'Service Agreement' },
  } as unknown as Document;
}

function makeListRepo(): jest.Mocked<IDocumentListItemRepository> {
  return {
    insert: jest.fn().mockResolvedValue(undefined),
    update: jest.fn().mockResolvedValue(undefined),
    remove: jest.fn().mockResolvedValue(undefined),
    findById: jest.fn(),
    findAll: jest.fn(),
    summary: jest.fn(),
  };
}

function makeDocRepo(doc: Document | null = makeDocument()): jest.Mocked<IDocumentRepository> {
  return {
    findById: jest.fn().mockResolvedValue(doc),
    findByIdForOrg: jest.fn(),
    save: jest.fn(),
  } as unknown as jest.Mocked<IDocumentRepository>;
}

describe('OnDocumentUploadStartedHandler', () => {
  it('inserts a processing DocumentListItem with extension stripped', async () => {
    const listRepo = makeListRepo();
    const docRepo = makeDocRepo();
    const handler = new OnDocumentUploadStartedHandler(listRepo, docRepo);

    await handler.handle(makeEvent());

    expect(listRepo.insert).toHaveBeenCalledTimes(1);
    const arg = listRepo.insert.mock.calls[0][0] as NewDocumentListItem;
    expect(arg.id).toBe(DOC_ID);
    expect(arg.orgId).toBe(ORG_ID);
    expect(arg.name).toBe('Service Agreement');
    expect(arg.type).toBe('vendor');
    expect(arg.status).toBe('processing');
    expect(arg.uploadedAt).toEqual(new Date('2026-05-20T10:00:00Z'));
  });

  it('strips extension correctly for filenames with dots in the base name', async () => {
    const listRepo = makeListRepo();
    const docRepo = makeDocRepo();
    const handler = new OnDocumentUploadStartedHandler(listRepo, docRepo);

    await handler.handle(makeEvent({ fileName: 'contract.v2.final.docx' }));

    const arg = listRepo.insert.mock.calls[0][0] as NewDocumentListItem;
    expect(arg.name).toBe('contract.v2.final');
  });

  it('skips insert and does not throw when document is not found', async () => {
    const listRepo = makeListRepo();
    const docRepo = makeDocRepo(null);
    const handler = new OnDocumentUploadStartedHandler(listRepo, docRepo);

    await expect(handler.handle(makeEvent())).resolves.toBeUndefined();
    expect(listRepo.insert).not.toHaveBeenCalled();
  });

  it('propagates errors from the list repository', async () => {
    const listRepo = makeListRepo();
    const docRepo = makeDocRepo();
    listRepo.insert.mockRejectedValue(new Error('DB error'));
    const handler = new OnDocumentUploadStartedHandler(listRepo, docRepo);

    await expect(handler.handle(makeEvent())).rejects.toThrow('DB error');
  });
});
