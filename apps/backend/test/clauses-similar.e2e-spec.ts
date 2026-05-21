/**
 * E2E — GET /clauses/:id/similar (US-CI-1, Task 11.4)
 *
 * Controller mounted standalone; QueryBus mocked so this test covers
 * routing, parameter parsing, error mapping, and response envelope
 * without hitting a real database. The actual handler + repository are
 * covered by their own unit / integration specs.
 */
import { Test, TestingModule } from '@nestjs/testing';
import { QueryBus } from '@nestjs/cqrs';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { ClausesController } from '../src/modules/clauses/infrastructure/clauses.controller';
import { GetSimilarClausesQuery } from '../src/modules/clauses/application/queries/get-similar-clauses.query';
import type { SimilarClausesResponse } from '../src/modules/clauses/application/queries/similar-clauses.dto';
import { ResponseInterceptor } from '../src/shared/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/shared/exceptions/http-exception.filter';
import { ApplicationException } from '../src/shared/exceptions/app-error';

const USER_ID = '11111111-2222-4333-8444-555555555555';
const SOURCE_ID = '11111111-1111-4111-8111-111111111111';
const DOC_ID = '22222222-2222-4222-8222-222222222222';
const NEAR_ID = '33333333-3333-4333-8333-333333333333';

const SAMPLE_RESPONSE: SimilarClausesResponse = {
  source: {
    id: SOURCE_ID,
    type: 'limitation_of_liability',
    textSnippet: 'Liability shall not exceed twelve months fees.',
    documentId: DOC_ID,
  },
  results: [
    {
      id: NEAR_ID,
      type: 'limitation_of_liability',
      textSnippet: 'Aggregate liability capped at amounts paid in prior 12 months.',
      similarity: 0.94,
      document: {
        id: '44444444-4444-4444-8444-444444444444',
        title: 'Globex MSA',
        uploadedAt: '2025-03-14T00:00:00.000Z',
      },
      pageNumber: 7,
      sectionRef: null,
    },
  ],
};

describe('GET /clauses/:id/similar', () => {
  let app: any;
  let queryBus: { execute: jest.Mock };

  beforeAll(async () => {
    queryBus = { execute: jest.fn() };

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [ClausesController],
      providers: [
        { provide: APP_INTERCEPTOR, useClass: ResponseInterceptor },
        { provide: QueryBus, useValue: queryBus },
      ],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.use((req: any, _res: any, next: any) => {
      req.user = { userId: USER_ID, email: 't@x.com', displayName: 'T' };
      next();
    });
    await app.init();
  });

  afterAll(() => app.close());
  afterEach(() => queryBus.execute.mockReset());

  // ── Happy path ────────────────────────────────────────────────────────

  describe('happy path', () => {
    beforeEach(() => {
      queryBus.execute.mockResolvedValue(SAMPLE_RESPONSE);
    });

    it('returns 200 with the source + results wrapped in the ApiResponse envelope', async () => {
      const res = await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toMatchObject({
        source: { id: SOURCE_ID, type: 'limitation_of_liability' },
        results: [
          {
            id: NEAR_ID,
            similarity: 0.94,
            document: { title: 'Globex MSA' },
          },
        ],
      });
    });

    it('constructs GetSimilarClausesQuery with the clauseId from the route', async () => {
      await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar`)
        .expect(200);

      expect(queryBus.execute).toHaveBeenCalledTimes(1);
      const q = queryBus.execute.mock.calls[0][0] as GetSimilarClausesQuery;
      expect(q).toBeInstanceOf(GetSimilarClausesQuery);
      expect(q.clauseId).toBe(SOURCE_ID);
    });

    it('defaults limit to 5 when omitted', async () => {
      await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar`)
        .expect(200);
      const q = queryBus.execute.mock.calls[0][0] as GetSimilarClausesQuery;
      expect(q.limit).toBe(5);
    });

    it('forwards an explicit limit from the query string', async () => {
      await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar?limit=12`)
        .expect(200);
      const q = queryBus.execute.mock.calls[0][0] as GetSimilarClausesQuery;
      expect(q.limit).toBe(12);
    });
  });

  // ── Error mapping (delegated to HttpExceptionFilter) ─────────────────

  describe('error mapping', () => {
    it('returns 404 when the handler throws CLAUSE_NOT_FOUND', async () => {
      queryBus.execute.mockRejectedValue(
        new ApplicationException(
          'CLAUSE_NOT_FOUND',
          `Clause ${SOURCE_ID} not found`,
          404,
        ),
      );

      const res = await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar`)
        .expect(404);

      expect(res.body.success).toBe(false);
      expect(res.body.error).toMatchObject({
        type: 'CLAUSE_NOT_FOUND',
        status: 404,
      });
      expect(res.body.error.detail).toContain(SOURCE_ID);
    });

    it('returns 409 when the handler throws CLAUSE_NOT_EMBEDDED', async () => {
      queryBus.execute.mockRejectedValue(
        new ApplicationException(
          'CLAUSE_NOT_EMBEDDED',
          `Clause ${SOURCE_ID} has no embedding`,
          409,
        ),
      );

      const res = await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar`)
        .expect(409);

      expect(res.body.error).toMatchObject({
        type: 'CLAUSE_NOT_EMBEDDED',
        status: 409,
      });
    });

    it('returns 400 when the handler throws INVALID_LIMIT (out of range)', async () => {
      queryBus.execute.mockRejectedValue(
        new ApplicationException(
          'INVALID_LIMIT',
          'limit must be an integer in [1, 20] (got 99)',
          400,
        ),
      );

      const res = await request(app.getHttpServer())
        .get(`/clauses/${SOURCE_ID}/similar?limit=99`)
        .expect(400);

      expect(res.body.error.type).toBe('INVALID_LIMIT');
    });

    // Note: non-numeric ?limit (e.g. "notanumber") is intentionally
    // not asserted at the HTTP layer. Pipe-vs-global-ValidationPipe
    // ordering can let it through to the handler depending on NestJS
    // configuration. The handler's INVALID_LIMIT check is the
    // authoritative validation (covered by the handler spec) and the
    // out-of-range case is covered above.
  });
});
