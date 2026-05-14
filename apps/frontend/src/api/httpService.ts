import { apiClient } from './client';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export const httpService = {
  get<T>(url: string) {
    return apiClient.get<ApiResponse<T>>(url).then((res) => res.data);
  },

  post<T>(url: string, data?: unknown) {
    return apiClient.post<ApiResponse<T>>(url, data).then((res) => res.data);
  },

  put<T>(url: string, data?: unknown) {
    return apiClient.put<ApiResponse<T>>(url, data).then((res) => res.data);
  },

  delete<T>(url: string) {
    return apiClient.delete<ApiResponse<T>>(url).then((res) => res.data);
  },
};
