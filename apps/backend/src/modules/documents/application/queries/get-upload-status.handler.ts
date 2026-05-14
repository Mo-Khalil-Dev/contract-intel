import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import { GetUploadStatusQuery, GetUploadStatusResult } from './get-upload-status.query';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

@QueryHandler(GetUploadStatusQuery)
export class GetUploadStatusHandler
  implements IQueryHandler<GetUploadStatusQuery, GetUploadStatusResult>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
  ) {}

  async execute(query: GetUploadStatusQuery): Promise<GetUploadStatusResult> {
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

    return {
      documentId: document.id.value,
      status: document.status.value,
      uploadedAt: document.completedAt ? document.completedAt.toISOString() : null,
      failureReason: document.failureReason,
    };
  }
}
