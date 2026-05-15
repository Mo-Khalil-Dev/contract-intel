import axios from 'axios';
import { API } from './endpoints';

// Backend base URL. In local dev, .env.local can omit VITE_API_URL and we
// fall back to the dev backend on :3000. In Railway / prod the build sets
// VITE_API_URL to the deployed backend origin (no trailing /api/v1 — endpoints
// in src/api/endpoints.ts already include that prefix).
const API_BASE_URL =
  (import.meta.env.VITE_API_URL as string | undefined) ?? 'http://localhost:3000';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
});

// 401 response interceptor: redirect to login with returnUrl
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const returnUrl = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.href = `${API.AUTH_LOGIN}?returnUrl=${returnUrl}`;
    }
    return Promise.reject(error);
  },
);
