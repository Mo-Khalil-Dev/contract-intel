import { referenceDataService } from '../referenceDataService';
import { httpService } from '@/api/httpService';
import { unwrap } from '@/api/unwrap';
import { API } from '@/api/endpoints';
import { DashboardViewModel } from '@/types/referenceData';

jest.mock('@/api/httpService');
jest.mock('@/api/unwrap');

describe('referenceDataService', () => {
  const mockData: DashboardViewModel = {
    user: {
      userId: 'user-123',
      email: 'test@example.com',
      displayName: 'Test User',
    },
    kpis: {
      activeContractCount: 4,
      inProgressCount: 1,
      avgRiskScore: 44,
      criticalFlagCount: 9,
      urgentRenewalCount: 2,
    },
    recentContracts: [],
    urgentRenewals: [],
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getDashboard', () => {
    it('should call httpService.get with API.REFERENCE_DATA', async () => {
      (unwrap as jest.Mock).mockReturnValue(mockData);
      (httpService.get as jest.Mock).mockResolvedValue({ success: true, data: mockData });

      await referenceDataService.getDashboard();

      expect(httpService.get).toHaveBeenCalledWith(API.REFERENCE_DATA);
    });

    it('should call unwrap on the response', async () => {
      const mockResponse = { success: true, data: mockData };
      (httpService.get as jest.Mock).mockResolvedValue(mockResponse);
      (unwrap as jest.Mock).mockReturnValue(mockData);

      await referenceDataService.getDashboard();

      expect(unwrap).toHaveBeenCalledWith(mockResponse);
    });

    it('should return the unwrapped DashboardViewModel', async () => {
      (httpService.get as jest.Mock).mockResolvedValue({ success: true, data: mockData });
      (unwrap as jest.Mock).mockReturnValue(mockData);

      const result = await referenceDataService.getDashboard();

      expect(result).toEqual(mockData);
    });

    it('should throw when unwrap throws', async () => {
      const error = new Error('Unwrap failed');
      (httpService.get as jest.Mock).mockResolvedValue({ success: false });
      (unwrap as jest.Mock).mockImplementation(() => {
        throw error;
      });

      await expect(referenceDataService.getDashboard()).rejects.toThrow('Unwrap failed');
    });
  });
});
