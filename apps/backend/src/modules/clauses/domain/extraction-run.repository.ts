import { ExtractionRun } from './aggregates/extraction-run.aggregate';
import { ExtractionRunId } from './value-objects/extraction-run-id.vo';
import { DocumentId } from '../../documents/domain/value-objects/document-id.vo';

export const EXTRACTION_RUN_REPOSITORY = Symbol('EXTRACTION_RUN_REPOSITORY');

/**
 * Persistence port for the ExtractionRun aggregate.
 *
 * Each re-extraction creates a new run; old runs are retained for audit.
 * `findCurrentForDocument` returns whatever run the Document aggregate
 * points to via `currentExtractionRunId` — typically the most recent one.
 */
export interface IExtractionRunRepository {
  save(run: ExtractionRun): Promise<void>;
  findById(id: ExtractionRunId): Promise<ExtractionRun | null>;
  /** Returns the in-flight or most recent run for a document, regardless
   *  of status. Used for idempotency checks in StartClauseExtraction. */
  findCurrentForDocument(documentId: DocumentId): Promise<ExtractionRun | null>;
}
