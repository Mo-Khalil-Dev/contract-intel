/**
 * Maps backend error codes to user-friendly messages.
 *
 * Rules:
 * - Messages must be safe to display directly in the UI.
 * - Never expose internal details (stack traces, DB errors, etc.).
 * - Keep messages concise — one sentence.
 * - Fall back to UNKNOWN_ERROR for any unmapped code.
 */
export const ERROR_MESSAGES: Record<string, string> = {
  // Network / connectivity
  NETWORK_ERROR: 'Unable to reach the server. Please check your connection and try again.',
  TIMEOUT_ERROR: 'The request took too long. Please try again.',

  // Auth
  UNAUTHORIZED: 'Your session has expired. Please sign in again.',
  FORBIDDEN: "You don't have permission to perform this action.",

  // Resource
  NOT_FOUND: "The resource you're looking for doesn't exist.",
  CONFLICT: 'This action conflicts with the current state. Please refresh and try again.',

  // Validation
  VALIDATION_ERROR: 'Please check your input and try again.',
  UNPROCESSABLE_ENTITY: 'The request could not be processed. Please check your input.',

  // Contract-specific
  CONTRACT_NOT_FOUND: 'Contract not found.',
  CONTRACT_ALREADY_APPROVED: 'This contract has already been approved.',
  CONTRACT_ANALYSIS_FAILED: 'Contract analysis failed. Please try uploading again.',
  DOCUMENT_TOO_LARGE: 'The file is too large. Maximum size is 50 MB.',
  UNSUPPORTED_FILE_TYPE: 'Only PDF and DOCX files are supported.',

  // Server
  SERVER_ERROR: 'Something went wrong on our end. Please try again later.',
  SERVICE_UNAVAILABLE: 'The service is temporarily unavailable. Please try again shortly.',

  // Fallback
  UNKNOWN_ERROR: 'An unexpected error occurred. Please try again.',
};

/**
 * Returns a user-friendly message for the given error code.
 * Falls back to UNKNOWN_ERROR if the code is not mapped.
 */
export function getErrorMessage(code: string): string {
  return ERROR_MESSAGES[code] ?? ERROR_MESSAGES.UNKNOWN_ERROR;
}
