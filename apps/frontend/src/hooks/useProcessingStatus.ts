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
 * Polls the document processing pipeline every 2 s. Rolls through OCR →
 * extraction → results on a single endpoint. Terminal states are:
 *   - OCR failed → polling stops, retry CTA shown
 *   - extraction_complete → polling stops, container redirects to /results
 *   - extraction_failed → polling stops, error card shown
 *
 * We do NOT stop at `ocr_complete` alone — Phase 8 extraction is still
 * pending and `extractionStatus` will flip forward within ~2 s.
 */
export function useProcessingStatus(documentId: DocumentId | undefined) {
  return useQuery<ProcessingStatusResponse>(
    ['processing-status', documentId],
    () => processingService.getProcessingStatus(documentId as DocumentId),
    {
      enabled: Boolean(documentId),
      refetchOnWindowFocus: false,
      refetchInterval: (data) => {
        if (!data) return POLL_INTERVAL_MS;
        return isTerminalProcessingStatus(data) ? false : POLL_INTERVAL_MS;
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
