// ContractIntel Redesign — Clauses tab + Similar Clauses drawer
// Implements the "Similar Clauses" feature per spec:
//   • Clauses tab on the contract Results screen
//   • Inline "Find similar" affordance on each clause card
//   • Right-side drawer (480px) with source block + 5 precedents
//   • States: loading skeleton, loaded, empty, single, error
//   • Active comparison state (after clicking a precedent row)
//   • Keyboard: F (find), Esc (close), ↑/↓ (move), Enter (open)

const { useMemo: useMemoCL, useEffect: useEffectCL, useState: useStateCL, useRef: useRefCL, useCallback: useCallbackCL } = React;

// ─── Data: derive clauses from each contract ────────────────────────
// Every contract has a small standard library of clauses. We mix the
// contract's own risk flags in (so the user sees the clauses they care
// about most) plus a few neutral / low-risk ones to round out the set.
const STD_CLAUSES_BY_TYPE = {
  vendor: [
    { key: 'liability',    label: 'Limitation of Liability',  matchFlag: /liability/i,            sampleSection: '9.2', samplePage: 7, samplePreview: "Each party's total liability under this Agreement shall not exceed the fees paid by Customer in the twelve (12) months preceding the event giving rise to the claim, regardless of the form of action." },
    { key: 'indemnity',    label: 'Indemnification',          matchFlag: /indemn/i,                sampleSection: '10.1', samplePage: 5, samplePreview: "Vendor shall defend, indemnify and hold harmless Customer from third-party claims arising out of Vendor's gross negligence, wilful misconduct, or material breach of this Agreement." },
    { key: 'ip',           label: 'Intellectual Property',    matchFlag: /ip|intellect/i,         sampleSection: '12.0', samplePage: 6, samplePreview: "All work product, deliverables and derivative works produced under this Agreement shall be the exclusive property of Vendor upon creation, including any pre-existing materials incorporated therein." },
    { key: 'termination',  label: 'Termination',              matchFlag: /terminat/i,              sampleSection: '15.3', samplePage: 7, samplePreview: "Either party may terminate this Agreement for convenience upon thirty (30) days written notice; provided that Customer shall pay an early-termination fee equal to six (6) months of remaining fees." },
    { key: 'changectrl',   label: 'Change of Control',        matchFlag: /change of control/i,    sampleSection: '17.0', samplePage: 8, samplePreview: "Neither party shall assign this Agreement without prior written consent, except in connection with a merger, acquisition or sale of substantially all of its assets." },
    { key: 'renewal',      label: 'Auto-Renewal',             matchFlag: /renewal|auto/i,          sampleSection: '3.4',  samplePage: 2, samplePreview: "This Agreement shall automatically renew for successive one (1) year terms unless either party provides written notice of non-renewal at least sixty (60) days prior to the end of the then-current term." },
    { key: 'dispute',      label: 'Dispute Resolution',       matchFlag: /dispute|arbitr/i,        sampleSection: '18.0', samplePage: 9, samplePreview: "Any dispute arising out of or relating to this Agreement shall be finally resolved by binding arbitration administered in New York under the Commercial Arbitration Rules of the American Arbitration Association." },
    { key: 'confidential', label: 'Confidentiality',          matchFlag: /confid|nda/i,            sampleSection: '8.0',  samplePage: 4, samplePreview: "Each party shall hold the other's Confidential Information in strict confidence for a period of three (3) years following termination, using at least the same degree of care it uses for its own confidential materials." },
    { key: 'payment',      label: 'Payment Terms',            matchFlag: null,                     sampleSection: '5.1',  samplePage: 3, samplePreview: "Customer shall pay all undisputed invoices within thirty (30) days of receipt. Late payments shall bear interest at the lesser of 1.5% per month or the maximum rate permitted by applicable law." },
    { key: 'sla',          label: 'Service Levels',           matchFlag: /sla|service level/i,    sampleSection: '7.3',  samplePage: 5, samplePreview: "Vendor shall maintain monthly uptime of at least 99.9%, measured over each calendar month, excluding scheduled maintenance windows and force majeure events." },
    { key: 'dataport',     label: 'Data Portability',         matchFlag: /data portab|export/i,   sampleSection: '11.0', samplePage: 7, samplePreview: "Upon termination, Vendor shall make Customer Data available for export in a structured, commonly used format for a period of ninety (90) days, after which Vendor may permanently delete such data." },
  ],
  license: [],
  partnership: [],
  customer: [],
  lease: [],
  nda: [],
};
// Reuse the vendor library for other types — same clause families exist across contract types
for (const k of Object.keys(STD_CLAUSES_BY_TYPE)) if (STD_CLAUSES_BY_TYPE[k].length === 0) STD_CLAUSES_BY_TYPE[k] = STD_CLAUSES_BY_TYPE.vendor;

