import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ErrorBoundary } from './ErrorBoundary';
import { AppError } from '@/errors';

// Suppress console.error noise from intentional throws in tests
beforeEach(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

// Helper: a component that throws on render
function Bomb({ error }: { error: Error }) {
  throw error;
}

describe('ErrorBoundary', () => {
  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('shows the default fallback when a plain Error is thrown', () => {
    render(
      <ErrorBoundary>
        <Bomb error={new Error('boom')} />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('shows a network-specific message for AppError with status 0', () => {
    const err = new AppError({
      message: 'Network error',
      code: 'NETWORK_ERROR',
      status: 0,
      detail: 'Unable to reach the server.',
    });
    render(
      <ErrorBoundary>
        <Bomb error={err} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Connection problem')).toBeInTheDocument();
  });

  it('shows an access-denied message for AppError with status 403', () => {
    const err = new AppError({
      message: 'Forbidden',
      code: 'FORBIDDEN',
      status: 403,
      detail: 'Forbidden.',
    });
    render(
      <ErrorBoundary>
        <Bomb error={err} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });

  it('resets and re-renders children when "Try again" is clicked', () => {
    let shouldThrow = true;

    function MaybeThrow() {
      if (shouldThrow) throw new Error('boom');
      return <p>Recovered</p>;
    }

    render(
      <ErrorBoundary>
        <MaybeThrow />
      </ErrorBoundary>,
    );

    expect(screen.getByRole('alert')).toBeInTheDocument();

    shouldThrow = false;
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    expect(screen.getByText('Recovered')).toBeInTheDocument();
  });

  it('renders a custom fallback when provided', () => {
    render(
      <ErrorBoundary
        fallback={(err, reset) => <button onClick={reset}>Custom: {err.message}</button>}
      >
        <Bomb error={new Error('custom error')} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Custom: custom error')).toBeInTheDocument();
  });
});
