import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import { unwrap } from '@/api/unwrap';
import { User } from '@/types/auth';

export const authService = {
  getCurrentUser: async (): Promise<User> => {
    return httpService.get<User>(API.AUTH_ME).then(unwrap);
  },

  logout: async (): Promise<void> => {
    return httpService.post<void>(API.AUTH_LOGOUT, {}).then(unwrap);
  },
};
