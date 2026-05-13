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

  static combine(results: Result<unknown>[]): Result<void> {
    for (const result of results) {
      if (!result.isSuccess) {
        return Result.fail<void>(result.error ?? new Error('Unknown error'));
      }
    }
    return Result.ok<void>(undefined);
  }

  getValueOrThrow(): T {
    if (this.isSuccess && this.value !== undefined) {
      return this.value;
    }
    throw this.error || new Error('Unknown error');
  }
}
