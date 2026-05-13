import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of, lastValueFrom } from 'rxjs';
import { ResponseInterceptor } from './response.interceptor';

describe('ResponseInterceptor', () => {
  let interceptor: ResponseInterceptor<unknown>;
  let mockExecutionContext: ExecutionContext;

  beforeEach(() => {
    interceptor = new ResponseInterceptor();
    mockExecutionContext = {} as ExecutionContext;
  });

  const intercept = async (payload: unknown) => {
    const callHandler: CallHandler = { handle: () => of(payload) };
    return lastValueFrom(interceptor.intercept(mockExecutionContext, callHandler));
  };

  describe('non-paginated responses', () => {
    it('wraps a plain object in success envelope with null meta', async () => {
      const result = await intercept({ id: '1', name: 'Test' });

      expect(result).toEqual({
        success: true,
        data: { id: '1', name: 'Test' },
        meta: null,
      });
    });

    it('wraps a string in success envelope', async () => {
      const result = await intercept('hello');

      expect(result).toEqual({
        success: true,
        data: 'hello',
        meta: null,
      });
    });

    it('wraps a number in success envelope', async () => {
      const result = await intercept(42);

      expect(result).toEqual({
        success: true,
        data: 42,
        meta: null,
      });
    });

    it('wraps null in success envelope', async () => {
      const result = await intercept(null);

      expect(result).toEqual({
        success: true,
        data: null,
        meta: null,
      });
    });

    it('wraps an array (not paginated) in success envelope', async () => {
      const arr = [{ id: 1 }, { id: 2 }];
      const result = await intercept(arr);

      expect(result).toEqual({
        success: true,
        data: arr,
        meta: null,
      });
    });
  });

  describe('paginated responses', () => {
    it('unwraps paginated payload and lifts meta', async () => {
      const payload = {
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 50, page: 1, pageSize: 20, totalPages: 3 },
      };

      const result = await intercept(payload);

      expect(result).toEqual({
        success: true,
        data: [{ id: 1 }, { id: 2 }],
        meta: { total: 50, page: 1, pageSize: 20, totalPages: 3 },
      });
    });

    it('preserves pagination meta fields exactly', async () => {
      const payload = {
        data: [],
        meta: { total: 0, page: 1, pageSize: 25, totalPages: 1 },
      };

      const result = await intercept(payload);

      expect(result.meta).toEqual({
        total: 0,
        page: 1,
        pageSize: 25,
        totalPages: 1,
      });
    });

    it('treats an object missing meta as non-paginated', async () => {
      const payload = { data: [{ id: 1 }] };

      const result = await intercept(payload);

      expect(result).toEqual({
        success: true,
        data: payload,
        meta: null,
      });
    });
  });

  describe('envelope structure', () => {
    it('always returns success: true', async () => {
      const cases = [{}, [], null, 'string', 42, { foo: 'bar' }];

      for (const c of cases) {
        const result = await intercept(c);
        expect(result.success).toBe(true);
      }
    });

    it('produces only success, data, and meta keys', async () => {
      const result = await intercept({ id: 1 });

      expect(Object.keys(result).sort()).toEqual(['data', 'meta', 'success']);
    });
  });
});
