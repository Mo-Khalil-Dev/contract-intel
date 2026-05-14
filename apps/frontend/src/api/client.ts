import axios from 'axios';
import { API } from './endpoints';

export const apiClient = axios.create({
  baseURL: 'http://localhost:3000',
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
