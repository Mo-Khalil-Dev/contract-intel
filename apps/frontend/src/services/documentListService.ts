import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import { unwrap } from '@/api/unwrap';
import type { DocumentListFilters } from '@/lib/documentListFilters/defaults';
import type { DocumentListResponse } from '@/types/contracts';

export const documentListService = {
  getDocumentList(filters: DocumentListFilters): Promise<DocumentListResponse> {
    const params = {
      ...(filters.q ? { q: filters.q } : {}),
      ...(filters.risk !== 'all' ? { risk: filters.risk } : {}),
      ...(filters.type !== 'all' ? { type: filters.type } : {}),
      ...(filters.sort !== 'risk' ? { sort: filters.sort } : {}),
      page: filters.page,
      pageSize: filters.pageSize,
    };
    return httpService
      .get<DocumentListResponse>(API.DOCUMENTS.LIST, { params })
      .then(unwrap);
  },
};
