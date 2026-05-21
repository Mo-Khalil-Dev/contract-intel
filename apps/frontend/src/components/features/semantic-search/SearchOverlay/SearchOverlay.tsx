import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AlertIcon } from '@/components/core/icons';
import { PrecedentRow } from '@/components/features/similar-clauses';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import type { ClauseSearchResult } from '@/types/semanticSearch';
import type { SimilarClauseDto } from '@/types/similarClauses';
import { ContractResultRow } from '../ContractResultRow';
import { SearchInput } from '../SearchInput';
import { SuggestedSearches } from '../SuggestedSearches';

export interface SearchOverlayProps {
  open: boolean;
  onClose: () => void;
}

/**
 * Global ⌘K / Ctrl+K overlay (Phase 11 US-CI-2).
 *
 * Layout:
 *   - Slides down from the top of the viewport
 *   - Backdrop 50% black (stronger than the drawer's 18% — this is a
 *     focused mode, not a side panel)
 *   - Renders Suggested searches in idle state, two-section results
 *     when loaded (Top contracts / Top clauses), or empty / error
 *     state messages
 *   - Esc / backdrop / ✕ all dismiss
 *
 * Owns nothing about the search itself — useSemanticSearch handles
 * debounce, state, and the swap-ready mock service.
 */
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  const { state, data } = useSemanticSearch(query);

  // ── Reset + focus on open ──────────────────────────────────────
  useEffect(() => {
    if (open) {
      setQuery('');
      // Defer focus to next tick so the input is mounted.
      const t = window.setTimeout(() => inputRef.current?.focus(), 0);
      return () => window.clearTimeout(t);
    }
  }, [open]);

  // ── Esc to close ───────────────────────────────────────────────
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const openContract = (id: string) => {
    onClose();
    navigate(`/results/${id}`);
  };
  const openClause = (clauseContractId: string) => {
    onClose();
    navigate(`/results/${clauseContractId}`);
  };
  const seeAll = (tab: 'contracts' | 'clauses') => {
    onClose();
    navigate(
      `/search?q=${encodeURIComponent(query)}&tab=${tab}`,
    );
  };

  const total = data?.total ?? 0;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-start justify-center"
      style={{ background: 'rgba(15, 23, 42, 0.5)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Search your contracts"
    >
      <div
        className="bg-surface border-border w-full border-b shadow-[0_16px_40px_rgba(15,23,42,0.12)]"
        style={{
          maxHeight: '85vh',
          animation: 'ss-slide-down 200ms cubic-bezier(0.22, 1, 0.36, 1) both',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* ── Input row ─────────────────────────────────────────── */}
        <div className="border-border border-b px-5 py-3.5">
          <SearchInput
            ref={inputRef}
            value={query}
            onChange={setQuery}
            isLoading={state === 'loading'}
            rightAdornment={<EscKbd onClick={onClose} />}
          />
        </div>

        {/* ── Body ─────────────────────────────────────────────── */}
        <div className="overflow-y-auto px-5 py-5">
          {state === 'idle' && <SuggestedSearches onSelect={setQuery} />}

          {state === 'loading' && <LoadingSkeletons />}

          {(state === 'loaded' || state === 'low') && data && (
            <>
              {state === 'low' && <LowConfidenceBanner />}
              {data.contracts.length > 0 && (
                <Section
                  title="Top contracts"
                  count={data.contracts.length}
                  onSeeAll={data.contracts.length > 0 ? () => seeAll('contracts') : undefined}
                >
                  <ul className="space-y-2">
                    {data.contracts.map((c) => (
                      <li key={c.id}>
                        <ContractResultRow
                          result={c}
                          onSelect={() => openContract(c.contract.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              {data.clauses.length > 0 && (
                <Section
                  title="Top clauses (across contracts)"
                  count={data.clauses.length}
                  onSeeAll={data.clauses.length > 0 ? () => seeAll('clauses') : undefined}
                >
                  <ul className="space-y-2">
                    {data.clauses.map((c) => (
                      <li key={c.id}>
                        <PrecedentRow
                          clause={clauseToPrecedent(c)}
                          onSelect={() => openClause(c.contract.id)}
                        />
                      </li>
                    ))}
                  </ul>
                </Section>
              )}
              <FooterHint total={total} />
            </>
          )}

          {state === 'empty' && <EmptyState query={query} onBrowse={() => {
            onClose();
            navigate('/contracts');
          }} />}

          {state === 'error' && <ErrorState />}
        </div>
      </div>

      <style>{`
        @keyframes ss-slide-down {
          from { transform: translateY(-16px); opacity: 0.4; }
          to   { transform: translateY(0);     opacity: 1;   }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function Section({
  title,
  count,
  onSeeAll,
  children,
}: {
  title: string;
  count: number;
  onSeeAll?: () => void;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-5 last:mb-0">
      <div className="mb-2.5 flex items-baseline justify-between">
        <h3
          className="text-ink-mute text-[11px] font-bold uppercase"
          style={{ letterSpacing: '0.08em' }}
        >
          {title}
        </h3>
        {onSeeAll && (
          <button
            type="button"
            onClick={onSeeAll}
            className="text-blue hover:text-blue-dark text-xs font-semibold transition-colors focus:outline-none focus-visible:underline"
          >
            See all ({count}) →
          </button>
        )}
      </div>
      {children}
    </section>
  );
}

function EscKbd({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Close search"
      className="bg-bg-alt border-border text-ink-soft hover:text-ink rounded border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors"
    >
      Esc
    </button>
  );
}

function LowConfidenceBanner() {
  return (
    <div
      className="text-orange-dark mb-4 flex items-center gap-2 rounded-lg border border-orange-border bg-orange-bg px-3 py-2 text-xs"
      role="status"
    >
      <AlertIcon className="h-4 w-4 shrink-0" aria-hidden="true" />
      <span>We didn&rsquo;t find a strong match. Showing closest results.</span>
    </div>
  );
}

function LoadingSkeletons() {
  return (
    <div className="space-y-5" aria-label="Searching">
      <div>
        <div className="bg-bg-alt mb-2.5 h-2.5 w-32 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-surface h-[120px] animate-pulse rounded-[10px] border px-4 py-3"
            >
              <div className="bg-bg-alt mb-2 h-1.5 w-full rounded" />
              <div className="bg-border mb-2 h-3 w-40 rounded" />
              <div className="bg-bg-alt mb-1 h-2 w-2/3 rounded" />
              <div className="bg-bg-alt h-2 w-1/2 rounded" />
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="bg-bg-alt mb-2.5 h-2.5 w-48 rounded" />
        <div className="space-y-2">
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="border-border bg-surface h-[106px] animate-pulse rounded-[10px] border px-3.5 py-3"
            >
              <div className="bg-bg-alt mb-2 h-1.5 w-full rounded" />
              <div className="bg-border mb-2 h-3 w-32 rounded" />
              <div className="bg-bg-alt mb-1 h-2 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ query, onBrowse }: { query: string; onBrowse: () => void }) {
  return (
    <div className="mx-auto max-w-[320px] py-8 text-center">
      <h3 className="text-ink mb-2 text-sm font-semibold">
        Nothing matched{' '}
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          &ldquo;{query}&rdquo;
        </span>
      </h3>
      <p className="text-ink-soft mb-3 text-xs leading-relaxed">
        Try rephrasing, or browse contracts directly.
      </p>
      <button
        type="button"
        onClick={onBrowse}
        className="bg-blue hover:bg-blue-dark rounded-md px-3 py-1.5 text-xs font-semibold text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
      >
        Browse all contracts
      </button>
    </div>
  );
}

function ErrorState() {
  return (
    <div className="mx-auto max-w-[320px] py-8 text-center">
      <h3 className="text-ink mb-2 text-sm font-semibold">
        Something went wrong
      </h3>
      <p className="text-ink-soft text-xs">
        The search service is unavailable. Try again in a moment.
      </p>
    </div>
  );
}

function FooterHint({ total }: { total: number }) {
  return (
    <div className="text-ink-mute mt-3 flex items-center justify-between text-[11px]">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Kbd>↑↓</Kbd>
        <span>navigate</span>
        <span className="text-border-mid">·</span>
        <Kbd>Enter</Kbd>
        <span>open</span>
        <span className="text-border-mid">·</span>
        <Kbd>Esc</Kbd>
        <span>close</span>
      </div>
      <span className="font-mono">{total} results</span>
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

/** Adapt a ClauseSearchResult to the PrecedentRow's SimilarClauseDto shape. */
function clauseToPrecedent(c: ClauseSearchResult): SimilarClauseDto {
  return {
    id: c.id,
    type: c.label.toLowerCase().replace(/\s+/g, '_'),
    textSnippet: c.text,
    similarity: c.score,
    document: {
      id: c.contract.id,
      title: c.contract.name,
      uploadedAt: c.contract.signedAt,
    },
    pageNumber: null,
    sectionRef: c.section.replace(/^§/, ''),
  };
}
