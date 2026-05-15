import { Document } from './document.aggregate';
import { DocumentId } from './value-objects/document-id.vo';
import { OrgId } from './value-objects/org-id.vo';

export const DOCUMENT_REPOSITORY = Symbol('DOCUMENT_REPOSITORY');

/**
 * Persistence port for the Document aggregate.
 *
 * Every lookup is scoped by `OrgId` — there is no `findById(id)` that
 * spans orgs. Callers must always pass the requester's OrgId so cross-
 * tenant access becomes a type error rather than a code-review concern.
 */
export interface IDocumentRepository {
  /** Find a document by id, scoped to one org. Returns null when the
   *  document doesn't exist OR exists in a different org. */
  findByIdForOrg(id: DocumentId, orgId: OrgId): Promise<Document | null>;

  /**
   * Find a document by id without an org filter. **System-only.**
   *
   * Reserved for pipelines triggered by domain events (no user session),
   * such as the Phase 7 OCR pipeline reading documents in response to
   * `DocumentUploadCompletedEvent`. HTTP handlers must use
   * `findByIdForOrg`.
   */
  findById(id: DocumentId): Promise<Document | null>;

  /** Persist a new or updated Document. */
  save(document: Document): Promise<void>;
}
