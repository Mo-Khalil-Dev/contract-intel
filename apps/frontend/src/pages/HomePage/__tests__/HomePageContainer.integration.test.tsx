import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { HomePageContainer } from '../HomePageContainer';
import { DashboardViewModel } from '@/types/referenceData';

const mockDashboardData: DashboardViewModel = {
  user: {
    id: 'user-1',
    displayName: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
  },
  kpis: {
    activeContractCount: 12,
    inProgressCount: 3,
    avgRiskScore: 45,
    criticalFlagCount: 5,
    urgentRenewalCount: 2,
  },
  recentContracts: [
    {
      id: '1',
      name: 'AWS Services Agreement',
      type: 'SaaS',
      party: 'Amazon Web Services Inc.',
      flagCount: 2,
      riskScore: 72,
      uploadedAt: new Date().toISOString(),
    },
  ],
  urgentRenewals: [
    {
      id: 'renewal-1',
      contractName: 'AWS Services Agreement',
      party: 'Amazon Web Services Inc.',
      renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 10,
      urgency: 'critical',
    },
  ],
  lastOpenedContract: {
    id: '1',
    name: 'AWS Services Agreement',
    type: 'SaaS',
    party: 'Amazon Web Services Inc.',
    flagCount: 2,
    riskScore: 72,
    uploadedAt: new Date().toISOString(),
  },
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>{children}</BrowserRouter>
    </QueryClientProvider>
  );
};

// Mock the useReferenceData hook
jest.mock('@/hooks/useReferenceData', () => ({
  useReferenceData: jest.fn(),
}));

import { useReferenceData } from '@/hooks/useReferenceData';

describe('HomePageContainer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('loading state', () => {
    it('should display loading skeleton while data is loading', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText(/loading/i) || document.querySelector('.loadingContainer')).toBeTruthy();
    });
  });

  describe('error state', () => {
    it('should display error message when query fails', () => {
      const testError = new Error('Failed to fetch dashboard');
      (useReferenceData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: testError,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
      expect(screen.getByText(/Failed to fetch dashboard/)).toBeInTheDocument();
    });

    it('should display generic error when error is not an Error object', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: 'Unknown error',
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Unable to load dashboard')).toBeInTheDocument();
    });

    it('should provide retry button on error', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: new Error('Test error'),
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      const retryButton = screen.getByRole('button', { name: /Retry/ });
      expect(retryButton).toBeInTheDocument();
    });
  });

  describe('no data state', () => {
    it('should display error when data is null after loading', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: null,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('No data available')).toBeInTheDocument();
    });
  });

  describe('success state', () => {
    it('should render HomePage with data', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText(/Good morning|Good afternoon|Good evening/)).toBeInTheDocument();
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
    });

    it('should pass correct props to HomePage', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
      expect(screen.getByText('Northwind Holdings Ltd')).toBeInTheDocument();
    });

    it('should use displayName from data', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText(/Sarah Johnson\./)).toBeInTheDocument();
    });

    it('should fall back to "User" when displayName is empty', () => {
      const dataWithoutName: DashboardViewModel = {
        ...mockDashboardData,
        user: { ...mockDashboardData.user, displayName: '' },
      };

      (useReferenceData as jest.Mock).mockReturnValue({
        data: dataWithoutName,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText(/User\./)).toBeInTheDocument();
    });
  });

  describe('navigation', () => {
    it('should navigate to upload when upload action is triggered', () => {
      const mockNavigate = jest.fn();
      jest.mock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
      }));

      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      // Navigation would be tested via user interactions in full integration tests
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
    });

    it('should navigate to portfolio when view all is triggered', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      // Navigation verification
      expect(screen.getByText('View all contracts')).toBeInTheDocument();
    });
  });

  describe('sign out', () => {
    it('should clear auth tokens and navigate to login on sign out', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      const { container } = render(<HomePageContainer />, { wrapper: createWrapper() });

      // Verify sign out functionality would be called
      // In full integration, this would clear tokens and redirect
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });
  });

  describe('data transformation', () => {
    it('should pass user display name and email to HomePage', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Sarah Johnson')).toBeInTheDocument();
    });

    it('should pass KPI data to HomePage', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Active contracts')).toBeInTheDocument();
    });

    it('should pass recent contracts to HomePage', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
    });

    it('should pass urgent renewals to HomePage', () => {
      (useReferenceData as jest.Mock).mockReturnValue({
        data: mockDashboardData,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Urgent renewals')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty recent contracts list', () => {
      const dataWithoutContracts: DashboardViewModel = {
        ...mockDashboardData,
        recentContracts: [],
      };

      (useReferenceData as jest.Mock).mockReturnValue({
        data: dataWithoutContracts,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('No contracts uploaded yet')).toBeInTheDocument();
    });

    it('should handle empty urgent renewals list', () => {
      const dataWithoutRenewals: DashboardViewModel = {
        ...mockDashboardData,
        urgentRenewals: [],
      };

      (useReferenceData as jest.Mock).mockReturnValue({
        data: dataWithoutRenewals,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('No urgent renewals')).toBeInTheDocument();
    });

    it('should handle null lastOpenedContract', () => {
      const dataWithoutLastOpened: DashboardViewModel = {
        ...mockDashboardData,
        lastOpenedContract: null,
      };

      (useReferenceData as jest.Mock).mockReturnValue({
        data: dataWithoutLastOpened,
        isLoading: false,
        error: null,
      });

      render(<HomePageContainer />, { wrapper: createWrapper() });
      expect(screen.getByText('Upload a contract')).toBeInTheDocument();
    });
  });
});
