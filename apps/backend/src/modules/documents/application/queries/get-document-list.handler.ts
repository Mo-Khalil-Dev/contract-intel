import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { GetDocumentListQuery, GetDocumentListResult } from './get-document-list.query';
import {
  DOCUMENT_LIST_ITEM_REPOSITORY,
  IDocumentListItemRepository,
} from '../projections/document-list-item/document-list-item.repository';

@QueryHandler(GetDocumentListQuery)
export class GetDocumentListHandler
  implements IQueryHandler<GetDocumentListQuery, GetDocumentListResult>
{
  constructor(
    @Inject(DOCUMENT_LIST_ITEM_REPOSITORY)
    private readonly listRepo: IDocumentListItemRepository,
  ) {}

  async execute(query: GetDocumentListQuery): Promise<GetDocumentListResult> {
    return this.listRepo.findAll(
      query.orgId,
      query.filters,
      query.sort,
      query.page,
      query.pageSize,
    );
  }
}
