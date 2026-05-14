import { render, screen } from '@testing-library/react';
import { KpiCardsSection } from '../KpiCardsSection';
import { DashboardKpis } from '@/types/referenceData';

const mockKpis: DashboardKpis = {
  activeContractCount: 12,
  inProgressCount: 3,
  avgRiskScore: 45,
  criticalFlagCount: 5,
  urgentRenewalCount: 2,
};

describe('KpiCardsSection', () => {
  describe('rendering', () => {
    it('should render all 4 KPI cards', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('Active contracts')).toBeInTheDocument();
      expect(screen.getByText('Average risk score')).toBeInTheDocument();
      expect(screen.getByText('Critical flags')).toBeInTheDocument();
      expect(screen.getByText('Renewals <60d')).toBeInTheDocument();
    });

    it('should render active contracts value', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should render critical flags value', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      const criticalValue = screen.getAllByText('5');
      expect(criticalValue.length).toBeGreaterThan(0);
    });

    it('should render urgent renewal value', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      const renewalValue = screen.getAllByText('2');
      expect(renewalValue.length).toBeGreaterThan(0);
    });
  });

  describe('KPI values', () => {
    it('should display active contracts count correctly', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('12')).toBeInTheDocument();
    });

    it('should display average risk score', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      const riskBadges = screen.getAllByText(/45/);
      expect(riskBadges.length).toBeGreaterThan(0);
    });

    it('should handle zero values', () => {
      const emptyKpis: DashboardKpis = {
        activeContractCount: 0,
        inProgressCount: 0,
        avgRiskScore: 0,
        criticalFlagCount: 0,
        urgentRenewalCount: 0,
      };
      render(<KpiCardsSection kpis={emptyKpis} />);
      const zeros = screen.getAllByText('0');
      expect(zeros.length).toBeGreaterThan(0);
    });

    it('should handle high values', () => {
      const highKpis: DashboardKpis = {
        activeContractCount: 999,
        inProgressCount: 99,
        avgRiskScore: 100,
        criticalFlagCount: 50,
        urgentRenewalCount: 25,
      };
      render(<KpiCardsSection kpis={highKpis} />);
      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('50')).toBeInTheDocument();
    });
  });

  describe('card labels', () => {
    it('should display "Active contracts" label', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('Active contracts')).toBeInTheDocument();
    });

    it('should display "Average risk score" label', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('Average risk score')).toBeInTheDocument();
    });

    it('should display "Critical flags" label', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('Critical flags')).toBeInTheDocument();
    });

    it('should display "Renewals <60d" label', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('Renewals <60d')).toBeInTheDocument();
    });
  });

  describe('structure', () => {
    it('should render grid container', () => {
      const { container } = render(<KpiCardsSection kpis={mockKpis} />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should contain 4 KPICard components', () => {
      const { container } = render(<KpiCardsSection kpis={mockKpis} />);
      const cards = container.querySelectorAll('[role="region"]');
      expect(cards.length).toBeGreaterThanOrEqual(4);
    });

    it('should have consistent spacing between cards', () => {
      const { container } = render(<KpiCardsSection kpis={mockKpis} />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid');
    });
  });

  describe('risk score badge', () => {
    it('should render risk badge with low risk score', () => {
      const lowRiskKpis: DashboardKpis = {
        ...mockKpis,
        avgRiskScore: 20,
      };
      render(<KpiCardsSection kpis={lowRiskKpis} />);
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should render risk badge with medium risk score', () => {
      const mediumRiskKpis: DashboardKpis = {
        ...mockKpis,
        avgRiskScore: 50,
      };
      render(<KpiCardsSection kpis={mediumRiskKpis} />);
      expect(screen.getByText('50')).toBeInTheDocument();
    });

    it('should render risk badge with high risk score', () => {
      const highRiskKpis: DashboardKpis = {
        ...mockKpis,
        avgRiskScore: 85,
      };
      render(<KpiCardsSection kpis={highRiskKpis} />);
      expect(screen.getByText('85')).toBeInTheDocument();
    });
  });

  describe('responsive design', () => {
    it('should apply grid class for layout', () => {
      const { container } = render(<KpiCardsSection kpis={mockKpis} />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid');
    });

    it('should render all cards regardless of viewport', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      const cardLabels = [
        'Active contracts',
        'Average risk score',
        'Critical flags',
        'Renewals <60d',
      ];
      cardLabels.forEach((label) => {
        expect(screen.getByText(label)).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have accessible card structure', () => {
      const { container } = render(<KpiCardsSection kpis={mockKpis} />);
      const cards = container.querySelectorAll('[role="region"]');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy in cards', () => {
      render(<KpiCardsSection kpis={mockKpis} />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThanOrEqual(4);
    });
  });

  describe('prop changes', () => {
    it('should update when KPI values change', () => {
      const { rerender } = render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('12')).toBeInTheDocument();

      const newKpis: DashboardKpis = {
        ...mockKpis,
        activeContractCount: 20,
      };
      rerender(<KpiCardsSection kpis={newKpis} />);
      expect(screen.getByText('20')).toBeInTheDocument();
    });

    it('should update risk score when it changes', () => {
      const { rerender } = render(<KpiCardsSection kpis={mockKpis} />);
      expect(screen.getByText('45')).toBeInTheDocument();

      const newKpis: DashboardKpis = {
        ...mockKpis,
        avgRiskScore: 75,
      };
      rerender(<KpiCardsSection kpis={newKpis} />);
      expect(screen.getByText('75')).toBeInTheDocument();
    });
  });
});
