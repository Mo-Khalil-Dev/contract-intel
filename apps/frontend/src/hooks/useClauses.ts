import { useQuery } from 'react-query';
import { clausesService } from '@/services/clausesService';
import type { DocumentId } from '@/types/documents';
import type {
  ClauseResponse,
  ExtractionStatusResponse,
} from '@/types/clauses';

/**
 * Fetches the list of clauses for a document. Returns whatever the
 * current ExtractionRun produced; empty array until extraction completes.
 * Container is responsible for gating the fetch on the polling status —
 * we don't want to spam this endpoint while extraction is still running.
 */
export function useClauses(documentId: DocumentId | undefined, enabled = true) {
  return useQuery<ClauseResponse[]>(
    ['clauses', documentId],
    () => clausesService.getClauses(documentId as DocumentId),
    {
      enabled: Boolean(documentId) && enabled,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  );
}

/**
 * Fetches the ExtractionRun status + metadata snapshot. Used by the
 * Results screen to render the Overview tab (parties, key dates,
 * financial terms) and the right sidebar (contract details).
 *
 * Mostly read-once per page load — the data only changes when a
 * re-extraction is triggered (admin command, not user-facing in Phase 8).
 */
export function useExtractionStatus(
  documentId: DocumentId | undefined,
  enabled = true,
) {
  return useQuery<ExtractionStatusResponse>(
    ['extraction-status', documentId],
    () => clausesService.getExtractionStatus(documentId as DocumentId),
    {
      enabled: Boolean(documentId) && enabled,
      refetchOnWindowFocus: false,
      staleTime: 60_000,
    },
  );
}
