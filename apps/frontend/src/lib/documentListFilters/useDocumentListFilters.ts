import { useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { type DocumentListFilters } from './defaults';
import { parse } from './parse';
import { serialize } from './serialize';

const DEBOUNCE_MS = 250;

export interface UseDocumentListFiltersResult {
  filters: DocumentListFilters;
  /** Immediately syncs any filter field (except q) to the URL. Resets page to 1 unless page is explicitly patched. */
  setFilters: (patch: Partial<DocumentListFilters>) => void;
  /** Updates q with a 250 ms debounce before pushing to the URL. */
  setQueryText: (value: string) => void;
}

export function useDocumentListFilters(): UseDocumentListFiltersResult {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parse(searchParams);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const setFilters = useCallback(
    (patch: Partial<DocumentListFilters>) => {
      setSearchParams(
        (prev) => {
          const next = { ...parse(prev), ...patch };
          if (!('page' in patch)) next.page = 1;
          return serialize(next);
        },
        { replace: true },
      );
    },
    [setSearchParams],
  );

  const setQueryText = useCallback(
    (value: string) => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setFilters({ q: value, page: 1 }), DEBOUNCE_MS);
    },
    [setFilters],
  );

  return { filters, setFilters, setQueryText };
}
