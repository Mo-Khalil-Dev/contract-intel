import { CloseIcon } from '@/components/core/icons';
import { PrecedentRow } from '../PrecedentRow';
import { SourceClauseCard } from '../SourceClauseCard';
import { EmptyPrecedentState } from '../EmptyPrecedentState';
import {
  useSimilarClausesDrawer,
  type UseSimilarClausesDrawerProps,
} from './useSimilarClausesDrawer';

/**
 * 480px right slide-over for Similar Clauses (Phase 11, US-CI-1).
 *
 * Composition root: header · sticky SourceClauseCard · scrollable body
 * with one of {skeleton list / EmptyPrecedentState / error / results}.
 * Result row clicks call back via `onSelectResult` — the parent owns
 * navigation/highlight (Task 11.8).
 *
 * The drawer is **not** a true modal in the OK/Cancel sense — it's a
 * research panel that lets the user keep glancing at the contract
 * behind it. We use `role="dialog" aria-modal="true"` for screen
 * readers, but the backdrop opacity is light and the contract stays
 * legible.
 */
export function SimilarClausesDrawer(props: UseSimilarClausesDrawerProps) {
  const { clauseId, onClose, onSelectResult, activeResultId } = props;
  const {
    isOpen,
    isLoading,
    isError,
    data,
    containerRef,
    handleBackdropClick,
    retry,
  } = useSimilarClausesDrawer({
    clauseId,
    onClose,
    limit: props.limit,
  });

  if (!isOpen) return null;

  const results = data?.results ?? [];
  const showEmpty = !isLoading && !isError && results.length === 0;
  const showResults = !isLoading && !isError && results.length > 0;
  const headerCount = results.length === 1 ? '1 similar clause' : `${results.length} similar clauses`;

  return (
    <div
      className="fixed inset-0 z-40 bg-ink/20"
      onMouseDown={handleBackdropClick}
      data-testid="similar-clauses-backdrop"
    >
      <aside
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Similar clauses"
        className="absolute right-0 top-0 flex h-full w-[480px] flex-col border-l border-border bg-surface shadow-xl outline-none transition-transform"
      >
        {/* ── Header ──────────────────────────────────────────────── */}
        <header className="flex items-center justify-between border-b border-border px-5 py-4">
          <h2 className="text-ink text-base font-semibold">Similar clauses</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close similar clauses drawer"
            className="text-inkSoft hover:text-ink focus:outline-none focus-visible:ring-2 focus-visible:ring-blue rounded p-1 transition-colors"
          >
            <CloseIcon className="h-4 w-4" aria-hidden="true" />
          </button>
        </header>

        {/* ── Source block (sticky-ish: rendered above the scroll body) ── */}
        {data?.source && (
          <div className="border-b border-border px-5 py-4">
            <SourceClauseCard
              type={data.source.type}
              textSnippet={data.source.textSnippet}
            />
          </div>
        )}

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {isLoading && <SkeletonList />}

          {isError && (
            <div className="text-center pt-4">
              <p className="text-inkSoft mb-3 text-sm">
                Couldn&rsquo;t load similar clauses
              </p>
              <button
                type="button"
                onClick={retry}
                className="bg-blue hover:bg-blueDark rounded px-3 py-1.5 text-sm font-medium text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                Retry
              </button>
            </div>
          )}

          {showEmpty && <EmptyPrecedentState clauseType={data?.source.type} />}

          {showResults && (
            <>
              <div className="text-inkSoft mb-3 text-xs font-semibold">
                {headerCount}
              </div>
              <ul className="space-y-2.5">
                {results.map((c) => (
                  <li key={c.id}>
                    <PrecedentRow
                      clause={c}
                      isActive={activeResultId === c.id}
                      onSelect={() => onSelectResult(c)}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </aside>
    </div>
  );
}

/** 5 grey skeleton rows. No spinner — the target is <400ms. */
function SkeletonList() {
  return (
    <ul className="space-y-2.5" aria-label="Loading similar clauses">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="border-border bg-surface h-[96px] animate-pulse rounded-lg border px-4 py-3"
        >
          <div className="bg-border mb-2 h-2 w-20 rounded" />
          <div className="bg-border mb-2 h-3 w-32 rounded" />
          <div className="bg-border mb-1.5 h-2 w-full rounded" />
          <div className="bg-border h-2 w-3/4 rounded" />
        </li>
      ))}
    </ul>
  );
}
