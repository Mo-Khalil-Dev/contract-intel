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

// Helper: build the backend login URL with a returnUrl. We must include the
// absolute backend origin because the login route lives on the backend, not
// the SPA — using a relative path would resolve against the frontend origin
// (works locally via Vite's proxy, breaks on Railway where each service is a
// separate domain).
export function loginRedirectUrl(returnUrl?: string): string {
  const target = returnUrl ?? window.location.pathname + window.location.search;
  return `${API_BASE_URL}${API.AUTH_LOGIN}?returnUrl=${encodeURIComponent(target)}`;
}

// 401 response interceptor: redirect to login with returnUrl
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      window.location.href = loginRedirectUrl();
    }
    return Promise.reject(error);
  },
);
