// ContractIntel Redesign — Semantic Search
// Implements:
//   • GlobalSearchBar (lives in the top nav, present on every page)
//   • ⌘K / Ctrl+K shortcut from anywhere
//   • SearchOverlay (slide-down, backdrop, two stacked sections)
//   • SearchPage (dedicated, tabs + filters + density)
//   • States: empty (suggested searches), loading, no results, low-confidence, error
//   • Reuses SimilarityBar + PrecedentRow from screens-clauses.jsx

const { useMemo: useMemoSE, useEffect: useEffectSE, useState: useStateSE, useRef: useRefSE, useCallback: useCallbackSE } = React;

const SUGGESTED_QUERIES = [
  "contracts with unlimited liability",
  "auto-renewal clauses with short notice periods",
  "NDAs signed in the last 90 days",
  "termination rights that favour the counterparty",
];

const SE_MAC = typeof navigator !== 'undefined' && /Mac/.test(navigator.platform);
const SE_MOD = SE_MAC ? '⌘' : 'Ctrl';

// ─── Synthetic search engine ────────────────────────────────────────
// Stand-in for the real kNN search. Returns ranked contracts + clauses
// for a query. Score is derived from query length + clause salience so
// it looks deterministic and reasonable for the spec's example queries.
function seedScore(q, salt) {
  let h = 0;
  const s = (q || '').toLowerCase().trim() + '|' + salt;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h % 1000) / 1000;
}

function runSemanticSearch(query, contracts) {
  const q = (query || '').toLowerCase().trim();
  if (!q) return { contracts: [], clauses: [], total: 0 };

  const lib = window.STD_CLAUSES_BY_TYPE || null; // we don't export this; inline our own
  const KEYS = ['liability', 'indemnity', 'ip', 'termination', 'changectrl', 'renewal', 'dispute', 'confidential', 'payment', 'sla', 'dataport'];
  const LABELS = {
    liability: 'Limitation of Liability', indemnity: 'Indemnification', ip: 'Intellectual Property',
    termination: 'Termination', changectrl: 'Change of Control', renewal: 'Auto-Renewal',
    dispute: 'Dispute Resolution', confidential: 'Confidentiality', payment: 'Payment Terms',
    sla: 'Service Levels', dataport: 'Data Portability',
  };

  // Keyword nudges: if query mentions liability, boost liability clauses, etc.
  const NUDGE = {
    liability: /liab|cap|exposure/i,
    indemnity: /indemn/i,
    ip: /\bip\b|intellect|ownership|work product/i,
    termination: /terminat|exit/i,
    changectrl: /change of control|acquir|m&a/i,
    renewal: /renew|auto/i,
    dispute: /dispute|arbitr|court|jurisdiction/i,
    confidential: /confid|nda|disclosure/i,
    payment: /payment|invoice|fee|price/i,
    sla: /sla|uptime|service level|availabil/i,
    dataport: /data|export|portab/i,
  };

  // Score each contract by its best-matching clause
  const contractResults = [];
  for (const c of contracts) {
    const clauses = (window.getContractClauses ? window.getContractClauses(c) : []).filter(Boolean);
    if (!clauses.length) continue;
    let best = { score: 0, clause: null };
    for (const cl of clauses) {
      let s = 0.45 + seedScore(q, c.id + '|' + cl.key) * 0.45;
      // keyword nudges (semantic-ish)
      if (NUDGE[cl.key] && NUDGE[cl.key].test(q)) s = Math.min(0.98, s + 0.12);
      // risk flag matches boost slightly (these clauses tend to be more notable)
      if (cl.severity === 'red') s = Math.min(0.99, s + 0.04);
      if (s > best.score) best = { score: s, clause: cl };
    }
    if (best.clause) {
      contractResults.push({
        id: `c::${c.id}`,
        contract: c,
        score: best.score,
        clause: best.clause,
      });
    }
  }
  contractResults.sort((a, b) => b.score - a.score);

  // Score each clause across all contracts independently
  const clauseResults = [];
  for (const c of contracts) {
    const clauses = (window.getContractClauses ? window.getContractClauses(c) : []);
    for (const cl of clauses) {
      let s = 0.42 + seedScore(q, c.id + '|' + cl.key + '|c') * 0.5;
      if (NUDGE[cl.key] && NUDGE[cl.key].test(q)) s = Math.min(0.98, s + 0.14);
      if (cl.severity === 'red') s = Math.min(0.99, s + 0.03);
      clauseResults.push({
        id: `cl::${c.id}::${cl.key}`,
        score: s,
        label: cl.label,
        contractName: c.name.replace(/\.pdf$/i, ''),
        contractDate: c.uploadDate ? new Date(c.uploadDate).toLocaleString('en-GB', { month: 'short', year: 'numeric' }) : '—',
        text: cl.text,
        contract: c,
        clause: cl,
      });
    }
  }
  clauseResults.sort((a, b) => b.score - a.score);

  return {
    contracts: contractResults,
    clauses: clauseResults,
    total: contractResults.length + clauseResults.length,
  };
}

