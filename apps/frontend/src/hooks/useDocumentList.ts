import { useQuery } from 'react-query';
import { documentListService } from '@/services/documentListService';
import type { DocumentListFilters } from '@/lib/documentListFilters/defaults';
import type { DocumentListItem, DocumentListSummary } from '@/types/contracts';

const EMPTY_SUMMARY: DocumentListSummary = {
  totalContracts: 0,
  analysed: 0,
  avgRisk: 0,
  criticalFlags: 0,
  unlimitedLiability: 0,
};

export interface UseDocumentListResult {
  items: DocumentListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  summary: DocumentListSummary;
  isLoading: boolean;
  isFetching: boolean;
  error: unknown;
  refetch: () => void;
}

export function useDocumentList(filters: DocumentListFilters): UseDocumentListResult {
  const query = useQuery({
    queryKey: ['document-list', filters],
    queryFn: () => documentListService.getDocumentList(filters),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
  });

  return {
    items: query.data?.items ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page,
    pageSize: query.data?.pageSize ?? filters.pageSize,
    totalPages: query.data?.totalPages ?? 1,
    summary: query.data?.summary ?? EMPTY_SUMMARY,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    error: query.error,
    refetch: query.refetch,
  };
}
