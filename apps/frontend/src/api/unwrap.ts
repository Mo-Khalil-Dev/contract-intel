import { ApiResponse } from './httpService';

export function unwrap<T>(response: ApiResponse<T>): T {
  if (!response.success) {
    throw new Error(response.error || 'API request failed');
  }
  if (response.data === undefined) {
    throw new Error('API response missing data');
  }
  return response.data;
}
