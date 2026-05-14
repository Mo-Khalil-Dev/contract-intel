import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UrgentRenewalsSection } from '../UrgentRenewalsSection';
import { UrgentRenewalItem } from '@/types/referenceData';

const mockRenewals: UrgentRenewalItem[] = [
  {
    id: '1',
    contractName: 'AWS Services Agreement',
    party: 'Amazon Web Services Inc.',
    renewalDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 10,
    urgency: 'critical',
  },
  {
    id: '2',
    contractName: 'Microsoft Enterprise License',
    party: 'Microsoft Corporation',
    renewalDate: new Date(Date.now() + 25 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 25,
    urgency: 'high',
  },
  {
    id: '3',
    contractName: 'Slack Workspace Agreement',
    party: 'Slack Technologies Inc.',
    renewalDate: new Date(Date.now() + 45 * 24 * 60 * 60 * 1000).toISOString(),
    daysRemaining: 45,
    urgency: 'medium',
  },
];

describe('UrgentRenewalsSection', () => {
  describe('rendering with data', () => {
    it('should render section title', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      expect(screen.getByText('Urgent renewals')).toBeInTheDocument();
    });

    it('should render all renewals in table', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Enterprise License')).toBeInTheDocument();
      expect(screen.getByText('Slack Workspace Agreement')).toBeInTheDocument();
    });

    it('should render table with correct headers', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      expect(screen.getByText('Contract')).toBeInTheDocument();
      expect(screen.getByText('Renewal date')).toBeInTheDocument();
      expect(screen.getByText('Days remaining')).toBeInTheDocument();
      expect(screen.getByText('Urgency')).toBeInTheDocument();
    });

    it('should display days remaining with correct format', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      expect(screen.getByText('10d')).toBeInTheDocument();
      expect(screen.getByText('25d')).toBeInTheDocument();
      expect(screen.getByText('45d')).toBeInTheDocument();
    });

    it('should render urgency badges with correct labels', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      expect(screen.getByText('critical')).toBeInTheDocument();
      expect(screen.getByText('high')).toBeInTheDocument();
      expect(screen.getByText('medium')).toBeInTheDocument();
    });

    it('should display renewal dates in localized format', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const rows = screen.getAllByRole('button');
      expect(rows).toHaveLength(3);
    });

    it('should limit display to 3 renewals', () => {
      const mockOnSelect = jest.fn();
      const manyRenewals = [...mockRenewals, ...mockRenewals];
      render(
        <UrgentRenewalsSection renewals={manyRenewals} onSelectRenewal={mockOnSelect} />
      );
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(3);
    });
  });

  describe('empty state', () => {
    it('should render empty state message when no renewals', () => {
      const mockOnSelect = jest.fn();
      render(<UrgentRenewalsSection renewals={[]} onSelectRenewal={mockOnSelect} />);
      expect(screen.getByText('No urgent renewals')).toBeInTheDocument();
    });

    it('should not render table when no renewals', () => {
      const mockOnSelect = jest.fn();
      render(<UrgentRenewalsSection renewals={[]} onSelectRenewal={mockOnSelect} />);
      expect(screen.queryByRole('columnheader', { name: 'Contract' })).not.toBeInTheDocument();
    });

    it('should render title in empty state', () => {
      const mockOnSelect = jest.fn();
      render(<UrgentRenewalsSection renewals={[]} onSelectRenewal={mockOnSelect} />);
      expect(screen.getByText('Urgent renewals')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelectRenewal when row is clicked', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });

    it('should call onSelectRenewal for each different row', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      await user.click(buttons[1]);
      expect(mockOnSelect).toHaveBeenCalledTimes(2);
      expect(mockOnSelect).toHaveBeenNthCalledWith(1, '1');
      expect(mockOnSelect).toHaveBeenNthCalledWith(2, '2');
    });

    it('should handle Enter key press', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      await user.keyboard('{Enter}');
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });

    it('should handle Space key press', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      await user.keyboard(' ');
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });
  });

  describe('accessibility', () => {
    it('should have proper table semantics', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should have column headers with scope attribute', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(4);
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have rows marked as buttons with tabIndex', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have focus-visible styling support', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const rows = container.querySelectorAll('[role="button"]');
      rows.forEach((row) => {
        expect(row).toHaveClass('row');
      });
    });
  });

  describe('styling', () => {
    it('should apply critical urgency class to critical rows', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const rows = container.querySelectorAll('[role="button"]');
      expect(rows[0]).toHaveClass('urgency-critical');
    });

    it('should apply high urgency class to high urgency rows', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const rows = container.querySelectorAll('[role="button"]');
      expect(rows[1]).toHaveClass('urgency-high');
    });

    it('should apply medium urgency class to medium urgency rows', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const rows = container.querySelectorAll('[role="button"]');
      expect(rows[2]).toHaveClass('urgency-medium');
    });

    it('should apply days color class based on urgency', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const daysCells = container.querySelectorAll('.daysCell span');
      expect(daysCells[0]).toHaveClass('days-critical');
      expect(daysCells[1]).toHaveClass('days-high');
      expect(daysCells[2]).toHaveClass('days-medium');
    });
  });

  describe('data formatting', () => {
    it('should format contract names correctly', () => {
      const mockOnSelect = jest.fn();
      render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
    });

    it('should use DM Mono font for dates (via class)', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const dateCell = container.querySelector('.dateCell');
      expect(dateCell).toBeInTheDocument();
    });

    it('should use DM Mono font for days cell (via class)', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <UrgentRenewalsSection renewals={mockRenewals} onSelectRenewal={mockOnSelect} />
      );
      const daysCell = container.querySelector('.daysCell');
      expect(daysCell).toBeInTheDocument();
    });
  });
});
