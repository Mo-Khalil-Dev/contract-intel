/**
 * similarClausesService — Phase 11 (US-CI-1) read endpoint.
 *
 *   - GET /api/v1/clauses/:id/similar?limit=N → SimilarClausesResponse
 *
 * 3-tier API stack:
 *   useSimilarClauses → similarClausesService → httpService → axios
 *
 * Per the frontend guidelines: this layer calls httpService and
 * unwraps the ApiResponse<T> envelope. Hooks consume the unwrapped
 * SimilarClausesResponse directly; the envelope never leaks upward.
 */

import { httpService } from '@/api/httpService';
import { unwrap } from '@/api/unwrap';
import { API } from '@/api/endpoints';
import type { ClauseId, SimilarClausesResponse } from '@/types/similarClauses';

export const DEFAULT_SIMILAR_LIMIT = 5;

export const similarClausesService = {
  /**
   * Fetch the most-similar clauses across the portfolio for a given
   * source clause. The backend filters to the same `clauseType` and
   * excludes the source clause and any sibling clauses from the same
   * document — see US-CI-1 AC2 / AC3.
   *
   * Throws an AppError (via unwrap / httpService) on any failure;
   * specifically 404 (CLAUSE_NOT_FOUND) and 409 (CLAUSE_NOT_EMBEDDED)
   * map to AppError instances that the hook surfaces as `error`.
   */
  async getSimilar(
    clauseId: ClauseId,
    limit: number = DEFAULT_SIMILAR_LIMIT,
  ): Promise<SimilarClausesResponse> {
    return httpService
      .get<SimilarClausesResponse>(API.SIMILAR_CLAUSES(clauseId), {
        params: { limit },
      })
      .then(unwrap);
  },
};
