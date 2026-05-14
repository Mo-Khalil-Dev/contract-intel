import type { Meta, StoryObj } from '@storybook/react';
import { HomePage } from './HomePage';
import { DashboardViewModel } from '@/types/referenceData';

const baseData: DashboardViewModel = {
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
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '2',
      name: 'Microsoft Enterprise License',
      type: 'License',
      party: 'Microsoft Corporation',
      flagCount: 0,
      riskScore: 28,
      uploadedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '3',
      name: 'Google Workspace Agreement',
      type: 'SaaS',
      party: 'Google LLC',
      flagCount: 1,
      riskScore: 68,
      uploadedAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: '4',
      name: 'Slack Enterprise Agreement',
      type: 'SaaS',
      party: 'Slack Technologies Inc.',
      flagCount: 3,
      riskScore: 15,
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
      contractName: 'Microsoft Enterprise License',
      party: 'Microsoft Corporation',
      renewalDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 25,
      urgency: 'high',
    },
    {
      id: 'renewal-3',
      contractName: 'Slack Enterprise Agreement',
      party: 'Slack Technologies Inc.',
      renewalDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
      daysRemaining: 45,
      urgency: 'medium',
    },
  ],
  lastOpenedContract: {
    id: '1',
    name: 'AWS Services Agreement',
    type: 'SaaS',
    party: 'Amazon Web Services Inc.',
    flagCount: 2,
    riskScore: 72,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

const meta: Meta<typeof HomePage> = {
  title: 'Pages/HomePage',
  component: HomePage,
  parameters: {
    layout: 'fullscreen',
    backgrounds: {
      default: 'light',
    },
  },
  args: {
    displayUser: { name: 'Sarah Johnson', email: 'sarah.johnson@example.com' },
    onNav: (screen: string, params?: Record<string, string>) => {
      console.log(`Navigation: ${screen}`, params);
    },
    onSignOut: () => {
      console.log('Sign out clicked');
    },
  },
};

export default meta;
type Story = StoryObj<typeof HomePage>;

export const Default: Story = {
  args: {
    data: baseData,
  },
};

export const HighRiskPortfolio: Story = {
  args: {
    data: {
      ...baseData,
      kpis: {
        activeContractCount: 8,
        inProgressCount: 2,
        avgRiskScore: 78,
        criticalFlagCount: 12,
        urgentRenewalCount: 5,
      },
      recentContracts: [
        {
          id: '1',
          name: 'High Risk Vendor Agreement',
          type: 'Service',
          party: 'Unknown Vendor Inc.',
          flagCount: 8,
          riskScore: 95,
          uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'Complex Partnership Agreement',
          type: 'Partnership',
          party: 'Global Partners LLC',
          flagCount: 5,
          riskScore: 82,
          uploadedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  },
};

export const LowRiskPortfolio: Story = {
  args: {
    data: {
      ...baseData,
      kpis: {
        activeContractCount: 25,
        inProgressCount: 1,
        avgRiskScore: 15,
        criticalFlagCount: 0,
        urgentRenewalCount: 0,
      },
      recentContracts: [
        {
          id: '1',
          name: 'Standard SaaS Agreement',
          type: 'SaaS',
          party: 'Safe Vendor Corp',
          flagCount: 0,
          riskScore: 12,
          uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
        {
          id: '2',
          name: 'Simple License Agreement',
          type: 'License',
          party: 'Trusted Provider Inc.',
          flagCount: 0,
          riskScore: 8,
          uploadedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      urgentRenewals: [],
    },
  },
};

export const EmptyPortfolio: Story = {
  args: {
    data: {
      user: baseData.user,
      kpis: {
        activeContractCount: 0,
        inProgressCount: 0,
        avgRiskScore: 0,
        criticalFlagCount: 0,
        urgentRenewalCount: 0,
      },
      recentContracts: [],
      urgentRenewals: [],
      lastOpenedContract: null,
    },
  },
};

export const NoUrgentRenewals: Story = {
  args: {
    data: {
      ...baseData,
      kpis: {
        ...baseData.kpis,
        urgentRenewalCount: 0,
      },
      urgentRenewals: [],
    },
  },
};

export const ManyUrgentRenewals: Story = {
  args: {
    data: {
      ...baseData,
      kpis: {
        ...baseData.kpis,
        urgentRenewalCount: 7,
      },
      urgentRenewals: [
        {
          id: 'renewal-1',
          contractName: 'AWS Services Agreement',
          party: 'Amazon Web Services Inc.',
          renewalDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 3,
          urgency: 'critical',
        },
        {
          id: 'renewal-2',
          contractName: 'Microsoft Enterprise License',
          party: 'Microsoft Corporation',
          renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 10,
          urgency: 'critical',
        },
        {
          id: 'renewal-3',
          contractName: 'Google Workspace Agreement',
          party: 'Google LLC',
          renewalDate: new Date(Date.now() + 20 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 20,
          urgency: 'high',
        },
        {
          id: 'renewal-4',
          contractName: 'Slack Enterprise Agreement',
          party: 'Slack Technologies Inc.',
          renewalDate: new Date(Date.now() + 35 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 35,
          urgency: 'high',
        },
        {
          id: 'renewal-5',
          contractName: 'Salesforce Subscription',
          party: 'Salesforce Inc.',
          renewalDate: new Date(Date.now() + 50 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 50,
          urgency: 'medium',
        },
        {
          id: 'renewal-6',
          contractName: 'Datadog Monitoring License',
          party: 'Datadog Inc.',
          renewalDate: new Date(Date.now() + 55 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 55,
          urgency: 'medium',
        },
        {
          id: 'renewal-7',
          contractName: 'Jira Cloud License',
          party: 'Atlassian Inc.',
          renewalDate: new Date(Date.now() + 58 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 58,
          urgency: 'medium',
        },
      ],
    },
  },
};

export const NoRecentContracts: Story = {
  args: {
    data: {
      ...baseData,
      recentContracts: [],
      lastOpenedContract: null,
    },
  },
};

export const SingleRecentContract: Story = {
  args: {
    data: {
      ...baseData,
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
    },
  },
};

export const NoLastOpenedContract: Story = {
  args: {
    data: {
      ...baseData,
      lastOpenedContract: null,
    },
  },
};

export const LongContractNames: Story = {
  args: {
    data: {
      ...baseData,
      recentContracts: [
        {
          id: '1',
          name: 'Very Long Software as a Service Agreement with Extended Terms and Conditions for Enterprise Usage',
          type: 'SaaS',
          party: 'Very Long Company Name with Many Words Inc.',
          flagCount: 2,
          riskScore: 72,
          uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
      urgentRenewals: [
        {
          id: 'renewal-1',
          contractName: 'Extremely Long Vendor Agreement with Multiple Renewal Clauses and Extended Service Periods',
          party: 'Another Very Long Company Name Corporation',
          renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
          daysRemaining: 10,
          urgency: 'critical',
        },
      ],
    },
  },
};

export const MultipleFlagsAndHighRisk: Story = {
  args: {
    data: {
      ...baseData,
      kpis: {
        ...baseData.kpis,
        criticalFlagCount: 15,
      },
      recentContracts: [
        {
          id: '1',
          name: 'Complex Vendor Agreement',
          type: 'Service',
          party: 'Complex Vendor Corp',
          flagCount: 12,
          riskScore: 92,
          uploadedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        },
      ],
    },
  },
};

export const WithoutDisplayUser: Story = {
  args: {
    data: baseData,
    displayUser: undefined,
  },
};

export const MidnightGreeting: Story = {
  args: {
    data: baseData,
  },
  parameters: {
    theme: 'dark',
  },
};

export const LoadingState: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <h2>Loading State</h2>
      <p>This state shows skeleton loaders while data is being fetched.</p>
      <p>Components should show placeholder shimmer effects.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows the dashboard while data is loading. Skeleton components provide visual feedback.',
      },
    },
  },
};

export const ErrorState: Story = {
  render: () => (
    <div style={{ padding: '2rem' }}>
      <h2>Error State</h2>
      <p>This state shows when there is an error loading the dashboard data.</p>
      <p>User sees an error message with a retry button.</p>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Shows an error message when dashboard data fails to load. User can retry.',
      },
    },
  },
};
