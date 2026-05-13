import {
  AppError,
  DomainException,
  ApplicationException,
  InfrastructureException,
  NotFoundException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  ValidationException,
} from './app-error';

describe('AppError', () => {
  class TestError extends AppError {
    readonly code = 'TEST_ERROR';
    readonly httpStatus = 400;
  }

  describe('constructor', () => {
    it('should create an error with message', () => {
      const error = new TestError('Test message');

      expect(error.message).toBe('Test message');
      expect(error).toBeInstanceOf(Error);
    });

    it('should preserve error prototype chain', () => {
      const error = new TestError('Test');

      expect(error).toBeInstanceOf(AppError);
      expect(error).toBeInstanceOf(Error);
    });
  });

  describe('getCode()', () => {
    it('should return the error code', () => {
      const error = new TestError('Test');

      expect(error.getCode()).toBe('TEST_ERROR');
    });
  });

  describe('getHttpStatus()', () => {
    it('should return the HTTP status code', () => {
      const error = new TestError('Test');

      expect(error.getHttpStatus()).toBe(400);
    });
  });

  describe('toJSON()', () => {
    it('should serialize to JSON with code, message, and httpStatus', () => {
      const error = new TestError('Test error');
      const json = error.toJSON();

      expect(json).toEqual({
        code: 'TEST_ERROR',
        message: 'Test error',
        httpStatus: 400,
      });
    });
  });
});