// ─── SearchInput — used in both top-bar (compact) and page (large) ──
function SearchInput({ value, onChange, onFocus, onClear, loading, compact, autoFocus, onKeyDown }) {
  const ref = useRefSE(null);
  useEffectSE(() => { if (autoFocus && ref.current) ref.current.focus(); }, [autoFocus]);

  const h = compact ? 36 : 52;
  const fs = compact ? 13 : 16;
  const pad = compact ? '0 38px 0 36px' : '0 56px 0 48px';

  return (
    <div style={{ position: 'relative', width: '100%', height: h }}>
      <span style={{ position: 'absolute', left: compact ? 11 : 16, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft, pointerEvents: 'none' }}>
        {loading ? (
          <span style={{ width: compact ? 14 : 18, height: compact ? 14 : 18, border: `1.5px solid ${T.blue}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'ci-spin 0.7s linear infinite' }} />
        ) : (
          <svg width={compact ? 14 : 18} height={compact ? 14 : 18} viewBox="0 0 18 18" fill="none">
            <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        )}
      </span>
      <input
        ref={ref}
        value={value}
        onChange={e => onChange(e.target.value)}
        onFocus={onFocus}
        onKeyDown={onKeyDown}
        placeholder="Search your contracts in plain English…"
        style={{
          width: '100%', height: '100%', padding: pad,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: compact ? 8 : 12,
          fontSize: fs, fontFamily: "'DM Sans', sans-serif", color: T.ink,
          outline: 'none', letterSpacing: '-0.01em',
          transition: 'border-color 0.12s, box-shadow 0.12s',
        }}
      />
      <div style={{ position: 'absolute', right: compact ? 8 : 14, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 6 }}>
        {value && (
          <button onClick={onClear} aria-label="Clear" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkSoft, padding: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 4 }}>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M3 3l6 6M9 3l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        )}
        {!value && (
          <span style={{ display: 'inline-flex', gap: 3, fontSize: 10, fontWeight: 600, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>
            <kbd style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 5px', fontSize: 10 }}>{SE_MOD}</kbd>
            <kbd style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 5px', fontSize: 10 }}>K</kbd>
          </span>
        )}
      </div>
    </div>
  );
}

// ─── ContractResultRow ───────────────────────────────────────────────
// New row type, contract-level meta + "Matched on" explainability anchor.
function ContractResultRow({ result, focused, onClick, onFocus }) {
  const ref = useRefSE(null);
  useEffectSE(() => { if (focused && ref.current) ref.current.focus(); }, [focused]);
  const pct = Math.round(result.score * 100);
  const c = result.contract;
  const counterparty = c.parties && c.parties[0] ? c.parties[0] : '—';
  const signed = c.effectiveDate || c.uploadDate || '';
  const signedShort = signed ? new Date(signed).toLocaleString('en-GB', { month: 'short', year: 'numeric' }) : '—';
  return (
    <div
      ref={ref}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onFocus={onFocus}
      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onClick(); } }}
      style={{
        position: 'relative',
        background: focused ? T.bgAlt : T.surface,
        border: `1px solid ${focused ? T.borderMid : T.border}`,
        borderRadius: 10,
        padding: '14px 16px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'background 0.12s, border-color 0.12s, transform 0.12s',
        transform: focused ? 'translateY(-1px)' : 'none',
        boxShadow: focused ? '0 4px 12px rgba(15,23,42,0.06)' : 'none',
        fontFamily: "'DM Sans', sans-serif",
      }}
      onMouseEnter={e => { e.currentTarget.style.background = T.bgAlt; }}
      onMouseLeave={e => { e.currentTarget.style.background = focused ? T.bgAlt : T.surface; }}
    >
      {/* Top similarity bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <SimilarityBar score={result.score} height={6} showTicks />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: result.score >= 0.9 ? T.blueDark : T.ink, fontFamily: "'DM Mono', monospace", fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'right' }}>
          {pct}% match
        </span>
      </div>

      {/* Contract title */}
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
        <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: '-0.01em' }}>{c.name.replace(/\.pdf$/i, '')}</span>
        <TypePill type={c.type} />
      </div>

      {/* Meta line: signed · value · counterparty */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.inkSoft, marginBottom: 8, flexWrap: 'wrap' }}>
        <span>Signed {signedShort}</span>
        {c.paymentAmount && (<><span style={{ color: T.borderMid }}>·</span><span style={{ fontFamily: "'DM Mono', monospace" }}>{c.paymentAmount}</span></>)}
        <span style={{ color: T.borderMid }}>·</span>
        <span>Counterparty: <strong style={{ color: T.inkMid, fontWeight: 600 }}>{counterparty}</strong></span>
      </div>

      {/* Matched on — explainability anchor */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '3px 8px', background: T.blueLight, border: `1px solid ${T.blueMid}55`, borderRadius: 5, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.blueDark, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Matched on</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: T.blueDark }}>{result.clause.label}</span>
        <span style={{ fontSize: 10, color: T.blueDark, fontFamily: "'DM Mono', monospace", opacity: 0.75 }}>§{result.clause.section}</span>
      </div>

      {/* Snippet */}
      <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.55, color: T.inkMid, fontFamily: 'Georgia, serif', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        "{result.clause.text}"
      </p>
    </div>
  );
}

// ─── SuggestedSearches — empty state ─────────────────────────────────
function SuggestedSearches({ onPick }) {
  return (
    <div style={{ padding: '16px 4px 4px' }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>Try searching…</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {SUGGESTED_QUERIES.map(q => (
          <button
            key={q}
            onClick={() => onPick(q)}
            style={{
              display: 'flex', alignItems: 'center', gap: 12, textAlign: 'left',
              background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8,
              padding: '10px 14px', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.12s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = T.bgAlt; e.currentTarget.style.borderColor = T.borderMid; }}
            onMouseLeave={e => { e.currentTarget.style.background = T.surface; e.currentTarget.style.borderColor = T.border; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ color: T.inkMute, flexShrink: 0 }}>
              <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.4" />
              <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
            </svg>
            <span style={{ fontSize: 14, color: T.ink, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>"{q}"</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Low confidence banner ──────────────────────────────────────────
function LowConfidenceBanner() {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: T.orangeBg, border: `1px solid ${T.orangeBorder}`, borderRadius: 8, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ color: T.orangeDark, flexShrink: 0 }}>
        <path d="M8 2v6m0 3v1" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.4" />
      </svg>
      <span style={{ fontSize: 12.5, color: T.orangeDark, fontWeight: 500 }}>
        We didn't find a strong match. Showing closest results.
      </span>
    </div>
  );
}

// ─── No results state ───────────────────────────────────────────────
function NoResultsState({ query, onBrowse }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8.5" stroke={T.inkMute} strokeWidth="1.5" />
          <path d="M5 5l12 12" stroke={T.inkMute} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
        Nothing matched <span style={{ color: T.inkMid, fontStyle: 'italic', fontFamily: 'Georgia, serif' }}>"{query}"</span>
      </div>
      <p style={{ margin: '0 auto 14px', maxWidth: 320, fontSize: 12.5, lineHeight: 1.6, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
        Try rephrasing, or browse contracts directly.
      </p>
      <Btn size="sm" variant="secondary" onClick={onBrowse}>Browse all contracts</Btn>
    </div>
  );
}

// ─── SearchOverlay ──────────────────────────────────────────────────
// The slide-down result surface
function SearchOverlay({ open, query, setQuery, state, results, focusIdx, setFocusIdx, onClose, onSeeAll, onOpenContract, onOpenClause, onBrowse }) {
  if (!open) return null;

  const lowConfidence = (state === 'loaded' || state === 'low') &&
    ((results.contracts[0]?.score || 0) < 0.55) && ((results.clauses[0]?.score || 0) < 0.55) &&
    (results.contracts.length || results.clauses.length);

  const topContracts = results.contracts.slice(0, 3);
  const topClauses = results.clauses.slice(0, 5);

  // Flat indexable list for keyboard nav
  const navItems = [
    ...topContracts.map((r, i) => ({ kind: 'contract', idx: i, r })),
    ...topClauses.map((r, i) => ({ kind: 'clause', idx: i, r })),
  ];

  return (
    <>
      {/* Strong backdrop (50%) — overlay reads as focused mode */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', inset: 0, background: 'rgba(15,23,42,0.5)',
          zIndex: 290, animation: 'ci-fade-in 0.18s ease-out',
        }}
      />
      <div
        role="dialog"
        aria-label="Search"
        style={{
          position: 'fixed', top: 0, left: 0, right: 0,
          maxHeight: '85vh', zIndex: 300,
          display: 'flex', flexDirection: 'column',
          background: T.surface, borderBottom: `1px solid ${T.border}`,
          boxShadow: '0 16px 40px rgba(15,23,42,0.12)',
          animation: 'ci-slide-down 0.2s ease-out',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Input row */}
        <div style={{ padding: '14px 20px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
          <div style={{ flex: 1, maxWidth: 720 }}>
            <SearchInput
              value={query}
              onChange={setQuery}
              onClear={() => setQuery('')}
              loading={state === 'loading'}
              autoFocus
            />
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: T.inkSoft, padding: 6, display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 600 }}
          >
            <kbd style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 6px', fontSize: 10, fontFamily: "'DM Mono', monospace", color: T.inkSoft }}>Esc</kbd>
          </button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '18px 20px 22px' }}>
          {state === 'idle' && <SuggestedSearches onPick={q => setQuery(q)} />}

          {state === 'loading' && (
            <>
              <SectionHead label="Top contracts" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                <SkeletonRow /><SkeletonRow />
              </div>
              <SectionHead label="Top clauses (across contracts)" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <SkeletonRow /><SkeletonRow /><SkeletonRow />
              </div>
            </>
          )}

          {state === 'error' && (
            <div style={{ padding: '40px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8 }}>Something went wrong</div>
              <p style={{ margin: '0 auto 14px', maxWidth: 280, fontSize: 12.5, color: T.inkSoft }}>The search service is unavailable. Try again in a moment.</p>
              <Btn size="sm" variant="secondary" onClick={() => setQuery(query)}>Retry</Btn>
            </div>
          )}

          {state === 'empty' && <NoResultsState query={query} onBrowse={onBrowse} />}

          {(state === 'loaded' || state === 'low') && (
            <>
              {lowConfidence && <LowConfidenceBanner />}

              {/* Contracts section */}
              {topContracts.length > 0 && (
                <>
                  <SectionHead
                    label="Top contracts"
                    aside={
                      <button onClick={() => onSeeAll('contracts')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.blue, fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                        See all ({results.contracts.length}) →
                      </button>
                    }
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 22 }}>
                    {topContracts.map((r, i) => (
                      <ContractResultRow
                        key={r.id}
                        result={r}
                        focused={focusIdx === i}
                        onFocus={() => setFocusIdx(i)}
                        onClick={() => onOpenContract(r)}
                      />
                    ))}
                  </div>
                </>
              )}

              {/* Clauses section — reuses PrecedentRow */}
              {topClauses.length > 0 && (
                <>
                  <SectionHead
                    label="Top clauses (across contracts)"
                    aside={
                      <button onClick={() => onSeeAll('clauses')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.blue, fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
                        See all ({results.clauses.length}) →
                      </button>
                    }
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {topClauses.map((r, i) => {
                      const navIdx = topContracts.length + i;
                      return (
                        <PrecedentRow
                          key={r.id}
                          result={r}
                          focused={focusIdx === navIdx}
                          onFocus={() => setFocusIdx(navIdx)}
                          onClick={() => onOpenClause(r)}
                        />
                      );
                    })}
                  </div>
                </>
              )}

              {/* Keyboard hints */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 0 0', fontSize: 11, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>
                <Kbd>↑↓</Kbd><span>navigate</span>
                <Kbd>Enter</Kbd><span>open</span>
                <Kbd>Esc</Kbd><span>close</span>
                <span style={{ marginLeft: 'auto', fontFamily: "'DM Mono', monospace" }}>
                  {results.total} result{results.total === 1 ? '' : 's'}
                </span>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}

function SectionHead({ label, aside }) {
  return (
    <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 12 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{label}</span>
      {aside}
    </div>
  );
}

// ─── GlobalSearch — bar + overlay; mounts itself globally ───────────
function GlobalSearch({ onNavToSearchPage, onOpenContract, onOpenClause, demoState }) {
  const { CONTRACTS } = window.APP_DATA;
  const [open, setOpen] = useStateSE(false);
  const [query, setQuery] = useStateSE('');
  const [state, setState] = useStateSE('idle');    // idle | loading | loaded | low | empty | error
  const [results, setResults] = useStateSE({ contracts: [], clauses: [], total: 0 });
  const [focusIdx, setFocusIdx] = useStateSE(-1);
  const debounceRef = useRefSE(null);

  // ⌘K / Ctrl+K global shortcut
  useEffectSE(() => {
    function onKey(e) {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault(); setOpen(true);
      } else if (e.key === 'Escape' && open) {
        e.preventDefault(); setOpen(false);
      } else if (open && (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Enter')) {
        if (state !== 'loaded' && state !== 'low') return;
        const total = Math.min(3, results.contracts.length) + Math.min(5, results.clauses.length);
        if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(total - 1, i + 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
        else if (e.key === 'Enter' && focusIdx >= 0) {
          e.preventDefault();
          const topContractsLen = Math.min(3, results.contracts.length);
          if (focusIdx < topContractsLen) doOpenContract(results.contracts[focusIdx]);
          else doOpenClause(results.clauses[focusIdx - topContractsLen]);
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, state, results, focusIdx]);

  // Demo state override
  useEffectSE(() => {
    if (!demoState || demoState === 'auto') return;
    if (demoState === 'closed') { setOpen(false); return; }
    setOpen(true);
    if (demoState === 'idle')    { setQuery(''); setState('idle'); }
    if (demoState === 'loading') { setQuery('unlimited liability indemnification'); setState('loading'); }
    if (demoState === 'loaded')  {
      setQuery('unlimited liability indemnification');
      const r = runSemanticSearch('unlimited liability indemnification', CONTRACTS);
      setResults(r); setState('loaded');
    }
    if (demoState === 'low') {
      setQuery('aardvark mineral rights pre-1850');
      const r = runSemanticSearch('aardvark mineral rights pre-1850', CONTRACTS);
      // force low scores
      r.contracts = r.contracts.map(x => ({ ...x, score: 0.41 + (x.score * 0.1) }));
      r.clauses = r.clauses.map(x => ({ ...x, score: 0.40 + (x.score * 0.08) }));
      setResults(r); setState('low');
    }
    if (demoState === 'empty')   { setQuery('xqxq nothing-here-zzz'); setResults({ contracts: [], clauses: [], total: 0 }); setState('empty'); }
    if (demoState === 'error')   { setQuery('something'); setState('error'); }
  }, [demoState]);

  // Debounced search on query change
  useEffectSE(() => {
    if (demoState && demoState !== 'auto') return; // demoState owns state
    if (!open) return;
    if (!query.trim()) { setState('idle'); setResults({ contracts: [], clauses: [], total: 0 }); setFocusIdx(-1); return; }
    setState('loading');
    setFocusIdx(-1);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const r = runSemanticSearch(query, CONTRACTS);
      setResults(r);
      if (!r.total) setState('empty');
      else {
        const topScore = Math.max(r.contracts[0]?.score || 0, r.clauses[0]?.score || 0);
        setState(topScore < 0.55 ? 'low' : 'loaded');
      }
    }, 600);
    return () => clearTimeout(debounceRef.current);
  }, [query, open, demoState]);

  function doOpenContract(r) { setOpen(false); onOpenContract(r); }
  function doOpenClause(r) { setOpen(false); onOpenClause(r); }

  return (
    <>
      <GlobalSearchBar value={query} onChange={setQuery} onFocus={() => setOpen(true)} />
      <SearchOverlay
        open={open}
        query={query}
        setQuery={setQuery}
        state={state}
        results={results}
        focusIdx={focusIdx}
        setFocusIdx={setFocusIdx}
        onClose={() => setOpen(false)}
        onSeeAll={(tab) => { setOpen(false); onNavToSearchPage(query, tab); }}
        onOpenContract={doOpenContract}
        onOpenClause={doOpenClause}
        onBrowse={() => { setOpen(false); onNavToSearchPage('', 'contracts'); }}
      />
    </>
  );
}

// ─── GlobalSearchBar — compact bar in TopNav ────────────────────────
function GlobalSearchBar({ value, onChange, onFocus }) {
  return (
    <div className="ci-search-bar" style={{ flex: 1, maxWidth: 480, marginLeft: 24, marginRight: 16 }}>
      <button
        onClick={onFocus}
        style={{
          width: '100%', height: 36, padding: '0 12px 0 36px', position: 'relative',
          background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
          borderRadius: 8, cursor: 'text', display: 'flex', alignItems: 'center',
          gap: 8, fontFamily: "'DM Sans', sans-serif", color: 'rgba(255,255,255,0.55)',
          fontSize: 13, transition: 'all 0.12s', textAlign: 'left',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; e.currentTarget.style.color = 'rgba(255,255,255,0.85)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)'; e.currentTarget.style.color = 'rgba(255,255,255,0.55)'; }}
      >
        <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', display: 'flex' }}>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.2" stroke="currentColor" strokeWidth="1.5" />
            <path d="M9 9l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <span style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {value || 'Search your contracts in plain English…'}
        </span>
        <span style={{ display: 'inline-flex', gap: 3, flexShrink: 0 }}>
          <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.7)' }}>{SE_MOD}</kbd>
          <kbd style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: 4, padding: '1px 5px', fontSize: 10, fontFamily: "'DM Mono', monospace", color: 'rgba(255,255,255,0.7)' }}>K</kbd>
        </span>
      </button>
    </div>
  );
}

// ─── SearchPage — dedicated /search page ────────────────────────────
function SearchPage({ initialQuery, initialTab, onOpenContract, onOpenClause, onBrowse }) {
  const { CONTRACTS } = window.APP_DATA;
  const [query, setQuery] = useStateSE(initialQuery || '');
  const [tab, setTab] = useStateSE(initialTab || 'contracts');
  const [sort, setSort] = useStateSE('best');
  const [counterparty, setCounterparty] = useStateSE('any');
  const [dateRange, setDateRange] = useStateSE('any');
  const [limit, setLimit] = useStateSE(20);

  const allCounterparties = useMemoSE(() => Array.from(new Set(CONTRACTS.map(c => c.parties?.[0]).filter(Boolean))), []);

  const results = useMemoSE(() => runSemanticSearch(query, CONTRACTS), [query]);

  const filtered = useMemoSE(() => {
    function filterContract(r) {
      if (counterparty !== 'any' && r.contract.parties?.[0] !== counterparty) return false;
      if (dateRange !== 'any') {
        const d = r.contract.effectiveDate || r.contract.uploadDate;
        if (!d) return false;
        const dt = new Date(d).getTime(); const now = Date.now();
        const days = dateRange === '30' ? 30 : dateRange === '90' ? 90 : dateRange === '365' ? 365 : 9999;
        if (now - dt > days * 86400000) return false;
      }
      return true;
    }
    const cR = results.contracts.filter(filterContract);
    const clR = results.clauses.filter(r => filterContract({ contract: r.contract }));
    if (sort === 'recent') {
      cR.sort((a, b) => new Date(b.contract.uploadDate || 0) - new Date(a.contract.uploadDate || 0));
      clR.sort((a, b) => new Date(b.contract.uploadDate || 0) - new Date(a.contract.uploadDate || 0));
    } else if (sort === 'largest') {
      const v = c => parseFloat((c.paymentAmount || '0').replace(/[^0-9.]/g, '')) || 0;
      cR.sort((a, b) => v(b.contract) - v(a.contract));
      clR.sort((a, b) => v(b.contract) - v(a.contract));
    }
    return { contracts: cR, clauses: clR };
  }, [results, sort, counterparty, dateRange]);

  const list = tab === 'contracts' ? filtered.contracts : filtered.clauses;
  const visible = list.slice(0, limit);

  return (
    <PageShell title="Search" subtitle={query ? `${results.total} result${results.total === 1 ? '' : 's'} for "${query}"` : 'Search your contracts in plain English'}>
      <div className="ci-pad-32" style={{ padding: '24px 32px', maxWidth: 1080 }}>
        {/* Large search input */}
        <div style={{ marginBottom: 16 }}>
          <SearchInput
            value={query}
            onChange={setQuery}
            onClear={() => setQuery('')}
            autoFocus={!query}
          />
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          {[{ id: 'contracts', label: `Contracts`, n: filtered.contracts.length }, { id: 'clauses', label: `Clauses`, n: filtered.clauses.length }].map(t => (
            <button
              key={t.id}
              onClick={() => { setTab(t.id); setLimit(20); }}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                background: tab === t.id ? T.ink : T.surface,
                color: tab === t.id ? '#fff' : T.inkMid,
                border: `1px solid ${tab === t.id ? T.ink : T.border}`,
                borderRadius: 8, padding: '8px 14px',
                fontSize: 13, fontWeight: 600, cursor: 'pointer',
                fontFamily: "'DM Sans', sans-serif",
              }}>
              {t.label}
              <span style={{ display: 'inline-block', padding: '1px 7px', background: tab === t.id ? 'rgba(255,255,255,0.18)' : T.bgAlt, borderRadius: 4, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{t.n}</span>
            </button>
          ))}
        </div>

        {/* Filters */}
        <SearchFiltersBar
          counterparty={counterparty} setCounterparty={setCounterparty}
          counterparties={allCounterparties}
          dateRange={dateRange} setDateRange={setDateRange}
        />

        {/* Sort + count row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0 12px', borderBottom: `1px solid ${T.border}`, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
            Showing <strong style={{ color: T.ink, fontWeight: 700 }}>{Math.min(limit, list.length)}</strong> of <strong style={{ color: T.ink, fontWeight: 700 }}>{list.length}</strong> {tab}
          </span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 12, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>Sort:</span>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 6, padding: '5px 8px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}
            >
              <option value="best">Best match</option>
              <option value="recent">Most recent</option>
              <option value="largest">Largest deal</option>
            </select>
          </div>
        </div>

        {/* Result list */}
        {!query.trim() ? (
          <SuggestedSearches onPick={setQuery} />
        ) : list.length === 0 ? (
          <NoResultsState query={query} onBrowse={onBrowse} />
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {tab === 'contracts'
                ? visible.map(r => <ContractResultRow key={r.id} result={r} onClick={() => onOpenContract(r)} />)
                : visible.map(r => <PrecedentRow key={r.id} result={r} onClick={() => onOpenClause(r)} />)}
            </div>
            {visible.length < list.length && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 18 }}>
                <Btn size="sm" variant="secondary" onClick={() => setLimit(l => l + 20)}>Load more</Btn>
              </div>
            )}
          </>
        )}
      </div>
    </PageShell>
  );
}

// ─── SearchFiltersBar — chip row ────────────────────────────────────
function SearchFiltersBar({ counterparty, setCounterparty, counterparties, dateRange, setDateRange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 0, fontFamily: "'DM Sans', sans-serif" }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em', marginRight: 4 }}>Filters</span>

      <FilterDropdown
        label="Counterparty"
        value={counterparty === 'any' ? 'Any' : counterparty}
        onChange={setCounterparty}
        options={[{ value: 'any', label: 'Any' }, ...counterparties.map(c => ({ value: c, label: c }))]}
      />
      <FilterDropdown
        label="Date range"
        value={dateRange === 'any' ? 'Any' : dateRange === '30' ? 'Last 30 days' : dateRange === '90' ? 'Last 90 days' : 'Last year'}
        onChange={setDateRange}
        options={[
          { value: 'any', label: 'Any' },
          { value: '30', label: 'Last 30 days' },
          { value: '90', label: 'Last 90 days' },
          { value: '365', label: 'Last year' },
        ]}
      />
      <FilterChip label="Counterparty" inactive>Any</FilterChip>
    </div>
  );
}

function FilterDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useStateSE(false);
  const ref = useRefSE(null);
  useEffectSE(() => {
    function onDoc(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: T.surface, border: `1px solid ${T.border}`, borderRadius: 7,
          padding: '6px 10px', fontSize: 12.5, color: T.inkMid,
          cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontWeight: 500,
        }}>
        <span style={{ color: T.inkSoft, fontWeight: 600 }}>{label}:</span>
        <span style={{ color: T.ink, fontWeight: 600 }}>{value}</span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ marginLeft: 2 }}>
          <path d="M2 4l3 3 3-3" stroke={T.inkSoft} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {open && (
        <div style={{ position: 'absolute', top: 'calc(100% + 4px)', left: 0, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, boxShadow: '0 8px 24px rgba(15,23,42,0.08)', zIndex: 10, minWidth: 180, padding: 4 }}>
          {options.map(o => (
            <button key={o.value} onClick={() => { onChange(o.value); setOpen(false); }} style={{
              display: 'block', width: '100%', textAlign: 'left',
              background: 'transparent', border: 'none', cursor: 'pointer',
              padding: '7px 10px', borderRadius: 5, fontSize: 12.5,
              color: T.inkMid, fontFamily: "'DM Sans', sans-serif",
            }}
              onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >{o.label}</button>
          ))}
        </div>
      )}
    </div>
  );
}

function FilterChip({ label, children, inactive }) {
  // Visual placeholder for additional filter slots planned for v2 (contract type, deal size)
  return null;
}

// Inject CSS for slide-down + ⌘K-press flash on the search bar
if (typeof document !== 'undefined' && !document.getElementById('ci-search-anim')) {
  const s = document.createElement('style');
  s.id = 'ci-search-anim';
  s.textContent = `
    @keyframes ci-slide-down { from { transform: translateY(-16px); opacity: 0.4; } to { transform: translateY(0); opacity: 1; } }
    @keyframes ci-bar-flash { 0%,100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); } 30% { box-shadow: 0 0 0 4px rgba(37,99,235,0.35); } }
    .ci-search-bar-flash { animation: ci-bar-flash 0.5s ease-out; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  GlobalSearch, GlobalSearchBar, SearchOverlay, SearchPage, SearchInput,
  ContractResultRow, SuggestedSearches, NoResultsState, SearchFiltersBar,
  runSemanticSearch,
});
