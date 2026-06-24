/**
 * reviewService — Playbook-Driven Contract Review agent (asynchronous).
 *
 *   - POST /api/v1/documents/:id/review → starts a run, returns immediately
 *   - GET  /api/v1/documents/:id/review → current status + report (polled)
 *
 * The agent run can exceed the HTTP window, so it runs in the background;
 * the frontend starts it then polls GET until status is complete/failed.
 */

import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import type { DocumentId } from '@/types/documents';

export type ContractReviewRuntime = 'anthropic' | 'agentcore';
export type ContractReviewStatus =
  | 'not_started'
  | 'running'
  | 'complete'
  | 'failed';

export interface ContractReviewState {
  documentId: string;
  status: ContractReviewStatus;
  markdown: string | null;
  runtime: ContractReviewRuntime | null;
  error: string | null;
  reviewedAt: string | null;
}

export const reviewService = {
  async startReview(documentId: DocumentId): Promise<{ status: ContractReviewStatus }> {
    return httpService
      .post<{ documentId: string; status: ContractReviewStatus }>(
        API.REVIEW(documentId),
      )
      .then((r) => ({ status: r.data?.status ?? 'running' }));
  },

  async getReview(documentId: DocumentId): Promise<ContractReviewState> {
    return httpService
      .get<ContractReviewState>(API.REVIEW(documentId))
      .then((r) => r.data!);
  },
};