describe('DomainException', () => {
  it('should have 422 HTTP status (Unprocessable Entity)', () => {
    const error = new DomainException('INVALID_RULE', 'Business rule violated');

    expect(error.getHttpStatus()).toBe(422);
    expect(error.getCode()).toBe('INVALID_RULE');
  });

  it('should create domain exception with custom code', () => {
    const error = new DomainException('DUPLICATE_EMAIL', 'Email already exists');

    expect(error.message).toBe('Email already exists');
    expect(error.getCode()).toBe('DUPLICATE_EMAIL');
  });

  it('should be instanceof DomainException', () => {
    const error = new DomainException('TEST', 'Test');

    expect(error).toBeInstanceOf(DomainException);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('ApplicationException', () => {
  it('should default to 400 HTTP status', () => {
    const error = new ApplicationException('BAD_REQUEST', 'Invalid request');

    expect(error.getHttpStatus()).toBe(400);
  });

  it('should allow custom HTTP status', () => {
    const error = new ApplicationException('NOT_FOUND', 'Resource not found', 404);

    expect(error.getHttpStatus()).toBe(404);
  });

  it('should handle various HTTP status codes', () => {
    const statuses = [
      { code: 'UNAUTHORIZED', status: 401 },
      { code: 'FORBIDDEN', status: 403 },
      { code: 'CONFLICT', status: 409 },
      { code: 'SERVER_ERROR', status: 503 },
    ];

    statuses.forEach(({ code, status }) => {
      const error = new ApplicationException(code, 'Test', status);
      expect(error.getHttpStatus()).toBe(status);
    });
  });

  it('should be instanceof ApplicationException', () => {
    const error = new ApplicationException('TEST', 'Test');

    expect(error).toBeInstanceOf(ApplicationException);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('InfrastructureException', () => {
  it('should have 500 HTTP status (Internal Server Error)', () => {
    const error = new InfrastructureException('DATABASE_ERROR', 'Database connection failed');

    expect(error.getHttpStatus()).toBe(500);
    expect(error.getCode()).toBe('DATABASE_ERROR');
  });

  it('should preserve infrastructure error details', () => {
    const error = new InfrastructureException(
      'EXTERNAL_SERVICE_FAILURE',
      'Third-party API timeout',
    );

    expect(error.message).toBe('Third-party API timeout');
    expect(error.getCode()).toBe('EXTERNAL_SERVICE_FAILURE');
  });

  it('should be instanceof InfrastructureException', () => {
    const error = new InfrastructureException('TEST', 'Test');

    expect(error).toBeInstanceOf(InfrastructureException);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('NotFoundException', () => {
  it('should create with default message', () => {
    const error = new NotFoundException();

    expect(error.message).toBe('Resource not found');
    expect(error.getCode()).toBe('NOT_FOUND');
    expect(error.getHttpStatus()).toBe(404);
  });

  it('should accept custom message', () => {
    const error = new NotFoundException('User with ID 123 not found');

    expect(error.message).toBe('User with ID 123 not found');
  });

  it('should be instanceof NotFoundException', () => {
    const error = new NotFoundException();

    expect(error).toBeInstanceOf(NotFoundException);
    expect(error).toBeInstanceOf(ApplicationException);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('UnauthorizedException', () => {
  it('should create with default message', () => {
    const error = new UnauthorizedException();

    expect(error.message).toBe('Unauthorized');
    expect(error.getCode()).toBe('UNAUTHORIZED');
    expect(error.getHttpStatus()).toBe(401);
  });

  it('should accept custom message', () => {
    const error = new UnauthorizedException('Invalid token');

    expect(error.message).toBe('Invalid token');
  });
});

describe('ForbiddenException', () => {
  it('should create with default message', () => {
    const error = new ForbiddenException();

    expect(error.message).toBe('Forbidden');
    expect(error.getCode()).toBe('FORBIDDEN');
    expect(error.getHttpStatus()).toBe(403);
  });

  it('should accept custom message', () => {
    const error = new ForbiddenException('You do not have access to this resource');

    expect(error.message).toBe('You do not have access to this resource');
  });
});

describe('ConflictException', () => {
  it('should create with default message', () => {
    const error = new ConflictException();

    expect(error.message).toBe('Resource conflict');
    expect(error.getCode()).toBe('CONFLICT');
    expect(error.getHttpStatus()).toBe(409);
  });

  it('should accept custom message', () => {
    const error = new ConflictException('Document already exists');

    expect(error.message).toBe('Document already exists');
  });
});

describe('ValidationException', () => {
  it('should create without errors object', () => {
    const error = new ValidationException('Validation failed');

    expect(error.message).toBe('Validation failed');
    expect(error.getCode()).toBe('VALIDATION_ERROR');
    expect(error.getHttpStatus()).toBe(400);
    expect(error.errors).toEqual({});
  });

  it('should create with field errors', () => {
    const fieldErrors = {
      email: ['must be a valid email'],
      password: ['must be at least 8 characters'],
    };
    const error = new ValidationException('Validation failed', fieldErrors);

    expect(error.errors).toEqual(fieldErrors);
  });

  it('should include errors in toJSON()', () => {
    const fieldErrors = {
      name: ['required'],
      age: ['must be a number'],
    };
    const error = new ValidationException('Invalid input', fieldErrors);
    const json = error.toJSON();

    expect(json.errors).toEqual(fieldErrors);
    expect(json.code).toBe('VALIDATION_ERROR');
  });

  it('should handle multiple errors per field', () => {
    const errors = {
      password: [
        'must be at least 8 characters',
        'must contain uppercase letter',
        'must contain number',
      ],
    };
    const error = new ValidationException('Password invalid', errors);

    expect(error.errors.password).toHaveLength(3);
  });

  it('should be instanceof ValidationException', () => {
    const error = new ValidationException('Test');

    expect(error).toBeInstanceOf(ValidationException);
    expect(error).toBeInstanceOf(ApplicationException);
    expect(error).toBeInstanceOf(AppError);
  });
});

describe('Exception hierarchy', () => {
  it('should allow catching DomainException as AppError', () => {
    const error: AppError = new DomainException('TEST', 'Test');

    expect(error.getHttpStatus()).toBe(422);
  });

  it('should allow catching ApplicationException as AppError', () => {
    const error: AppError = new NotFoundException();

    expect(error.getHttpStatus()).toBe(404);
  });

  it('should allow catching InfrastructureException as AppError', () => {
    const error: AppError = new InfrastructureException('TEST', 'Test');

    expect(error.getHttpStatus()).toBe(500);
  });

  it('should distinguish exception types', () => {
    const domainErr = new DomainException('TEST', 'Test');
    const appErr = new NotFoundException();
    const infraErr = new InfrastructureException('TEST', 'Test');

    expect(domainErr).toBeInstanceOf(DomainException);
    expect(appErr).toBeInstanceOf(ApplicationException);
    expect(infraErr).toBeInstanceOf(InfrastructureException);
  });
});
