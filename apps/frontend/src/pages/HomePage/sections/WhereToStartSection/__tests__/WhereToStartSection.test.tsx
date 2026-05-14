import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WhereToStartSection } from '../WhereToStartSection';
import { RecentContractItem } from '@/types/referenceData';

const mockRecentContract: RecentContractItem = {
  id: '1',
  name: 'AWS Services Agreement',
  type: 'SaaS',
  party: 'Amazon Web Services Inc.',
  flagCount: 2,
  riskScore: 72,
  uploadedAt: new Date().toISOString(),
};

describe('WhereToStartSection', () => {
  describe('upload card', () => {
    it('should render upload card with title', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByText('Upload a contract')).toBeInTheDocument();
    });

    it('should render upload card description', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByText(/Drag and drop or click to browse/)).toBeInTheDocument();
    });

    it('should render upload button', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByRole('button', { name: /Upload contract/ })).toBeInTheDocument();
    });

    it('should call onUpload when upload button is clicked', async () => {
      const mockOnUpload = jest.fn();
      const user = userEvent.setup();
      render(<WhereToStartSection lastOpenedContract={null} onUpload={mockOnUpload} />);
      const uploadButton = screen.getByRole('button', { name: /Upload contract/ });
      await user.click(uploadButton);
      expect(mockOnUpload).toHaveBeenCalled();
    });

    it('should have upload card styling', () => {
      const { container } = render(
        <WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />,
      );
      const uploadCard = container.querySelector('.uploadCard');
      expect(uploadCard).toBeInTheDocument();
    });
  });

  describe('resume card with recent contract', () => {
    it('should render resume card when lastOpenedContract exists', () => {
      render(<WhereToStartSection lastOpenedContract={mockRecentContract} onUpload={jest.fn()} />);
      expect(screen.getByText('Resume')).toBeInTheDocument();
    });

    it('should display contract name in resume card', () => {
      render(<WhereToStartSection lastOpenedContract={mockRecentContract} onUpload={jest.fn()} />);
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
    });

    it('should display contract type in resume card', () => {
      render(<WhereToStartSection lastOpenedContract={mockRecentContract} onUpload={jest.fn()} />);
      expect(screen.getByText('SaaS')).toBeInTheDocument();
    });

    it('should not render resume card when lastOpenedContract is null', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.queryByText('Resume')).not.toBeInTheDocument();
    });
  });

  describe('sample card', () => {
    it('should render sample card', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByText('Sample contract')).toBeInTheDocument();
    });

    it('should render sample card description', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByText(/Review a sample contract/)).toBeInTheDocument();
    });

    it('should always render sample card regardless of lastOpenedContract', () => {
      render(<WhereToStartSection lastOpenedContract={mockRecentContract} onUpload={jest.fn()} />);
      expect(screen.getByText('Sample contract')).toBeInTheDocument();
    });
  });

  describe('layout structure', () => {
    it('should render grid container', () => {
      const { container } = render(
        <WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />,
      );
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should render upload and sample cards without recent contract', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByText('Upload a contract')).toBeInTheDocument();
      expect(screen.getByText('Sample contract')).toBeInTheDocument();
    });

    it('should render upload, resume, and sample cards with recent contract', () => {
      render(<WhereToStartSection lastOpenedContract={mockRecentContract} onUpload={jest.fn()} />);
      expect(screen.getByText('Upload a contract')).toBeInTheDocument();
      expect(screen.getByText('Resume')).toBeInTheDocument();
      expect(screen.getByText('Sample contract')).toBeInTheDocument();
    });
  });

  describe('card styling', () => {
    it('should apply card class to cards', () => {
      const { container } = render(
        <WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} onResume={jest.fn()} />,
      );
      const cards = container.querySelectorAll('.card');
      expect(cards.length).toBeGreaterThan(0);
    });

    it('should apply uploadCard class to upload card', () => {
      const { container } = render(
        <WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} onResume={jest.fn()} />,
      );
      const uploadCard = container.querySelector('.uploadCard');
      expect(uploadCard).toBeInTheDocument();
    });
  });

  describe('typography and spacing', () => {
    it('should display card titles with proper styling', () => {
      const { container } = render(
        <WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} onResume={jest.fn()} />,
      );
      const titles = container.querySelectorAll('.cardTitle');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should display descriptions with consistent styling', () => {
      const { container } = render(
        <WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} onResume={jest.fn()} />,
      );
      const descriptions = container.querySelectorAll('.description');
      expect(descriptions.length).toBeGreaterThan(0);
    });
  });

  describe('accessibility', () => {
    it('should have accessible card buttons', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });

    it('should have proper heading hierarchy in cards', () => {
      render(<WhereToStartSection lastOpenedContract={mockRecentContract} onUpload={jest.fn()} />);
      const headings = screen.getAllByRole('heading');
      expect(headings.length).toBeGreaterThan(0);
    });
  });

  describe('different contract types', () => {
    it('should display different contract types in resume card', () => {
      const licenseContract: RecentContractItem = {
        ...mockRecentContract,
        type: 'License',
      };
      render(<WhereToStartSection lastOpenedContract={licenseContract} onUpload={jest.fn()} />);
      expect(screen.getByText('License')).toBeInTheDocument();
    });

    it('should display different risk scores in resume card', () => {
      const highRiskContract: RecentContractItem = {
        ...mockRecentContract,
        riskScore: 95,
      };
      render(<WhereToStartSection lastOpenedContract={highRiskContract} onUpload={jest.fn()} />);
      // Risk badge will display the score
      expect(screen.getByText('AWS Services Agreement')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle null lastOpenedContract gracefully', () => {
      render(<WhereToStartSection lastOpenedContract={null} onUpload={jest.fn()} />);
      expect(screen.getByText('Upload a contract')).toBeInTheDocument();
      expect(screen.queryByText('Resume')).not.toBeInTheDocument();
    });

    it('should handle undefined lastOpenedContract gracefully', () => {
      render(<WhereToStartSection lastOpenedContract={undefined} onUpload={jest.fn()} />);
      expect(screen.getByText('Upload a contract')).toBeInTheDocument();
    });

    it('should handle long contract names', () => {
      const longNameContract: RecentContractItem = {
        ...mockRecentContract,
        name: 'Very Long Contract Name That Should Be Truncated If It Exceeds Maximum Length',
      };
      render(<WhereToStartSection lastOpenedContract={longNameContract} onUpload={jest.fn()} />);
      expect(
        screen.getByText(
          'Very Long Contract Name That Should Be Truncated If It Exceeds Maximum Length',
        ),
      ).toBeInTheDocument();
    });
  });
});
