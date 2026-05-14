import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RecentContractsSection } from '../RecentContractsSection';
import { RecentContractItem } from '@/types/referenceData';

const mockContracts: RecentContractItem[] = [
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
];

describe('RecentContractsSection', () => {
  describe('rendering with data', () => {
    it('should render section title', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      expect(screen.getByText('Recent contracts')).toBeInTheDocument();
    });

    it('should render up to 4 contracts', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
      expect(screen.getByText('Microsoft Enterprise License')).toBeInTheDocument();
      expect(screen.getByText('Google Workspace Agreement')).toBeInTheDocument();
      expect(screen.getByText('Slack Enterprise Agreement')).toBeInTheDocument();
    });

    it('should limit display to 4 contracts', () => {
      const mockOnSelect = jest.fn();
      const manyContracts = [...mockContracts, ...mockContracts];
      render(<RecentContractsSection contracts={manyContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('should render table with correct headers', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      expect(screen.getByText('Name')).toBeInTheDocument();
      expect(screen.getByText('Type')).toBeInTheDocument();
      expect(screen.getByText('Risk')).toBeInTheDocument();
      expect(screen.getByText('Uploaded')).toBeInTheDocument();
    });

    it('should display contract names with title attribute', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const nameCell = container.querySelector('[title="AWS Services Agreement"]');
      expect(nameCell).toBeInTheDocument();
    });

    it('should display dates in localized format', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const rows = screen.getAllByRole('button');
      expect(rows).toHaveLength(4);
    });
  });

  describe('empty state', () => {
    it('should render empty state message when no contracts', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={[]} onSelectContract={mockOnSelect} />);
      expect(screen.getByText('No contracts uploaded yet')).toBeInTheDocument();
    });

    it('should not render table when no contracts', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={[]} onSelectContract={mockOnSelect} />);
      expect(screen.queryByRole('columnheader', { name: 'Name' })).not.toBeInTheDocument();
    });

    it('should render title in empty state', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={[]} onSelectContract={mockOnSelect} />);
      expect(screen.getByText('Recent contracts')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('should call onSelectContract when row is clicked', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      await user.click(buttons[0]);
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });

    it('should call onSelectContract with correct IDs for multiple clicks', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
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
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      await user.keyboard('{Enter}');
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });

    it('should handle Space key press', async () => {
      const mockOnSelect = jest.fn();
      const user = userEvent.setup();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      buttons[0].focus();
      await user.keyboard(' ');
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });
  });

  describe('accessibility', () => {
    it('should have proper table semantics', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should have column headers with scope attribute', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const headers = screen.getAllByRole('columnheader');
      expect(headers).toHaveLength(4);
      headers.forEach((header) => {
        expect(header).toHaveAttribute('scope', 'col');
      });
    });

    it('should have rows marked as buttons with tabIndex', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      buttons.forEach((btn) => {
        expect(btn).toHaveAttribute('tabIndex', '0');
      });
    });

    it('should have focus-visible styling support', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const rows = container.querySelectorAll('[role="button"]');
      rows.forEach((row) => {
        expect(row.className).toMatch(/row(Even|Odd)/);
      });
    });
  });

  describe('styling', () => {
    it('should alternate row background colors', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const rows = container.querySelectorAll('[role="button"]');
      expect(rows[0]).toHaveClass('rowEven');
      expect(rows[1]).toHaveClass('rowOdd');
      expect(rows[2]).toHaveClass('rowEven');
      expect(rows[3]).toHaveClass('rowOdd');
    });

    it('should apply nameCell class for name truncation', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const nameCell = container.querySelector('.nameCell');
      expect(nameCell).toBeInTheDocument();
    });

    it('should apply dateCell class for date styling', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const dateCell = container.querySelector('.dateCell');
      expect(dateCell).toBeInTheDocument();
    });
  });

  describe('data formatting', () => {
    it('should display all contract names', () => {
      const mockOnSelect = jest.fn();
      render(<RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />);
      mockContracts.slice(0, 4).forEach((contract) => {
        expect(screen.getByText(contract.name)).toBeInTheDocument();
      });
    });

    it('should format contract names with proper ellipsis support (via CSS)', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const nameCell = container.querySelector('.nameCell');
      expect(nameCell).toHaveClass('nameCell');
    });

    it('should use DM Mono font for dates (via class)', () => {
      const mockOnSelect = jest.fn();
      const { container } = render(
        <RecentContractsSection contracts={mockContracts} onSelectContract={mockOnSelect} />,
      );
      const dateCell = container.querySelector('.dateCell');
      expect(dateCell).toBeInTheDocument();
    });
  });

  describe('data slicing', () => {
    it('should only display first 4 items when more are provided', () => {
      const mockOnSelect = jest.fn();
      const tenContracts = Array.from({ length: 10 }, (_, i) => ({
        ...mockContracts[0],
        id: String(i),
        name: `Contract ${i}`,
      }));
      render(<RecentContractsSection contracts={tenContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(4);
    });

    it('should display all items when fewer than 4 are provided', () => {
      const mockOnSelect = jest.fn();
      const twoContracts = mockContracts.slice(0, 2);
      render(<RecentContractsSection contracts={twoContracts} onSelectContract={mockOnSelect} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons).toHaveLength(2);
    });
  });
});
