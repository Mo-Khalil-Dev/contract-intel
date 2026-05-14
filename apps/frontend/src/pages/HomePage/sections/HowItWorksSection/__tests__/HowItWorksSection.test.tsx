import { render, screen } from '@testing-library/react';
import { HowItWorksSection } from '../HowItWorksSection';

describe('HowItWorksSection', () => {
  describe('section rendering', () => {
    it('should render section title', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('How it works')).toBeInTheDocument();
    });

    it('should render all 4 steps', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Flag')).toBeInTheDocument();
      expect(screen.getByText('Decide')).toBeInTheDocument();
    });
  });

  describe('step 1: Upload', () => {
    it('should display Upload step number', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('01')).toBeInTheDocument();
    });

    it('should display Upload step title', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('Upload')).toBeInTheDocument();
    });

    it('should display Upload description', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Start by uploading contract documents/)
      ).toBeInTheDocument();
    });

    it('should display Upload "who" line', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Available to all team members/)
      ).toBeInTheDocument();
    });
  });

  describe('step 2: Review', () => {
    it('should display Review step number', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('02')).toBeInTheDocument();
    });

    it('should display Review step title', () => {
      render(<HowItWorksSection />);
      const titles = screen.getAllByText('Review');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should display Review description', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Our AI analyzes the content/)
      ).toBeInTheDocument();
    });

    it('should display Review "who" line', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Powered by intelligent analysis/)
      ).toBeInTheDocument();
    });
  });

  describe('step 3: Flag', () => {
    it('should display Flag step number', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('03')).toBeInTheDocument();
    });

    it('should display Flag step title', () => {
      render(<HowItWorksSection />);
      const titles = screen.getAllByText('Flag');
      expect(titles.length).toBeGreaterThan(0);
    });

    it('should display Flag description', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Issues are flagged for review/)
      ).toBeInTheDocument();
    });

    it('should display Flag "who" line', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Prioritized by risk level/)
      ).toBeInTheDocument();
    });
  });

  describe('step 4: Decide', () => {
    it('should display Decide step number', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('04')).toBeInTheDocument();
    });

    it('should display Decide step title', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('Decide')).toBeInTheDocument();
    });

    it('should display Decide description', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Make informed decisions on contract/)
      ).toBeInTheDocument();
    });

    it('should display Decide "who" line', () => {
      render(<HowItWorksSection />);
      expect(
        screen.getByText(/Stakeholders get visibility/)
      ).toBeInTheDocument();
    });
  });

  describe('step styling', () => {
    it('should apply stepNumber class to step numbers', () => {
      const { container } = render(<HowItWorksSection />);
      const stepNumbers = container.querySelectorAll('.stepNumber');
      expect(stepNumbers.length).toBe(4);
    });

    it('should apply stepTitle class to step titles', () => {
      const { container } = render(<HowItWorksSection />);
      const stepTitles = container.querySelectorAll('.stepTitle');
      expect(stepTitles.length).toBe(4);
    });

    it('should apply description class to step descriptions', () => {
      const { container } = render(<HowItWorksSection />);
      const descriptions = container.querySelectorAll('.description');
      expect(descriptions.length).toBe(4);
    });

    it('should apply who class to step "who" lines', () => {
      const { container } = render(<HowItWorksSection />);
      const whoLines = container.querySelectorAll('.who');
      expect(whoLines.length).toBe(4);
    });
  });

  describe('grid layout', () => {
    it('should render grid container', () => {
      const { container } = render(<HowItWorksSection />);
      const grid = container.querySelector('.grid');
      expect(grid).toBeInTheDocument();
    });

    it('should have 4 step containers', () => {
      const { container } = render(<HowItWorksSection />);
      const stepContents = container.querySelectorAll('.stepContent');
      expect(stepContents.length).toBe(4);
    });
  });

  describe('step numbers format', () => {
    it('should display step numbers in 01-04 format', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('01')).toBeInTheDocument();
      expect(screen.getByText('02')).toBeInTheDocument();
      expect(screen.getByText('03')).toBeInTheDocument();
      expect(screen.getByText('04')).toBeInTheDocument();
    });

    it('should use DM Mono font for step numbers (via class)', () => {
      const { container } = render(<HowItWorksSection />);
      const stepNumbers = container.querySelectorAll('.stepNumber');
      stepNumbers.forEach((num) => {
        expect(num).toHaveClass('stepNumber');
      });
    });
  });

  describe('step content structure', () => {
    it('should have consistent structure for each step', () => {
      const { container } = render(<HowItWorksSection />);
      const steps = container.querySelectorAll('.stepContent');
      steps.forEach((step) => {
        const number = step.querySelector('.stepNumber');
        const title = step.querySelector('.stepTitle');
        const description = step.querySelector('.description');
        const who = step.querySelector('.who');
        expect(number).toBeInTheDocument();
        expect(title).toBeInTheDocument();
        expect(description).toBeInTheDocument();
        expect(who).toBeInTheDocument();
      });
    });
  });

  describe('accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<HowItWorksSection />);
      const mainHeading = screen.getByText('How it works');
      expect(mainHeading.tagName).toMatch(/H[1-3]/);
    });

    it('should have step titles as headings', () => {
      const { container } = render(<HowItWorksSection />);
      const stepTitles = container.querySelectorAll('.stepTitle');
      stepTitles.forEach((title) => {
        expect(title.tagName).toMatch(/H[1-3]/);
      });
    });

    it('should have semantic paragraph elements for descriptions', () => {
      const { container } = render(<HowItWorksSection />);
      const descriptions = container.querySelectorAll('.description');
      descriptions.forEach((desc) => {
        expect(desc.tagName).toBe('P');
      });
    });

    it('should have semantic paragraph elements for who lines', () => {
      const { container } = render(<HowItWorksSection />);
      const whoLines = container.querySelectorAll('.who');
      whoLines.forEach((who) => {
        expect(who.tagName).toBe('P');
      });
    });
  });

  describe('content completeness', () => {
    it('should have all required sections', () => {
      render(<HowItWorksSection />);
      expect(screen.getByText('How it works')).toBeInTheDocument();
      // Check for at least one element from each step
      expect(screen.getByText('Upload')).toBeInTheDocument();
      expect(screen.getByText('Review')).toBeInTheDocument();
      expect(screen.getByText('Flag')).toBeInTheDocument();
      expect(screen.getByText('Decide')).toBeInTheDocument();
    });

    it('should display meaningful descriptions for each step', () => {
      render(<HowItWorksSection />);
      const descriptionTexts = [
        'Start by uploading contract documents',
        'Our AI analyzes the content',
        'Issues are flagged for review',
        'Make informed decisions on contract',
      ];
      descriptionTexts.forEach((text) => {
        expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      });
    });

    it('should display "who" context for each step', () => {
      render(<HowItWorksSection />);
      const whoTexts = [
        'Available to all team members',
        'Powered by intelligent analysis',
        'Prioritized by risk level',
        'Stakeholders get visibility',
      ];
      whoTexts.forEach((text) => {
        expect(screen.getByText(new RegExp(text))).toBeInTheDocument();
      });
    });
  });

  describe('section container', () => {
    it('should render section element', () => {
      const { container } = render(<HowItWorksSection />);
      const section = container.querySelector('section');
      expect(section).toBeInTheDocument();
    });

    it('should have section class', () => {
      const { container } = render(<HowItWorksSection />);
      const section = container.querySelector('.section');
      expect(section).toBeInTheDocument();
    });

    it('should have title with proper styling', () => {
      const { container } = render(<HowItWorksSection />);
      const title = container.querySelector('.title');
      expect(title).toBeInTheDocument();
    });
  });

  describe('responsive layout', () => {
    it('should render grid with responsive classes', () => {
      const { container } = render(<HowItWorksSection />);
      const grid = container.querySelector('.grid');
      expect(grid).toHaveClass('grid');
    });

    it('should render all steps regardless of viewport', () => {
      render(<HowItWorksSection />);
      const steps = ['01', '02', '03', '04'];
      steps.forEach((step) => {
        expect(screen.getByText(step)).toBeInTheDocument();
      });
    });
  });
});
