/**
 * Structured application error — mirrors the backend RFC 7807 Problem Details envelope.
 *
 * Every error that crosses the API boundary is normalised into this shape so that
 * the rest of the frontend has a single, predictable error type to handle.
 */
export class AppError extends Error {
  /** Machine-readable error code from the backend (e.g. "CONTRACT_NOT_FOUND"). */
  readonly code: string;

  /** HTTP status code (0 for network/timeout errors). */
  readonly status: number;

  /** Human-readable detail message — safe to display to the user. */
  readonly detail: string;

  /** Correlation ID from the X-Request-Id / correlationId field, if present. */
  readonly correlationId?: string;

  /** Field-level validation errors, keyed by field name. */
  readonly fieldErrors?: Record<string, string[]>;

  constructor(params: {
    message: string;
    code: string;
    status: number;
    detail: string;
    correlationId?: string;
    fieldErrors?: Record<string, string[]>;
  }) {
    super(params.message);
    this.name = 'AppError';
    this.code = params.code;
    this.status = params.status;
    this.detail = params.detail;
    this.correlationId = params.correlationId;
    this.fieldErrors = params.fieldErrors;

    // Restore prototype chain (required when extending built-ins in TypeScript)
    Object.setPrototypeOf(this, AppError.prototype);
  }

  /** True when the error is a client-side network or timeout failure. */
  get isNetworkError(): boolean {
    return this.status === 0;
  }

  /** True when the server returned a 4xx status. */
  get isClientError(): boolean {
    return this.status >= 400 && this.status < 500;
  }

  /** True when the server returned a 5xx status. */
  get isServerError(): boolean {
    return this.status >= 500;
  }
}
