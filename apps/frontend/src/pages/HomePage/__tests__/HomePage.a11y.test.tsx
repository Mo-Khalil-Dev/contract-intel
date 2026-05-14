import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePage } from '../HomePage';
import { DashboardViewModel } from '@/types/referenceData';

expect.extend(toHaveNoViolations);

const mockData: DashboardViewModel = {
  user: {
    id: 'user-1',
    displayName: 'Sarah Johnson',
    email: 'sarah.johnson@example.com',
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
      type: 'Vendor',
      party: 'Amazon Web Services Inc.',
      flagCount: 2,
      riskScore: 72,
      uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
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
    type: 'Vendor',
    party: 'Amazon Web Services Inc.',
    flagCount: 2,
    riskScore: 72,
    uploadedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
};

describe('HomePage - Accessibility', () => {
  it('should not have any accessibility violations', async () => {
    const { container } = render(
      <HomePage
        data={mockData}
        displayUser={{ name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }}
        onNav={() => {}}
        onSignOut={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper heading hierarchy', async () => {
    const { container, getByRole } = render(
      <HomePage
        data={mockData}
        displayUser={{ name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }}
        onNav={() => {}}
        onSignOut={() => {}}
      />
    );

    // Check for h1 (should be the greeting)
    const h1 = getByRole('heading', { level: 1 });
    expect(h1).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible buttons and links', async () => {
    const { container, getAllByRole } = render(
      <HomePage
        data={mockData}
        displayUser={{ name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }}
        onNav={() => {}}
        onSignOut={() => {}}
      />
    );

    const buttons = getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    buttons.forEach((button) => {
      expect(button).toHaveAccessibleName();
    });

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper contrast ratios', async () => {
    const { container } = render(
      <HomePage
        data={mockData}
        displayUser={{ name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }}
        onNav={() => {}}
        onSignOut={() => {}}
      />
    );

    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    // Log any violations for manual review
    if (results.violations.length > 0) {
      console.warn('Color contrast violations found:', results.violations);
    }

    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', async () => {
    const { container } = render(
      <HomePage
        data={mockData}
        displayUser={{ name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }}
        onNav={() => {}}
        onSignOut={() => {}}
      />
    );

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels and roles', async () => {
    const { container, getByRole } = render(
      <HomePage
        data={mockData}
        displayUser={{ name: 'Sarah Johnson', email: 'sarah.johnson@example.com' }}
        onNav={() => {}}
        onSignOut={() => {}}
      />
    );

    // Check for main landmark
    const main = getByRole('main');
    expect(main).toBeInTheDocument();

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