function getContractClauses(contract) {
  const lib = STD_CLAUSES_BY_TYPE[contract.type] || STD_CLAUSES_BY_TYPE.vendor;
  return lib.map(tpl => {
    // Find a matching risk flag from this contract (if any)
    const flag = tpl.matchFlag ? contract.riskFlags.find(f => tpl.matchFlag.test(f.title) || tpl.matchFlag.test(f.description)) : null;
    return {
      id: `${contract.id}::${tpl.key}`,
      key: tpl.key,
      label: tpl.label,
      section: flag?.section || tpl.sampleSection,
      page: flag?.page || tpl.samplePage,
      severity: flag?.severity || null,     // 'red' | 'orange' | 'green' | null
      text: tpl.samplePreview,
      flagId: flag?.id || null,
    };
  });
}

// ─── Data: derive "similar clauses" results for a given clause ───────
// For demo purposes, we synthesise plausible precedents from the other
// contracts in the portfolio, varying the snippet to feel realistic.
const SIMILAR_VARIANTS = {
  liability: [
    "Each party's aggregate liability arising out of or in connection with this Agreement shall not exceed the aggregate amounts paid by Customer in the twelve (12) months immediately preceding the claim.",
    "Neither party's liability under this Agreement shall exceed twelve (12) months of fees paid or payable by Customer, except for breaches of confidentiality or IP indemnification obligations.",
    "Supplier's total cumulative liability is capped at the greater of (a) £1,000,000 or (b) two (2) times the fees paid in the prior 12 months. This cap excludes wilful misconduct and gross negligence.",
    "Liability of either party shall in no event exceed the total amounts paid hereunder in the six (6) months prior to the event giving rise to the claim.",
    "The Provider's maximum liability shall be limited to direct damages only and shall not exceed the annualised contract value.",
    "EXCEPT FOR BREACH OF SECTION 11 (CONFIDENTIALITY), NEITHER PARTY'S LIABILITY SHALL EXCEED FEES PAID IN THE TRAILING TWELVE MONTHS.",
  ],
  indemnity: [
    "Each party (the 'Indemnifying Party') shall indemnify, defend and hold harmless the other party from third-party claims arising from the Indemnifying Party's negligence or breach of this Agreement.",
    "Vendor shall indemnify Customer from any third-party claim alleging that the Services infringe a valid patent, copyright or trade secret. Customer's sole remedy is set forth in this Section.",
    "Both parties agree to mutual indemnification for claims of personal injury, property damage or wilful misconduct caused by the other party's acts or omissions.",
    "Provider's indemnification obligations are subject to (i) prompt written notice, (ii) sole control of defence, and (iii) reasonable cooperation by Customer at Provider's expense.",
    "Customer shall indemnify Supplier solely for misuse of the Services in breach of the documented usage policy; Supplier carries no indemnification obligation.",
    "Each party will indemnify the other on a reciprocal basis for direct losses arising from a breach of representations and warranties set forth herein.",
  ],
  ip: [
    "All work product created by Provider in performance of the Services, including all derivative works, shall be the exclusive property of Customer upon creation, free of any retained rights.",
    "Vendor retains ownership of all pre-existing materials, methodologies and tools. Customer receives a perpetual, royalty-free licence to use deliverables for its internal business purposes.",
    "Intellectual property rights in deliverables shall vest in Customer upon payment in full. Vendor retains a non-exclusive licence to use anonymised learnings for general improvement of its products.",
    "Joint ownership applies to all jointly-developed works, with each party free to exploit such works without accounting to the other.",
    "Title to all deliverables transfers to Customer; provided that any third-party open-source components shall remain governed by their respective licences.",
  ],
  termination: [
    "Either party may terminate this Agreement for convenience upon ninety (90) days written notice without penalty or further liability.",
    "Customer may terminate for material breach upon thirty (30) days written notice if such breach is not cured. Vendor may not terminate for convenience.",
    "Termination for cause requires written notice and a thirty (30) day cure period. Termination for convenience by either party requires sixty (60) days notice.",
    "This Agreement may be terminated by either party for convenience on six (6) months notice given at any time after the first anniversary of the Effective Date.",
    "Provider may terminate immediately for non-payment after fifteen (15) days written notice; Customer may terminate immediately for material breach.",
  ],
  changectrl: [
    "Upon a change of control of either party, the other party may terminate this Agreement on ninety (90) days written notice given within sixty (60) days of public announcement of such change.",
    "Customer shall have the right to terminate this Agreement upon written notice if Vendor undergoes a change of control to a direct competitor of Customer.",
    "Neither party may assign this Agreement without the prior written consent of the other, except to an Affiliate or in connection with a merger or sale of all or substantially all of its assets.",
  ],
  renewal: [
    "This Agreement shall renew automatically for additional one (1) year terms unless either party provides written notice of non-renewal at least ninety (90) days before the end of the current term.",
    "The Initial Term is two (2) years. Thereafter, this Agreement renews for successive twelve-month terms unless notice of non-renewal is given at least sixty (60) days in advance.",
    "Auto-renewal applies only after the Initial Term and may be cancelled by Customer at any time on thirty (30) days written notice without penalty.",
  ],
  dispute: [
    "Any dispute shall first be escalated to senior executives of both parties for good-faith negotiation for thirty (30) days before either party may commence formal proceedings.",
    "All disputes shall be finally settled by arbitration in London under the LCIA Rules by one arbitrator appointed in accordance with those Rules. The language of the arbitration shall be English.",
    "Disputes shall be resolved exclusively by the courts of England and Wales, which shall have exclusive jurisdiction. Each party waives any objection to such forum.",
  ],
  confidential: [
    "Each party shall use Confidential Information solely for the purposes of this Agreement and shall protect it with the same degree of care it uses for its own information of like importance, but in no event less than reasonable care.",
    "Confidentiality obligations survive for five (5) years after termination, except that trade secrets shall remain confidential for so long as they retain trade secret status under applicable law.",
    "Receiving party shall return or destroy all Confidential Information upon termination, except as required by applicable law or internal record-keeping obligations.",
  ],
  payment: [
    "Customer shall pay all invoices within forty-five (45) days of receipt. Disputed amounts shall be notified within fifteen (15) days of invoice date.",
    "All fees are payable in advance. Late payments accrue interest at 1% per month and Provider may suspend Services after thirty (30) days notice of non-payment.",
    "Invoices issued monthly in arrears. Payment due net 60. Currency: GBP. Late charges: Bank of England base rate + 8%.",
  ],
  sla: [
    "Service availability target: 99.95% monthly uptime. Service credits: 10% of monthly fee per 0.1% below target, capped at one (1) month of fees.",
    "Vendor commits to 99.5% monthly uptime, excluding scheduled maintenance. Credits available as Customer's sole and exclusive remedy.",
    "Uptime SLA: 99.9% measured monthly. Excludes (a) Customer-caused downtime, (b) force majeure, (c) maintenance windows announced ≥72 hours in advance.",
  ],
  dataport: [
    "On termination, Customer Data shall be made available for export in JSON or CSV format for a period of one hundred eighty (180) days, after which all copies will be permanently deleted.",
    "Vendor shall provide Customer Data export tools at no additional charge during the term and for sixty (60) days following expiration or termination of this Agreement.",
    "Customer Data remains the sole property of Customer at all times. Vendor's data retention period post-termination is thirty (30) days.",
  ],
};

