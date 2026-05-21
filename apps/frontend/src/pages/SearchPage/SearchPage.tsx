import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { ContractResultRow } from '@/components/features/semantic-search/ContractResultRow';
import { PrecedentRow } from '@/components/features/similar-clauses';
import { SearchInput } from '@/components/features/semantic-search/SearchInput';
import { SuggestedSearches } from '@/components/features/semantic-search/SuggestedSearches';
import { useSemanticSearch } from '@/hooks/useSemanticSearch';
import type { SimilarClauseDto } from '@/types/similarClauses';
import type { ClauseSearchResult } from '@/types/semanticSearch';
import styles from './SearchPage.module.css';

type TabId = 'contracts' | 'clauses';
type SortId = 'best' | 'recent' | 'largest';

const PAGE_SIZE = 20;

/**
 * Dedicated /search page (Phase 11 US-CI-2).
 *
 * URL is the source of truth: ?q=<query>&tab=contracts|clauses
 * Filters (counterparty, date range) are reserved slots in v1 —
 * the chip rail renders but they're not wired to the mock service
 * yet. When the real backend lands they map to ?counterparty=&from=&to=.
 *
 * Result rows reuse ContractResultRow + PrecedentRow from the
 * SearchOverlay — no new components for the page.
 */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  // Render the auth-only wrapper if not logged in. Provided by App.tsx
  // ProtectedRoute, but a defensive guard here protects against direct nav.
  const { isAuthenticated } = useAuth();

  const initialQuery = params.get('q') ?? '';
  const initialTab = (params.get('tab') as TabId) ?? 'contracts';
  const [query, setQuery] = useState(initialQuery);
  const [tab, setTab] = useState<TabId>(initialTab);
  const [sort, setSort] = useState<SortId>('best');
  const [limit, setLimit] = useState(PAGE_SIZE);

  // Increase the per-section caps so the page shows more than the
  // overlay does (overlay defaults to 3 + 5).
  const { state, data } = useSemanticSearch(query, {
    contractLimit: 50,
    clauseLimit: 50,
  });

  // Keep the URL in sync with state changes (debounced via React's
  // natural batching on a single render).
  useEffect(() => {
    const next = new URLSearchParams();
    if (query.trim()) next.set('q', query);
    next.set('tab', tab);
    setParams(next, { replace: true });
  }, [query, tab, setParams]);

  if (!isAuthenticated) return null;

  const allContracts = data?.contracts ?? [];
  const allClauses = data?.clauses ?? [];

  const sortedContracts = useMemo(() => {
    const arr = [...allContracts];
    if (sort === 'best') arr.sort((a, b) => b.score - a.score);
    else if (sort === 'recent') arr.sort((a, b) =>
      b.contract.signedAt.localeCompare(a.contract.signedAt),
    );
    else if (sort === 'largest') arr.sort((a, b) =>
      parseDealSize(b.contract.dealSize) - parseDealSize(a.contract.dealSize),
    );
    return arr;
  }, [allContracts, sort]);

  const sortedClauses = useMemo(() => {
    const arr = [...allClauses];
    if (sort === 'best') arr.sort((a, b) => b.score - a.score);
    else if (sort === 'recent')
      arr.sort((a, b) => b.contract.signedAt.localeCompare(a.contract.signedAt));
    return arr;
  }, [allClauses, sort]);

  const visibleContracts = sortedContracts.slice(0, limit);
  const visibleClauses = sortedClauses.slice(0, limit);
  const visible = tab === 'contracts' ? visibleContracts : visibleClauses;
  const totalForTab =
    tab === 'contracts' ? sortedContracts.length : sortedClauses.length;
  const hasMore = visible.length < totalForTab;

  const subtitle = query
    ? `${data?.total ?? 0} results for "${query}"`
    : 'Search your contracts in plain English';

  return (
    <div className={styles.page}>
      <header>
        <h1 className={styles.title}>Search</h1>
        <p className={styles.subtitle}>{subtitle}</p>
      </header>

      <SearchInput
        value={query}
        onChange={(v) => {
          setQuery(v);
          setLimit(PAGE_SIZE);
        }}
        isLoading={state === 'loading'}
        autoFocus={!initialQuery}
      />

      {!query.trim() ? (
        <SuggestedSearches onSelect={setQuery} />
      ) : (
        <>
          <div className={styles.tabs} role="tablist">
            <TabButton
              active={tab === 'contracts'}
              label="Contracts"
              count={sortedContracts.length}
              onClick={() => {
                setTab('contracts');
                setLimit(PAGE_SIZE);
              }}
            />
            <TabButton
              active={tab === 'clauses'}
              label="Clauses"
              count={sortedClauses.length}
              onClick={() => {
                setTab('clauses');
                setLimit(PAGE_SIZE);
              }}
            />
          </div>

          <FiltersBar />

          <div className={styles.sortRow}>
            <div>
              Showing {visible.length} of {totalForTab} {tab}
            </div>
            <div className={styles.sortGroup}>
              <label htmlFor="sort">Sort:</label>
              <select
                id="sort"
                value={sort}
                onChange={(e) => setSort(e.target.value as SortId)}
              >
                <option value="best">Best match</option>
                <option value="recent">Most recent</option>
                {tab === 'contracts' && (
                  <option value="largest">Largest deal</option>
                )}
              </select>
            </div>
          </div>

          {visible.length === 0 ? (
            <NoResultsCard query={query} onBrowse={() => navigate('/contracts')} />
          ) : (
            <>
              <ul className={styles.list} aria-label={`${tab} results`}>
                {tab === 'contracts'
                  ? visibleContracts.map((c) => (
                      <li key={c.id}>
                        <ContractResultRow
                          result={c}
                          onSelect={() => navigate(`/results/${c.contract.id}`)}
                        />
                      </li>
                    ))
                  : visibleClauses.map((c) => (
                      <li key={c.id}>
                        <PrecedentRow
                          clause={clauseToPrecedent(c)}
                          onSelect={() => navigate(`/results/${c.contract.id}`)}
                        />
                      </li>
                    ))}
              </ul>
              {hasMore && (
                <button
                  type="button"
                  onClick={() => setLimit((l) => l + PAGE_SIZE)}
                  className={styles.loadMore}
                >
                  Load more
                </button>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function TabButton({
  active,
  label,
  count,
  onClick,
}: {
  active: boolean;
  label: string;
  count: number;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`${styles.tab} ${active ? styles.active : ''}`}
    >
      {label}
      <span className={styles.tabBadge}>{count}</span>
    </button>
  );
}

function FiltersBar() {
  // v1: chip rail renders but filters aren't wired to the mock
  // service (it doesn't filter). When the real backend lands,
  // forward into useSemanticSearch options.
  return (
    <div className={styles.filtersRow}>
      <span className={styles.filtersLabel}>Filters</span>
      <FilterChip label="Counterparty" value="Any" />
      <FilterChip label="Date range" value="Any" />
    </div>
  );
}

function FilterChip({ label, value }: { label: string; value: string }) {
  return (
    <button
      type="button"
      className="bg-surface border-border text-ink-mid hover:bg-bg-alt inline-flex items-center gap-1.5 rounded-[7px] border px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-blue"
      aria-label={`${label}: ${value}`}
    >
      <span className="text-ink-soft">{label}:</span>
      <span>{value}</span>
      <svg width="10" height="10" viewBox="0 0 10 10" aria-hidden="true">
        <path d="M2 4l3 3 3-3" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

function NoResultsCard({ query, onBrowse }: { query: string; onBrowse: () => void }) {
  return (
    <div className={styles.empty}>
      <h2>
        Nothing matched{' '}
        <span style={{ fontFamily: 'Georgia, serif', fontStyle: 'italic' }}>
          &ldquo;{query}&rdquo;
        </span>
      </h2>
      <p>Try rephrasing, or browse contracts directly.</p>
      <button
        type="button"
        onClick={onBrowse}
        className="bg-blue hover:bg-blue-dark mt-3 rounded-md px-3 py-1.5 text-xs font-semibold text-white"
      >
        Browse all contracts
      </button>
    </div>
  );
}

// ── Helpers ─────────────────────────────────────────────────────────

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

/** Parse "$2.4M" → 2_400_000, "$480K" → 480_000. Best-effort; returns 0 on miss. */
function parseDealSize(s: string): number {
  const m = s.match(/\$?([\d.]+)\s*([KM])?/i);
  if (!m) return 0;
  const n = Number(m[1]);
  const mult = m[2]?.toUpperCase() === 'M' ? 1_000_000 : m[2]?.toUpperCase() === 'K' ? 1_000 : 1;
  return Number.isFinite(n) ? n * mult : 0;
}
