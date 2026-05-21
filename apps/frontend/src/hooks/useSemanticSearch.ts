import { useEffect, useRef, useState } from 'react';
import {
  semanticSearchService,
  LOW_CONFIDENCE_THRESHOLD,
} from '@/services/semanticSearchService';
import type {
  SemanticSearchOptions,
  SemanticSearchResponse,
} from '@/types/semanticSearch';

const DEBOUNCE_MS = 600;
const MIN_QUERY_LEN = 3;

export type SemanticSearchState =
  | 'idle'        // empty query
  | 'loading'    // request in flight
  | 'loaded'    // results above threshold
  | 'low'         // top score below LOW_CONFIDENCE_THRESHOLD
  | 'empty'       // request returned no results
  | 'error';

export interface UseSemanticSearchResult {
  state: SemanticSearchState;
  data: SemanticSearchResponse | null;
  error: Error | null;
}

/**
 * Debounced semantic-search driver shared by the overlay and the
 * dedicated /search page. Owns the 600ms debounce, the in-flight
 * cancellation guard, and the state-machine mapping from
 * "did we get a response" → idle/loading/loaded/low/empty/error.
 *
 * **Mock-backed in v1** (see semanticSearchService). When the real
 * `/api/v1/search` lands, only the service body changes — the hook
 * and all components stay the same.
 */
export function useSemanticSearch(
  query: string,
  options: SemanticSearchOptions = {},
): UseSemanticSearchResult {
  const [state, setState] = useState<SemanticSearchState>('idle');
  const [data, setData] = useState<SemanticSearchResponse | null>(null);
  const [error, setError] = useState<Error | null>(null);

  // Lets us drop the response of a request that's been superseded by
  // a fresher keystroke — prevents flicker between stale results.
  const latestRequestId = useRef(0);

  // Serialise options so the effect dep array is stable across renders.
  const optionsKey = JSON.stringify(options);

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < MIN_QUERY_LEN) {
      setState('idle');
      setData(null);
      setError(null);
      return;
    }

    const myRequestId = ++latestRequestId.current;
    setState('loading');
    setError(null);

    const timer = window.setTimeout(async () => {
      try {
        const response = await semanticSearchService.search(trimmed, options);
        if (myRequestId !== latestRequestId.current) return; // superseded
        setData(response);
        if (response.contracts.length === 0 && response.clauses.length === 0) {
          setState('empty');
        } else if (response.confidence < LOW_CONFIDENCE_THRESHOLD) {
          setState('low');
        } else {
          setState('loaded');
        }
      } catch (err) {
        if (myRequestId !== latestRequestId.current) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setState('error');
      }
    }, DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, optionsKey]);

  return { state, data, error };
}
