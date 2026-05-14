import type { Meta, StoryObj } from '@storybook/react-vite';
import { HomePageV2 } from './HomePageV2';
import type { DashboardViewModel } from './types';

const day = 24 * 60 * 60 * 1000;
const daysFromNow = (n: number) => new Date(Date.now() + n * day).toISOString();
const daysAgo = (n: number) => new Date(Date.now() - n * day).toISOString();

const baseData: DashboardViewModel = {
  user: {
    userId: 'user-1',
    email: 'sarah.johnson@northwind.example',
    displayName: 'Sarah Johnson',
  },
  kpis: {
    activeContractCount: 8,
    inProgressCount: 1,
    avgRiskScore: 55,
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
      uploadedAt: daysAgo(7),
    },
    {
      id: '2',
      name: 'Microsoft Enterprise License',
      type: 'license',
      party: 'Microsoft Corporation',
      flagCount: 0,
      riskScore: 28,
      uploadedAt: daysAgo(14),
    },
    {
      id: '3',
      name: 'Google Cloud Platform Agreement',
      type: 'vendor',
      party: 'Google LLC',
      flagCount: 1,
      riskScore: 52,
      uploadedAt: daysAgo(21),
    },
    {
      id: '4',
      name: 'Slack Workspace Subscription',
      type: 'license',
      party: 'Slack Technologies, Inc.',
      flagCount: 3,
      riskScore: 68,
      uploadedAt: daysAgo(30),
    },
  ],
  urgentRenewals: [
    {
      id: 'renewal-1',
      contractName: 'AWS Services Agreement',
      party: 'Amazon Web Services Inc.',
      renewalDate: daysFromNow(10),
      daysRemaining: 10,
      urgency: 'critical',
    },
    {
      id: 'renewal-2',
      contractName: 'Slack Workspace Subscription',
      party: 'Slack Technologies, Inc.',
      renewalDate: daysFromNow(25),
      daysRemaining: 25,
      urgency: 'high',
    },
    {
      id: 'renewal-3',
      contractName: 'Google Cloud Platform Agreement',
      party: 'Google LLC',
      renewalDate: daysFromNow(45),
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
    uploadedAt: daysAgo(2),
  },
};

const meta: Meta<typeof HomePageV2> = {
  title: 'Pages/HomePageV2',
  component: HomePageV2,
  parameters: { layout: 'fullscreen', backgrounds: { default: 'app' } },
  args: {
    greetingName: 'Sarah',
    userInitials: 'SJ',
    onNav: () => {},
  },
};
export default meta;
type Story = StoryObj<typeof HomePageV2>;

/** The canonical dashboard — moderate risk, 4 recent contracts, 3 renewals. */
export const Default: Story = { args: { vm: baseData } };

/** Lots of red — high average risk, many flags, urgent renewals. */
export const HighRiskPortfolio: Story = {
  args: {
    vm: {
      ...baseData,
      kpis: {
        activeContractCount: 12,
        inProgressCount: 4,
        avgRiskScore: 82,
        criticalFlagCount: 24,
        urgentRenewalCount: 6,
      },
      recentContracts: [
        {
          id: '1',
          name: 'Complex Vendor Partnership',
          type: 'partnership',
          party: 'Global Partners LLC',
          flagCount: 12,
          riskScore: 95,
          uploadedAt: daysAgo(1),
        },
        {
          id: '2',
          name: 'High-Liability Service Agreement',
          type: 'vendor',
          party: 'Untested Provider Co.',
          flagCount: 8,
          riskScore: 88,
          uploadedAt: daysAgo(3),
        },
        {
          id: '3',
          name: 'Reseller Agreement (legacy)',
          type: 'partnership',
          party: 'Old Channel Inc.',
          flagCount: 5,
          riskScore: 76,
          uploadedAt: daysAgo(8),
        },
      ],
    },
  },
};

