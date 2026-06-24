import { useMutation, useQuery, useQueryClient } from 'react-query';
import {
  reviewService,
  type ContractReviewState,
} from '@/services/reviewService';
import type { DocumentId } from '@/types/documents';
import type { AppError } from '@/errors';

/**
 * Drives the asynchronous Playbook-Driven Contract Review.
 *
 *   - `review`  — polled status + report. Auto-polls every 3s while the
 *                 run is 'running', stops once complete/failed.
 *   - `start()` — kicks off a run (POST). On success it flips local state
 *                 to running so polling resumes immediately.
 *
 * The query is enabled whenever we have a documentId, so an already-stored
 * report shows instantly on tab open without re-running the agent.
 */
export function useContractReview(documentId: DocumentId | undefined) {
  const qc = useQueryClient();
  const key = ['contract-review', documentId];

  const review = useQuery<ContractReviewState, AppError>(
    key,
    () => reviewService.getReview(documentId as DocumentId),
    {
      enabled: Boolean(documentId),
      refetchOnWindowFocus: false,
      // Poll while a run is in flight; stop otherwise.
      refetchInterval: (data) => (data?.status === 'running' ? 3000 : false),
    },
  );

  const start = useMutation<{ status: string }, AppError>(
    () => reviewService.startReview(documentId as DocumentId),
    {
      onSuccess: () => {
        // Optimistically mark running so the poller kicks in right away.
        qc.setQueryData<ContractReviewState>(key, (prev) =>
          prev
            ? { ...prev, status: 'running', error: null }
            : {
                documentId: documentId as string,
                status: 'running',
                markdown: null,
                runtime: null,
                error: null,
                reviewedAt: null,
              },
        );
        void review.refetch();
      },
    },
  );

  return { review, start };
}
