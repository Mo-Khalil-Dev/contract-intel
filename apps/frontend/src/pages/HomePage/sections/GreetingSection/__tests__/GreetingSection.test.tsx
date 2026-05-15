import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GreetingSection } from '../GreetingSection';

describe('GreetingSection', () => {
  describe('greeting text', () => {
    it('should render greeting with user name', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="John Doe"
          criticalFlagCount={2}
          urgentRenewalCount={3}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/John Doe\./)).toBeInTheDocument();
    });

    it('should include period in greeting', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="Jane Smith"
          criticalFlagCount={0}
          urgentRenewalCount={1}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/Jane Smith\.$/)).toBeInTheDocument();
    });
  });

  describe('greeting variant', () => {
    beforeEach(() => {
      jest.useFakeTimers();
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('should display morning greeting between 5 AM and 11:59 AM', () => {
      jest.setSystemTime(new Date('2024-01-15T08:00:00'));
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="Alice"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/Good morning/)).toBeInTheDocument();
    });

    it('should display afternoon greeting between 12 PM and 5:59 PM', () => {
      jest.setSystemTime(new Date('2024-01-15T14:00:00'));
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="Bob"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/Good afternoon/)).toBeInTheDocument();
    });

    it('should display evening greeting between 6 PM and 4:59 AM', () => {
      jest.setSystemTime(new Date('2024-01-15T20:00:00'));
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="Charlie"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/Good evening/)).toBeInTheDocument();
    });
  });

  describe('stats display', () => {
    it('should display critical flag count', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={5}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should display urgent renewal count', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={7}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText('7')).toBeInTheDocument();
    });

    it('should display zero critical flags', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={5}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should display critical flag label and pluralization', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={2}
          urgentRenewalCount={3}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/2 critical flag/)).toBeInTheDocument();
    });

    it('should display urgent renewal label and pluralization', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={2}
          urgentRenewalCount={3}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/3 urgent renewal/)).toBeInTheDocument();
    });
  });

  describe('buttons', () => {
    it('should render "View all contracts" button', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByRole('button', { name: /View all contracts/ })).toBeInTheDocument();
    });

    it('should render "+ Upload contract" button', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByRole('button', { name: /Upload contract/ })).toBeInTheDocument();
    });

    it('should call onViewAll when "View all contracts" is clicked', async () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      const user = userEvent.setup();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      const viewAllButton = screen.getByRole('button', { name: /View all contracts/ });
      await user.click(viewAllButton);
      expect(mockOnViewAll).toHaveBeenCalled();
    });

    it('should call onUpload when "+ Upload contract" is clicked', async () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      const user = userEvent.setup();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      const uploadButton = screen.getByRole('button', { name: /Upload contract/ });
      await user.click(uploadButton);
      expect(mockOnUpload).toHaveBeenCalled();
    });
  });

  describe('styling', () => {
    it('should apply greeting class', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      const { container } = render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      const greeting = container.querySelector('.greeting');
      expect(greeting).toBeInTheDocument();
    });

    it('should apply context class to stats row', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      const { container } = render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      const context = container.querySelector('.context');
      expect(context).toBeInTheDocument();
    });
  });

  describe('stat display logic', () => {
    it('should display both stats always', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={2}
          urgentRenewalCount={3}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/2 critical flag/)).toBeInTheDocument();
      expect(screen.getByText(/3 urgent renewal/)).toBeInTheDocument();
    });

    it('should handle singular flag label', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={1}
          urgentRenewalCount={0}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/1 critical flag[^s]/)).toBeInTheDocument();
    });

    it('should handle singular renewal label', () => {
      const mockOnViewAll = jest.fn();
      const mockOnUpload = jest.fn();
      render(
        <GreetingSection
          displayName="User"
          criticalFlagCount={0}
          urgentRenewalCount={1}
          onViewAll={mockOnViewAll}
          onUpload={mockOnUpload}
        />,
      );
      expect(screen.getByText(/1 urgent renewal[^s]/)).toBeInTheDocument();
    });
  });
});
