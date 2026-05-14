import { AppError } from '@/errors';
import { ApiResponse } from './httpService';

/**
 * Unwraps the ApiResponse<T> envelope returned by every backend endpoint.
 *
 * - On success: returns the inner `data` value.
 * - On failure: throws an AppError so callers always deal with a structured error.
 *
 * Every service method MUST call `.then(unwrap)` — never return the raw
 * ApiResponse to a hook or component.
 */
export function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new AppError({
      message: response.error ?? 'API request failed',
      code: 'API_ERROR',
      status: 0,
      detail: response.error ?? 'The request was not successful.',
    });
  }

  if (response.data === undefined) {
    throw new AppError({
      message: 'API response missing data',
      code: 'MISSING_DATA',
      status: 0,
      detail: 'The server returned an empty response.',
    });
  }

  return response.data;
}
