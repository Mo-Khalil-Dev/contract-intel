import { GetDocumentListHandler } from './get-document-list.handler';
import { GetDocumentListQuery } from './get-document-list.query';
import type { IDocumentListItemRepository, DocumentListPage } from '../projections/document-list-item/document-list-item.repository';

const ORG = 'org-001';

function emptyPage(overrides: Partial<DocumentListPage> = {}): DocumentListPage {
  return { items: [], total: 0, page: 1, pageSize: 8, totalPages: 1, ...overrides };
}

function makeRepo(page: DocumentListPage = emptyPage()): jest.Mocked<IDocumentListItemRepository> {
  return {
    insert: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    findById: jest.fn(),
    findAll: jest.fn().mockResolvedValue(page),
    summary: jest.fn(),
  };
}

describe('GetDocumentListHandler', () => {
  describe('query defaults', () => {
    it('defaults page=1 and pageSize=8 when not supplied', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG }));

      expect(repo.findAll).toHaveBeenCalledWith(ORG, expect.any(Object), 'risk', 1, 8);
    });

    it('defaults sort=risk and risk=all', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG }));

      const [, filters, sort] = repo.findAll.mock.calls[0];
      expect(sort).toBe('risk');
      expect(filters.risk).toBe('all');
    });
  });

  describe('pagination edge cases', () => {
    it('clamps page=0 to page=1', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, page: 0 }));

      expect(repo.findAll).toHaveBeenCalledWith(ORG, expect.any(Object), expect.any(String), 1, expect.any(Number));
    });

    it('clamps pageSize above 50 to 50', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, pageSize: 200 }));

      expect(repo.findAll).toHaveBeenCalledWith(ORG, expect.any(Object), expect.any(String), expect.any(Number), 50);
    });

    it('clamps pageSize below 1 to 1', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, pageSize: 0 }));

      expect(repo.findAll).toHaveBeenCalledWith(ORG, expect.any(Object), expect.any(String), expect.any(Number), 1);
    });

    it('returns empty items when page exceeds totalPages', async () => {
      const repo = makeRepo(emptyPage({ total: 5, totalPages: 1 }));
      const handler = new GetDocumentListHandler(repo);

      const result = await handler.execute(new GetDocumentListQuery({ orgId: ORG, page: 99 }));

      expect(result.items).toHaveLength(0);
    });
  });

  describe('filter composition', () => {
    it('passes q filter through to the repository', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, q: 'acme' }));

      const [, filters] = repo.findAll.mock.calls[0];
      expect(filters.q).toBe('acme');
    });

    it('passes risk=high filter through', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, risk: 'high' }));

      const [, filters] = repo.findAll.mock.calls[0];
      expect(filters.risk).toBe('high');
    });

    it('passes type filter through', async () => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, type: 'vendor' }));

      const [, filters] = repo.findAll.mock.calls[0];
      expect(filters.type).toBe('vendor');
    });
  });

  describe('sort modes', () => {
    it.each(['risk', 'date', 'name'] as const)('passes sort=%s through', async (sort) => {
      const repo = makeRepo();
      const handler = new GetDocumentListHandler(repo);

      await handler.execute(new GetDocumentListQuery({ orgId: ORG, sort }));

      expect(repo.findAll).toHaveBeenCalledWith(ORG, expect.any(Object), sort, expect.any(Number), expect.any(Number));
    });
  });

  describe('empty portfolio', () => {
    it('returns zero totals when no documents exist', async () => {
      const repo = makeRepo(emptyPage());
      const handler = new GetDocumentListHandler(repo);

      const result = await handler.execute(new GetDocumentListQuery({ orgId: ORG }));

      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(1);
      expect(result.items).toHaveLength(0);
    });
  });
});
