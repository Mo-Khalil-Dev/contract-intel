import { Clause } from './entities/clause';
import { ClauseId } from './value-objects/clause-id.vo';
import { ExtractionRunId } from './value-objects/extraction-run-id.vo';
import { DocumentId } from '../../documents/domain/value-objects/document-id.vo';

export const CLAUSE_REPOSITORY = Symbol('CLAUSE_REPOSITORY');

/**
 * Persistence port for Clause entities.
 *
 * Clauses are owned by an ExtractionRun. `saveRun` is the only write
 * path — the two-pass parent-FK resolution + pgvector insert must happen
 * inside one transaction, which the repository implementation owns.
 */
export interface IClauseRepository {
  /**
   * Persist all clauses for a single ExtractionRun in one transaction.
   * Parent FKs are resolved server-side via clientRef → ClauseId mapping
   * before insert; the input `clauses` array carries already-resolved
   * `parentClauseId` references where applicable.
   */
  saveForRun(runId: ExtractionRunId, clauses: Clause[]): Promise<void>;

  /** All clauses for a document's current ExtractionRun. */
  findByDocumentId(documentId: DocumentId): Promise<Clause[]>;

  findById(id: ClauseId): Promise<Clause | null>;
}
