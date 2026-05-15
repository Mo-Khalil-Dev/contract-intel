/**
 * Force-fail an in-flight OCR run.
 *
 * Reserved for admin / system callers (e.g. an operator manually aborting
 * a stuck pipeline). The pipeline's normal failure path uses
 * `Document.failProcessing(reason)` directly inside StartOcrProcessingHandler;
 * this command exists for external triggers.
 */
export class FailOcrProcessingCommand {
  constructor(
    readonly documentId: string,
    /** Short reason token. Same vocabulary as the pipeline emits — see
     *  `OcrPermanentError.reason` for the canonical list. */
    readonly reason: string,
  ) {}
}
