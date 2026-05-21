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
 * Composition root: header (with optional active-row breadcrumb) ·
 * SourceClauseCard pinned at top · scrollable body with one of
 * {skeleton list / results / EmptyPrecedentState / error} · footer
 * keyboard hint.
 *
 * **Drawer mounts BELOW the 56px top nav** (`top: 56px`) so the nav
 * stays interactive — a deliberate "this is a research panel, not a
 * focused modal" choice from the design handoff. Backdrop dims only
 * the content area, not the nav.
 */
export function SimilarClausesDrawer(props: UseSimilarClausesDrawerProps) {
  const {
    clauseId,
    onClose,
    onSelectResult,
    activeResultId,
    onClearActive,
    navOffset = 56,
  } = props;
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
  const activeRow = activeResultId
    ? results.find((r) => r.id === activeResultId) ?? null
    : null;

  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 animate-[fadeIn_140ms_ease-out]"
      style={{ top: navOffset, background: 'rgba(15, 23, 42, 0.18)' }}
      onMouseDown={handleBackdropClick}
      data-testid="similar-clauses-backdrop"
    >
      <aside
        ref={containerRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label="Similar clauses"
        className="absolute right-0 top-0 flex h-full w-[480px] max-w-[92vw] flex-col border-l border-border bg-surface outline-none"
        style={{
          boxShadow: '-2px 0 16px rgba(15, 23, 42, 0.04)',
          animation: 'sc-slide-in 180ms cubic-bezier(0.22, 1, 0.36, 1) both',
        }}
      >
        <DrawerHeader activeRow={activeRow} onClose={onClose} />

        {/* ── Source block ────────────────────────────────────────── */}
        {data?.source && (
          <div className="border-b border-border px-[18px] pb-1.5 pt-3.5">
            <SourceClauseCard
              type={data.source.type}
              textSnippet={data.source.textSnippet}
              active={!activeRow}
              onClick={activeRow && onClearActive ? onClearActive : undefined}
            />
          </div>
        )}

        {/* ── Results header (eyebrow + threshold pill) ───────────── */}
        {showResults && <ResultsHeader count={results.length} />}

        {/* ── Body ────────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-[18px] pb-[18px]">
          {isLoading && <SkeletonList />}

          {isError && (
            <div className="pt-6 text-center">
              <h3 className="text-ink mb-1 text-sm font-semibold">
                Couldn&rsquo;t load similar clauses
              </h3>
              <p className="text-ink-soft mb-3 text-xs">
                Something went wrong searching your portfolio. This is usually
                transient.
              </p>
              <button
                type="button"
                onClick={retry}
                className="bg-blue hover:bg-blue-dark rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
              >
                Retry
              </button>
            </div>
          )}

          {showEmpty && <EmptyPrecedentState clauseType={data?.source.type} />}

          {showResults && (
            <ul className="space-y-2">
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
          )}

          {showResults && <FooterHint />}
        </div>
      </aside>

      {/* Component-scoped animation keyframes. */}
      <style>{`
        @keyframes sc-slide-in {
          from { transform: translateX(16px); opacity: 0.4; }
          to   { transform: translateX(0);    opacity: 1;   }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ───────────────────────────────────────────────────

function DrawerHeader({
  activeRow,
  onClose,
}: {
  activeRow: { document: { title: string } } | null;
  onClose: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-3 border-b border-border px-[18px] py-3.5">
      <div className="flex min-w-0 items-center gap-2">
        <h2 className="text-ink text-[15px] font-bold tracking-[-0.02em]">
          Similar clauses
        </h2>
        {activeRow && (
          <>
            <span className="text-ink-mute text-sm" aria-hidden="true">
              ›
            </span>
            <span
              className="text-ink-mid overflow-hidden text-ellipsis whitespace-nowrap text-[13px] font-medium"
              style={{ maxWidth: 220 }}
            >
              {activeRow.document.title}
            </span>
          </>
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close similar clauses drawer"
        className="text-ink-soft hover:text-ink hover:bg-bg-alt flex h-7 w-7 items-center justify-center rounded-md transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        <CloseIcon className="h-4 w-4" aria-hidden="true" />
      </button>
    </header>
  );
}

function ResultsHeader({ count }: { count: number }) {
  const label = count === 1 ? '1 similar clause' : `${count} similar clauses`;
  return (
    <div className="flex items-baseline justify-between px-[18px] pb-2 pt-3.5">
      <span
        className="text-ink-mute text-[11px] font-bold uppercase"
        style={{ letterSpacing: '0.08em' }}
      >
        {label}
      </span>
      <span
        className="text-ink-mute text-[10px] font-semibold font-mono"
        aria-label="Similarity threshold"
      >
        ≥ 50% threshold
      </span>
    </div>
  );
}

/** Keyboard hints at the bottom of the result list. */
function FooterHint() {
  return (
    <div className="text-ink-mute mt-4 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px]">
      <Kbd>↑↓</Kbd>
      <span>navigate</span>
      <span className="text-border-mid">·</span>
      <Kbd>Enter</Kbd>
      <span>compare</span>
      <span className="text-border-mid">·</span>
      <Kbd>Esc</Kbd>
      <span>close</span>
    </div>
  );
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="bg-bg-alt border-border text-ink-soft rounded border px-1.5 py-px font-mono text-[10px] font-semibold">
      {children}
    </kbd>
  );
}

/** 5 grey skeleton rows that roughly mirror the PrecedentRow geometry. */
function SkeletonList() {
  return (
    <ul className="space-y-2 pt-4" aria-label="Loading similar clauses">
      {Array.from({ length: 5 }).map((_, i) => (
        <li
          key={i}
          className="border-border bg-surface relative h-[106px] animate-pulse rounded-[10px] border px-3.5 py-3"
        >
          <div className="bg-bg-alt mb-2.5 h-1.5 w-full rounded" />
          <div className="bg-border mb-2 h-3 w-40 rounded" />
          <div className="bg-bg-alt mb-2 h-2 w-32 rounded" />
          <div className="bg-bg-alt mb-1 h-2 w-full rounded" />
          <div className="bg-bg-alt h-2 w-4/5 rounded" />
        </li>
      ))}
    </ul>
  );
}
