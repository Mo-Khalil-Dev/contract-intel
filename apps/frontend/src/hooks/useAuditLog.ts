import { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import { auditService } from '@/services/auditService';
import { feedbackService } from '@/services/feedbackService';
import type { AuditEventDto, AuditFilters } from '@/types/audit';

const DEFAULT_PAGE_SIZE = 20;

/**
 * Hook for fetching and filtering the audit log.
 * Wraps auditService.getAuditEvents with React Query.
 */
export function useAuditLog() {
  const [filters, setFiltersState] = useState<AuditFilters>({
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
  });

  const query = useQuery({
    queryKey: ['audit-log', filters],
    queryFn: () => auditService.getAuditEvents(filters),
    keepPreviousData: true,
    refetchOnWindowFocus: false,
    onError: (err: unknown) => feedbackService.error(err),
  });

  function setFilters(partial: Omit<AuditFilters, 'page' | 'pageSize'>) {
    setFiltersState((prev) => ({ ...prev, ...partial, page: 1 }));
  }

  function setPage(page: number) {
    setFiltersState((prev) => ({ ...prev, page }));
  }

  return {
    events: query.data?.events ?? [],
    total: query.data?.total ?? 0,
    page: query.data?.page ?? filters.page ?? 1,
    pageSize: query.data?.pageSize ?? DEFAULT_PAGE_SIZE,
    totalPages: query.data?.totalPages ?? 0,
    isLoading: query.isLoading,
    error: query.error,
    filters,
    setFilters,
    setPage,
  };
}

/**
 * Mutation hook for exporting the audit log.
 * Triggers a browser download on success.
 */
export function useExportAuditLog() {
  return useMutation({
    mutationFn: ({
      format,
      filters,
    }: {
      format: 'json' | 'csv';
      filters?: Omit<AuditFilters, 'page' | 'pageSize'>;
    }) => auditService.exportAuditLog(format, filters),
    onSuccess: ({ content, filename, mimeType }) => {
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
      feedbackService.success('Export downloaded');
    },
    onError: (err: unknown) => feedbackService.error(err),
  });
}

/**
 * Convenience type for a selected audit event (used by modal state).
 */
export type SelectedAuditEvent = AuditEventDto | null;
