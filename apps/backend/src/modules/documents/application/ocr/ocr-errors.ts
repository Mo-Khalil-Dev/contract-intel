import {
  ApplicationException,
  InfrastructureException,
} from '../../../../shared/exceptions/app-error';

/**
 * OCR-pipeline error taxonomy.
 *
 * Driver implementations throw one of these so the retry loop in
 * StartOcrProcessingHandler can decide what to do without parsing strings:
 *
 *   - `OcrTransientError`: caller should retry with backoff (1s/4s/16s).
 *     Examples: 429 / 503 from Document AI, network timeout, GCS hiccup.
 *
 *   - `OcrPermanentError`: caller MUST NOT retry — the input is bad or
 *     a policy invariant was violated. Examples: invalid PDF, encrypted
 *     PDF, unsupported language, page-count cap exceeded.
 */

export class OcrTransientError extends InfrastructureException {
  constructor(message: string, readonly cause?: unknown) {
    super('OCR_TRANSIENT', message);
    Object.setPrototypeOf(this, OcrTransientError.prototype);
  }
}

export class OcrPermanentError extends ApplicationException {
  constructor(
    /**
     * Short, colon-separated reason token — surfaces verbatim as the
     * `reason` on DocumentOcrFailedEvent and the /processing/:id payload.
     * Stable vocabulary the frontend can switch on.
     *
     * Examples: 'invalid_pdf', 'encrypted_pdf', 'too_many_pages',
     * 'unsupported_language:fr', 'corrupt_response'.
     */
    readonly reason: string,
    message: string,
  ) {
    super('OCR_PERMANENT', message, 422);
    Object.setPrototypeOf(this, OcrPermanentError.prototype);
  }
}
