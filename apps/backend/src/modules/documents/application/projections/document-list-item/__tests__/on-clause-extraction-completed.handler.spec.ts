import { OnClauseExtractionCompletedHandler } from '../handlers/on-clause-extraction-completed.handler';
import { ClauseExtractionCompletedEvent } from '../../../../../clauses/domain/events/clause.events';
import type { IDocumentListItemRepository, DocumentListItemPatch } from '../document-list-item.repository';
import type { PrismaService } from '../../../../../../shared/infrastructure/prisma/prisma.service';

const RUN_ID = 'run-aaaabbbbcccc';
const DOC_ID = 'doc-aaaabbbbcccc';

function makeEvent() {
  return new ClauseExtractionCompletedEvent(RUN_ID, DOC_ID, 3, new Date());
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

function makePrisma(
  clauses: { riskScore: number | null; riskLevel: string | null; riskFlags: string[] }[],
  metadata: object | null = null,
): jest.Mocked<PrismaService> {
  return {
    clause: {
      findMany: jest.fn().mockResolvedValue(clauses),
    },
    extractionRun: {
      findUnique: jest.fn().mockResolvedValue(metadata !== null ? { metadata } : null),
    },
  } as unknown as jest.Mocked<PrismaService>;
}

describe('OnClauseExtractionCompletedHandler', () => {
  it('sets status=complete and computes riskScore as max/10', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma([
      { riskScore: 60, riskLevel: 'high', riskFlags: [] },
      { riskScore: 30, riskLevel: 'medium', riskFlags: [] },
    ]);
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.status).toBe('complete');
    expect(patch.riskScore).toBe(6); // max(60, 30) / 10
  });

  it('counts flag buckets correctly', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma([
      { riskScore: 80, riskLevel: 'critical', riskFlags: [] },
      { riskScore: 60, riskLevel: 'high', riskFlags: [] },
      { riskScore: 40, riskLevel: 'medium', riskFlags: [] },
      { riskScore: 10, riskLevel: 'low', riskFlags: [] },
    ]);
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.flagsRed).toBe(2);    // critical + high
    expect(patch.flagsOrange).toBe(1); // medium
    expect(patch.flagsBlue).toBe(1);   // low
  });

  it('sets hasUnlimitedLiability=true when any clause has the flag', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma([
      { riskScore: 50, riskLevel: 'medium', riskFlags: ['unlimited_liability', 'auto_renewal'] },
    ]);
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.hasUnlimitedLiability).toBe(true);
  });

  it('sets hasUnlimitedLiability=false when no clause has the flag', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma([
      { riskScore: 50, riskLevel: 'medium', riskFlags: ['auto_renewal'] },
    ]);
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.hasUnlimitedLiability).toBe(false);
  });

  it('sets riskScore=null when no clauses have a risk score', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma([
      { riskScore: null, riskLevel: null, riskFlags: [] },
    ]);
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.riskScore).toBeNull();
  });

  it('extracts counterparty from extraction run metadata', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma(
      [{ riskScore: 50, riskLevel: 'medium', riskFlags: [] }],
      { parties: [{ role: 'Client', name: 'Acme Corp' }] },
    );
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.counterparty).toBe('Acme Corp');
  });

  it('parses terminationDate from metadata string', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma(
      [{ riskScore: 50, riskLevel: 'medium', riskFlags: [] }],
      { terminationDate: '2027-12-31' },
    );
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.terminationDate).toEqual(new Date('2027-12-31'));
  });

  it('sets terminationDate=null when metadata string is unparseable', async () => {
    const listRepo = makeListRepo();
    const prisma = makePrisma(
      [{ riskScore: 50, riskLevel: 'medium', riskFlags: [] }],
      { terminationDate: 'upon mutual agreement' },
    );
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await handler.handle(makeEvent());

    const patch = listRepo.update.mock.calls[0][1] as DocumentListItemPatch;
    expect(patch.terminationDate).toBeNull();
  });

  it('propagates repository errors', async () => {
    const listRepo = makeListRepo();
    listRepo.update.mockRejectedValue(new Error('update failed'));
    const prisma = makePrisma([]);
    const handler = new OnClauseExtractionCompletedHandler(listRepo, prisma);

    await expect(handler.handle(makeEvent())).rejects.toThrow('update failed');
  });
});
