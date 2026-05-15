import { DocumentText } from './document-text.aggregate';
import { DocumentId } from './value-objects/document-id.vo';

export const DOCUMENT_TEXT_REPOSITORY = Symbol('DOCUMENT_TEXT_REPOSITORY');

/**
 * Persistence port for the DocumentText aggregate.
 *
 * Implementations write both the metadata row (Prisma) and the JSON blob
 * (IStorageService at `{documentId}.text.json`) — the split is hidden
 * from the application layer.
 *
 * Identity is the parent DocumentId; there is no separate text id. One
 * DocumentText per Document.
 */
export interface IDocumentTextRepository {
  findByDocumentId(id: DocumentId): Promise<DocumentText | null>;

  /** Insert or replace. A re-run after a failed OCR overwrites the prior
   *  artifact — we don't keep history in v1. */
  save(text: DocumentText): Promise<void>;
}
