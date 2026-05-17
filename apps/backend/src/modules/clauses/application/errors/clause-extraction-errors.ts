import {
  ApplicationException,
  InfrastructureException,
} from '../../../../shared/exceptions/app-error';

/**
 * Clause-extraction error taxonomy. Same shape as the OCR taxonomy:
 *
 *   - `*TransientError`: caller should retry with backoff (1s/4s/16s).
 *     Examples: 429 / 503 / 529 / overloaded_error from Anthropic; Voyage
 *     5xx; network timeouts.
 *
 *   - `*PermanentError`: caller MUST NOT retry — the input is bad or a
 *     policy invariant was violated. Examples: invalid request, context
 *     overflow, unsupported language, permission denied.
 *
 * Two separate hierarchies (extraction vs embedding) because the handler
 * isolates embedding failures from extraction success — clauses persist
 * with `embedding=null` rather than failing the whole run.
 */

export class ExtractionTransientError extends InfrastructureException {
  constructor(message: string, readonly cause?: unknown) {
    super('CLAUSE_EXTRACTION_TRANSIENT', message);
    Object.setPrototypeOf(this, ExtractionTransientError.prototype);
  }
}

export class ExtractionPermanentError extends ApplicationException {
  constructor(
    /** Short colon-separated reason token surfaced verbatim on
     *  ClauseExtractionFailedEvent and the API. */
    readonly reason: string,
    message: string,
  ) {
    super('CLAUSE_EXTRACTION_PERMANENT', message, 422);
    Object.setPrototypeOf(this, ExtractionPermanentError.prototype);
  }
}

export class EmbeddingTransientError extends InfrastructureException {
  constructor(message: string, readonly cause?: unknown) {
    super('EMBEDDING_TRANSIENT', message);
    Object.setPrototypeOf(this, EmbeddingTransientError.prototype);
  }
}

export class EmbeddingPermanentError extends ApplicationException {
  constructor(readonly reason: string, message: string) {
    super('EMBEDDING_PERMANENT', message, 422);
    Object.setPrototypeOf(this, EmbeddingPermanentError.prototype);
  }
}
