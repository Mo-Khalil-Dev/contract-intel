import { authService } from '../authService';
import * as httpModule from '@/api/httpService';
import * as unwrapModule from '@/api/unwrap';

jest.mock('@/api/httpService');
jest.mock('@/api/unwrap');

describe('authService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getCurrentUser', () => {
    it('fetches current user', async () => {
      const mockUser = { id: '123', email: 'test@example.com', name: 'Test User' };
      (httpModule.httpService.get as jest.Mock).mockResolvedValueOnce({ success: true, data: mockUser });
      (unwrapModule.unwrap as jest.Mock).mockReturnValueOnce(mockUser);

      const result = await authService.getCurrentUser();

      expect(result).toEqual(mockUser);
      expect(httpModule.httpService.get).toHaveBeenCalledWith('/api/v1/auth/me');
    });

    it('throws on error', async () => {
      (httpModule.httpService.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(authService.getCurrentUser()).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('calls logout endpoint', async () => {
      (httpModule.httpService.post as jest.Mock).mockResolvedValueOnce({ success: true });
      (unwrapModule.unwrap as jest.Mock).mockReturnValueOnce(undefined);

      await authService.logout();

      expect(httpModule.httpService.post).toHaveBeenCalledWith('/api/v1/auth/logout', {});
    });
  });
});
