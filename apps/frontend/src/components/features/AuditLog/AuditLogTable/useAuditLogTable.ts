import { useCallback } from 'react';
import type { AuditEventDto, AuditFilters } from '@/types/audit';

interface UseAuditLogTableProps {
  filters: AuditFilters;
  setFilters: (partial: Omit<AuditFilters, 'page' | 'pageSize'>) => void;
  setPage: (page: number) => void;
  page: number;
  totalPages: number;
  onRowClick: (event: AuditEventDto) => void;
}

export function useAuditLogTable({
  filters,
  setFilters,
  setPage,
  page,
  totalPages,
  onRowClick,
}: UseAuditLogTableProps) {
  const handleActorIdChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, actorId: e.target.value || undefined });
    },
    [filters, setFilters],
  );

  const handleActionChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, action: e.target.value || undefined });
    },
    [filters, setFilters],
  );

  const handleFromDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, fromDate: e.target.value || undefined });
    },
    [filters, setFilters],
  );

  const handleToDateChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters({ ...filters, toDate: e.target.value || undefined });
    },
    [filters, setFilters],
  );

  const handleRowClick = useCallback(
    (event: AuditEventDto) => {
      onRowClick(event);
    },
    [onRowClick],
  );

  const handleRowKeyDown = useCallback(
    (e: React.KeyboardEvent, event: AuditEventDto) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onRowClick(event);
      }
    },
    [onRowClick],
  );

  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  function formatTimestamp(iso: string): string {
    try {
      return new Date(iso).toLocaleString(undefined, {
        dateStyle: 'medium',
        timeStyle: 'short',
      });
    } catch {
      return iso;
    }
  }

  return {
    handleActorIdChange,
    handleActionChange,
    handleFromDateChange,
    handleToDateChange,
    handleRowClick,
    handleRowKeyDown,
    canGoPrev,
    canGoNext,
    setPage,
    formatTimestamp,
  };
}
