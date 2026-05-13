import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { v4 as uuid } from 'uuid';
import { AppError, ValidationException } from './app-error';

interface ErrorResponse {
  success: false;
  error: {
    type: string;
    title: string;
    status: number;
    detail: string;
    correlationId: string;
    errors?: Record<string, string[]>;
  };
}

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter');

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const correlationId = uuid();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorType = 'INTERNAL_SERVER_ERROR';
    let title = 'Internal Server Error';
    let detail = 'An unexpected error occurred';
    let errors: Record<string, string[]> | undefined;

    if (exception instanceof AppError) {
      status = exception.getHttpStatus();
      errorType = exception.getCode();
      title = this.getTitleFromCode(errorType);
      detail = exception.message;

      if (exception instanceof ValidationException) {
        errors = exception.errors;
      }

      this.logger.warn(
        `${errorType}: ${detail}`,
        `Correlation-ID: ${correlationId}`,
      );
    } else if (exception instanceof HttpException) {
      status = exception.getStatus();
      detail = exception.message;
      errorType = 'HTTP_EXCEPTION';
      title = this.getTitleFromCode(errorType);

      this.logger.warn(
        `HTTP ${status}: ${detail}`,
        `Correlation-ID: ${correlationId}`,
      );
    } else if (exception instanceof Error) {
      this.logger.error(
        exception.message,
        exception.stack,
        `Correlation-ID: ${correlationId}`,
      );
    } else {
      this.logger.error(
        'Unknown exception',
        JSON.stringify(exception),
        `Correlation-ID: ${correlationId}`,
      );
    }

    const errorResponse: ErrorResponse = {
      success: false,
      error: {
        type: errorType,
        title,
        status,
        detail,
        correlationId,
        ...(errors && { errors }),
      },
    };

    response.status(status).json(errorResponse);
  }

  private getTitleFromCode(code: string): string {
    const titleMap: Record<string, string> = {
      NOT_FOUND: 'Not Found',
      UNAUTHORIZED: 'Unauthorized',
      FORBIDDEN: 'Forbidden',
      CONFLICT: 'Conflict',
      VALIDATION_ERROR: 'Validation Error',
      INTERNAL_SERVER_ERROR: 'Internal Server Error',
    };
    return titleMap[code] || 'Error';
  }
}
