import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDocumentSummaryQuery, GetDocumentSummaryResult } from './get-document-summary.query';
import {
  DOCUMENT_LIST_ITEM_REPOSITORY,
  IDocumentListItemRepository,
} from '../projections/document-list-item/document-list-item.repository';

@QueryHandler(GetDocumentSummaryQuery)
export class GetDocumentSummaryHandler
  implements IQueryHandler<GetDocumentSummaryQuery, GetDocumentSummaryResult>
{
  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY)
    private readonly listRepo: IDocumentListItemRepository,
  ) {}

  async execute(query: GetDocumentSummaryQuery): Promise<GetDocumentSummaryResult> {
    return this.listRepo.summary(query.orgId);
  }
}
