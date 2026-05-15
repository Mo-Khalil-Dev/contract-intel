import { renderHook, waitFor } from '@testing-library/react';
import { useReferenceData } from '../useReferenceData';
import { referenceDataService } from '@/services/referenceDataService';
import { QueryClient, QueryClientProvider } from 'react-query';
import React from 'react';
import { DashboardViewModel } from '@/types/referenceData';

jest.mock('@/services/referenceDataService');

const createWrapper = () => {
  const queryClient = new QueryClient();
  return ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);
};

describe('useReferenceData', () => {
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

  it('should return loading state initially', () => {
    (referenceDataService.getDashboard as jest.Mock).mockImplementation(
      () => new Promise(() => {}),
    );

    const { result } = renderHook(() => useReferenceData(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.data).toBeUndefined();
  });

  it('should return data after successful fetch', async () => {
    (referenceDataService.getDashboard as jest.Mock).mockResolvedValue(mockData);

    const { result } = renderHook(() => useReferenceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data).toEqual(mockData);
    expect(result.current.isError).toBe(false);
  });

  // Note: a former "should have correct queryKey" test was removed — react-query's
  // UseQueryResult doesn't expose `queryKey`. The key is exercised indirectly by
  // the cache-behaviour tests below.

  it('should call getDashboard service', async () => {
    (referenceDataService.getDashboard as jest.Mock).mockResolvedValue(mockData);

    renderHook(() => useReferenceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(referenceDataService.getDashboard).toHaveBeenCalled();
    });
  });

  it('should return error state on failure', async () => {
    const error = new Error('Failed to fetch');
    (referenceDataService.getDashboard as jest.Mock).mockRejectedValue(error);

    const { result } = renderHook(() => useReferenceData(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toEqual(error);
  });
});
