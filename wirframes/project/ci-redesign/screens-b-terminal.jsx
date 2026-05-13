// ContractIntel Terminal — Screens B: Deep Dive, Compare, Portfolio, Export, Renewals, Settings
const { useState } = React;

// ─── Screen 5: Deep Dive ──────────────────────────────────────────
function DeepDiveScreen({ contractId, flagId, onBack }) {
  const { CONTRACTS } = window.APP_DATA;
  const c = CONTRACTS.find(x => x.id === contractId) || CONTRACTS[0];
  const f = c.riskFlags.find(x => x.id === flagId) || c.riskFlags[0];
  const [copied, setCopied] = useState(false);
  if (!f) return null;
  const fc = T.sevColor(f.severity);

  const marketStandards = {
    'Unlimited Liability Exposure': ['Liability capped at 2–3× annual fees', 'Minimum cap of £250k', 'IP indemnity excluded from cap'],
    'One-Sided Indemnification':    ['Mutual and reciprocal scope', "Proportional to each party's negligence", 'Excludes pre-existing IP'],
    'Broad IP Assignment':          ['Custom deliverables owned by client', 'Pre-existing IP excluded and listed', 'Joint ownership only for R&D'],
  };
  const standards = marketStandards[f.title] || ['Negotiate fair and balanced terms', 'Consult your legal team for specifics'];

  return (
    <PageShell title="DEEP DIVE" subtitle={`${c.name} · §${f.section} · PG ${f.page}`}
      actions={<Btn variant="ghost" size="sm" onClick={onBack}>← BACK TO REPORT</Btn>}>
      <div style={{ maxWidth: 680, margin: '0 auto', padding: '24px' }}>

        {/* Flag header */}
        <div style={{ background: T.sevBg(f.severity), border: `1px solid ${T.sevBorder(f.severity)}`, padding: '14px 18px', marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <SevTag severity={f.severity} />
            <span style={{ fontSize: 13, color: T.ink, fontFamily: MONO, letterSpacing: '0.02em' }}>{f.title}</span>
          </div>
          <div style={{ fontSize: 10, color: T.inkSoft, marginTop: 8, letterSpacing: '0.04em', fontFamily: MONO }}>
            STATUS: {f.status === 'open' ? <span style={{ color: T.orange }}>OPEN — ACTION REQUIRED</span> : <span style={{ color: T.green }}>ACCEPTED</span>}
          </div>
        </div>

        {/* What it means */}
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>WHAT THIS MEANS</SectionLabel>
          <div style={{ border: `1px solid ${T.border}`, background: T.surface, padding: '14px 18px' }}>
            <p style={{ margin: 0, fontSize: 11, color: T.inkMid, lineHeight: 1.8, fontFamily: MONO }}>{f.description}</p>
          </div>
        </div>

        {/* The clause */}
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>THE ACTUAL CLAUSE — PG {f.page}, §{f.section}</SectionLabel>
          <div style={{ border: `1px solid ${T.border}`, borderLeft: `3px solid ${fc}`, background: T.surface, padding: '14px 18px' }}>
            <div style={{ fontSize: 11, color: T.inkMid, lineHeight: 1.8, fontFamily: MONO, fontStyle: 'italic' }}>
              "{f.description.split('.')[0]}…"
            </div>
            <div style={{ marginTop: 8, fontSize: 9, color: T.inkMute, letterSpacing: '0.08em' }}>
              SOURCE: {c.name} — PAGE {f.page}, SECTION {f.section}
            </div>
          </div>
        </div>

        {/* Why it matters */}
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>EXPOSURE</SectionLabel>
          <div style={{ background: T.redDim, border: `1px solid ${T.redBorder}`, padding: '14px 18px' }}>
            <p style={{ margin: 0, fontSize: 11, color: T.inkMid, lineHeight: 1.8, fontFamily: MONO }}>
              If this clause stands as-is and a dispute arises, you may have limited or no legal recourse. This type of clause regularly results in six-figure losses for businesses that don't negotiate it away upfront.
            </p>
          </div>
        </div>

        {/* Market standard */}
        <div style={{ marginBottom: 22 }}>
          <SectionLabel>MARKET STANDARD</SectionLabel>
          <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
            {standards.map((s, i) => (
              <div key={s} style={{ display: 'flex', gap: 12, padding: '9px 14px', borderBottom: i < standards.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'center' }}>
                <span style={{ color: T.green, fontSize: 10, flexShrink: 0, letterSpacing: '0.06em' }}>+</span>
                <span style={{ fontSize: 11, color: T.inkMid, fontFamily: MONO }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggested language */}
        <div style={{ marginBottom: 24 }}>
          <SectionLabel>SUGGESTED LANGUAGE — COPY AND PASTE</SectionLabel>
          <div style={{ background: T.bgAlt, border: `1px solid ${T.borderMid}`, borderLeft: `3px solid ${T.amber}`, padding: '14px 18px' }}>
            <p style={{ margin: '0 0 12px', fontSize: 11, color: T.ink, lineHeight: 1.8, fontFamily: MONO }}>"{f.recommendation}"</p>
            <Btn size="sm" variant="amber" onClick={() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }}>
              {copied ? '✓ COPIED' : 'COPY LANGUAGE'}
            </Btn>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="success" onClick={onBack}>✓ MARK RESOLVED</Btn>
          <Btn variant="secondary" onClick={onBack}>DISMISS FLAG</Btn>
          <Btn variant="ghost" onClick={onBack}>← ALL FLAGS</Btn>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen 6: Compare ────────────────────────────────────────────
function CompareScreen({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const [idA, setIdA] = useState(1);
  const [idB, setIdB] = useState(2);
  const cA = complete.find(c => c.id === idA) || complete[0];
  const cB = complete.find(c => c.id === idB) || complete[1];

  const rows = [
    { label: 'RISK SCORE',    valA: cA.riskScore.toFixed(1), valB: cB.riskScore.toFixed(1), winnerFn: (a, b) => parseFloat(a) < parseFloat(b) ? 'A' : parseFloat(b) < parseFloat(a) ? 'B' : null, renderA: () => <RiskBar score={cA.riskScore} />, renderB: () => <RiskBar score={cB.riskScore} /> },
    { label: 'TYPE',          valA: cA.type, valB: cB.type, renderA: () => <TypePill type={cA.type} />, renderB: () => <TypePill type={cB.type} />, winnerFn: () => null },
    { label: 'VALUE',         valA: cA.paymentAmount || '—', valB: cB.paymentAmount || '—', winnerFn: () => null },
    { label: 'EXPIRY',        valA: cA.terminationDate || '—', valB: cB.terminationDate || '—', winnerFn: () => null },
    { label: 'AUTO-RENEWAL',  valA: cA.autoRenewal || '—', valB: cB.autoRenewal || '—', winnerFn: (a, b) => a === 'No' ? 'A' : b === 'No' ? 'B' : null },
    { label: 'NOTICE PERIOD', valA: cA.noticePeriod || '—', valB: cB.noticePeriod || '—', winnerFn: () => null },
    { label: 'PAYMENT TERMS', valA: cA.paymentTerms || '—', valB: cB.paymentTerms || '—', winnerFn: () => null },
    { label: 'RED FLAGS',     valA: String(cA.flags.red), valB: String(cB.flags.red), winnerFn: (a, b) => parseInt(a) < parseInt(b) ? 'A' : parseInt(b) < parseInt(a) ? 'B' : null },
    { label: 'TOTAL FLAGS',   valA: String(cA.flags.red + cA.flags.orange), valB: String(cB.flags.red + cB.flags.orange), winnerFn: (a, b) => parseInt(a) < parseInt(b) ? 'A' : parseInt(b) < parseInt(a) ? 'B' : null },
  ];

  let winsA = 0, winsB = 0;
  rows.forEach(r => { const w = r.winnerFn(r.valA, r.valB); if (w === 'A') winsA++; else if (w === 'B') winsB++; });
  const overallWinner = winsA > winsB ? 'A' : winsB > winsA ? 'B' : null;

  const selStyle = {
    width: '100%', background: T.surface, border: `1px solid ${T.borderMid}`,
    padding: '8px 10px', fontSize: 10, color: T.ink, fontFamily: MONO,
    outline: 'none', cursor: 'pointer', borderRadius: 0, letterSpacing: '0.04em',
  };

  return (
    <PageShell title="COMPARE" subtitle="Side-by-side term analysis"
      actions={<Btn size="sm" variant="secondary">EXPORT COMPARISON</Btn>}>
      <div style={{ padding: '16px 24px' }}>

        {/* Selectors */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 40px 1fr', gap: 10, marginBottom: 16, alignItems: 'end' }}>
          {[{ label: 'CONTRACT A', val: idA, set: setIdA }, { label: 'CONTRACT B', val: idB, set: setIdB }].map((sel, i) => (
            <div key={i}>
              <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', marginBottom: 5 }}>{sel.label}</div>
              <select value={sel.val} onChange={e => sel.set(Number(e.target.value))} style={selStyle}>
                {complete.map(c => <option key={c.id} value={c.id}>{c.name.replace(/\.[^.]+$/, '')}</option>)}
              </select>
            </div>
          ))}
          <div style={{ textAlign: 'center', fontSize: 11, color: T.inkMute, paddingBottom: 10, fontFamily: MONO }}>VS</div>
        </div>

        {/* Winner banner */}
        {overallWinner && (
          <div style={{ background: T.greenDim, border: `1px solid ${T.greenBorder}`, padding: '10px 16px', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 9, color: T.green, letterSpacing: '0.14em' }}>VERDICT:</span>
            <span style={{ fontSize: 11, color: T.green, fontFamily: MONO }}>
              {overallWinner === 'A' ? cA.name.replace(/\.[^.]+$/, '') : cB.name.replace(/\.[^.]+$/, '')} — better terms ({overallWinner === 'A' ? winsA : winsB} vs {overallWinner === 'A' ? winsB : winsA} categories)
            </span>
          </div>
        )}

        {/* Comparison table */}
        <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ padding: '9px 14px', fontSize: 9, color: T.inkMute, letterSpacing: '0.14em' }}>TERM</div>
            {[cA, cB].map(c => (
              <div key={c.id} style={{ padding: '9px 14px', borderLeft: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 10, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '0.04em' }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                <div style={{ fontSize: 9, color: T.inkSoft, marginTop: 1 }}>{c.parties[0]}</div>
              </div>
            ))}
          </div>

          {rows.map((row, i) => {
            const winner = row.winnerFn(row.valA, row.valB);
            return (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '160px 1fr 1fr', borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ padding: '10px 14px', fontSize: 9, color: T.inkSoft, letterSpacing: '0.08em', display: 'flex', alignItems: 'center' }}>{row.label}</div>
                {[{ val: row.valA, render: row.renderA, w: winner === 'A' }, { val: row.valB, render: row.renderB, w: winner === 'B' }].map((cell, ci) => (
                  <div key={ci} style={{ padding: '10px 14px', borderLeft: `1px solid ${T.border}`, background: cell.w ? T.greenDim : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontSize: 11, color: T.ink, fontFamily: MONO }}>
                      {cell.render ? cell.render() : cell.val}
                    </span>
                    {cell.w && <span style={{ fontSize: 9, color: T.green, letterSpacing: '0.08em' }}>✓</span>}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
          <Btn variant="secondary">EXPORT PDF</Btn>
          <Btn variant="ghost" onClick={() => onSelectContract(idA)}>OPEN A →</Btn>
          <Btn variant="ghost" onClick={() => onSelectContract(idB)}>OPEN B →</Btn>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen 7: Portfolio ──────────────────────────────────────────
function PortfolioScreen({ onSelect, onUpload, layoutVariant }) {
  const { CONTRACTS, RENEWALS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy] = useState('riskScore');

  const avgRisk = (complete.reduce((s, c) => s + c.riskScore, 0) / complete.length).toFixed(1);
  const totalRed = complete.reduce((s, c) => s + c.flags.red, 0);
  const urgentRenewals = RENEWALS.filter(r => r.daysRemaining < 60).length;

  const filtered = CONTRACTS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRisk === 'high' && c.riskScore < 7) return false;
    if (filterRisk === 'medium' && (c.riskScore < 4 || c.riskScore >= 7)) return false;
    if (filterRisk === 'low' && c.riskScore >= 4) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
    if (sortBy === 'date') return new Date(b.uploadDate) - new Date(a.uploadDate);
    if (sortBy === 'name') return a.name.localeCompare(b.name);
    return 0;
  });

  const isCard    = layoutVariant === 'card';
  const isMinimal = layoutVariant === 'minimal';

  const selStyle = {
    background: T.surface, border: `1px solid ${T.borderMid}`,
    padding: '6px 10px', fontSize: 10, color: T.ink, fontFamily: MONO,
    cursor: 'pointer', outline: 'none', borderRadius: 0, letterSpacing: '0.04em',
  };

  return (
    <PageShell title="PORTFOLIO" subtitle={`${filtered.length} contracts`}
      actions={<>
        <Btn variant="secondary" size="sm">EXPORT CSV</Btn>
        <Btn size="sm" onClick={onUpload}>+ UPLOAD</Btn>
      </>}
    >
      {/* KPI bar */}
      <div style={{ padding: '0 24px', background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'grid', gridTemplateColumns: 'repeat(4, auto)', gap: 0, width: '100%' }}>
        {[
          { label: 'TOTAL CONTRACTS',  value: CONTRACTS.length, color: T.ink },
          { label: 'AVG RISK SCORE',   value: avgRisk,          color: T.riskColor(parseFloat(avgRisk)) },
          { label: 'CRITICAL FLAGS',   value: totalRed,         color: T.red },
          { label: 'URGENT RENEWALS',  value: urgentRenewals,   color: urgentRenewals > 0 ? T.orange : T.green },
        ].map((k, i) => (
          <div key={k.label} style={{ padding: '14px 24px 14px 0', paddingLeft: i > 0 ? 24 : 0, borderRight: i < 3 ? `1px solid ${T.border}` : 'none' }}>
            <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.12em', marginBottom: 4 }}>{k.label}</div>
            <div style={{ fontSize: 22, color: k.color, fontFamily: MONO }}>{k.value}</div>
          </div>
        ))}
      </div>

      {/* Filter strip */}
      <div style={{ padding: '8px 24px', background: T.bgAlt, borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="SEARCH CONTRACTS..."
          style={{ flex: 1, minWidth: 160, background: T.surface, border: `1px solid ${T.borderMid}`, padding: '6px 10px', fontSize: 10, color: T.ink, fontFamily: MONO, outline: 'none', borderRadius: 0, letterSpacing: '0.04em' }} />
        {[
          { val: filterRisk, set: setFilterRisk, opts: [['all', 'ALL RISK'], ['high', 'HIGH (7+)'], ['medium', 'MEDIUM'], ['low', 'LOW']] },
          { val: filterType, set: setFilterType, opts: [['all', 'ALL TYPES'], ['vendor', 'VENDOR'], ['license', 'LICENSE'], ['partnership', 'PARTNERSHIP'], ['customer', 'CUSTOMER'], ['lease', 'LEASE'], ['nda', 'NDA']] },
          { val: sortBy, set: setSortBy, opts: [['riskScore', 'SORT: RISK'], ['date', 'SORT: DATE'], ['name', 'SORT: NAME']] },
        ].map((s, i) => (
          <select key={i} value={s.val} onChange={e => s.set(e.target.value)} style={selStyle}>
            {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        ))}
      </div>

      <div style={{ padding: '16px 24px' }}>

        {/* CARD LAYOUT */}
        {isCard && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 10 }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => c.status === 'complete' && onSelect(c.id)}
                style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '14px 16px', cursor: c.status === 'complete' ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (c.status === 'complete') e.currentTarget.style.borderColor = T.amber; }}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                  <TypePill type={c.type} />
                  {c.status === 'complete' ? <RiskCode score={c.riskScore} /> : (
                    <span style={{ fontSize: 10, color: T.amber, fontFamily: MONO }}>{c.progress || 0}%</span>
                  )}
                </div>
                <div style={{ fontSize: 11, color: T.ink, marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: MONO }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                <div style={{ fontSize: 10, color: T.inkSoft, marginBottom: 10, fontFamily: MONO }}>{c.parties[0]}</div>
                {c.status === 'complete' && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <FlagsSummary flags={c.flags} />
                    <span style={{ fontSize: 10, color: T.inkMute, fontFamily: MONO }}>{c.terminationDate || '—'}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* TABLE LAYOUT */}
        {!isCard && !isMinimal && (
          <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                  {['CONTRACT', 'TYPE', 'RISK', 'FLAGS', 'COUNTERPARTY', 'EXPIRY', 'STATUS'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, color: T.inkMute, letterSpacing: '0.12em', whiteSpace: 'nowrap', fontFamily: MONO, fontWeight: 400 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} onClick={() => c.status === 'complete' && onSelect(c.id)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: c.status === 'complete' ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (c.status === 'complete') e.currentTarget.style.background = T.surfaceAlt; }}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '9px 14px', maxWidth: 220 }}>
                      <div style={{ color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: MONO, fontSize: 11 }}>{c.name}</div>
                    </td>
                    <td style={{ padding: '9px 14px' }}><TypePill type={c.type} /></td>
                    <td style={{ padding: '9px 14px' }}>{c.status === 'complete' ? <RiskBar score={c.riskScore} /> : <span style={{ color: T.inkMute }}>—</span>}</td>
                    <td style={{ padding: '9px 14px' }}>{c.status === 'complete' ? <FlagsSummary flags={c.flags} /> : <span style={{ color: T.inkMute }}>—</span>}</td>
                    <td style={{ padding: '9px 14px', color: T.inkMid, fontSize: 10, maxWidth: 140, fontFamily: MONO }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.parties[0]}</div>
                    </td>
                    <td style={{ padding: '9px 14px', color: T.inkSoft, fontSize: 10, fontFamily: MONO, whiteSpace: 'nowrap' }}>{c.terminationDate || '—'}</td>
                    <td style={{ padding: '9px 14px' }}>
                      {c.status === 'complete'
                        ? <Badge label="COMPLETE" color={T.green} bg={T.greenDim} border={T.greenBorder} />
                        : <span style={{ fontSize: 10, color: T.amber, fontFamily: MONO }}>{c.progress || 0}%</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* MINIMAL */}
        {isMinimal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {filtered.map(c => (
              <div key={c.id} onClick={() => c.status === 'complete' && onSelect(c.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '9px 14px', background: T.surface, border: `1px solid ${T.border}`, cursor: c.status === 'complete' ? 'pointer' : 'default' }}
                onMouseEnter={e => { if (c.status === 'complete') e.currentTarget.style.borderColor = T.amber; }}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <TypePill type={c.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: MONO }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                  <div style={{ fontSize: 9, color: T.inkSoft, fontFamily: MONO }}>{c.parties[0]}</div>
                </div>
                {c.status === 'complete' ? <><FlagsSummary flags={c.flags} /><RiskCode score={c.riskScore} /></> : <span style={{ fontSize: 10, color: T.amber, fontFamily: MONO }}>{c.progress || 0}%</span>}
                <span style={{ fontSize: 10, color: T.inkMute, fontFamily: MONO, minWidth: 76, textAlign: 'right' }}>{c.terminationDate || '—'}</span>
              </div>
            ))}
          </div>
        )}

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '48px', color: T.inkMute, fontSize: 11, fontFamily: MONO, letterSpacing: '0.08em' }}>NO CONTRACTS MATCH FILTERS</div>
        )}
      </div>
    </PageShell>
  );
}

// ─── Screen 8: Export ─────────────────────────────────────────────
function ExportScreen({ contractId, onBack }) {
  const { CONTRACTS } = window.APP_DATA;
  const c = CONTRACTS.find(x => x.id === contractId) || CONTRACTS[0];
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const formats = [
    { code: 'PDF', label: 'PDF REPORT',    desc: 'Formatted, branded — ready to share with stakeholders' },
    { code: 'XLS', label: 'EXCEL / CSV',   desc: 'Raw data — for analysis or tracking' },
    { code: 'SUM', label: 'SUMMARY ONLY',  desc: 'One-page overview — risks only, quick read' },
  ];

  return (
    <PageShell title="EXPORT & SHARE" subtitle={c.name}
      actions={<Btn variant="ghost" size="sm" onClick={onBack}>← BACK</Btn>}>
      <div style={{ maxWidth: 560, margin: '0 auto', padding: '24px' }}>

        {/* Share */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>SHARE WITH TEAM</SectionLabel>

          <div style={{ border: `1px solid ${T.border}`, background: T.surface, padding: '14px 18px', marginBottom: 8 }}>
            <div style={{ fontSize: 10, color: T.inkMid, marginBottom: 10, letterSpacing: '0.06em' }}>SEND VIA EMAIL</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@chambers.com"
                style={{ flex: 1, background: T.bgAlt, border: `1px solid ${T.borderMid}`, padding: '7px 10px', fontSize: 10, color: T.ink, fontFamily: MONO, outline: 'none', borderRadius: 0, letterSpacing: '0.04em' }} />
              <Btn size="sm" onClick={() => { if (email.trim()) { setEmailSent(true); setTimeout(() => setEmailSent(false), 3000); setEmail(''); } }}>
                {emailSent ? '✓ SENT' : 'SEND'}
              </Btn>
            </div>
            <div style={{ marginTop: 6, fontSize: 9, color: T.inkMute, letterSpacing: '0.06em' }}>RECIPIENT GETS VIEW-ONLY LINK — NO ACCOUNT NEEDED</div>
          </div>

          <div style={{ border: `1px solid ${T.border}`, background: T.surface, padding: '14px 18px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
              <span style={{ fontSize: 10, color: T.inkMid, letterSpacing: '0.06em' }}>SHAREABLE LINK</span>
              <Btn size="sm" variant="secondary" onClick={() => { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }}>
                {linkCopied ? '✓ COPIED' : 'COPY LINK'}
              </Btn>
            </div>
            <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.06em', display: 'flex', gap: 12 }}>
              <span>EXPIRES 7 DAYS</span><span>/</span><span>VIEW-ONLY</span><span>/</span><span>NO LOGIN</span>
            </div>
          </div>
        </div>

        {/* Download formats */}
        <div>
          <SectionLabel>DOWNLOAD FORMATS</SectionLabel>
          <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
            {formats.map((f, i) => (
              <div key={f.code} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 18px', borderBottom: i < formats.length - 1 ? `1px solid ${T.border}` : 'none', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <span style={{ fontSize: 9, color: T.amber, fontFamily: MONO, letterSpacing: '0.1em', minWidth: 28 }}>{f.code}</span>
                  <div>
                    <div style={{ fontSize: 11, color: T.ink, marginBottom: 2, letterSpacing: '0.04em' }}>{f.label}</div>
                    <div style={{ fontSize: 10, color: T.inkSoft }}>{f.desc}</div>
                  </div>
                </div>
                <Btn size="sm" variant="secondary">DOWNLOAD</Btn>
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginTop: 20, padding: '10px 14px', background: T.bgAlt, border: `1px solid ${T.border}`, fontSize: 9, color: T.inkMute, letterSpacing: '0.06em', fontFamily: MONO }}>
          + ALL SHARED LINKS ARE ENCRYPTED · ACCESS REVOCABLE FROM SETTINGS
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen: Renewals ─────────────────────────────────────────────
function RenewalsScreen() {
  const { RENEWALS } = window.APP_DATA;
  const [selected, setSelected] = useState(null);

  function rc(r) { return r.daysRemaining < 0 ? T.red : r.daysRemaining < 30 ? T.red : r.daysRemaining < 60 ? T.orange : T.green; }

  return (
    <PageShell title="RENEWALS" subtitle="Upcoming renewal and notice deadlines">
      <div style={{ padding: '16px 24px', display: 'grid', gridTemplateColumns: '1fr 260px', gap: 16, maxWidth: 1080 }}>
        <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                {['CONTRACT', 'RENEWAL DATE', 'DAYS LEFT', 'NOTICE REQ.', 'RISK'].map(h => (
                  <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, color: T.inkMute, letterSpacing: '0.12em', fontFamily: MONO, fontWeight: 400, borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...RENEWALS].sort((a, b) => a.daysRemaining - b.daysRemaining).map(r => (
                <tr key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                  style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selected === r.id ? T.surfaceAlt : '' }}
                  onMouseEnter={e => { if (selected !== r.id) e.currentTarget.style.background = T.surfaceAlt; }}
                  onMouseLeave={e => { if (selected !== r.id) e.currentTarget.style.background = ''; }}
                >
                  <td style={{ padding: '9px 14px', borderLeft: `2px solid ${rc(r)}`, fontFamily: MONO, fontSize: 11, color: T.ink }}>{r.name.replace(/\.[^.]+$/, '').slice(0, 26)}</td>
                  <td style={{ padding: '9px 14px', color: T.inkMid, fontFamily: MONO, fontSize: 10 }}>{r.renewalDate}</td>
                  <td style={{ padding: '9px 14px', fontFamily: MONO, fontSize: 11, color: rc(r), letterSpacing: '0.04em' }}>
                    {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}D OVERDUE` : r.daysRemaining === 0 ? 'TODAY' : `${r.daysRemaining}D`}
                  </td>
                  <td style={{ padding: '9px 14px', color: T.inkSoft, fontSize: 10, fontFamily: MONO }}>{r.noticePeriod}</td>
                  <td style={{ padding: '9px 14px' }}><RiskBar score={r.riskScore} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div>
          {selected ? (() => {
            const r = RENEWALS.find(x => x.id === selected);
            if (!r) return null;
            return (
              <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                <div style={{ padding: '12px 16px', background: T.riskBg(r.riskScore), borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 9, color: rc(r), letterSpacing: '0.12em', marginBottom: 4 }}>
                    {r.daysRemaining < 0 ? 'OVERDUE' : r.daysRemaining < 30 ? 'URGENT' : 'RENEWAL DETAIL'}
                  </div>
                  <div style={{ fontSize: 12, color: T.ink, fontFamily: MONO, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name}</div>
                </div>
                <div style={{ padding: '12px 16px' }}>
                  {[['RENEWAL DATE', r.renewalDate], ['DAYS REMAINING', r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}D OVERDUE` : `${r.daysRemaining} DAYS`], ['NOTICE PERIOD', r.noticePeriod], ['RISK SCORE', `${r.riskScore}/10`]].map(([k, v], i, arr) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', fontSize: 10, fontFamily: MONO }}>
                      <span style={{ color: T.inkSoft, letterSpacing: '0.06em' }}>{k}</span>
                      <span style={{ color: T.ink }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Btn full>VIEW CONTRACT</Btn>
                    <Btn variant="secondary" full>ACKNOWLEDGE</Btn>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ color: T.inkMute, fontSize: 10, fontFamily: MONO, letterSpacing: '0.08em', paddingTop: 8 }}>
              SELECT A RENEWAL TO SEE DETAILS
            </div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen: Settings ─────────────────────────────────────────────
function SettingsScreen() {
  const { TEAM_MEMBERS } = window.APP_DATA;
  const [tab, setTab] = useState('team');

  return (
    <PageShell title="SETTINGS">
      <div style={{ padding: '0 24px' }}>
        <Tabs tabs={[{ id: 'team', label: 'TEAM' }, { id: 'billing', label: 'BILLING' }, { id: 'audit', label: 'AUDIT LOG' }]} active={tab} onChange={setTab} />
        <div style={{ padding: '20px 0', maxWidth: 820 }}>

          {tab === 'team' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 11, color: T.inkMid, fontFamily: MONO, letterSpacing: '0.06em' }}>TEAM MEMBERS</span>
                <Btn size="sm">+ INVITE MEMBER</Btn>
              </div>
              <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 11 }}>
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      {['MEMBER', 'ROLE', 'LAST ACTIVE', 'STATUS', ''].map(h => (
                        <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 9, color: T.inkMute, letterSpacing: '0.12em', borderBottom: `1px solid ${T.border}`, fontFamily: MONO, fontWeight: 400 }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEAM_MEMBERS.map(m => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 28, height: 28, background: T.surfaceAlt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, color: T.amber, fontFamily: MONO, flexShrink: 0 }}>{m.avatar}</div>
                            <div>
                              <div style={{ color: T.ink, fontFamily: MONO, fontSize: 11 }}>{m.name}</div>
                              <div style={{ fontSize: 10, color: T.inkSoft, fontFamily: MONO }}>{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <select defaultValue={m.role} style={{ background: T.bgAlt, border: `1px solid ${T.border}`, padding: '4px 8px', fontSize: 10, fontFamily: MONO, outline: 'none', color: T.inkMid, borderRadius: 0 }}>
                            <option>Admin</option><option>Reviewer</option><option>Viewer</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px', color: T.inkSoft, fontSize: 10, fontFamily: MONO }}>{m.lastLogin}</td>
                        <td style={{ padding: '10px 14px' }}>
                          {m.status === 'pending'
                            ? <Badge label="PENDING" color={T.orange} bg={T.orangeDim} border={T.orangeBorder} />
                            : <Badge label="ACTIVE" color={T.green} bg={T.greenDim} border={T.greenBorder} />}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {m.id !== 1 && <Btn size="sm" variant="danger">REMOVE</Btn>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {tab === 'billing' && (
            <div style={{ maxWidth: 400 }}>
              <div style={{ border: `1px solid ${T.border}`, background: T.surface, padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', marginBottom: 4 }}>CURRENT PLAN</div>
                    <div style={{ fontSize: 20, color: T.ink, fontFamily: MONO }}>PROFESSIONAL</div>
                    <div style={{ fontSize: 10, color: T.inkSoft, fontFamily: MONO, marginTop: 2 }}>£299/MONTH · 50 CONTRACTS/MONTH</div>
                  </div>
                  <Btn variant="secondary" size="sm">UPGRADE</Btn>
                </div>
                <div style={{ height: 2, background: T.border, marginBottom: 4 }}>
                  <div style={{ width: '72%', height: '100%', background: T.amber }} />
                </div>
                <div style={{ fontSize: 10, color: T.inkSoft, fontFamily: MONO, letterSpacing: '0.04em' }}>36 / 50 ANALYSES USED THIS MONTH</div>
              </div>
            </div>
          )}

          {tab === 'audit' && (
            <div style={{ fontSize: 10, color: T.inkMute, fontFamily: MONO, letterSpacing: '0.08em' }}>FULL AUDIT LOG AVAILABLE IN V1 RELEASE</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

Object.assign(window, { DeepDiveScreen, CompareScreen, PortfolioScreen, ExportScreen, RenewalsScreen, SettingsScreen });
