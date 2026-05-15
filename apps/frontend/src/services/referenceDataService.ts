import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import { unwrap } from '@/api/unwrap';
import { DashboardViewModel } from '@/types/referenceData';

const mockDashboardData: DashboardViewModel = {
  user: {
    userId: 'user-123',
    email: 'sarah.johnson@example.com',
    displayName: 'Sarah Johnson',
  },
  kpis: {
    activeContractCount: 12,
    inProgressCount: 3,
    avgRiskScore: 45,
    criticalFlagCount: 15,
    urgentRenewalCount: 3,
  },
  recentContracts: [
    {
      id: '1',
      name: 'AWS Services Agreement',
      type: 'vendor',
      party: 'Amazon Web Services Inc.',
      flagCount: 2,
      riskScore: 72,
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Microsoft Enterprise License',
      type: 'license',
      party: 'Microsoft Corporation',
      flagCount: 0,
      riskScore: 28,
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Google Cloud Platform Agreement',
      type: 'vendor',
      party: 'Google LLC',
      flagCount: 1,
      riskScore: 52,
      uploadedAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      name: 'Slack Workspace Subscription',
      type: 'license',
      party: 'Slack Technologies, Inc.',
      flagCount: 3,
      riskScore: 68,
      uploadedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
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
    {
      id: 'renewal-2',
      contractName: 'Slack Workspace Subscription',
      party: 'Slack Technologies, Inc.',
      renewalDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 25,
      urgency: 'high',
    },
    {
      id: 'renewal-3',
      contractName: 'Google Cloud Platform Agreement',
      party: 'Google LLC',
      renewalDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 45,
      urgency: 'medium',
    },
  ],
  lastOpenedContract: {
    id: '1',
    name: 'AWS Services Agreement',
    type: 'vendor',
    party: 'Amazon Web Services Inc.',
    flagCount: 2,
    riskScore: 72,
    uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

export const referenceDataService = {
  getDashboard: async (): Promise<DashboardViewModel> => {
    // In development mode, return mock data immediately for faster testing
    if (import.meta.env.DEV) {
      return new Promise((resolve) => {
        // Simulate a small network delay for realistic behavior
        setTimeout(() => {
          resolve(mockDashboardData);
        }, 300);
      });
    }

    try {
      // Backend returns a HATEOAS-ish envelope: { data: DashboardViewModel,
      // actions: {...}, ui: {...} } wrapped in the standard ApiResponse.
      // unwrap() peels off the outer ApiResponse; we then pluck `.data` to
      // get the flat DashboardViewModel the UI expects.
      type ReferenceDataEnvelope = {
        data: DashboardViewModel;
        actions: Record<string, boolean>;
        ui: { orgBannerText: string; systemStatus: string; systemStatusColor: string };
      };
      const envelope = await httpService
        .get<ReferenceDataEnvelope>(API.REFERENCE_DATA)
        .then(unwrap);
      return envelope.data;
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
      throw error;
    }
  },
};
