import { DocumentListItem } from '../projections/document-list-item/document-list-item.read-model';
import type { DocumentListFilters, DocumentListSort } from '../projections/document-list-item/document-list-item.repository';

export class GetDocumentListQuery {
  readonly orgId: string;
  readonly filters: DocumentListFilters;
  readonly sort: DocumentListSort;
  readonly page: number;
  readonly pageSize: number;

  constructor(params: {
    orgId: string;
    q?: string;
    risk?: string;
    type?: string;
    sort?: string;
    page?: number;
    pageSize?: number;
  }) {
    this.orgId = params.orgId;
    this.filters = {
      q: params.q,
      risk: (params.risk as DocumentListFilters['risk']) ?? 'all',
      type: params.type ?? 'all',
    };
    this.sort = (params.sort as DocumentListSort) ?? 'risk';
    this.page = Math.max(1, params.page ?? 1);
    this.pageSize = Math.min(50, Math.max(1, params.pageSize ?? 8));
  }
}

export interface GetDocumentListResult {
  items: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
