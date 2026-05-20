import { GetDocumentSummaryHandler } from './get-document-summary.handler';
import { GetDocumentSummaryQuery } from './get-document-summary.query';
import type { IDocumentListItemRepository, DocumentListSummary } from '../projections/document-list-item/document-list-item.repository';

const ORG = 'org-001';

function makeSummary(overrides: Partial<DocumentListSummary> = {}): DocumentListSummary {
  return {
    totalContracts: 0,
    analysed: 0,
    avgRisk: 0,
    criticalFlags: 0,
    unlimitedLiability: 0,
    ...overrides,
  };
}

function makeRepo(summary: DocumentListSummary = makeSummary()): jest.Mocked<IDocumentListItemRepository> {
  return {
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn(),
    summary: jest.fn().mockResolvedValue(summary),
  };
}

describe('GetDocumentSummaryHandler', () => {
  it('returns all five KPI fields from the repository', async () => {
    const repo = makeRepo(makeSummary({
      totalContracts: 42,
      analysed: 38,
      avgRisk: 5.4,
      criticalFlags: 12,
      unlimitedLiability: 3,
    }));
    const handler = new GetDocumentSummaryHandler(repo);

    const result = await handler.execute(new GetDocumentSummaryQuery(ORG));

    expect(result.totalContracts).toBe(42);
    expect(result.analysed).toBe(38);
    expect(result.avgRisk).toBe(5.4);
    expect(result.criticalFlags).toBe(12);
    expect(result.unlimitedLiability).toBe(3);
  });

  it('scopes the summary query to the correct orgId', async () => {
    const repo = makeRepo();
    const handler = new GetDocumentSummaryHandler(repo);

    await handler.execute(new GetDocumentSummaryQuery(ORG));

    expect(repo.summary).toHaveBeenCalledWith(ORG);
  });

  it('returns zero KPIs for an empty portfolio', async () => {
    const repo = makeRepo(makeSummary());
    const handler = new GetDocumentSummaryHandler(repo);

    const result = await handler.execute(new GetDocumentSummaryQuery(ORG));

    expect(result.totalContracts).toBe(0);
    expect(result.analysed).toBe(0);
    expect(result.avgRisk).toBe(0);
    expect(result.criticalFlags).toBe(0);
    expect(result.unlimitedLiability).toBe(0);
  });
});
