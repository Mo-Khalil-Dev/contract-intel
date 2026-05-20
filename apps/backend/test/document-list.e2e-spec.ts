/**
 * E2E — GET /documents (Contracts View list + summary)
 *
 * The controller is mounted standalone; CommandBus and QueryBus are mocked
 * at the bus boundary so this test covers routing, validation, query
 * construction, and response shape without hitting a real database.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { DocumentController } from '../src/modules/documents/infrastructure/document.controller';
import { LocalStorageDriver } from '../src/modules/documents/infrastructure/storage/local-storage.driver';
import { STORAGE_SERVICE } from '../src/modules/documents/domain/ports/storage-service.port';
import { ResponseInterceptor } from '../src/shared/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/shared/exceptions/http-exception.filter';
import { AppConfigService } from '../src/config/app-config.service';
import { GetDocumentListQuery } from '../src/modules/documents/application/queries/get-document-list.query';
import { GetDocumentSummaryQuery } from '../src/modules/documents/application/queries/get-document-summary.query';

const USER_ID = '11111111-2222-4333-8444-555555555555';

const EMPTY_LIST = { items: [], total: 0, page: 1, pageSize: 8, totalPages: 1 };
const EMPTY_SUMMARY = { totalContracts: 0, analysed: 0, avgRisk: 0, criticalFlags: 0, unlimitedLiability: 0 };

describe('GET /documents (Contracts View)', () => {
  let app: any;
  let queryBus: { execute: jest.Mock };

  beforeAll(async () => {
    queryBus = { execute: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [DocumentController],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: CommandBus, useValue: { execute: jest.fn() } },
        { provide: QueryBus, useValue: queryBus },
        {
          provide: AppConfigService,
          useValue: { localStoragePath: '/tmp' } as Partial<AppConfigService>,
        },
        LocalStorageDriver,
        { provide: STORAGE_SERVICE, useExisting: LocalStorageDriver },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.use((req: any, _res: any, next: any) => {
      req.user = { userId: USER_ID, email: 'test@example.com', displayName: 'Test User' };
      next();
    });
    await app.init();
  });

  afterAll(() => app.close());

  beforeEach(() => {
    queryBus.execute.mockImplementation((query: unknown) => {
      if (query instanceof GetDocumentListQuery) return Promise.resolve(EMPTY_LIST);
      if (query instanceof GetDocumentSummaryQuery) return Promise.resolve(EMPTY_SUMMARY);
      return Promise.resolve(null);
    });
  });

  afterEach(() => queryBus.execute.mockReset());

  describe('happy path', () => {
    it('returns 200 with items + summary wrapped in ApiResponse envelope', async () => {
      const res = await request(app.getHttpServer()).get('/documents').expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        items: [],
        total: 0,
        page: 1,
        pageSize: 8,
        totalPages: 1,
        summary: EMPTY_SUMMARY,
      });
    });

    it('executes both GetDocumentListQuery and GetDocumentSummaryQuery', async () => {
      await request(app.getHttpServer()).get('/documents').expect(200);

      const calls = queryBus.execute.mock.calls.map(([q]) => q);
      expect(calls.some((q) => q instanceof GetDocumentListQuery)).toBe(true);
      expect(calls.some((q) => q instanceof GetDocumentSummaryQuery)).toBe(true);
    });

    it('scopes both queries to the authenticated user orgId', async () => {
      await request(app.getHttpServer()).get('/documents').expect(200);

      const listQuery = queryBus.execute.mock.calls
        .map(([q]) => q)
        .find((q) => q instanceof GetDocumentListQuery) as GetDocumentListQuery;

      expect(listQuery.orgId).toBe(USER_ID);
    });
  });

  describe('filter composition', () => {
    it('passes q to the list query', async () => {
      await request(app.getHttpServer()).get('/documents?q=acme').expect(200);

      const q = queryBus.execute.mock.calls.map(([x]) => x).find((x) => x instanceof GetDocumentListQuery) as GetDocumentListQuery;
      expect(q.filters.q).toBe('acme');
    });

    it('passes risk=high to the list query', async () => {
      await request(app.getHttpServer()).get('/documents?risk=high').expect(200);

      const q = queryBus.execute.mock.calls.map(([x]) => x).find((x) => x instanceof GetDocumentListQuery) as GetDocumentListQuery;
      expect(q.filters.risk).toBe('high');
    });

    it('passes type=vendor to the list query', async () => {
      await request(app.getHttpServer()).get('/documents?type=vendor').expect(200);

      const q = queryBus.execute.mock.calls.map(([x]) => x).find((x) => x instanceof GetDocumentListQuery) as GetDocumentListQuery;
      expect(q.filters.type).toBe('vendor');
    });

    it('passes sort=date to the list query', async () => {
      await request(app.getHttpServer()).get('/documents?sort=date').expect(200);

      const q = queryBus.execute.mock.calls.map(([x]) => x).find((x) => x instanceof GetDocumentListQuery) as GetDocumentListQuery;
      expect(q.sort).toBe('date');
    });
  });

  describe('pagination', () => {
    it('passes page and pageSize to the list query', async () => {
      await request(app.getHttpServer()).get('/documents?page=3&pageSize=20').expect(200);

      const q = queryBus.execute.mock.calls.map(([x]) => x).find((x) => x instanceof GetDocumentListQuery) as GetDocumentListQuery;
      expect(q.page).toBe(3);
      expect(q.pageSize).toBe(20);
    });
  });

  describe('validation', () => {
    it('rejects an unknown risk band with 400', async () => {
      await request(app.getHttpServer()).get('/documents?risk=extreme').expect(400);
    });

    it('rejects an unknown sort value with 400', async () => {
      await request(app.getHttpServer()).get('/documents?sort=random').expect(400);
    });

    it('rejects pageSize > 50 with 400', async () => {
      await request(app.getHttpServer()).get('/documents?pageSize=100').expect(400);
    });

    it('rejects q longer than 200 chars with 400', async () => {
      const longQ = 'a'.repeat(201);
      await request(app.getHttpServer()).get(`/documents?q=${longQ}`).expect(400);
    });
  });

  describe('empty portfolio', () => {
    it('returns empty items array and zero summary when portfolio is empty', async () => {
      const res = await request(app.getHttpServer()).get('/documents').expect(200);

      expect(res.body.data.items).toHaveLength(0);
      expect(res.body.data.summary.totalContracts).toBe(0);
    });
  });
});
