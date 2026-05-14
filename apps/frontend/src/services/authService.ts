import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import { unwrap } from '@/api/unwrap';
import { User } from '@/types/auth';

const mockUser: User = {
  userId: 'dev-user',
  email: 'dev@example.com',
  displayName: 'Sarah Johnson',
};

export const authService = {
  getCurrentUser: async (): Promise<User> => {
    if (import.meta.env.DEV) {
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve(mockUser);
        }, 300);
      });
    }
    return httpService.get<User>(API.AUTH_ME).then(unwrap);
  },

  logout: async (): Promise<void> => {
    return httpService.post<void>(API.AUTH_LOGOUT, {}).then(unwrap);
  },
};
