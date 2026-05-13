import { Result } from './result';

describe('Result<T>', () => {
  describe('ok()', () => {
    it('should create a successful result with a value', () => {
      const result = Result.ok(42);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBe(42);
      expect(result.error).toBeUndefined();
    });

    it('should create a successful result with undefined value', () => {
      const result = Result.ok<void>(undefined);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toBeUndefined();
    });

    it('should create a successful result with complex object', () => {
      const obj = { id: '123', name: 'Test' };
      const result = Result.ok(obj);

      expect(result.isSuccess).toBe(true);
      expect(result.value).toEqual(obj);
    });
  });

  describe('fail()', () => {
    it('should create a failed result with an error', () => {
      const error = new Error('Something went wrong');
      const result = Result.fail<string>(error);

      expect(result.isSuccess).toBe(false);
      expect(result.error).toBe(error);
      expect(result.value).toBeUndefined();
    });

    it('should preserve error message', () => {
      const errorMessage = 'Database connection failed';
      const error = new Error(errorMessage);
      const result = Result.fail<void>(error);

      expect(result.error?.message).toBe(errorMessage);
    });
  });

  describe('combine()', () => {
    it('should return ok when all results are successful', () => {
      const results = [Result.ok(1), Result.ok(2), Result.ok(3)];
      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(true);
    });

    it('should return first failure when any result fails', () => {
      const error1 = new Error('First error');
      const error2 = new Error('Second error');
      const results = [Result.ok(1), Result.fail(error1), Result.fail(error2)];
      const combined = Result.combine(results);

      expect(combined.isSuccess).toBe(false);
      expect(combined.error).toBe(error1);
    });

    it('should handle empty array as success', () => {
      const combined = Result.combine([]);

      expect(combined.isSuccess).toBe(true);
    });
  });

  describe('getValueOrThrow()', () => {
    it('should return value when result is successful', () => {
      const value = 'success';
      const result = Result.ok(value);

      expect(result.getValueOrThrow()).toBe(value);
    });

    it('should throw error when result is failed', () => {
      const error = new Error('Failed');
      const result = Result.fail<string>(error);

      expect(() => result.getValueOrThrow()).toThrow(error);
    });

    it('should throw when result is successful but value is undefined', () => {
      const result = Result.ok<void>(undefined);

      expect(() => result.getValueOrThrow()).toThrow('Unknown error');
    });
  });
});
