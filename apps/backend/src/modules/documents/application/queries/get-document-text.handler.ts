import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  GetDocumentTextQuery,
  GetDocumentTextResult,
} from './get-document-text.query';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import {
  DOCUMENT_TEXT_REPOSITORY,
  IDocumentTextRepository,
} from '../../domain/document-text.repository';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

/**
 * Read the extracted text of a Document.
 *
 * Two-step lookup: first verify the requester owns the document (org
 * scope), then load the DocumentText artifact. The text repository
 * itself isn't org-scoped — ownership is enforced one layer up.
 */
@QueryHandler(GetDocumentTextQuery)
export class GetDocumentTextHandler
  implements IQueryHandler<GetDocumentTextQuery, GetDocumentTextResult>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
    @Inject(DOCUMENT_TEXT_REPOSITORY)
    private readonly documentTexts: IDocumentTextRepository,
  ) {}

  async execute(query: GetDocumentTextQuery): Promise<GetDocumentTextResult> {
    const documentId = DocumentId.fromString(query.documentId);
    const orgId = OrgId.fromUploader(UploadedBy.fromUserId(query.requesterUserId));

    const document = await this.documents.findByIdForOrg(documentId, orgId);
    if (!document) {
      throw new ApplicationException(
        'DOCUMENT_NOT_FOUND',
        `Document ${query.documentId} not found in this org`,
        404,
      );
    }

    const text = await this.documentTexts.findByDocumentId(documentId);
    if (!text) {
      throw new ApplicationException(
        'DOCUMENT_TEXT_NOT_FOUND',
        `OCR has not produced text for document ${query.documentId}`,
        404,
      );
    }

    return {
      documentId: text.documentId.value,
      text: text.text,
      pages: text.pages.map((p) => ({
        pageNumber: p.pageNumber,
        text: p.text,
        confidence: p.confidence.value,
        textQualityScore: p.textQualityScore.value,
        driver: p.driver.value,
      })),
      confidence: text.confidence.value,
      minPageConfidence: text.minPageConfidence.value,
      language: text.language.code,
      driver: text.driver.value,
      pageCount: text.pageCount,
      extractedAt: text.extractedAt.toISOString(),
    };
  }
}
