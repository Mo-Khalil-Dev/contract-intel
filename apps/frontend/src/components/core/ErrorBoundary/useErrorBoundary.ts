import { AppError } from '@/errors';

interface ErrorBoundaryViewModel {
  title: string;
  description: string;
}

/**
 * Derives user-friendly copy from the caught error.
 * Keeps all display logic out of the class component.
 */
export function useErrorBoundary(error: Error): ErrorBoundaryViewModel {
  if (error instanceof AppError) {
    if (error.isNetworkError) {
      return {
        title: 'Connection problem',
        description: 'Unable to reach the server. Please check your connection and try again.',
      };
    }
    if (error.status === 403) {
      return {
        title: 'Access denied',
        description: "You don't have permission to view this page.",
      };
    }
    if (error.status === 404) {
      return {
        title: 'Not found',
        description: "The page or resource you're looking for doesn't exist.",
      };
    }
    return {
      title: 'Something went wrong',
      description: error.detail,
    };
  }

  return {
    title: 'Something went wrong',
    description: 'An unexpected error occurred. Please try again or contact support.',
  };
}
