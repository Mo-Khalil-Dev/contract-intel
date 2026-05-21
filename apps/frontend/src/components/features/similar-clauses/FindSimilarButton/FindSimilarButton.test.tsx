import { render, screen, fireEvent } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { FindSimilarButton } from './FindSimilarButton';

describe('FindSimilarButton', () => {
  it('renders the default label and calls onClick when clicked', () => {
    const onClick = vi.fn();
    render(<FindSimilarButton onClick={onClick} />);
    const btn = screen.getByRole('button', { name: /Find similar/i });
    fireEvent.click(btn);
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('shows the loading label and a spinner when isLoading is true', () => {
    render(<FindSimilarButton onClick={() => {}} isLoading />);
    expect(screen.getByText(/Finding…/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('disables the button while loading', () => {
    render(<FindSimilarButton onClick={() => {}} isLoading />);
    expect(screen.getByRole('button')).toBeDisabled();
  });

  it('renders nothing when hidden is true (un-embedded clause)', () => {
    const { container } = render(
      <FindSimilarButton onClick={() => {}} hidden />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('carries a tooltip hint about the keyboard shortcut', () => {
    render(<FindSimilarButton onClick={() => {}} />);
    expect(screen.getByRole('button')).toHaveAttribute(
      'title',
      expect.stringContaining('(F)'),
    );
  });
});
