/**
 * Kick off the OCR pipeline for an upload-complete Document.
 *
 * Dispatched by `DocumentUploadCompletedHandler` (Phase 5 → Phase 7 bridge)
 * and by `RetryOcrProcessingHandler` on user-initiated retries.
 *
 * Not triggered directly by an HTTP route — there's no public endpoint
 * to start OCR; uploads do that for you.
 */
export class StartOcrProcessingCommand {
  constructor(readonly documentId: string) {}
}