/** Clean state — low risk, no critical flags, no urgent renewals. */
export const LowRiskPortfolio: Story = {
  args: {
    vm: {
      ...baseData,
      kpis: {
        activeContractCount: 18,
        inProgressCount: 0,
        avgRiskScore: 22,
        criticalFlagCount: 0,
        urgentRenewalCount: 0,
      },
      recentContracts: [
        {
          id: '1',
          name: 'Standard SaaS Subscription',
          type: 'license',
          party: 'Safe Vendor Corp',
          flagCount: 0,
          riskScore: 18,
          uploadedAt: daysAgo(4),
        },
        {
          id: '2',
          name: 'Office Lease Renewal',
          type: 'lease',
          party: 'Property Trust LLP',
          flagCount: 0,
          riskScore: 14,
          uploadedAt: daysAgo(11),
        },
      ],
      urgentRenewals: [],
    },
  },
};

/** Brand-new tenant — no contracts uploaded yet. */
export const EmptyPortfolio: Story = {
  args: {
    vm: {
      ...baseData,
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

/** Active portfolio but nothing renewing soon — verifies empty list state. */
export const NoUrgentRenewals: Story = {
  args: {
    vm: { ...baseData, urgentRenewals: [], kpis: { ...baseData.kpis, urgentRenewalCount: 0 } },
  },
};

/** Wall of renewals — list scroll / overflow check. */
export const ManyUrgentRenewals: Story = {
  args: {
    vm: {
      ...baseData,
      kpis: { ...baseData.kpis, urgentRenewalCount: 7 },
      urgentRenewals: [
        { id: 'r-1', contractName: 'AWS Services Agreement', party: 'Amazon', renewalDate: daysFromNow(2), daysRemaining: 2, urgency: 'critical' },
        { id: 'r-2', contractName: 'Microsoft Enterprise License', party: 'Microsoft', renewalDate: daysFromNow(7), daysRemaining: 7, urgency: 'critical' },
        { id: 'r-3', contractName: 'Google Workspace Agreement', party: 'Google', renewalDate: daysFromNow(15), daysRemaining: 15, urgency: 'high' },
        { id: 'r-4', contractName: 'Slack Subscription', party: 'Slack', renewalDate: daysFromNow(28), daysRemaining: 28, urgency: 'high' },
        { id: 'r-5', contractName: 'Salesforce Cloud', party: 'Salesforce', renewalDate: daysFromNow(40), daysRemaining: 40, urgency: 'medium' },
        { id: 'r-6', contractName: 'Datadog Monitoring', party: 'Datadog', renewalDate: daysFromNow(52), daysRemaining: 52, urgency: 'medium' },
        { id: 'r-7', contractName: 'Jira Cloud', party: 'Atlassian', renewalDate: daysFromNow(58), daysRemaining: 58, urgency: 'medium' },
      ],
    },
  },
};

/** Long contract names + party names — ellipsis / truncation test. */
export const LongContractNames: Story = {
  args: {
    vm: {
      ...baseData,
      recentContracts: [
        {
          id: '1',
          name: 'Very Long Master Services Agreement with Multiple Statements of Work and Schedules — V12 Final Signed',
          type: 'vendor',
          party: 'Extraordinarily Long Vendor Company Name Holdings Plc',
          flagCount: 3,
          riskScore: 64,
          uploadedAt: daysAgo(2),
        },
        {
          id: '2',
          name: 'Another Surprisingly Lengthy Partnership Agreement with Many Amendments',
          type: 'partnership',
          party: 'Yet Another Corporation With An Unusually Verbose Name Limited',
          flagCount: 1,
          riskScore: 38,
          uploadedAt: daysAgo(6),
        },
      ],
      urgentRenewals: [
        {
          id: 'r-1',
          contractName: 'Master Services Agreement with the Aforementioned Long Name',
          party: 'Long Counterparty Holdings',
          renewalDate: daysFromNow(8),
          daysRemaining: 8,
          urgency: 'critical',
        },
      ],
    },
  },
};

/** No 'last opened' contract — verifies the Resume tile hides gracefully. */
export const NoLastOpenedContract: Story = {
  args: { vm: { ...baseData, lastOpenedContract: null } },
};

/** New user with email-only identity — greeting falls back to local-part. */
export const EmailOnlyUser: Story = {
  args: {
    vm: {
      ...baseData,
      user: { userId: 'user-2', email: 'mo@northwind.example', displayName: undefined },
    },
    greetingName: 'mo',
    userInitials: 'MO',
  },
};
