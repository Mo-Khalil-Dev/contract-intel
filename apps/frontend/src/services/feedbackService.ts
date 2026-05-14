import { toast } from 'sonner';
import { AppError } from '@/errors';

/**
 * Centralised user feedback service (Layer 4).
 *
 * All toasts, notifications, and user-facing error messages go through here.
 * Components and hooks MUST NOT call `toast` directly — always use this service.
 *
 * This keeps the feedback mechanism swappable (e.g. replace sonner with another
 * library) without touching any hook or component.
 */
export const feedbackService = {
  /**
   * Show a success toast.
   * @example feedbackService.success('Contract approved')
   */
  success(message: string, description?: string): void {
    toast.success(message, { description });
  },

  /**
   * Show an error toast.
   * Accepts either a plain message string or an AppError — in the latter case
   * the user-friendly `detail` is shown automatically.
   * @example feedbackService.error(err)
   * @example feedbackService.error('Failed to upload contract')
   */
  error(messageOrError: string | AppError | unknown, description?: string): void {
    if (messageOrError instanceof AppError) {
      toast.error(messageOrError.detail, {
        description: messageOrError.correlationId
          ? `Reference: ${messageOrError.correlationId}`
          : undefined,
      });
      return;
    }

    if (typeof messageOrError === 'string') {
      toast.error(messageOrError, { description });
      return;
    }

    // Unknown error shape — show generic message
    toast.error('An unexpected error occurred. Please try again.');
  },

  /**
   * Show a warning toast.
   * @example feedbackService.warning('Your session will expire in 5 minutes')
   */
  warning(message: string, description?: string): void {
    toast.warning(message, { description });
  },

  /**
   * Show an informational toast.
   * @example feedbackService.info('Analysis is running in the background')
   */
  info(message: string, description?: string): void {
    toast.info(message, { description });
  },

  /**
   * Show a loading toast that can be updated to success/error.
   * Returns the toast ID so you can dismiss or update it.
   * @example
   *   const id = feedbackService.loading('Uploading contract...')
   *   // later:
   *   feedbackService.dismiss(id)
   */
  loading(message: string): string | number {
    return toast.loading(message);
  },

  /**
   * Dismiss a specific toast by ID, or all toasts if no ID is given.
   */
  dismiss(id?: string | number): void {
    toast.dismiss(id);
  },

  /**
   * Update a loading toast to a success state.
   */
  resolveLoading(id: string | number, message: string, description?: string): void {
    toast.success(message, { id, description });
  },

  /**
   * Update a loading toast to an error state.
   */
  rejectLoading(id: string | number, messageOrError: string | AppError | unknown): void {
    if (messageOrError instanceof AppError) {
      toast.error(messageOrError.detail, { id });
      return;
    }
    const message =
      typeof messageOrError === 'string' ? messageOrError : 'An unexpected error occurred.';
    toast.error(message, { id });
  },
};
