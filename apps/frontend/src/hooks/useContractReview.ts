import { useMutation } from 'react-query';
import { reviewService, type ContractReviewResponse } from '@/services/reviewService';
import type { DocumentId } from '@/types/documents';
import type { AppError } from '@/errors';

/**
 * Triggers the Playbook-Driven Contract Review agent for a document.
 *
 * A mutation, not a query — the review is an explicit user action ("Run
 * Review") and a multi-step agent run (tens of seconds), so we don't want
 * it firing on mount or refetching. The returned `data.markdown` is the
 * §4 risk report; `data.runtime` says which runtime produced it.
 */
export function useContractReview(documentId: DocumentId | undefined) {
  return useMutation<ContractReviewResponse, AppError>(() => {
    if (!documentId) {
      return Promise.reject(new Error('documentId is required'));
    }
    return reviewService.runReview(documentId);
  });
}
