import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { KPICard } from './KPICard';

describe('KPICard', () => {
  it('renders label and value', () => {
    render(<KPICard label="Active Contracts" value={142} />);

    expect(screen.getByText('Active Contracts')).toBeInTheDocument();
    expect(screen.getByText('142')).toBeInTheDocument();
  });

  it('renders ReactNode values', () => {
    render(<KPICard label="Status" value={<strong>OK</strong>} />);

    expect(screen.getByText('OK')).toBeInTheDocument();
  });

  it('renders an "up" delta in green', () => {
    const { container } = render(
      <KPICard label="Contracts" value={100} delta={{ direction: 'up', text: '+5 this week' }} />,
    );

    expect(screen.getByText(/\+5 this week/)).toBeInTheDocument();
    const delta = container.querySelector('[style*="color"]') as HTMLElement;
    expect(delta.style.color).toBe('rgb(16, 185, 129)'); // green
    expect(screen.getByText('▲')).toBeInTheDocument();
  });

  it('renders a "down" delta in red', () => {
    const { container } = render(
      <KPICard
        label="Critical Flags"
        value={3}
        delta={{ direction: 'down', text: '-2 vs last week' }}
      />,
    );

    const delta = container.querySelector('[style*="color"]') as HTMLElement;
    expect(delta.style.color).toBe('rgb(239, 68, 68)'); // red
    expect(screen.getByText('▼')).toBeInTheDocument();
  });

  it('renders a "flat" delta in ink-soft', () => {
    const { container } = render(
      <KPICard label="Renewals" value={8} delta={{ direction: 'flat', text: 'No change' }} />,
    );

    const delta = container.querySelector('[style*="color"]') as HTMLElement;
    expect(delta.style.color).toBe('rgb(100, 116, 139)'); // ink-soft
  });

  it('renders optional hint', () => {
    render(<KPICard label="Risk Score" value={72} hint="Across 142 active contracts" />);

    expect(screen.getByText('Across 142 active contracts')).toBeInTheDocument();
  });

  it('skips delta when not provided', () => {
    render(<KPICard label="Total" value={142} />);

    expect(screen.queryByText('▲')).not.toBeInTheDocument();
    expect(screen.queryByText('▼')).not.toBeInTheDocument();
  });
});
