import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { Inject } from '@nestjs/common';
import {
  GetProcessingStatusQuery,
  GetProcessingStatusResult,
} from './get-processing-status.query';
import {
  DOCUMENT_REPOSITORY,
  IDocumentRepository,
} from '../../domain/document.repository';
import { MAX_USER_RETRY_COUNT } from '../../domain/document.aggregate';
import { DocumentId } from '../../domain/value-objects/document-id.vo';
import { OrgId } from '../../domain/value-objects/org-id.vo';
import { ProcessingStatusValue } from '../../domain/value-objects/processing-status.vo';
import { UploadedBy } from '../../domain/value-objects/uploaded-by.vo';
import { ApplicationException } from '../../../../shared/exceptions/app-error';

@QueryHandler(GetProcessingStatusQuery)
export class GetProcessingStatusHandler
  implements IQueryHandler<GetProcessingStatusQuery, GetProcessingStatusResult>
{
  constructor(
    @Inject(DOCUMENT_REPOSITORY) private readonly documents: IDocumentRepository,
  ) {}

  async execute(query: GetProcessingStatusQuery): Promise<GetProcessingStatusResult> {
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

    const canRetry =
      document.processingStatus.value === ProcessingStatusValue.OCR_FAILED &&
      document.userRetryCount < MAX_USER_RETRY_COUNT;

    return {
      documentId: document.id.value,
      status: document.processingStatus.value,
      failureReason: document.failureReason,
      userRetryCount: document.userRetryCount,
      canRetry,
    };
  }
}
