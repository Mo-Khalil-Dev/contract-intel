import axios, { AxiosError } from 'axios';
import { AppError } from './AppError';
import { getErrorMessage } from './errorMessages';

/**
 * Shape of the backend RFC 7807 Problem Details error body.
 * Matches the global HttpExceptionFilter envelope.
 */
interface ProblemDetails {
  success: false;
  error: {
    type?: string;
    title?: string;
    status?: number;
    detail?: string;
    code?: string;
    correlationId?: string;
    errors?: Array<{ field: string; message: string }>;
  };
}

/**
 * Converts any thrown value (AxiosError, plain Error, unknown) into a
 * structured AppError. This is the single normalisation point for all
 * API errors in the frontend.
 *
 * Usage: call this inside the axios response interceptor or in service
 * catch blocks — never scatter raw error handling across hooks/components.
 */
export function parseApiError(error: unknown): AppError {
  // ── Axios error (HTTP response received) ──────────────────────────────────
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ProblemDetails>;

    // Network failure or request cancelled before a response arrived
    if (!axiosError.response) {
      const isTimeout = axiosError.code === 'ECONNABORTED';
      return new AppError({
        message: isTimeout ? 'Request timed out' : 'Network error',
        code: isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR',
        status: 0,
        detail: getErrorMessage(isTimeout ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR'),
      });
    }

    const { status, data, headers } = axiosError.response;
    const correlationId =
      (headers['x-request-id'] as string | undefined) ?? data?.error?.correlationId;

    // Backend returned a well-formed Problem Details body
    if (data?.error) {
      const { code, title, detail, errors } = data.error;
      const errorCode = code ?? httpStatusToCode(status);
      const fieldErrors = buildFieldErrors(errors);

      return new AppError({
        message: title ?? getErrorMessage(errorCode),
        code: errorCode,
        status,
        detail: detail ?? getErrorMessage(errorCode),
        correlationId,
        fieldErrors,
      });
    }

    // Backend returned an unexpected body shape — derive from HTTP status
    const code = httpStatusToCode(status);
    return new AppError({
      message: getErrorMessage(code),
      code,
      status,
      detail: getErrorMessage(code),
      correlationId,
    });
  }

  // ── Already an AppError (re-thrown somewhere) ─────────────────────────────
  if (error instanceof AppError) {
    return error;
  }

  // ── Plain Error ───────────────────────────────────────────────────────────
  if (error instanceof Error) {
    return new AppError({
      message: error.message,
      code: 'UNKNOWN_ERROR',
      status: 0,
      detail: getErrorMessage('UNKNOWN_ERROR'),
    });
  }

  // ── Completely unknown ────────────────────────────────────────────────────
  return new AppError({
    message: 'An unexpected error occurred',
    code: 'UNKNOWN_ERROR',
    status: 0,
    detail: getErrorMessage('UNKNOWN_ERROR'),
  });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'VALIDATION_ERROR',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE_ENTITY',
    429: 'RATE_LIMITED',
    500: 'SERVER_ERROR',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] ?? 'UNKNOWN_ERROR';
}

function buildFieldErrors(
  errors?: Array<{ field: string; message: string }>,
): Record<string, string[]> | undefined {
  if (!errors?.length) return undefined;
  return errors.reduce<Record<string, string[]>>((acc, { field, message }) => {
    if (!acc[field]) acc[field] = [];
    acc[field].push(message);
    return acc;
  }, {});
}
