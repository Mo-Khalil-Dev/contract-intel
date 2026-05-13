import { ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { HttpExceptionFilter } from './http-exception.filter';
import {
  DomainException,
  InfrastructureException,
  NotFoundException,
  ValidationException,
} from './app-error';

describe('HttpExceptionFilter', () => {
  let filter: HttpExceptionFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockArgumentsHost: ArgumentsHost;

  beforeEach(() => {
    filter = new HttpExceptionFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
    };

    mockArgumentsHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: jest.fn().mockReturnValue(mockResponse),
        getRequest: jest.fn().mockReturnValue(mockRequest),
      }),
    } as any;
  });

  describe('catching AppError exceptions', () => {
    it('should catch DomainException and return 422 status', () => {
      const error = new DomainException('INVALID_RULE', 'Business rule violated');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      const call = mockResponse.json.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error.type).toBe('INVALID_RULE');
      expect(call.error.status).toBe(422);
    });

    it('should catch ApplicationException with custom status', () => {
      const error = new NotFoundException('User not found');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(404);
      const call = mockResponse.json.mock.calls[0][0];
      expect(call.error.type).toBe('NOT_FOUND');
      expect(call.error.status).toBe(404);
    });

    it('should catch InfrastructureException and return 500 status', () => {
      const error = new InfrastructureException('DATABASE_ERROR', 'Connection failed');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const call = mockResponse.json.mock.calls[0][0];
      expect(call.error.type).toBe('DATABASE_ERROR');
      expect(call.error.status).toBe(500);
    });
  });

  describe('catching NestJS HttpException', () => {
    it('should catch HttpException and extract status', () => {
      const error = new HttpException('Bad Request', HttpStatus.BAD_REQUEST);

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(400);
      const call = mockResponse.json.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error.status).toBe(400);
    });

    it('should handle various HTTP status codes', () => {
      const statusCodes = [400, 401, 403, 404, 409, 500, 503];

      statusCodes.forEach((status) => {
        mockResponse.status.mockClear();
        mockResponse.json.mockClear();

        const error = new HttpException('Error', status);
        filter.catch(error, mockArgumentsHost);

        expect(mockResponse.status).toHaveBeenCalledWith(status);
      });
    });
  });

  describe('catching generic Error', () => {
    it('should catch generic Error and return 500 status', () => {
      const error = new Error('Unexpected error');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const call = mockResponse.json.mock.calls[0][0];
      expect(call.error.status).toBe(500);
      expect(call.error.type).toBe('INTERNAL_SERVER_ERROR');
    });
  });

  describe('error response format (RFC 7807)', () => {
    it('should return proper error response structure', () => {
      const error = new NotFoundException('Resource not found');

      filter.catch(error, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];

      expect(response).toHaveProperty('success', false);
      expect(response.error).toHaveProperty('type');
      expect(response.error).toHaveProperty('title');
      expect(response.error).toHaveProperty('status');
      expect(response.error).toHaveProperty('detail');
      expect(response.error).toHaveProperty('correlationId');
    });

    it('should include all required fields in error object', () => {
      const error = new DomainException('TEST', 'Test message');

      filter.catch(error, mockArgumentsHost);

      const { error: errorObj } = mockResponse.json.mock.calls[0][0];

      expect(typeof errorObj.type).toBe('string');
      expect(typeof errorObj.title).toBe('string');
      expect(typeof errorObj.status).toBe('number');
      expect(typeof errorObj.detail).toBe('string');
      expect(typeof errorObj.correlationId).toBe('string');
    });

    it('should generate unique correlationId for each request', () => {
      const error1 = new NotFoundException();
      const error2 = new NotFoundException();

      filter.catch(error1, mockArgumentsHost);
      const { error: error1Obj } = mockResponse.json.mock.calls[0][0];

      mockResponse.json.mockClear();

      filter.catch(error2, mockArgumentsHost);
      const { error: error2Obj } = mockResponse.json.mock.calls[0][0];

      expect(error1Obj.correlationId).not.toBe(error2Obj.correlationId);
    });
  });

  describe('ValidationException with errors', () => {
    it('should include field errors in response', () => {
      const errors = {
        email: ['must be valid email'],
        password: ['must be at least 8 characters'],
      };
      const error = new ValidationException('Validation failed', errors);

      filter.catch(error, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];

      expect(response.error.errors).toEqual(errors);
    });

    it('should not include errors field for non-ValidationException', () => {
      const error = new NotFoundException();

      filter.catch(error, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];

      expect(response.error.errors).toBeUndefined();
    });
  });

  describe('error titles mapping', () => {
    it('should map error codes to titles', () => {
      const testCases = [
        { error: new NotFoundException(), expectedTitle: 'Not Found' },
        { error: new DomainException('TEST', 'Test'), expectedTitle: 'Error' },
      ];

      testCases.forEach(({ error, expectedTitle }) => {
        mockResponse.json.mockClear();

        filter.catch(error, mockArgumentsHost);

        const response = mockResponse.json.mock.calls[0][0];
        expect(typeof response.error.title).toBe('string');
        expect(response.error.title).toBe(expectedTitle);
      });
    });
  });

  describe('unexpected exception types', () => {
    it('should handle non-Error objects gracefully', () => {
      const unknownException = { some: 'object' };

      filter.catch(unknownException, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
      const call = mockResponse.json.mock.calls[0][0];
      expect(call.success).toBe(false);
      expect(call.error.status).toBe(500);
    });

    it('should handle null exception', () => {
      filter.catch(null, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });

    it('should handle undefined exception', () => {
      filter.catch(undefined, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(500);
    });
  });

  describe('request context', () => {
    it('should call response.json once', () => {
      const error = new NotFoundException();

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.json).toHaveBeenCalledTimes(1);
    });

    it('should call response.status with correct status code', () => {
      const error = new DomainException('TEST', 'Test');

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalledWith(422);
      expect(mockResponse.status).toHaveBeenCalledTimes(1);
    });

    it('should chain status().json() call', () => {
      const error = new NotFoundException();

      filter.catch(error, mockArgumentsHost);

      expect(mockResponse.status).toHaveBeenCalled();
      expect(mockResponse.json).toHaveBeenCalled();
    });
  });

  describe('exception message preservation', () => {
    it('should preserve error message in detail field', () => {
      const message = 'User with ID 123 was not found';
      const error = new NotFoundException(message);

      filter.catch(error, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.detail).toBe(message);
    });

    it('should preserve custom DomainException message', () => {
      const message = 'Email address is already registered';
      const error = new DomainException('DUPLICATE_EMAIL', message);

      filter.catch(error, mockArgumentsHost);

      const response = mockResponse.json.mock.calls[0][0];
      expect(response.error.detail).toBe(message);
    });
  });
});
