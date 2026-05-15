import { useQuery, useQueryClient } from 'react-query';
import { useMutation } from 'react-query';
import { processingService } from '@/services/processingService';
import type { DocumentId } from '@/types/documents';
import {
  isTerminalProcessingStatus,
  type ProcessingStatusResponse,
} from '@/types/processing';

const POLL_INTERVAL_MS = 2000;

/**
 * Polls the OCR pipeline status every 2 s until it reaches a terminal
 * state (`ocr_complete` or `ocr_failed`). The query auto-disables itself
 * when there's no documentId.
 */
export function useProcessingStatus(documentId: DocumentId | undefined) {
  return useQuery<ProcessingStatusResponse>(
    ['processing-status', documentId],
    () => processingService.getProcessingStatus(documentId as DocumentId),
    {
      enabled: Boolean(documentId),
      refetchOnWindowFocus: false,
      refetchInterval: (data) => {
        // Stop polling once we hit a terminal state — the user is either
        // about to be redirected (success) or sees the retry CTA (failed).
        if (!data) return POLL_INTERVAL_MS;
        return isTerminalProcessingStatus(data.status) ? false : POLL_INTERVAL_MS;
      },
    },
  );
}

/**
 * Triggers a user-initiated retry of a failed OCR run. Success invalidates
 * the status query so polling picks up the new `processing` state on the
 * next tick.
 */
export function useRetryOcr(documentId: DocumentId | undefined) {
  const queryClient = useQueryClient();
  return useMutation<void, Error>(
    () => processingService.retryOcr(documentId as DocumentId),
    {
      onSuccess: () => {
        if (documentId) {
          void queryClient.invalidateQueries(['processing-status', documentId]);
        }
      },
    },
  );
}
