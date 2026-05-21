import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SimilarityBar } from './SimilarityBar';

describe('SimilarityBar', () => {
  it('renders the rounded percent label', () => {
    render(<SimilarityBar value={0.94} />);
    expect(screen.getByText('94% match')).toBeInTheDocument();
  });

  it('fills the bar proportional to value (0-1)', () => {
    const { container } = render(<SimilarityBar value={0.5} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.width).toBe('50%');
  });

  it('clamps values above 1 to 100%', () => {
    const { container } = render(<SimilarityBar value={2} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.width).toBe('100%');
    expect(screen.getByText('100% match')).toBeInTheDocument();
  });

  it('clamps negative values to 0%', () => {
    const { container } = render(<SimilarityBar value={-0.5} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.width).toBe('0%');
    expect(screen.getByText('0% match')).toBeInTheDocument();
  });

  it('exposes correct ARIA attributes for screen readers', () => {
    render(<SimilarityBar value={0.62} />);
    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '62');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-label', '62 percent match');
  });
});
