import { httpService, ApiResponse } from '../httpService';
import * as client from '../client';

jest.mock('../client', () => ({
  apiClient: {
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('httpService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('get', () => {
    it('returns response data', async () => {
      const mockResponse: ApiResponse<string> = { success: true, data: 'test' };
      (client.apiClient.get as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await httpService.get<string>('/test');

      expect(result).toEqual(mockResponse);
      expect(client.apiClient.get).toHaveBeenCalledWith('/test');
    });

    it('throws on error response', async () => {
      (client.apiClient.get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

      await expect(httpService.get('/test')).rejects.toThrow('Network error');
    });
  });

  describe('post', () => {
    it('sends data and returns response', async () => {
      const mockResponse: ApiResponse<string> = { success: true, data: 'created' };
      (client.apiClient.post as jest.Mock).mockResolvedValueOnce({ data: mockResponse });

      const result = await httpService.post<string>('/test', { name: 'test' });

      expect(result).toEqual(mockResponse);
      expect(client.apiClient.post).toHaveBeenCalledWith('/test', { name: 'test' });
    });
  });
});
