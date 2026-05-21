import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { SimilarityBar } from './SimilarityBar';
import { colors } from '@/config/designTokens';

describe('SimilarityBar', () => {
  it('fills the bar proportional to value (0-1)', () => {
    const { container } = render(<SimilarityBar value={0.5} />);
    const fill = container.querySelector('[style*="width: 50%"]') as HTMLElement;
    expect(fill).toBeTruthy();
  });

  it('clamps values above 1 to 100%', () => {
    const { container } = render(<SimilarityBar value={2} />);
    const fill = container.querySelector('[style*="width: 100%"]') as HTMLElement;
    expect(fill).toBeTruthy();
  });

  it('clamps negative values to 0%', () => {
    const { container } = render(<SimilarityBar value={-0.5} />);
    const fill = container.querySelector('[style*="width: 0%"]') as HTMLElement;
    expect(fill).toBeTruthy();
  });

  it('uses blue-dark fill at >= 90% (strong match)', () => {
    const { container } = render(<SimilarityBar value={0.92} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(29, 78, 216)');
    expect(colors.blueDark).toBe('#1D4ED8');
  });

  it('uses blue fill in the 75-89% band', () => {
    const { container } = render(<SimilarityBar value={0.8} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(37, 99, 235)');
    expect(colors.blue).toBe('#2563EB');
  });

  it('uses blue-mid fill in the 50-74% band', () => {
    const { container } = render(<SimilarityBar value={0.6} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(147, 197, 253)');
  });

  it('uses ink-mute fill below 50%', () => {
    const { container } = render(<SimilarityBar value={0.3} />);
    const fill = container.querySelector('[style*="width"]') as HTMLElement;
    expect(fill.style.backgroundColor).toBe('rgb(148, 163, 184)');
  });

  it('overrides to blue-dark + blueLight track when strong is set', () => {
    const { container } = render(<SimilarityBar value={0.6} strong />);
    const fill = container.querySelector(
      '[style*="background-color: rgb(29, 78, 216)"]',
    );
    const track = container.querySelector(
      '[style*="background-color: rgb(219, 234, 254)"]',
    );
    expect(fill).toBeTruthy();
    expect(track).toBeTruthy();
  });

  it('renders three tick marks at 50/75/90 by default', () => {
    const { container } = render(<SimilarityBar value={0.6} />);
    const ticks = container.querySelectorAll('[aria-hidden="true"]');
    expect(ticks).toHaveLength(3);
  });

  it('omits tick marks when showTicks=false', () => {
    const { container } = render(<SimilarityBar value={0.6} showTicks={false} />);
    expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(0);
  });

  it('exposes correct ARIA attributes for screen readers', () => {
    const { container } = render(<SimilarityBar value={0.62} />);
    const bar = container.querySelector('[role="progressbar"]');
    expect(bar).toHaveAttribute('aria-valuenow', '62');
    expect(bar).toHaveAttribute('aria-valuemin', '0');
    expect(bar).toHaveAttribute('aria-valuemax', '100');
    expect(bar).toHaveAttribute('aria-label', '62 percent match');
  });
});
