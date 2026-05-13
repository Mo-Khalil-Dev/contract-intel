import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { FlagsSummary } from './FlagsSummary';

describe('FlagsSummary', () => {
  it('renders counts for each severity', () => {
    render(<FlagsSummary red={3} orange={5} green={12} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
  });

  it("renders '—' when there are no urgent (red or orange) flags", () => {
    render(<FlagsSummary green={10} />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it("renders '—' when all counts are zero", () => {
    render(<FlagsSummary />);

    expect(screen.getByText('—')).toBeInTheDocument();
  });

  it('shows red+orange even when one is zero', () => {
    render(<FlagsSummary red={2} orange={0} green={0} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.queryByText('—')).not.toBeInTheDocument();
  });

  it('exposes a screen-reader summary', () => {
    render(<FlagsSummary red={3} orange={5} green={12} />);

    expect(screen.getByLabelText('3 critical, 5 warning, 12 info flags')).toBeInTheDocument();
  });

  it('exposes empty-state aria-label when no flags', () => {
    render(<FlagsSummary />);

    expect(screen.getByLabelText('No critical or warning flags')).toBeInTheDocument();
  });

  it('hides decorative dots from screen readers', () => {
    const { container } = render(<FlagsSummary red={1} />);

    const dots = container.querySelectorAll('[aria-hidden="true"]');
    expect(dots.length).toBeGreaterThan(0);
  });
});
