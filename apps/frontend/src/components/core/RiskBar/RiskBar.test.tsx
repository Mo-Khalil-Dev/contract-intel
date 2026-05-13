import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskBar } from './RiskBar';
import { colors } from '@/config/designTokens';

describe('RiskBar', () => {
  it('renders the rounded score next to the bar', () => {
    render(<RiskBar score={73} />);

    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('fills the bar proportionally to score / max', () => {
    const { container } = render(<RiskBar score={50} max={100} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;

    expect(fill.style.width).toBe('50%');
  });

  it('uses the threshold colour for the fill', () => {
    const { container } = render(<RiskBar score={80} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;

    expect(fill.style.backgroundColor).toBe('rgb(239, 68, 68)'); // red
    expect(colors.red).toBe('#EF4444');
  });

  it('clamps scores above max', () => {
    const { container } = render(<RiskBar score={150} max={100} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;

    expect(fill.style.width).toBe('100%');
  });

  it('clamps negative scores to 0', () => {
    const { container } = render(<RiskBar score={-10} max={100} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;

    expect(fill.style.width).toBe('0%');
  });

  it('exposes correct ARIA attributes', () => {
    render(<RiskBar score={42} />);

    const bar = screen.getByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '42');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
  });

  it('supports custom max scale', () => {
    const { container } = render(<RiskBar score={7} max={10} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;

    expect(fill.style.width).toBe('70%');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuemax', '10');
  });
});
