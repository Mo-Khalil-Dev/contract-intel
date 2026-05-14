import { apiClient } from './client';
import { parseApiError } from '@/errors';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * HTTP service — the only layer that calls the Axios client.
 *
 * All errors are normalised into AppError via parseApiError so that every
 * caller (services, hooks) receives a consistent, structured error type.
 */
export const httpService = {
  async get<T>(url: string, config?: Parameters<typeof apiClient.get>[1]): Promise<ApiResponse<T>> {
    try {
      const res = await apiClient.get<ApiResponse<T>>(url, config);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  },

  async post<T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.post>[2],
  ): Promise<ApiResponse<T>> {
    try {
      const res = await apiClient.post<ApiResponse<T>>(url, data, config);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  },

  async put<T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.put>[2],
  ): Promise<ApiResponse<T>> {
    try {
      const res = await apiClient.put<ApiResponse<T>>(url, data, config);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  },

  async patch<T>(
    url: string,
    data?: unknown,
    config?: Parameters<typeof apiClient.patch>[2],
  ): Promise<ApiResponse<T>> {
    try {
      const res = await apiClient.patch<ApiResponse<T>>(url, data, config);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  },

  async delete<T>(
    url: string,
    config?: Parameters<typeof apiClient.delete>[1],
  ): Promise<ApiResponse<T>> {
    try {
      const res = await apiClient.delete<ApiResponse<T>>(url, config);
      return res.data;
    } catch (err) {
      throw parseApiError(err);
    }
  },
};