// Build similar-clauses lookup for a given clause id. Returns a list of
// match objects { score, contractName, contractDate, label, text }
function getSimilarClauses(sourceClause, contracts, n = 5) {
  const variants = SIMILAR_VARIANTS[sourceClause.key] || [];
  if (!variants.length) return [];
  // Pick up to N other contracts (skip the source contract)
  const others = contracts.filter(c => `${c.id}::${sourceClause.key}` !== sourceClause.id).slice(0, n);
  const dateStrings = ['Mar 2025', 'Jan 2025', 'Oct 2024', 'Aug 2024', 'Jun 2024', 'Apr 2024', 'Feb 2024', 'Nov 2023'];
  // Deterministic-looking match scores: descending with realistic gaps
  const scores = [0.94, 0.86, 0.78, 0.71, 0.62];
  return others.map((c, i) => ({
    id: `${c.id}::${sourceClause.key}`,
    score: scores[i] ?? Math.max(0.5, 0.62 - i * 0.07),
    contractName: c.name.replace(/\.pdf$/i, ''),
    contractDate: dateStrings[i] || 'Older',
    label: sourceClause.label,
    text: variants[i % variants.length],
  })).slice(0, n);
}

// ═══════════════════════════════════════════════════════════════════
// SimilarityBar — primary scannable signal per spec §3.3 / §8
// Density-first, with tick markers at 50/75/90 thresholds. Fill is a
// blue accent that intensifies past 90% (the "very strong match" zone).
// ═══════════════════════════════════════════════════════════════════
function SimilarityBar({ score, height = 6, showTicks = true, strong = false }) {
  const pct = Math.max(0, Math.min(1, score));
  const fillColor = pct >= 0.9 ? T.blueDark : pct >= 0.75 ? T.blue : pct >= 0.5 ? '#60A5FA' : T.inkMute;
  const trackBg = strong ? T.blueLight : T.bgAlt;
  return (
    <div style={{ position: 'relative', width: '100%', height, background: trackBg, borderRadius: height, overflow: 'visible' }}>
      <div style={{ width: `${pct * 100}%`, height: '100%', background: fillColor, borderRadius: height, transition: 'width 0.4s cubic-bezier(0.22, 1, 0.36, 1)' }} />
      {showTicks && [0.5, 0.75, 0.9].map(t => (
        <div key={t} style={{
          position: 'absolute', top: -2, bottom: -2, left: `calc(${t * 100}% - 0.5px)`, width: 1,
          background: pct >= t ? 'rgba(255,255,255,0.5)' : T.borderMid,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ClauseCard — clause-as-it-appears in the Clauses tab (main view)
// Lifts the "Find similar" affordance into the card top-right.
// ═══════════════════════════════════════════════════════════════════
function ClauseCard({ clause, onFindSimilar, onFocus, focused, loading, highlighted }) {
  const ref = useRefCL(null);
  useEffectCL(() => { if (focused && ref.current) ref.current.focus(); }, [focused]);
  const sevColor = clause.severity ? T.sevColor(clause.severity) : null;
  const sevBg = clause.severity ? T.sevBg(clause.severity) : null;

  return (
    <div
      ref={ref}
      tabIndex={0}
      onFocus={onFocus}
      data-clause-id={clause.id}
      data-highlighted={highlighted ? 'true' : undefined}
      style={{
        background: T.surface,
        border: `1px solid ${highlighted ? T.blue : T.border}`,
        borderLeft: sevColor ? `4px solid ${sevColor}` : `4px solid ${T.border}`,
        borderRadius: 10,
        padding: '14px 18px 14px 18px',
        marginBottom: 10,
        outline: 'none',
        position: 'relative',
        boxShadow: highlighted ? `0 0 0 3px ${T.blue}1a` : focused ? `0 0 0 3px ${T.blue}33` : 'none',
        transition: 'box-shadow 0.18s, border-color 0.18s',
      }}
    >
      {highlighted && (
        <span style={{ position: 'absolute', top: 10, right: 14, fontSize: 11, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif" }}>
          In comparison
        </span>
      )}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 6 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.01em' }}>{clause.label}</span>
          {clause.severity && (
            <Badge label={clause.severity === 'red' ? 'High risk' : clause.severity === 'orange' ? 'Caution' : 'Low risk'} color={sevColor} bg={sevBg} dot />
          )}
        </div>
        {!highlighted && (
          <FindSimilarButton onClick={() => onFindSimilar(clause)} loading={loading} />
        )}
      </div>
      <p style={{ margin: '4px 0 8px', fontSize: 13, lineHeight: 1.6, color: T.inkMid, fontFamily: 'Georgia, serif', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        "{clause.text}"
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 11, color: T.inkSoft, fontFamily: "'DM Mono', monospace" }}>
        <span>§{clause.section}</span>
        <span style={{ color: T.borderMid }}>·</span>
        <span>Page {clause.page}</span>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// FindSimilarButton — compact secondary button with compass icon
// ═══════════════════════════════════════════════════════════════════
function FindSimilarButton({ onClick, loading }) {
  const [hover, setHover] = useStateCL(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={loading}
      title="Find 5 most similar clauses across your portfolio (F)"
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: hover ? T.blueLight : 'transparent',
        color: T.blue,
        border: `1px solid ${hover ? T.blueMid : T.border}`,
        borderRadius: 7,
        padding: '4px 10px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
        cursor: loading ? 'wait' : 'pointer',
        transition: 'all 0.12s',
        whiteSpace: 'nowrap',
        opacity: loading ? 0.7 : 1,
      }}
    >
      {loading ? (
        <>
          <span style={{ width: 10, height: 10, border: `1.5px solid ${T.blue}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'ci-spin 0.7s linear infinite' }} />
          Finding…
        </>
      ) : (
        <>
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" style={{ flexShrink: 0 }}>
            <circle cx="6" cy="6" r="5" stroke="currentColor" strokeWidth="1.3" />
            <path d="M6 2.5l1.2 2.8L9.5 6.5l-2.3 1L6 10l-1.2-2.5L2.5 6.5l2.3-1.2L6 2.5z" fill="currentColor" />
          </svg>
          Find similar
        </>
      )}
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SourceClauseCard — pinned at top of drawer; muted variant of result row
// ═══════════════════════════════════════════════════════════════════
function SourceClauseCard({ clause, contractName, onClick, active }) {
  return (
    <button
      onClick={onClick}
      title={active ? 'Already on source' : 'Return to source clause'}
      style={{
        display: 'block', width: '100%', textAlign: 'left',
        background: active ? T.bg : T.surfaceAlt,
        border: `1px solid ${active ? T.borderMid : T.border}`,
        borderRadius: 10,
        padding: '12px 14px',
        cursor: 'pointer',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, letterSpacing: '-0.01em' }}>{clause.label}</span>
        <span style={{ fontSize: 10, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Source</span>
      </div>
      <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Mono', monospace", marginBottom: 6 }}>
        {contractName.replace(/\.pdf$/i, '')} · §{clause.section}
      </div>
      <p style={{ margin: 0, fontSize: 12, lineHeight: 1.55, color: T.inkMid, fontFamily: 'Georgia, serif', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        "{clause.text}"
      </p>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════
// PrecedentRow — the heart of the drawer. Bar-led, dense, scannable.
// ═══════════════════════════════════════════════════════════════════
function PrecedentRow({ result, active, focused, onClick, onFocus }) {
  const ref = useRefCL(null);
  useEffectCL(() => { if (focused && ref.current) ref.current.focus(); }, [focused]);
  const pct = Math.round(result.score * 100);

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
        background: active ? T.blueLight : focused ? T.bgAlt : T.surface,
        border: `1px solid ${active ? T.blue : focused ? T.borderMid : T.border}`,
        borderRadius: 10,
        padding: '12px 14px 12px 14px',
        cursor: 'pointer',
        outline: 'none',
        transition: 'background 0.12s, border-color 0.12s, transform 0.12s',
        transform: focused && !active ? 'translateY(-1px)' : 'none',
        boxShadow: focused && !active ? '0 4px 12px rgba(15,23,42,0.06)' : 'none',
      }}
      onMouseEnter={e => { if (!active) e.currentTarget.style.background = T.bgAlt; }}
      onMouseLeave={e => { if (!active) e.currentTarget.style.background = focused ? T.bgAlt : T.surface; }}
    >
      {/* Top similarity bar — the primary scannable signal */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1 }}>
          <SimilarityBar score={result.score} height={6} showTicks strong={active} />
        </div>
        <span style={{ fontSize: 12, fontWeight: 700, color: result.score >= 0.9 ? T.blueDark : T.ink, fontFamily: "'DM Mono', monospace", fontVariantNumeric: 'tabular-nums', minWidth: 64, textAlign: 'right' }}>
          {pct}% match
        </span>
      </div>

      {/* Clause type — small confirmation that types match */}
      <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", marginBottom: 2, letterSpacing: '-0.01em' }}>
        {result.label}
      </div>

      {/* Meta line */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 240 }}>{result.contractName}</span>
        <span style={{ color: T.borderMid }}>·</span>
        <span style={{ fontFamily: "'DM Mono', monospace" }}>{result.contractDate}</span>
      </div>

      {/* Snippet */}
      <p style={{ margin: '0 24px 0 0', fontSize: 12.5, lineHeight: 1.55, color: T.inkMid, fontFamily: 'Georgia, serif', fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
        "{result.text}"
      </p>

      {/* Arrow on the right edge */}
      <span style={{ position: 'absolute', right: 12, bottom: 12, color: active ? T.blue : T.inkMute, opacity: focused || active ? 1 : 0.55, transition: 'opacity 0.12s, color 0.12s' }}>
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 3l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </span>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// EmptyPrecedentState
// ═══════════════════════════════════════════════════════════════════
function EmptyPrecedentState({ clauseLabel }) {
  return (
    <div style={{ padding: '40px 16px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: '50%', background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <circle cx="11" cy="11" r="8.5" stroke={T.inkMute} strokeWidth="1.5" />
          <path d="M5 5l12 12" stroke={T.inkMute} strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
        No similar clauses found yet
      </div>
      <p style={{ margin: '0 auto', maxWidth: 280, fontSize: 12.5, lineHeight: 1.6, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
        This is the first <strong style={{ color: T.inkMid, fontWeight: 600 }}>{clauseLabel}</strong> clause in your portfolio, or none of your existing ones are close enough to compare meaningfully.
      </p>
      <p style={{ margin: '10px auto 0', maxWidth: 280, fontSize: 12.5, lineHeight: 1.6, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>
        As you add more contracts, precedents will appear here.
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SkeletonRow — loading state
// ═══════════════════════════════════════════════════════════════════
function SkeletonRow() {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '12px 14px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div style={{ flex: 1, height: 6, background: T.bgAlt, borderRadius: 4, overflow: 'hidden', position: 'relative' }}>
          <div className="ci-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </div>
        <div style={{ width: 56, height: 10, background: T.bgAlt, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
          <div className="ci-shimmer" style={{ position: 'absolute', inset: 0 }} />
        </div>
      </div>
      <div style={{ width: '50%', height: 12, background: T.bgAlt, borderRadius: 3, marginBottom: 8, position: 'relative', overflow: 'hidden' }}>
        <div className="ci-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ width: '35%', height: 9, background: T.bgAlt, borderRadius: 3, marginBottom: 10, position: 'relative', overflow: 'hidden' }}>
        <div className="ci-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ width: '94%', height: 9, background: T.bgAlt, borderRadius: 3, marginBottom: 5, position: 'relative', overflow: 'hidden' }}>
        <div className="ci-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
      <div style={{ width: '80%', height: 9, background: T.bgAlt, borderRadius: 3, position: 'relative', overflow: 'hidden' }}>
        <div className="ci-shimmer" style={{ position: 'absolute', inset: 0 }} />
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SimilarClausesDrawer — main surface
// ═══════════════════════════════════════════════════════════════════
function SimilarClausesDrawer({ open, sourceClause, sourceContractName, contracts, demoState, onClose }) {
  const [state, setState] = useStateCL('loading');           // loading | loaded | empty | error | single
  const [results, setResults] = useStateCL([]);
  const [activeId, setActiveId] = useStateCL(null);          // currently-comparing row
  const [focusIdx, setFocusIdx] = useStateCL(-1);            // keyboard focus index

  // Compute results when drawer opens (or demo state changes)
  useEffectCL(() => {
    if (!open || !sourceClause) return;
    setActiveId(null);
    setFocusIdx(-1);

    // demoState override
    if (demoState && demoState !== 'auto') {
      if (demoState === 'loading') { setState('loading'); return; }
      if (demoState === 'error')   { setState('error'); setResults([]); return; }
      if (demoState === 'empty')   { setState('empty'); setResults([]); return; }
      if (demoState === 'single')  {
        const r = getSimilarClauses(sourceClause, contracts, 1);
        setResults(r); setState(r.length ? 'single' : 'empty'); return;
      }
      if (demoState === 'active') {
        const r = getSimilarClauses(sourceClause, contracts, 5);
        setResults(r); setState('loaded');
        // simulate clicking the top match
        setTimeout(() => setActiveId(r[0]?.id || null), 50);
        return;
      }
    }

    // Default flow: brief skeleton → loaded
    setState('loading');
    setResults([]);
    const timer = setTimeout(() => {
      const r = getSimilarClauses(sourceClause, contracts, 5);
      setResults(r);
      setState(r.length === 0 ? 'empty' : r.length === 1 ? 'single' : 'loaded');
    }, 380);
    return () => clearTimeout(timer);
  }, [open, sourceClause?.id, demoState]);

  // Keyboard nav inside drawer
  useEffectCL(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); return; }
      if (state !== 'loaded' && state !== 'single' && state !== 'active') return;
      if (e.key === 'ArrowDown') { e.preventDefault(); setFocusIdx(i => Math.min(results.length - 1, i + 1)); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); setFocusIdx(i => Math.max(0, i - 1)); }
      else if (e.key === 'Enter' && focusIdx >= 0) { e.preventDefault(); setActiveId(results[focusIdx].id); }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, state, results, focusIdx, onClose]);

  if (!open || !sourceClause) return null;

  const activeResult = results.find(r => r.id === activeId) || null;
  const countLabel = state === 'single' ? '1 similar clause' : `${results.length} similar clauses`;

  return (
    <>
      {/* Subtle backdrop — 20% per spec; click to dismiss. Sits below the top nav. */}
      <div
        onClick={onClose}
        style={{
          position: 'fixed', top: 56, left: 0, right: 0, bottom: 0,
          background: 'rgba(15,23,42,0.18)',
          zIndex: 50, animation: 'ci-fade-in 0.18s ease-out',
        }}
      />
      {/* Drawer panel — slide from right, no heavy shadow */}
      <aside
        role="dialog"
        aria-label="Similar clauses"
        style={{
          position: 'fixed', top: 56, right: 0, bottom: 0,
          width: 480, maxWidth: '92vw',
          background: T.surface,
          borderLeft: `1px solid ${T.borderMid}`,
          boxShadow: '-2px 0 16px rgba(15,23,42,0.04)',
          zIndex: 51, display: 'flex', flexDirection: 'column',
          animation: 'ci-slide-in 0.18s cubic-bezier(0.22,1,0.36,1)',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {/* Header */}
        <div style={{ padding: '14px 18px 12px', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
            <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, letterSpacing: '-0.02em' }}>Similar clauses</span>
            {activeResult && (
              <>
                <span style={{ color: T.borderMid, fontSize: 13 }}>›</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: T.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 220 }}>
                  {activeResult.contractName.split(' ').slice(0, 3).join(' ')}
                </span>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            style={{ background: 'transparent', border: 'none', cursor: 'pointer', width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.inkSoft }}
            onMouseEnter={e => { e.currentTarget.style.background = T.bgAlt; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        {/* Source block (sticky-ish at top of scroll area) */}
        <div style={{ padding: '14px 18px 6px', flexShrink: 0 }}>
          <SourceClauseCard
            clause={sourceClause}
            contractName={sourceContractName}
            active={!activeResult}
            onClick={() => setActiveId(null)}
          />
        </div>

        {/* Results header */}
        <div style={{ padding: '14px 18px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <span style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            {state === 'loading' ? 'Searching portfolio…' : state === 'error' ? '' : state === 'empty' ? '' : countLabel}
          </span>
          {(state === 'loaded' || state === 'single') && (
            <span style={{ fontSize: 10, fontWeight: 600, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>
              ≥ 50% threshold
            </span>
          )}
        </div>

        {/* Results body */}
        <div style={{ flex: 1, overflow: 'auto', padding: '0 18px 18px', display: 'flex', flexDirection: 'column', gap: 8 }}>
          {state === 'loading' && (
            <>
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
              <SkeletonRow />
            </>
          )}
          {state === 'error' && (
            <div style={{ padding: '36px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 10 }}>Couldn't load similar clauses</div>
              <p style={{ margin: '0 auto 14px', maxWidth: 260, fontSize: 12.5, color: T.inkSoft, lineHeight: 1.55 }}>
                Something went wrong searching your portfolio. This is usually transient.
              </p>
              <Btn size="sm" variant="secondary" onClick={() => { setState('loading'); setTimeout(() => { const r = getSimilarClauses(sourceClause, contracts, 5); setResults(r); setState(r.length ? 'loaded' : 'empty'); }, 300); }}>Retry</Btn>
            </div>
          )}
          {state === 'empty' && <EmptyPrecedentState clauseLabel={sourceClause.label} />}
          {(state === 'loaded' || state === 'single') && results.map((r, i) => (
            <PrecedentRow
              key={r.id}
              result={r}
              active={r.id === activeId}
              focused={i === focusIdx}
              onFocus={() => setFocusIdx(i)}
              onClick={() => setActiveId(r.id)}
            />
          ))}

          {/* Footer hint — keyboard nav reminder */}
          {(state === 'loaded' || state === 'single') && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 4px 0', fontSize: 11, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>
              <Kbd>↑↓</Kbd><span>navigate</span>
              <Kbd>Enter</Kbd><span>compare</span>
              <Kbd>Esc</Kbd><span>close</span>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

function Kbd({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4,
      padding: '1px 5px', fontSize: 10, fontWeight: 600, color: T.inkSoft,
      fontFamily: "'DM Mono', monospace", minWidth: 18,
    }}>{children}</span>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ClausesTab — the panel shown when the user picks "Clauses"
// ═══════════════════════════════════════════════════════════════════
function ClausesTab({ contract, contracts, demoState }) {
  const clauses = useMemoCL(() => getContractClauses(contract), [contract.id]);
  const [drawerOpen, setDrawerOpen] = useStateCL(false);
  const [activeClause, setActiveClause] = useStateCL(null);
  const [focusedClauseId, setFocusedClauseId] = useStateCL(null);
  const [loadingClauseId, setLoadingClauseId] = useStateCL(null);
  const [comparedClauseId, setComparedClauseId] = useStateCL(null); // for highlight in main view

  const openDrawer = useCallbackCL((clause) => {
    setLoadingClauseId(clause.id);
    setComparedClauseId(clause.id);
    setTimeout(() => {
      setActiveClause(clause);
      setDrawerOpen(true);
      setLoadingClauseId(null);
    }, 180);
  }, []);

  // Auto-open when demoState provides a non-auto value
  useEffectCL(() => {
    if (demoState && demoState !== 'auto' && demoState !== 'closed' && clauses[0] && !drawerOpen) {
      setActiveClause(clauses[0]);
      setComparedClauseId(clauses[0].id);
      setDrawerOpen(true);
    }
    if (demoState === 'closed' && drawerOpen) {
      setDrawerOpen(false);
    }
  }, [demoState]);

  // Global F to open similar for focused clause
  useEffectCL(() => {
    function onKey(e) {
      if (drawerOpen) return;
      if ((e.key === 'f' || e.key === 'F') && !e.metaKey && !e.ctrlKey && !e.altKey) {
        const tag = (e.target?.tagName || '').toLowerCase();
        if (tag === 'input' || tag === 'textarea') return;
        const c = clauses.find(x => x.id === focusedClauseId) || clauses[0];
        if (c) { e.preventDefault(); openDrawer(c); }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [clauses, focusedClauseId, drawerOpen, openDrawer]);

  function closeDrawer() {
    setDrawerOpen(false);
    setTimeout(() => { setActiveClause(null); setComparedClauseId(null); }, 200);
  }

  return (
    <>
      <div style={{ maxWidth: 720 }}>
        <div style={{ marginBottom: 14, padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
          <span style={{ fontSize: 13, color: T.inkMid, fontFamily: "'DM Sans', sans-serif" }}>
            <strong style={{ color: T.ink }}>{clauses.length}</strong> clauses extracted ·
            <span style={{ marginLeft: 6 }}>Press <Kbd>F</Kbd> on any clause to find precedents</span>
          </span>
          <span style={{ fontSize: 11, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>
            kNN search across portfolio
          </span>
        </div>

        {clauses.map(c => (
          <ClauseCard
            key={c.id}
            clause={c}
            focused={focusedClauseId === c.id}
            highlighted={comparedClauseId === c.id && drawerOpen}
            loading={loadingClauseId === c.id}
            onFocus={() => setFocusedClauseId(c.id)}
            onFindSimilar={openDrawer}
          />
        ))}
      </div>

      <SimilarClausesDrawer
        open={drawerOpen}
        sourceClause={activeClause}
        sourceContractName={contract.name}
        contracts={contracts}
        demoState={demoState}
        onClose={closeDrawer}
      />
    </>
  );
}

// Inject CSS animations once
if (typeof document !== 'undefined' && !document.getElementById('ci-similar-anim')) {
  const s = document.createElement('style');
  s.id = 'ci-similar-anim';
  s.textContent = `
    @keyframes ci-spin { to { transform: rotate(360deg); } }
    @keyframes ci-slide-in { from { transform: translateX(16px); opacity: 0.4; } to { transform: translateX(0); opacity: 1; } }
    @keyframes ci-fade-in { from { opacity: 0; } to { opacity: 1; } }
    @keyframes ci-shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
    @keyframes ci-clause-ring {
      0%   { box-shadow: 0 0 0 0 rgba(37,99,235,0.55); }
      40%  { box-shadow: 0 0 0 6px rgba(37,99,235,0.25); }
      100% { box-shadow: 0 0 0 0 rgba(37,99,235,0); }
    }
    .ci-shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.7) 50%, transparent 100%); animation: ci-shimmer 1.3s linear infinite; }
    [data-highlighted="true"] { animation: ci-clause-ring 1.8s ease-out; }
  `;
  document.head.appendChild(s);
}

Object.assign(window, {
  SimilarityBar, FindSimilarButton, ClauseCard, PrecedentRow, SourceClauseCard,
  EmptyPrecedentState, SimilarClausesDrawer, ClausesTab,
  getContractClauses, getSimilarClauses,
});
