import { useEffect, useRef } from 'react';
import { useSimilarClauses } from '@/hooks/useSimilarClauses';
import type { SimilarClauseDto, SimilarClausesResponse } from '@/types/similarClauses';

export interface UseSimilarClausesDrawerProps {
  /**
   * The source clause to research. `null` closes the drawer (the hook
   * is gated on a non-null id so no fetch happens in that state).
   */
  clauseId: string | null;
  onClose: () => void;
  /**
   * Fires when the user clicks a result row. The parent decides how to
   * navigate (scroll the main view, swap pages, etc.) — see Task 11.8.
   */
  onSelectResult: (target: SimilarClauseDto) => void;
  /** Optional override for limit; defaults to the service default (5). */
  limit?: number;
  /** Id of the row currently "active" (last clicked). */
  activeResultId?: string | null;
  /**
   * Clears the active row (returns to the "source view" with no row
   * highlighted). Wired to the source card click when a row is active.
   * Optional — when omitted, the source card stays static.
   */
  onClearActive?: () => void;
  /**
   * Vertical pixel offset where the drawer starts — usually the height
   * of the global top nav (default 56). Pass 0 in tests / Storybook to
   * render full-height.
   */
  navOffset?: number;
}

export interface UseSimilarClausesDrawerResult {
  isOpen: boolean;
  isLoading: boolean;
  isError: boolean;
  /** Data once loaded; undefined while loading or in empty/error states. */
  data: SimilarClausesResponse | undefined;
  /** Refs and handlers wired by the JSX layer. */
  containerRef: React.RefObject<HTMLDivElement>;
  handleBackdropClick: (e: React.MouseEvent) => void;
  retry: () => void;
}

/**
 * Stateful glue for SimilarClausesDrawer.
 *
 *   - Drives the data fetch via {@link useSimilarClauses}; closing the
 *     drawer (`clauseId === null`) cancels the in-flight request via
 *     react-query's `enabled` gate.
 *   - Wires `Escape` to close (only while open) so the drawer behaves
 *     like a focused mode without competing with global shortcuts when
 *     closed.
 *   - Focuses the drawer container on open so screen readers and
 *     keyboard users land in the right place. The previously focused
 *     element is restored on close.
 */
export function useSimilarClausesDrawer({
  clauseId,
  onClose,
  limit,
}: Pick<
  UseSimilarClausesDrawerProps,
  'clauseId' | 'onClose' | 'limit'
>): Pick<
  UseSimilarClausesDrawerResult,
  'isOpen' | 'isLoading' | 'isError' | 'data' | 'containerRef' | 'handleBackdropClick' | 'retry'
> {
  const isOpen = clauseId !== null;
  const query = useSimilarClauses(clauseId, limit);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  // ── Escape to close ────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  // ── Focus management ───────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    containerRef.current?.focus();
    return () => {
      lastFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    // Only close when clicking the backdrop itself, not bubbled child clicks.
    if (e.target === e.currentTarget) onClose();
  };

  return {
    isOpen,
    isLoading: query.isLoading && isOpen,
    isError: query.isError,
    data: query.data,
    containerRef,
    handleBackdropClick,
    retry: () => query.refetch(),
  };
}
