import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { RiskBadge } from './RiskBadge';
import { colors } from '@/config/designTokens';

describe('RiskBadge', () => {
  it('renders the score (rounded)', () => {
    render(<RiskBadge score={73} />);

    expect(screen.getByText('73')).toBeInTheDocument();
  });

  it('rounds non-integer scores for display', () => {
    render(<RiskBadge score={42.7} />);

    expect(screen.getByText('43')).toBeInTheDocument();
  });

  it('uses high-risk colour for scores >= 70', () => {
    render(<RiskBadge score={80} />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveStyle({ backgroundColor: colors.redBg });
  });

  it('uses medium-risk colour for scores in [40, 70)', () => {
    render(<RiskBadge score={55} />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveStyle({ backgroundColor: colors.orangeBg });
  });

  it('uses low-risk colour for scores below 40', () => {
    render(<RiskBadge score={20} />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveStyle({ backgroundColor: colors.greenBg });
  });

  it('exposes a descriptive aria-label', () => {
    render(<RiskBadge score={85} />);

    expect(screen.getByRole('status')).toHaveAttribute('aria-label', 'High Risk — score 85');
  });

  it('applies sm size by default', () => {
    render(<RiskBadge score={50} />);

    const badge = screen.getByRole('status');
    expect(badge.className).toContain('px-2');
    expect(screen.getByText('50').className).toContain('text-xs');
  });

  it('applies lg size when explicitly requested', () => {
    render(<RiskBadge score={50} size="lg" />);

    const badge = screen.getByRole('status');
    expect(badge.className).toContain('px-3');
    expect(screen.getByText('50').className).toContain('text-sm');
  });

  it('supports custom max scale (wireframe 0-10)', () => {
    render(<RiskBadge score={8} max={10} />);

    const badge = screen.getByRole('status');
    expect(badge).toHaveStyle({ backgroundColor: colors.redBg });
    expect(screen.getByText('8')).toBeInTheDocument();
  });

  it('marks the colour dot as decorative (aria-hidden)', () => {
    const { container } = render(<RiskBadge score={50} />);

    const dot = container.querySelector('[aria-hidden="true"]');
    expect(dot).toBeInTheDocument();
  });
});
