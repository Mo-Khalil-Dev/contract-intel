import { Test, TestingModule } from '@nestjs/testing';
import { Controller, Get } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import request from 'supertest';
import { ResponseInterceptor } from '../src/shared/infrastructure/interceptors/response.interceptor';
import { HttpExceptionFilter } from '../src/shared/exceptions/http-exception.filter';
import { NotFoundException } from '../src/shared/exceptions/app-error';

@Controller('test')
class TestController {
  @Get('ok')
  ok(): { message: string } {
    return { message: 'hello' };
  }

  @Get('paginated')
  paginated() {
    return {
      data: [{ id: 1 }, { id: 2 }],
      meta: { total: 2, page: 1, pageSize: 20, totalPages: 1 },
    };
  }

  @Get('error')
  error(): never {
    throw new NotFoundException('Resource not found');
  }
}

describe('Application E2E (testing infrastructure)', () => {
  let app: any;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [TestController],
      providers: [{ provide: APP_INTERCEPTOR, useClass: ResponseInterceptor }],
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('success envelope', () => {
    it('wraps non-paginated response with null meta', async () => {
      const response = await request(app.getHttpServer()).get('/test/ok').expect(200);

      expect(response.body).toEqual({
        success: true,
        data: { message: 'hello' },
        meta: null,
      });
    });

    it('wraps paginated response with meta', async () => {
      const response = await request(app.getHttpServer()).get('/test/paginated').expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual([{ id: 1 }, { id: 2 }]);
      expect(response.body.meta).toEqual({
        total: 2,
        page: 1,
        pageSize: 20,
        totalPages: 1,
      });
    });
  });

  describe('error envelope', () => {
    it('returns RFC 7807 error structure on AppError', async () => {
      const response = await request(app.getHttpServer()).get('/test/error').expect(404);

      expect(response.body).toMatchObject({
        success: false,
        error: {
          type: 'NOT_FOUND',
          title: 'Not Found',
          status: 404,
          detail: 'Resource not found',
        },
      });
      expect(response.body.error.correlationId).toBeDefined();
    });
  });
});
