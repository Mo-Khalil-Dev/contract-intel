import React from 'react';
import { useErrorBoundary } from './useErrorBoundary';
import { posthog } from '@/analytics/posthog';

interface ErrorBoundaryProps {
  children: React.ReactNode;
  /** Optional custom fallback UI. Receives the error and a reset function. */
  fallback?: (error: Error, reset: () => void) => React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Top-level error boundary (Layer 4).
 *
 * Catches unhandled React render errors and displays a recovery UI instead of
 * a blank screen. Pair with the <Toaster> for runtime async errors.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <App />
 *   </ErrorBoundary>
 *
 * Custom fallback:
 *   <ErrorBoundary fallback={(err, reset) => <MyErrorPage onRetry={reset} />}>
 *     <FeatureSection />
 *   </ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { error: null };
    this.reset = this.reset.bind(this);
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    // In production this is where you'd send to Sentry / LogRocket.
    // For now, log to console so it's visible during development.
    console.error('[ErrorBoundary] Uncaught error:', error, info.componentStack);
    posthog.captureException(error, { properties: { componentStack: info.componentStack } });
  }

  reset(): void {
    this.setState({ error: null });
  }

  render(): React.ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (error) {
      if (fallback) {
        return fallback(error, this.reset);
      }
      return <DefaultErrorFallback error={error} onReset={this.reset} />;
    }

    return children;
  }
}

// ── Default fallback UI ───────────────────────────────────────────────────────

interface DefaultErrorFallbackProps {
  error: Error;
  onReset: () => void;
}

// eslint-disable-next-line react-refresh/only-export-components
function DefaultErrorFallback({ error, onReset }: DefaultErrorFallbackProps) {
  const { title, description } = useErrorBoundary(error);

  return (
    <div
      role="alert"
      className="flex min-h-[400px] flex-col items-center justify-center gap-4 p-8 text-center"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-50">
        <svg
          className="h-6 w-6 text-red-500"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"
          />
        </svg>
      </div>

      <div className="space-y-1">
        <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-500">{description}</p>
      </div>

      <button
        onClick={onReset}
        className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
      >
        Try again
      </button>
    </div>
  );
}
