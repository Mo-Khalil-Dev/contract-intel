import { useQuery } from 'react-query';
import {
  DEFAULT_SIMILAR_LIMIT,
  similarClausesService,
} from '@/services/similarClausesService';
import type { ClauseId, SimilarClausesResponse } from '@/types/similarClauses';

/**
 * Stable query-key prefix so other parts of the app can invalidate /
 * prefetch this slice if needed (e.g. after an extraction re-run).
 */
export const SIMILAR_CLAUSES_QUERY_KEY = 'similar-clauses' as const;

/**
 * Fetches the top-N similar clauses across the portfolio for a given
 * source clause (US-CI-1).
 *
 * The hook is **gated on `clauseId != null`** so a closed drawer
 * doesn't issue a request. The trigger component lifts open/closed
 * state to the page, then passes either the focused clause's id or
 * null:
 *
 *   const [openForClauseId, setOpenFor] = useState<string | null>(null);
 *   const { data, isLoading, error } = useSimilarClauses(openForClauseId);
 *
 * Stale time of 5 minutes — results are stable for a session, so flipping
 * the drawer closed and re-opening on the same clause shouldn't re-hit
 * the network.
 */
export function useSimilarClauses(
  clauseId: ClauseId | null | undefined,
  limit: number = DEFAULT_SIMILAR_LIMIT,
) {
  return useQuery<SimilarClausesResponse>(
    [SIMILAR_CLAUSES_QUERY_KEY, clauseId, limit],
    () => similarClausesService.getSimilar(clauseId as ClauseId, limit),
    {
      enabled: Boolean(clauseId),
      refetchOnWindowFocus: false,
      staleTime: 5 * 60_000,
      // Don't retry 4xx (CLAUSE_NOT_FOUND, CLAUSE_NOT_EMBEDDED,
      // INVALID_LIMIT). The standard react-query default would
      // retry 3× which would just delay the error in the UI.
      retry: 0,
    },
  );
}
