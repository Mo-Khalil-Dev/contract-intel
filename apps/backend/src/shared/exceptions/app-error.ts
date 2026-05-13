export abstract class AppError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(message: string) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  getCode(): string {
    return this.code;
  }

  getHttpStatus(): number {
    return this.httpStatus;
  }

  toJSON(): Record<string, unknown> {
    return {
      code: this.code,
      message: this.message,
      httpStatus: this.httpStatus,
    };
  }
}

export class DomainException extends AppError {
  readonly code: string;
  readonly httpStatus: number = 422;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, DomainException.prototype);
  }
}

export class ApplicationException extends AppError {
  readonly code: string;
  readonly httpStatus: number;

  constructor(code: string, message: string, httpStatus: number = 400) {
    super(message);
    this.code = code;
    this.httpStatus = httpStatus;
    Object.setPrototypeOf(this, ApplicationException.prototype);
  }
}

export class InfrastructureException extends AppError {
  readonly code: string;
  readonly httpStatus: number = 500;

  constructor(code: string, message: string) {
    super(message);
    this.code = code;
    Object.setPrototypeOf(this, InfrastructureException.prototype);
  }
}

export class NotFoundException extends ApplicationException {
  constructor(message: string = 'Resource not found') {
    super('NOT_FOUND', message, 404);
    Object.setPrototypeOf(this, NotFoundException.prototype);
  }
}

export class UnauthorizedException extends ApplicationException {
  constructor(message: string = 'Unauthorized') {
    super('UNAUTHORIZED', message, 401);
    Object.setPrototypeOf(this, UnauthorizedException.prototype);
  }
}

export class ForbiddenException extends ApplicationException {
  constructor(message: string = 'Forbidden') {
    super('FORBIDDEN', message, 403);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}

export class ConflictException extends ApplicationException {
  constructor(message: string = 'Resource conflict') {
    super('CONFLICT', message, 409);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}

export class ValidationException extends ApplicationException {
  readonly errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}) {
    super('VALIDATION_ERROR', message, 400);
    this.errors = errors;
    Object.setPrototypeOf(this, ValidationException.prototype);
  }

  toJSON(): Record<string, unknown> {
    return {
      ...super.toJSON(),
      errors: this.errors,
    };
  }
}
