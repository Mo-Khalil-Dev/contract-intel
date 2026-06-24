/**
 * reviewService — Playbook-Driven Contract Review agent.
 *
 *   - POST /api/v1/documents/:id/review → ContractReviewResponse
 *
 * Triggers the review agent (Anthropic Managed Agents or AWS AgentCore,
 * chosen server-side by CONTRACT_REVIEW_RUNTIME) and returns the §4 risk
 * report as markdown. Synchronous — the call blocks for the agent run.
 */

import { httpService } from '@/api/httpService';
import { API } from '@/api/endpoints';
import type { DocumentId } from '@/types/documents';

export type ContractReviewRuntime = 'anthropic' | 'agentcore';

export interface ContractReviewResponse {
  documentId: string;
  /** The §4 risk report, markdown. */
  markdown: string;
  /** Which runtime produced it — surfaced in the UI. */
  runtime: ContractReviewRuntime;
  runId?: string;
}

export const reviewService = {
  async runReview(documentId: DocumentId): Promise<ContractReviewResponse> {
    return httpService
      .post<ContractReviewResponse>(API.REVIEW(documentId))
      .then((r) => r.data!);
  },
};
