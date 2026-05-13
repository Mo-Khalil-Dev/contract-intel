export class Result<T> {
  readonly isSuccess: boolean;
  readonly value?: T;
  readonly error?: Error;

  constructor(isSuccess: boolean, value?: T, error?: Error) {
    this.isSuccess = isSuccess;
    this.value = value;
    this.error = error;
  }

  static ok<U>(value: U): Result<U> {
    return new Result(true, value);
  }

  static fail<U>(error: Error): Result<U> {
    return new Result(false, undefined, error);
  }

  static combine<U>(results: Result<any>[]): Result<U> {
    for (const result of results) {
      if (!result.isSuccess) return result;
    }
    return Result.ok<U>(undefined as any);
  }

  getValueOrThrow(): T {
    if (this.isSuccess && this.value !== undefined) {
      return this.value;
    }
    throw this.error || new Error('Unknown error');
  }
}
