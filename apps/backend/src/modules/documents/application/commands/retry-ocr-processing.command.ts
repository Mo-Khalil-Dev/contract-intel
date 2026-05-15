/**
 * User-initiated retry of a previously-failed OCR run.
 *
 * Triggered by the "Retry OCR" button on `/processing/:id` and proxied
 * through the HTTP controller. Org-scoped — the requester must own the
 * document. Capped at 3 user retries (enforced inside the aggregate).
 */
export class RetryOcrProcessingCommand {
  constructor(
    readonly documentId: string,
    /** Authenticated user from the session — used to scope the lookup. */
    readonly requesterUserId: string,
  ) {}
}
