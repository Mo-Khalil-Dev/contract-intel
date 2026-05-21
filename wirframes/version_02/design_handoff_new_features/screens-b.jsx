// ContractIntel Redesign — Screens 5-8: Deep Dive, Compare, Portfolio, Export/Share
const { useState, useMemo } = React;

// ─── Screen 5: Deep Dive (Individual Risk) ────────────────────────
function DeepDiveScreen({ contractId, flagId, onBack }) {
  const { CONTRACTS } = window.APP_DATA;
  const c = CONTRACTS.find(x => x.id === contractId) || CONTRACTS[0];
  const f = c.riskFlags.find(x => x.id === flagId) || c.riskFlags[0];
  const [copied, setCopied] = useState(false);

  if (!f) return null;
  const fc = T.sevColor(f.severity);
  const fbg = T.sevBg(f.severity);

  const marketStandards = {
    'Unlimited Liability Exposure': ['Liability capped at 2–3× annual fees', 'Minimum cap of £250k', 'IP indemnity excluded from cap'],
    'One-Sided Indemnification': ['Mutual and reciprocal scope', "Proportional to each party's negligence", 'Excludes pre-existing IP'],
    'Broad IP Assignment': ['Custom deliverables owned by client', 'Pre-existing IP excluded and listed', 'Joint ownership only for R&D'],
  };
  const standards = marketStandards[f.title] || ['Negotiate fair and balanced terms', 'Consult your legal team for specifics'];
  const suggestedLanguage = f.recommendation;

  function handleCopy() {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <PageShell
      title={f.title}
      subtitle={`${c.name} · Page ${f.page}, §${f.section}`}
      actions={<Btn variant="ghost" size="sm" onClick={onBack}>← Back to report</Btn>}
    >
      <div className="ci-pad-32" style={{ maxWidth: 680, margin: '0 auto', padding: '32px' }}>
        {/* Severity header */}
        <div style={{ background: fbg, border: `1px solid ${fc}33`, borderRadius: 10, padding: '16px 20px', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: fc, flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: fc, textTransform: 'uppercase', letterSpacing: '0.08em', fontFamily: "'DM Sans', sans-serif" }}>{f.severity === 'red' ? 'Critical risk' : f.severity === 'orange' ? 'Caution — review needed' : 'Informational'}</div>
            <div style={{ fontSize: 13, color: T.inkMid, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Status: {f.status === 'open' ? 'Open — action required' : 'Accepted'}</div>
          </div>
        </div>

        {/* What it means */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>What this means</SectionLabel>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <p style={{ margin: 0, fontSize: 14, color: T.inkMid, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.description}</p>
          </div>
        </div>

        {/* The actual clause */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>The actual clause (Page {f.page}, §{f.section})</SectionLabel>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${fc}`, borderRadius: 10, padding: '16px 20px' }}>
            <div style={{ fontSize: 13, fontStyle: 'italic', color: T.inkMid, lineHeight: 1.7, fontFamily: 'Georgia, serif' }}>
              "{f.description.split('.')[0]}…"
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>Source: {c.name}, page {f.page}, section {f.section}</div>
          </div>
        </div>

        {/* Why it matters */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Why it matters</SectionLabel>
          <div style={{ background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 10, padding: '16px 20px' }}>
            <p style={{ margin: 0, fontSize: 14, color: T.inkMid, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>
              If this clause stands as-is and something goes wrong, you may have limited or no legal recourse. This type of clause regularly results in six-figure losses for businesses that don't negotiate it away upfront.
            </p>
          </div>
        </div>

        {/* Market standard */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>Market standard</SectionLabel>
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            {standards.map((s, i) => (
              <div key={s} style={{ display: 'flex', gap: 12, padding: '11px 16px', borderBottom: i < standards.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'center' }}>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="7" fill={T.greenBg} stroke={T.greenBorder} /><path d="M5 8l2.5 2.5L11 6" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                <span style={{ fontSize: 13, color: T.inkMid, fontFamily: "'DM Sans', sans-serif" }}>{s}</span>
              </div>
            ))}
          </div>
        </div>

        {/* What to ask for */}
        <div style={{ marginBottom: 28 }}>
          <SectionLabel>What to ask for — copy and paste this</SectionLabel>
          <div style={{ background: T.ink, borderRadius: 10, padding: '18px 20px', position: 'relative' }}>
            <p style={{ margin: '0 0 14px', fontSize: 13, color: 'rgba(255,255,255,0.85)', lineHeight: 1.7, fontFamily: "'DM Mono', monospace" }}>"{suggestedLanguage}"</p>
            <Btn size="sm" variant="secondary" style={{ background: 'rgba(255,255,255,0.1)', color: '#fff', border: '1px solid rgba(255,255,255,0.2)' }} onClick={handleCopy}>
              {copied ? '✓ Copied!' : 'Copy language'}
            </Btn>
          </div>
        </div>

        {/* Actions */}
        <div className="ci-actions-wrap" style={{ display: 'flex', gap: 10 }}>
          <Btn variant="success" onClick={onBack}>✓ Mark this as resolved</Btn>
          <Btn variant="secondary" onClick={onBack}>Dismiss flag</Btn>
          <Btn variant="ghost" onClick={onBack}>← Back to all flags</Btn>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen 6: Compare (ported from Lloyds version) ───────────────
// Helpers
function _parseDays(s) {
  if (!s || s === 'N/A' || s === '—') return null;
  const m = String(s).match(/(\d+)\s*(day|month|year|week)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const u = m[2].toLowerCase();
  if (u.startsWith('day')) return n;
  if (u.startsWith('week')) return n * 7;
  if (u.startsWith('month')) return n * 30;
  if (u.startsWith('year')) return n * 365;
  return null;
}
function _parseEscalation(s) {
  if (!s || s === 'N/A' || s === '—') return null;
  const m = String(s).match(/([\d.]+)\s*%/);
  if (m) return parseFloat(m[1]);
  if (/cpi|rpi/i.test(s)) return 2.5;
  return null;
}
function _termDays(c) {
  if (!c.effectiveDate || !c.terminationDate) return null;
  return Math.round((new Date(c.terminationDate) - new Date(c.effectiveDate)) / 86400000);
}
function _flagHas(c, re) {
  return c.riskFlags && c.riskFlags.some(f => re.test(f.title));
}

function _buildCompareRows() {
  return [
    { group:'Parties', id:'counterparty', label:'Counterparty', get:c=>c.parties[0], fmt:v=>v, kind:'text' },
    { group:'Parties', id:'type', label:'Contract Type', get:c=>c.type, fmt:v=>v && <TypePill type={v} />, kind:'text' },
    { group:'Dates', id:'effective', label:'Effective Date', get:c=>c.effectiveDate, fmt:v=>v||'—', kind:'text' },
    { group:'Dates', id:'expires', label:'Expiry Date', get:c=>c.terminationDate, fmt:v=>v||'—', kind:'text' },
    { group:'Dates', id:'term', label:'Term Length', get:c=>_termDays(c), fmt:v=>v?`${(v/365).toFixed(1)} years`:'—', kind:'numeric', betterIs:'higher' },
    { group:'Dates', id:'notice', label:'Notice Period', get:c=>_parseDays(c.noticePeriod), fmt:(v,c)=>c.noticePeriod||'—', kind:'numeric', betterIs:'higher' },
    { group:'Dates', id:'autorenew', label:'Auto-Renewal', get:c=>c.autoRenewal, fmt:v=>v||'—', kind:'check', isFavourable:v=>!v||/^no$/i.test(v)||/mutual/i.test(v) },
    { group:'Financial', id:'amount', label:'Payment Amount', get:c=>c.paymentAmount, fmt:v=>v||'—', kind:'text' },
    { group:'Financial', id:'schedule', label:'Schedule', get:c=>c.paymentSchedule, fmt:v=>v||'—', kind:'text' },
    { group:'Financial', id:'escalation', label:'Price Escalation', get:c=>_parseEscalation(c.priceEscalation), fmt:(v,c)=>c.priceEscalation||'—', kind:'numeric', betterIs:'lower' },
    { group:'Financial', id:'paymentterms', label:'Payment Terms', get:c=>_parseDays(c.paymentTerms), fmt:(v,c)=>c.paymentTerms||'—', kind:'numeric', betterIs:'higher' },
    { group:'Risk Profile', id:'risk', label:'Risk Score', get:c=>c.riskScore, fmt:v=>v!=null?v.toFixed(1):'—', kind:'numeric', betterIs:'lower', emphasised:true },
    { group:'Risk Profile', id:'red', label:'High-Severity Flags', get:c=>c.flags.red, fmt:v=>v, kind:'numeric', betterIs:'lower' },
    { group:'Risk Profile', id:'orange', label:'Medium-Severity Flags', get:c=>c.flags.orange, fmt:v=>v, kind:'numeric', betterIs:'lower' },
    { group:'Key Clauses', id:'liabcap', label:'Liability Cap', get:c=>!_flagHas(c,/unlimited liability|liability/i), fmt:v=>v?'Capped':'Unlimited / unclear', kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'mutualindem', label:'Mutual Indemnification', get:c=>!_flagHas(c,/one-sided|asymmet|indemn/i), fmt:v=>v?'Mutual':'One-sided', kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'ipreten', label:'IP Retained by You', get:c=>!_flagHas(c,/ip|intellectual prop/i), fmt:v=>v?'Yes':'Assigned away', kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'dataport', label:'Data Portability', get:c=>!_flagHas(c,/data portability|export|portab/i), fmt:v=>v?'Guaranteed':'Not guaranteed', kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'changectrl', label:'Change-of-Control', get:c=>!_flagHas(c,/change of control/i), fmt:v=>v?'Addressed':'Not addressed', kind:'check', isFavourable:v=>v===true },
  ];
}

function _scoreRow(row, contracts) {
  const out = {};
  if (row.kind === 'text') { contracts.forEach(c => out[c.id] = 'neutral'); return out; }
  if (row.kind === 'check') {
    contracts.forEach(c => { const v = row.get(c); out[c.id] = v == null ? 'na' : (row.isFavourable(v) ? 'better' : 'worse'); });
    return out;
  }
  const vals = contracts.map(c => row.get(c)).filter(v => v != null && !Number.isNaN(v));
  if (vals.length < 2) { contracts.forEach(c => out[c.id] = 'neutral'); return out; }
  const sorted = [...vals].sort((a,b)=>a-b);
  const mid = sorted.length % 2 ? sorted[(sorted.length-1)/2] : (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2;
  contracts.forEach(c => {
    const v = row.get(c);
    if (v == null || Number.isNaN(v)) { out[c.id] = 'na'; return; }
    if (v === mid) { out[c.id] = 'neutral'; return; }
    const isLow = v < mid;
    out[c.id] = (row.betterIs === 'lower' ? isLow : !isLow) ? 'better' : 'worse';
  });
  return out;
}

function _pickWinner(rows, contracts) {
  if (contracts.length < 2) return null;
  const tally = Object.fromEntries(contracts.map(c => [c.id, { better:0, worse:0 }]));
  rows.forEach(row => {
    const s = _scoreRow(row, contracts);
    contracts.forEach(c => { if (s[c.id]==='better') tally[c.id].better++; if (s[c.id]==='worse') tally[c.id].worse++; });
  });
  const ranked = contracts.map(c => ({ c, ...tally[c.id], net: tally[c.id].better - tally[c.id].worse })).sort((a,b)=>b.net-a.net);
  if (ranked.length < 2 || ranked[0].net <= ranked[1].net) return null;
  const maxRisk = Math.max(...contracts.map(c => c.riskScore));
  if (ranked[0].c.riskScore === maxRisk && contracts.length > 2) return null;
  return { ...ranked[0], ranking: ranked };
}

function _CompareCell({ row, contract, verdict }) {
  const v = row.get(contract);
  const display = row.fmt(v, contract);
  let bg = 'transparent', bdc = T.border, chip = null;
  if (verdict === 'better') { bg = T.greenBg; bdc = T.greenBorder; chip = <span style={{ color:T.green, fontWeight:800 }}>✓</span>; }
  else if (verdict === 'worse') { bg = T.redBg; bdc = T.redBorder; chip = <span style={{ color:T.red, fontWeight:800 }}>✗</span>; }
  else if (verdict === 'na') { bg = T.bg; bdc = T.border; }
  if (row.id === 'risk') {
    const rc = T.riskColor(contract.riskScore);
    return (
      <div style={{ background:bg, border:`1px solid ${bdc}`, borderRadius:6, padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:46 }}>
        <span style={{ fontSize:22, fontWeight:800, color:rc, fontFamily:"'DM Mono', monospace", lineHeight:1 }}>{contract.riskScore.toFixed(1)}</span>
        <span style={{ fontSize:10, fontWeight:700, color:rc, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:"'DM Sans', sans-serif" }}>{T.riskLabel(contract.riskScore)}</span>
      </div>
    );
  }
  return (
    <div style={{ background:bg, border:`1px solid ${bdc}`, borderRadius:6, padding:'8px 12px', minHeight:36, display:'flex', alignItems:'center', justifyContent:'space-between', gap:8 }}>
      <span style={{ fontSize:12, color:T.ink, fontWeight:row.emphasised?700:500, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif" }}>{display}</span>
      {chip && <span style={{ fontSize:14, flexShrink:0 }}>{chip}</span>}
    </div>
  );
}

function _AddContractPicker({ candidates, onPick, onClose }) {
  return (
    <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:50, background:T.surface, border:`1px solid ${T.border}`, borderRadius:8, boxShadow:'0 8px 24px rgba(0,0,0,0.10)', width:340, maxHeight:340, overflow:'auto' }}>
      <div style={{ padding:'8px 12px', borderBottom:`1px solid ${T.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, fontWeight:700, color:T.inkSoft, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:"'DM Sans', sans-serif" }}>Add a contract</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:T.inkSoft, fontSize:13 }}>✕</button>
      </div>
      {candidates.length === 0
        ? <div style={{ padding:'20px', textAlign:'center', fontSize:12, color:T.inkMute, fontFamily:"'DM Sans', sans-serif" }}>No more contracts to add.</div>
        : candidates.map(c => (
          <button key={c.id} onClick={()=>onPick(c.id)} style={{ display:'flex', width:'100%', padding:'9px 12px', alignItems:'center', gap:10, background:'transparent', border:'none', borderBottom:`1px solid ${T.border}`, cursor:'pointer', textAlign:'left' }}
            onMouseEnter={e=>e.currentTarget.style.background=T.blueLight}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
            <RiskBadge score={c.riskScore} />
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:12, fontWeight:600, color:T.ink, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif" }}>{c.name}</div>
              <div style={{ fontSize:10, color:T.inkSoft, marginTop:1, fontFamily:"'DM Sans', sans-serif" }}>{c.parties[0]}</div>
            </div>
            <TypePill type={c.type} />
          </button>
        ))}
    </div>
  );
}

function CompareScreen({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const completed = CONTRACTS.filter(c => c.status === 'complete');
  const initial = [completed[0]?.id, completed[1]?.id, completed[2]?.id].filter(Boolean);
  const [selectedIds, setSelectedIds] = useState(initial);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [showExport, setShowExport] = useState(false);

  const selected = selectedIds.map(id => completed.find(c=>c.id===id)).filter(Boolean);
  const candidates = completed.filter(c => !selectedIds.includes(c.id));
  const rows = useMemo(_buildCompareRows, []);
  const groups = ['Parties','Dates','Financial','Risk Profile','Key Clauses'];
  const verdicts = useMemo(() => { const m = {}; rows.forEach(r => m[r.id] = _scoreRow(r, selected)); return m; }, [rows, selectedIds]);
  const winner = useMemo(() => _pickWinner(rows, selected), [rows, selectedIds]);

  function addContract(id) { if (selectedIds.length >= 5) return; setSelectedIds([...selectedIds, id]); setPickerOpen(false); }
  function removeContract(id) { setSelectedIds(selectedIds.filter(x => x !== id)); }

  const canCompare = selected.length >= 2;
  const colCount = selected.length;
  const gridCols = `220px repeat(${colCount}, minmax(200px, 1fr))`;

  return (
    <PageShell title="Compare contracts" subtitle={`Side-by-side analysis · ${selected.length} of 5 selected`}
      actions={
        <>
          <Btn variant="secondary" size="sm" onClick={()=>setShowExport(true)} disabled={!canCompare}>↓ Export report</Btn>
          <Btn variant="secondary" size="sm" disabled={!canCompare}>Print</Btn>
        </>
      }>
      <div style={{ padding:'18px 32px 36px' }}>
        {/* Selection bar */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:14, position:'relative' }}>
          <span style={{ fontSize:11, fontWeight:700, color:T.inkSoft, textTransform:'uppercase', letterSpacing:'0.06em', marginRight:4, fontFamily:"'DM Sans', sans-serif" }}>Comparing</span>
          {selected.map(c => (
            <div key={c.id} style={{ display:'inline-flex', alignItems:'center', gap:8, background:T.surface, border:`1px solid ${T.border}`, borderRadius:6, padding:'5px 5px 5px 10px', fontSize:12 }}>
              <RiskBadge score={c.riskScore} />
              <span style={{ color:T.ink, fontWeight:600, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif" }}>{c.name.replace(/\.(pdf|docx)$/i,'')}</span>
              <button onClick={()=>removeContract(c.id)} disabled={selected.length<=2}
                title={selected.length<=2?'Minimum 2 contracts required':'Remove'}
                style={{ background:selected.length<=2?'transparent':T.bg, border:`1px solid ${T.border}`, borderRadius:4, width:20, height:20, cursor:selected.length<=2?'not-allowed':'pointer', fontSize:11, color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', opacity:selected.length<=2?0.4:1 }}>✕</button>
            </div>
          ))}
          <div style={{ position:'relative' }}>
            <Btn variant="secondary" size="sm" onClick={()=>setPickerOpen(o=>!o)} disabled={selected.length>=5}>+ Add contract</Btn>
            {pickerOpen && <_AddContractPicker candidates={candidates} onPick={addContract} onClose={()=>setPickerOpen(false)} />}
          </div>
          <span style={{ fontSize:11, color:T.inkMute, marginLeft:'auto', fontFamily:"'DM Sans', sans-serif" }}>Select between 2 and 5 contracts · {colCount}/5</span>
        </div>

        {!canCompare && (
          <div style={{ padding:'48px 32px', textAlign:'center', background:T.surface, border:`1px dashed ${T.borderMid}`, borderRadius:10 }}>
            <div style={{ fontSize:32, marginBottom:8, opacity:0.5 }}>⇄</div>
            <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:4, fontFamily:"'DM Sans', sans-serif" }}>Pick at least 2 contracts to compare</div>
            <div style={{ fontSize:12, color:T.inkSoft, fontFamily:"'DM Sans', sans-serif" }}>You can compare up to five at once.</div>
          </div>
        )}

        {canCompare && (
          <>
            {winner ? (
              <div style={{ background:T.greenBg, border:`1px solid ${T.greenBorder}`, borderRadius:10, padding:'14px 18px', marginBottom:16, display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ width:40, height:40, borderRadius:8, background:T.green, color:'#fff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>★</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.greenDark, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3, fontFamily:"'DM Sans', sans-serif" }}>Recommended choice</div>
                  <div style={{ fontSize:14, fontWeight:700, color:T.ink, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif" }}>{winner.c.name.replace(/\.(pdf|docx)$/i,'')}</div>
                  <div style={{ fontSize:12, color:T.inkMid, lineHeight:1.5, fontFamily:"'DM Sans', sans-serif" }}>
                    Leads on <strong style={{color:T.greenDark}}>{winner.better}</strong> comparable terms
                    {winner.worse>0 && <> against <strong style={{color:T.red}}>{winner.worse}</strong> losses</>}
                    {' '}— net advantage <strong>+{winner.net}</strong>. Lowest risk profile and most favourable clause coverage in the set.
                  </div>
                </div>
                <Btn size="sm" onClick={()=>onSelectContract(winner.c.id)}>Open contract →</Btn>
              </div>
            ) : (
              <div style={{ background:T.bg, border:`1px solid ${T.border}`, borderRadius:10, padding:'12px 16px', marginBottom:16, display:'flex', alignItems:'center', gap:12 }}>
                <div style={{ width:32, height:32, borderRadius:6, background:T.bgAlt, color:T.inkSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>≈</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:T.ink, marginBottom:2, fontFamily:"'DM Sans', sans-serif" }}>No clear winner</div>
                  <div style={{ fontSize:12, color:T.inkSoft, fontFamily:"'DM Sans', sans-serif" }}>The selected contracts trade off across categories. Review each row to weigh priorities.</div>
                </div>
              </div>
            )}

            {/* Grid */}
            <div style={{ background:T.surface, border:`1px solid ${T.border}`, borderRadius:10, overflow:'auto' }}>
              <div style={{ display:'grid', gridTemplateColumns:gridCols, borderBottom:`1px solid ${T.border}`, background:T.bg, position:'sticky', top:0, zIndex:5 }}>
                <div style={{ padding:'14px 16px', borderRight:`1px solid ${T.border}`, position:'sticky', left:0, background:T.bg, zIndex:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:T.inkMute, textTransform:'uppercase', letterSpacing:'0.08em', fontFamily:"'DM Sans', sans-serif" }}>Term</div>
                </div>
                {selected.map((c, i) => {
                  const isWinner = winner && winner.c.id === c.id;
                  return (
                    <div key={c.id} style={{ padding:'12px 14px', borderRight: i<selected.length-1?`1px solid ${T.border}`:'none', background: isWinner ? T.greenBg : T.bg, position:'relative' }}>
                      {isWinner && <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:T.green }}></div>}
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                        <TypePill type={c.type} />
                        {isWinner && <span style={{ fontSize:10, fontWeight:700, color:T.greenDark, textTransform:'uppercase', letterSpacing:'0.06em', fontFamily:"'DM Sans', sans-serif" }}>★ Winner</span>}
                      </div>
                      <button onClick={()=>onSelectContract(c.id)} style={{ background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left', fontSize:13, fontWeight:700, color:T.ink, lineHeight:1.3, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block', fontFamily:"'DM Sans', sans-serif" }}
                        onMouseEnter={e=>e.currentTarget.style.color=T.blue}
                        onMouseLeave={e=>e.currentTarget.style.color=T.ink}>{c.name.replace(/\.(pdf|docx)$/i,'')}</button>
                      <div style={{ fontSize:11, color:T.inkSoft, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', fontFamily:"'DM Sans', sans-serif" }}>{c.parties[0]}</div>
                    </div>
                  );
                })}
              </div>
              {groups.map(g => {
                const gr = rows.filter(r => r.group === g);
                return (
                  <div key={g}>
                    <div style={{ display:'grid', gridTemplateColumns:gridCols, background:T.bgAlt, borderBottom:`1px solid ${T.border}`, borderTop:`1px solid ${T.border}` }}>
                      <div style={{ padding:'7px 16px', fontSize:10, fontWeight:700, color:T.inkSoft, textTransform:'uppercase', letterSpacing:'0.08em', position:'sticky', left:0, background:T.bgAlt, zIndex:2, gridColumn:`1 / span ${colCount+1}`, fontFamily:"'DM Sans', sans-serif" }}>{g}</div>
                    </div>
                    {gr.map((row, ri) => (
                      <div key={row.id} style={{ display:'grid', gridTemplateColumns:gridCols, borderBottom: ri<gr.length-1?`1px solid ${T.border}`:'none', background: row.emphasised ? T.blueLight : T.surface }}>
                        <div style={{ padding:'10px 16px', borderRight:`1px solid ${T.border}`, position:'sticky', left:0, background: row.emphasised ? T.blueLight : T.surface, zIndex:1, display:'flex', alignItems:'center' }}>
                          <span style={{ fontSize:12, fontWeight: row.emphasised?700:500, color:T.inkMid, fontFamily:"'DM Sans', sans-serif" }}>{row.label}</span>
                        </div>
                        {selected.map((c, ci) => (
                          <div key={c.id} style={{ padding:'8px 10px', borderRight: ci<selected.length-1?`1px solid ${T.border}`:'none' }}>
                            <_CompareCell row={row} contract={c} verdict={verdicts[row.id][c.id]} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:18, marginTop:14, fontSize:11, color:T.inkSoft, alignItems:'center', flexWrap:'wrap', fontFamily:"'DM Sans', sans-serif" }}>
              <span style={{ fontWeight:700, color:T.inkMid, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:10 }}>Legend</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:14, height:14, borderRadius:3, background:T.greenBg, border:`1px solid ${T.greenBorder}` }}></span>Better than median</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:14, height:14, borderRadius:3, background:T.redBg, border:`1px solid ${T.redBorder}` }}></span>Worse than median</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ width:14, height:14, borderRadius:3, background:T.surface, border:`1px solid ${T.border}` }}></span>Neutral / non-comparable</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}><span style={{ color:T.green, fontWeight:800, fontSize:13 }}>✓</span>/<span style={{ color:T.red, fontWeight:800, fontSize:13 }}>✗</span>Favourable / unfavourable clause</span>
            </div>
          </>
        )}
      </div>

      {showExport && (
        <Modal title="Export comparison report" onClose={()=>setShowExport(false)} width={460}>
          <div style={{ fontSize:12, color:T.inkMid, lineHeight:1.6, marginBottom:14, fontFamily:"'DM Sans', sans-serif" }}>
            Generate a formatted report covering all {rows.length} comparison rows across the {selected.length} selected contracts.
          </div>
          <div style={{ display:'grid', gap:8, marginBottom:18 }}>
            {[
              { fmt:'PDF', desc:'Formatted report with charts and full clause excerpts', size:'~280 KB' },
              { fmt:'XLSX', desc:'Spreadsheet with one row per term, one column per contract', size:'~45 KB' },
              { fmt:'DOCX', desc:'Editable document for sharing with stakeholders', size:'~120 KB' },
            ].map(f => (
              <label key={f.fmt} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 12px', border:`1px solid ${T.border}`, borderRadius:8, cursor:'pointer' }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=T.blue}
                onMouseLeave={e=>e.currentTarget.style.borderColor=T.border}>
                <input type="radio" name="exfmt" defaultChecked={f.fmt==='PDF'} style={{ accentColor:T.blue }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:T.ink, fontFamily:"'DM Sans', sans-serif" }}>{f.fmt}</div>
                  <div style={{ fontSize:11, color:T.inkSoft, marginTop:1, fontFamily:"'DM Sans', sans-serif" }}>{f.desc}</div>
                </div>
                <span style={{ fontSize:10, color:T.inkMute, fontFamily:"'DM Mono', monospace" }}>{f.size}</span>
              </label>
            ))}
          </div>
          <div style={{ display:'flex', gap:7, justifyContent:'flex-end' }}>
            <Btn variant="secondary" size="sm" onClick={()=>setShowExport(false)}>Cancel</Btn>
            <Btn size="sm" onClick={()=>setShowExport(false)}>Generate report</Btn>
          </div>
        </Modal>
      )}
    </PageShell>
  );
}

function _CompareScreen_OLD_UNUSED({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const [idA, setIdA] = useState(1);
  const [idB, setIdB] = useState(2);
  const cA = complete.find(c => c.id === idA) || complete[0];
  const cB = complete.find(c => c.id === idB) || complete[1];

  const rows = [
    {
      label: 'Risk Score',
      valA: cA.riskScore.toFixed(1),
      valB: cB.riskScore.toFixed(1),
      winnerFn: (a, b) => parseFloat(a) < parseFloat(b) ? 'A' : parseFloat(b) < parseFloat(a) ? 'B' : null,
      renderA: () => <RiskBar score={cA.riskScore} />,
      renderB: () => <RiskBar score={cB.riskScore} />,
    },
    { label: 'Type', valA: cA.type, valB: cB.type, renderA: () => <TypePill type={cA.type} />, renderB: () => <TypePill type={cB.type} />, winnerFn: () => null },
    { label: 'Value', valA: cA.paymentAmount || '—', valB: cB.paymentAmount || '—', winnerFn: () => null },
    { label: 'Expiry', valA: cA.terminationDate || '—', valB: cB.terminationDate || '—', winnerFn: () => null },
    { label: 'Auto-Renewal', valA: cA.autoRenewal || '—', valB: cB.autoRenewal || '—', winnerFn: (a, b) => a === 'No' ? 'A' : b === 'No' ? 'B' : null },
    { label: 'Notice Period', valA: cA.noticePeriod || '—', valB: cB.noticePeriod || '—', winnerFn: () => null },
    { label: 'Payment Terms', valA: cA.paymentTerms || '—', valB: cB.paymentTerms || '—', winnerFn: () => null },
    { label: 'Red Flags', valA: String(cA.flags.red), valB: String(cB.flags.red), winnerFn: (a, b) => parseInt(a) < parseInt(b) ? 'A' : parseInt(b) < parseInt(a) ? 'B' : null },
    { label: 'Total Flags', valA: String(cA.flags.red + cA.flags.orange), valB: String(cB.flags.red + cB.flags.orange), winnerFn: (a, b) => parseInt(a) < parseInt(b) ? 'A' : parseInt(b) < parseInt(a) ? 'B' : null },
  ];

  let winsA = 0, winsB = 0;
  rows.forEach(r => { const w = r.winnerFn(r.valA, r.valB); if (w === 'A') winsA++; else if (w === 'B') winsB++; });
  const overallWinner = winsA > winsB ? 'A' : winsB > winsA ? 'B' : null;

  return (
    <PageShell title="Compare contracts" subtitle="Select two contracts to compare their key terms side by side."
      actions={<Btn size="sm" variant="secondary">Export comparison</Btn>}>
      <div className="ci-pad-32" style={{ padding: '20px 32px' }}>
        {/* Selectors */}
        <div className="ci-stack-sm" style={{ display: 'grid', gridTemplateColumns: '1fr 48px 1fr', gap: 12, marginBottom: 24, alignItems: 'center' }}>
          {[{ label: 'Contract A', val: idA, set: setIdA }, { label: 'Contract B', val: idB, set: setIdB }].map((sel, i) => (
            <div key={i}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{sel.label}</div>
              <select value={sel.val} onChange={e => sel.set(Number(e.target.value))}
                style={{ width: '100%', background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: '9px 12px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}>
                {complete.map(c => <option key={c.id} value={c.id}>{c.name.replace(/\.[^.]+$/, '')}</option>)}
              </select>
            </div>
          ))}
          <div style={{ textAlign: 'center', fontSize: 13, fontWeight: 700, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>vs.</div>
        </div>

        {/* Overall winner */}
        {overallWinner && (
          <div style={{ background: T.greenBg, border: `1px solid ${T.greenBorder}`, borderRadius: 10, padding: '12px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', gap: 12 }}>
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2l1.8 5.4H17L12.1 10.6l1.8 5.4L9 13l-4.9 3 1.8-5.4L1 7.4h6.2L9 2z" fill={T.green} /></svg>
            <span style={{ fontSize: 14, fontWeight: 600, color: T.greenDark, fontFamily: "'DM Sans', sans-serif" }}>
              {overallWinner === 'A' ? cA.name.replace(/\.[^.]+$/, '') : cB.name.replace(/\.[^.]+$/, '')} has better terms overall ({overallWinner === 'A' ? winsA : winsB} vs {overallWinner === 'A' ? winsB : winsA} categories won)
            </span>
          </div>
        )}

        {/* Comparison table */}
        <div className="ci-table-wrap" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
            <div style={{ padding: '11px 16px', fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', fontFamily: "'DM Sans', sans-serif" }}>Term</div>
            {[cA, cB].map(c => (
              <div key={c.id} style={{ padding: '11px 16px', borderLeft: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{c.parties[0]}</div>
              </div>
            ))}
          </div>

          {rows.map((row, i) => {
            const winner = row.winnerFn(row.valA, row.valB);
            return (
              <div key={row.label} style={{ display: 'grid', gridTemplateColumns: '180px 1fr 1fr', borderBottom: i < rows.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <div style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", display: 'flex', alignItems: 'center' }}>{row.label}</div>
                {[{ val: row.valA, render: row.renderA, w: winner === 'A' }, { val: row.valB, render: row.renderB, w: winner === 'B' }].map((cell, ci) => (
                  <div key={ci} style={{ padding: '12px 16px', borderLeft: `1px solid ${T.border}`, background: cell.w ? T.greenBg : undefined, display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 13, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>
                      {cell.render ? cell.render() : cell.val}
                    </span>
                    {cell.w && (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="7" r="6" fill={T.green} /><path d="M4 7l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="ci-actions-wrap" style={{ marginTop: 20, display: 'flex', gap: 10 }}>
          <Btn variant="secondary">Export comparison PDF</Btn>
          <Btn variant="ghost" onClick={() => onSelectContract(idA)}>Open Contract A →</Btn>
          <Btn variant="ghost" onClick={() => onSelectContract(idB)}>Open Contract B →</Btn>
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

  const avgRisk = (complete.reduce((s, c) => s + c.riskScore, 0) / Math.max(1, complete.length)).toFixed(1);
  const totalRed = complete.reduce((s, c) => s + c.flags.red, 0);
  const unlimitedCount = complete.filter(c => c.riskFlags.some(f => f.title.toLowerCase().includes('unlimited'))).length;
  const cappedCount = complete.filter(c => c.riskFlags.some(f => f.title.toLowerCase().includes('liability') && f.severity === 'green')).length;
  const otherCapsCount = Math.max(0, complete.length - unlimitedCount - cappedCount);
  const urgent = RENEWALS.filter(r => r.daysRemaining < 60).length;

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

  const kpis = [
    { label: 'Total contracts', value: CONTRACTS.length, sub: `${complete.length} analysed` },
    { label: 'Average risk', value: avgRisk, sub: 'Out of 10.0', color: T.riskColor(parseFloat(avgRisk)) },
    { label: 'Critical flags', value: totalRed, sub: 'High severity', color: T.red },
    { label: 'Unlimited liability', value: unlimitedCount, sub: 'Contracts exposed', color: T.red },
    { label: 'Urgent renewals', value: urgent, sub: 'Within 60 days', color: urgent > 0 ? T.orange : T.green },
  ];

  return (
    <PageShell title="Contracts" subtitle={`${complete.length} contracts on file at Northwind`}
      actions={<>
        <Btn variant="secondary" size="sm">Export CSV</Btn>
        <Btn size="sm" onClick={onUpload}>+ Upload</Btn>
      </>}
    >
      <div className="ci-pad-32" style={{ padding: '20px 32px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI strip */}
        <div className="ci-grid-5" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {kpis.map(k => (
            <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{k.label}</div>
              <div style={{ fontSize: 26, fontWeight: 800, color: k.color || T.ink, fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Filter strip */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search contracts…"
            style={{ flex: 1, minWidth: 200, background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
          {[
            { val: filterRisk, set: setFilterRisk, opts: [['all', 'All risk'], ['high', 'High (7+)'], ['medium', 'Medium'], ['low', 'Low']] },
            { val: filterType, set: setFilterType, opts: [['all', 'All types'], ['vendor', 'Vendor'], ['license', 'License'], ['partnership', 'Partnership'], ['customer', 'Customer'], ['lease', 'Lease'], ['nda', 'NDA']] },
            { val: sortBy, set: setSortBy, opts: [['riskScore', 'Sort: Risk'], ['date', 'Sort: Date'], ['name', 'Sort: Name']] },
          ].map((s, i) => (
            <select key={i} value={s.val} onChange={e => s.set(e.target.value)}
              style={{ background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: '8px 10px', fontSize: 13, color: T.ink, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", outline: 'none' }}>
              {s.opts.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          ))}
        </div>

        {/* Main: contract table + side column */}
        <div className="ci-portfolio-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          {/* Contract list */}
          <div className="ci-table-wrap" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 18px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Contracts by risk score</div>
              <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{filtered.length} shown</div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: T.surfaceAlt, borderBottom: `1px solid ${T.border}` }}>
                  {['#', 'Contract', 'Type', 'Risk', 'Flags', 'Expiry', 'Status'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} onClick={() => c.status === 'complete' && onSelect(c.id)}
                    style={{ borderBottom: `1px solid ${T.border}`, cursor: c.status === 'complete' ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (c.status === 'complete') e.currentTarget.style.background = T.bgAlt; }}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '11px 14px', color: T.inkMute, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>{String(i + 1).padStart(2, '0')}</td>
                    <td style={{ padding: '11px 14px', maxWidth: 240 }}>
                      <div style={{ fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                      <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{c.parties[0]}</div>
                    </td>
                    <td style={{ padding: '11px 14px' }}><TypePill type={c.type} /></td>
                    <td style={{ padding: '11px 14px' }}>{c.status === 'complete' ? <RiskBar score={c.riskScore} /> : <span style={{ color: T.inkMute }}>—</span>}</td>
                    <td style={{ padding: '11px 14px' }}>{c.status === 'complete' ? <FlagsSummary flags={c.flags} /> : <span style={{ color: T.inkMute }}>—</span>}</td>
                    <td style={{ padding: '11px 14px', color: T.inkSoft, fontSize: 12, fontFamily: "'DM Mono', monospace", whiteSpace: 'nowrap' }}>{c.terminationDate || '—'}</td>
                    <td style={{ padding: '11px 14px' }}>
                      {c.status === 'complete'
                        ? <Badge label="Complete" color={T.green} bg={T.greenBg} />
                        : <span style={{ fontSize: 11, fontWeight: 600, color: T.blue, background: T.blueLight, borderRadius: 6, padding: '3px 9px', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                          <span style={{ width: 5, height: 5, borderRadius: '50%', background: T.blue, animation: 'ciPulse 1.2s infinite' }} />{c.progress || 0}%
                        </span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filtered.length === 0 && (
              <div style={{ textAlign: 'center', padding: '40px', color: T.inkMute, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>No contracts match your filters.</div>
            )}
          </div>

          {/* Side column: Liability + Renewals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* Liability exposure */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 12, fontFamily: "'DM Sans', sans-serif" }}>Liability exposure</div>
              {[
                { label: 'Capped (2× annual)', count: cappedCount, color: T.green },
                { label: 'Other caps', count: otherCapsCount, color: T.orange },
                { label: 'Unlimited / unknown', count: unlimitedCount, color: T.red },
              ].map(row => {
                const pct = complete.length ? (row.count / complete.length) * 100 : 0;
                return (
                  <div key={row.label} style={{ marginBottom: 12 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, color: T.inkMid, fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: row.color, fontFamily: "'DM Mono', monospace" }}>{row.count}</span>
                    </div>
                    <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: row.color, borderRadius: 3 }} />
                    </div>
                  </div>
                );
              })}
              {unlimitedCount > 0 && (
                <div style={{ marginTop: 10, padding: '9px 12px', background: T.redBg, border: `1px solid ${T.redBorder}`, borderRadius: 6, fontSize: 12, color: T.redDark, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
                  <strong>⚠ Action needed.</strong> {unlimitedCount} contract{unlimitedCount !== 1 ? 's' : ''} with unlimited or unknown liability — escalate to Head of Legal.
                </div>
              )}
            </div>

            {/* Upcoming renewals */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Upcoming renewals</div>
                <span style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>Next 90 days</span>
              </div>
              {RENEWALS.filter(r => r.daysRemaining < 90).sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 5).map((r, i, arr) => {
                const c = r.daysRemaining < 0 ? T.red : r.daysRemaining < 30 ? T.red : r.daysRemaining < 60 ? T.orange : T.green;
                return (
                  <div key={r.id} style={{ padding: '9px 0', borderTop: i > 0 ? `1px solid ${T.border}` : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{r.name.replace(/\.[^.]+$/, '')}</div>
                      <div style={{ fontSize: 10, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{r.noticePeriod} notice · {r.renewalDate}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 700, color: c, fontFamily: "'DM Mono', monospace", flexShrink: 0 }}>
                      {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d late` : `${r.daysRemaining}d`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen 7b: Playbook (Northwind standard positions) ───────────
const PB_CLAUSES = [
  { id: 'liability',       cat: 'Risk',                 clause: 'Liability cap',           position: 'Capped at 2× annual contract value',          acceptable: 'Any cap ≥ 1× annual value',    flagMatch: f => f.title.toLowerCase().includes('liability') },
  { id: 'indemnification', cat: 'Risk',                 clause: 'Indemnification',         position: 'Mutual and reciprocal',                       acceptable: 'Minor asymmetry tolerated if limited', flagMatch: f => f.title.toLowerCase().includes('indemni') },
  { id: 'ip',              cat: 'Intellectual property', clause: 'IP ownership',           position: 'Custom deliverables owned by Northwind',      acceptable: 'Joint ownership for R&D only', flagMatch: f => f.title.toLowerCase().includes('ip') || f.title.toLowerCase().includes('intellectual') },
  { id: 'termination',     cat: 'Risk',                 clause: 'Termination',             position: '30 days notice, no penalty',                  acceptable: 'Up to 60 days, no financial penalty', flagMatch: f => f.title.toLowerCase().includes('termination') || f.title.toLowerCase().includes('penalty') },
  { id: 'change_control',  cat: 'Risk',                 clause: 'Change of control',       position: 'Right to terminate within 90 days of acquisition', acceptable: 'Minimum 60-day opt-out',  flagMatch: f => f.title.toLowerCase().includes('change of control') },
  { id: 'auto_renewal',    cat: 'Commercial',           clause: 'Auto-renewal',            position: 'No automatic renewal without consent',        acceptable: 'OK if notice period ≥ 90 days', flagMatch: f => f.title.toLowerCase().includes('renewal') },
  { id: 'dispute',         cat: 'Governance',           clause: 'Dispute resolution',      position: 'English law, England & Wales courts',         acceptable: 'London arbitration acceptable',flagMatch: f => f.title.toLowerCase().includes('dispute') || f.title.toLowerCase().includes('arbitration') },
  { id: 'price_escalation',cat: 'Commercial',           clause: 'Price escalation',        position: 'CPI-linked, capped at 3% p.a.',               acceptable: 'Fixed ≤ 3% p.a.',              flagMatch: f => f.title.toLowerCase().includes('escalation') || f.title.toLowerCase().includes('price') },
  { id: 'confidentiality', cat: 'Governance',           clause: 'Confidentiality',         position: 'Mutual NDA, 3-year post-term',                acceptable: '2-year minimum; mutual',       flagMatch: f => f.title.toLowerCase().includes('confidential') },
  { id: 'sla',             cat: 'Commercial',           clause: 'SLA / uptime',            position: '99.9% uptime, credits ≥ 15% monthly fee',     acceptable: '99.5% min; auto credits',      flagMatch: f => f.title.toLowerCase().includes('sla') || f.title.toLowerCase().includes('uptime') },
];

function pbStatus(clause, contract) {
  if (!contract) return 'unknown';
  const m = contract.riskFlags.find(f => clause.flagMatch(f));
  if (!m) return 'pass';
  if (m.severity === 'red') return 'fail';
  if (m.severity === 'orange') return 'warn';
  return 'pass';
}

function PlaybookScreen({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [positions, setPositions] = useState(Object.fromEntries(PB_CLAUSES.map(c => [c.id, c.position])));
  const contract = complete.find(c => c.id === selectedId) || null;
  const cats = [...new Set(PB_CLAUSES.map(c => c.cat))];
  const sm = {
    pass:    { c: T.green,   bg: T.greenBg,  icon: '✓', l: 'Compliant' },
    warn:    { c: T.orange,  bg: T.orangeBg, icon: '⚠', l: 'Deviation' },
    fail:    { c: T.red,     bg: T.redBg,    icon: '✕', l: 'Non-compliant' },
    unknown: { c: T.inkMute, bg: T.bgAlt,    icon: '—', l: 'N/A' },
  };
  const counts = contract ? {
    pass: PB_CLAUSES.filter(c => pbStatus(c, contract) === 'pass').length,
    warn: PB_CLAUSES.filter(c => pbStatus(c, contract) === 'warn').length,
    fail: PB_CLAUSES.filter(c => pbStatus(c, contract) === 'fail').length,
  } : null;

  return (
    <PageShell title="Northwind playbook" subtitle="Our agreed positions on every key contract clause"
      actions={<Btn variant="secondary" size="sm">Export playbook</Btn>}
    >
      <div className="ci-pad-32" style={{ padding: '20px 32px 32px' }}>

        {/* Intro card */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.blue}`, borderRadius: 8, padding: '14px 18px', marginBottom: 18, display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 280 }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, marginBottom: 3, fontFamily: "'DM Sans', sans-serif" }}>Approved by the Board · last updated Mar 2026</div>
            <div style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              Every contract above £25k is scored against these positions. Anything outside the acceptable range needs sign-off from Head of Legal before signature.
            </div>
          </div>
          <div style={{ display: 'flex', gap: 14, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>
            <span><strong style={{ color: T.ink, fontFamily: "'DM Mono', monospace" }}>{PB_CLAUSES.length}</strong> <span style={{ color: T.inkSoft }}>clauses</span></span>
            <span><strong style={{ color: T.ink, fontFamily: "'DM Mono', monospace" }}>{cats.length}</strong> <span style={{ color: T.inkSoft }}>categories</span></span>
          </div>
        </div>

        {/* Contract selector */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, color: T.inkSoft, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>Check against contract:</span>
          <select value={selectedId || ''} onChange={e => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            style={{ background: T.bg, border: `1px solid ${T.borderMid}`, borderRadius: 6, padding: '6px 10px', fontSize: 13, color: T.ink, minWidth: 280, fontFamily: "'DM Sans', sans-serif", cursor: 'pointer' }}>
            <option value="">— Select a contract to compare —</option>
            {complete.map(c => <option key={c.id} value={c.id}>{c.name.replace(/\.[^.]+$/, '')}</option>)}
          </select>
          {contract && counts && (
            <>
              <span style={{ width: 1, height: 16, background: T.border }} />
              <span style={{ fontSize: 12, color: T.green, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>✓ {counts.pass} compliant</span>
              {counts.warn > 0 && <span style={{ fontSize: 12, color: T.orange, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>⚠ {counts.warn} deviations</span>}
              {counts.fail > 0 && <span style={{ fontSize: 12, color: T.red, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>✕ {counts.fail} non-compliant</span>}
              <div style={{ flex: 1, maxWidth: 180, height: 5, background: T.border, borderRadius: 3, overflow: 'hidden', display: 'flex' }}>
                <div style={{ width: `${counts.pass / PB_CLAUSES.length * 100}%`, background: T.green, height: '100%' }} />
                <div style={{ width: `${counts.warn / PB_CLAUSES.length * 100}%`, background: T.orange, height: '100%' }} />
                <div style={{ width: `${counts.fail / PB_CLAUSES.length * 100}%`, background: T.red, height: '100%' }} />
              </div>
              <span style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Mono', monospace" }}>{Math.round(counts.pass / PB_CLAUSES.length * 100)}% aligned</span>
              <button onClick={() => onSelectContract(contract.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.blue, fontWeight: 600, padding: 0, marginLeft: 'auto', fontFamily: "'DM Sans', sans-serif" }}>Open contract →</button>
            </>
          )}
        </div>

        {/* Categories + clause tables */}
        {cats.map(cat => (
          <div key={cat} style={{ marginBottom: 24 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '0 0 8px', borderBottom: `1px solid ${T.border}`, fontFamily: "'DM Sans', sans-serif" }}>{cat}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Clause', 'Our standard position', contract && 'Contract language', contract ? 'Status' : 'Acceptable range'].filter(Boolean).map(h => (
                    <th key={h} style={{ padding: '9px 12px 9px 0', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}`, width: h === 'Clause' ? '16%' : undefined, fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PB_CLAUSES.filter(c => c.cat === cat).map(pc => {
                  const status = pbStatus(pc, contract);
                  const s = sm[status];
                  const flag = contract && contract.riskFlags.find(f => pc.flagMatch(f));
                  return (
                    <tr key={pc.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '12px 12px 12px 0', verticalAlign: 'top' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{pc.clause}</span>
                      </td>
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {editingId === pc.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <textarea value={positions[pc.id]} onChange={e => setPositions(p => ({ ...p, [pc.id]: e.target.value }))} rows={2}
                              style={{ width: '100%', background: T.bg, border: `1px solid ${T.blue}`, borderRadius: 5, padding: '6px 8px', fontSize: 12, color: T.ink, resize: 'none', fontFamily: "'DM Sans', sans-serif" }} />
                            <div style={{ display: 'flex', gap: 6 }}>
                              <Btn size="sm" onClick={() => setEditingId(null)}>Save</Btn>
                              <Btn size="sm" variant="secondary" onClick={() => setEditingId(null)}>Cancel</Btn>
                            </div>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}
                            onMouseEnter={e => { const b = e.currentTarget.querySelector('.pbEdit'); if (b) b.style.opacity = '1'; }}
                            onMouseLeave={e => { const b = e.currentTarget.querySelector('.pbEdit'); if (b) b.style.opacity = '0'; }}
                          >
                            <span style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.55, flex: 1, fontFamily: "'DM Sans', sans-serif" }}>{positions[pc.id]}</span>
                            <button className="pbEdit" onClick={() => setEditingId(pc.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.blue, fontWeight: 600, opacity: 0, transition: 'opacity 0.12s', flexShrink: 0, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>Edit</button>
                          </div>
                        )}
                      </td>
                      {contract && (
                        <td style={{ padding: '12px', verticalAlign: 'top' }}>
                          {flag ? (
                            <div>
                              <div style={{ fontSize: 12, color: T.inkMid, fontStyle: 'italic', lineHeight: 1.55, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>"{flag.description.slice(0, 90)}…"</div>
                              <span style={{ fontSize: 10, color: T.inkSoft, fontFamily: "'DM Mono', monospace" }}>Pg {flag.page}, §{flag.section}</span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 12, color: T.green, fontFamily: "'DM Sans', sans-serif" }}>No deviations flagged</span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '12px', verticalAlign: 'top' }}>
                        {contract ? (
                          <div>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: s.bg, borderRadius: 6, padding: '4px 9px' }}>
                              <span style={{ fontSize: 12, color: s.c, fontWeight: 700 }}>{s.icon}</span>
                              <span style={{ fontSize: 11, color: s.c, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{s.l}</span>
                            </span>
                            {flag && flag.severity !== 'green' && (
                              <div style={{ marginTop: 6 }}>
                                <button onClick={() => onSelectContract(contract.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.blue, fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif" }}>View flag →</button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 12, color: T.inkSoft, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{pc.acceptable}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>
    </PageShell>
  );
}

// ─── Screen 8: Export / Share ─────────────────────────────────────
function ExportScreen({ contractId, onBack }) {
  const { CONTRACTS } = window.APP_DATA;
  const c = CONTRACTS.find(x => x.id === contractId) || CONTRACTS[0];
  const [email, setEmail] = useState('');
  const [linkCopied, setLinkCopied] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  function handleCopyLink() { setLinkCopied(true); setTimeout(() => setLinkCopied(false), 2000); }
  function handleSendEmail() { if (email.trim()) { setEmailSent(true); setTimeout(() => setEmailSent(false), 3000); setEmail(''); } }

  const formats = [
    { icon: '📄', label: 'PDF Report', desc: 'Formatted, branded — ready to share with stakeholders', cta: 'Download PDF' },
    { icon: '📊', label: 'Excel / CSV', desc: 'All raw data — for your own analysis or tracking', cta: 'Download Excel' },
    { icon: '📋', label: 'Summary only', desc: 'One-page overview — just the risks, quick read', cta: 'Download Summary' },
  ];

  return (
    <PageShell
      title="Export & share"
      subtitle={c.name}
      actions={<Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>}
    >
      <div className="ci-pad-32" style={{ maxWidth: 580, margin: '0 auto', padding: '32px' }}>

        {/* Share with team */}
        <div style={{ marginBottom: 32 }}>
          <SectionLabel>Share with your team</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {/* Email */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Send via email</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input value={email} onChange={e => setEmail(e.target.value)} placeholder="colleague@company.com"
                  style={{ flex: 1, background: T.bg, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                <Btn size="sm" onClick={handleSendEmail}>{emailSent ? '✓ Sent!' : 'Send'}</Btn>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>Recipient gets a view-only link — no account needed.</div>
            </div>

            {/* Link */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Shareable link</div>
                <Btn size="sm" variant="secondary" onClick={handleCopyLink}>{linkCopied ? '✓ Copied!' : 'Copy link'}</Btn>
              </div>
              <div style={{ display: 'flex', gap: 12, fontSize: 12, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>
                <span>Expires in 7 days</span>
                <span>·</span>
                <span>View-only access</span>
                <span>·</span>
                <span>No login required</span>
              </div>
            </div>
          </div>
        </div>

        {/* Download formats */}
        <div>
          <SectionLabel>Download formats</SectionLabel>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {formats.map(f => (
              <div key={f.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
                <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: T.bgAlt, border: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, flexShrink: 0 }}>{f.icon}</div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: T.ink, marginBottom: 2, fontFamily: "'DM Sans', sans-serif" }}>{f.label}</div>
                    <div style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{f.desc}</div>
                  </div>
                </div>
                <Btn size="sm" variant="secondary" style={{ flexShrink: 0 }}>{f.cta}</Btn>
              </div>
            ))}
          </div>
        </div>

        {/* Privacy note */}
        <div style={{ marginTop: 24, padding: '12px 16px', background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 8, display: 'flex', gap: 10, alignItems: 'center' }}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L3 4.5v4C3 11.4 5.1 14 8 14s5-2.6 5-5.5v-4L8 2z" stroke={T.inkSoft} strokeWidth="1.5" strokeLinejoin="round" /></svg>
          <span style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>All shared links are encrypted. You can revoke access anytime from your account settings.</span>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Renewals Screen ──────────────────────────────────────────────
function RenewalsScreen() {
  const { RENEWALS } = window.APP_DATA;
  const [selected, setSelected] = useState(null);

  function rc(r) { return r.daysRemaining < 0 ? T.red : r.daysRemaining < 30 ? T.red : r.daysRemaining < 60 ? T.orange : T.green; }

  return (
    <PageShell title="Renewals" subtitle="Track upcoming contract renewal and notice deadlines.">
      <div className="ci-pad-32 ci-renewals-grid" style={{ padding: '20px 32px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20, maxWidth: 1100 }}>
        <div className="ci-table-wrap" style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: T.surfaceAlt }}>
                {['Contract', 'Renewal Date', 'Days Left', 'Notice Required', 'Risk'].map(h => (
                  <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em', fontFamily: "'DM Sans', sans-serif", borderBottom: `1px solid ${T.border}` }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...RENEWALS].sort((a, b) => a.daysRemaining - b.daysRemaining).map(r => (
                <tr key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                  style={{ borderBottom: `1px solid ${T.border}`, cursor: 'pointer', background: selected === r.id ? T.bgAlt : '' }}
                  onMouseEnter={e => { if (selected !== r.id) e.currentTarget.style.background = T.bgAlt; }}
                  onMouseLeave={e => { if (selected !== r.id) e.currentTarget.style.background = ''; }}
                >
                  <td style={{ padding: '11px 16px', borderLeft: `3px solid ${rc(r)}`, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{r.name.replace(/\.[^.]+$/, '').slice(0, 28)}</td>
                  <td style={{ padding: '11px 16px', color: T.inkMid, fontFamily: "'DM Mono', monospace", fontSize: 12 }}>{r.renewalDate}</td>
                  <td style={{ padding: '11px 16px', fontWeight: 700, color: rc(r), fontFamily: "'DM Mono', monospace" }}>
                    {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : r.daysRemaining === 0 ? 'TODAY' : `${r.daysRemaining}d`}
                  </td>
                  <td style={{ padding: '11px 16px', color: T.inkSoft, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{r.noticePeriod}</td>
                  <td style={{ padding: '11px 16px' }}><RiskBar score={r.riskScore} /></td>
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
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '14px 18px', background: T.riskBg(r.riskScore), borderBottom: `1px solid ${T.border}` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: rc(r), textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                    {r.daysRemaining < 0 ? 'Overdue' : r.daysRemaining < 30 ? 'Urgent' : 'Renewal detail'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{r.name}</div>
                </div>
                <div style={{ padding: '14px 18px' }}>
                  {[['Renewal Date', r.renewalDate], ['Days remaining', r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : `${r.daysRemaining} days`], ['Notice period', r.noticePeriod], ['Risk score', `${r.riskScore}/10`]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                      <span style={{ color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{k}</span>
                      <span style={{ fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <Btn full>View Contract</Btn>
                    <Btn variant="secondary" full>Acknowledge</Btn>
                  </div>
                </div>
              </div>
            );
          })() : <div style={{ color: T.inkMute, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Select a renewal to see details.</div>}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Settings Screen ──────────────────────────────────────────────
function SettingsScreen() {
  const { TEAM_MEMBERS } = window.APP_DATA;
  const [tab, setTab] = useState('team');
  return (
    <PageShell title="Settings">
      <div className="ci-pad-32" style={{ padding: '0 32px' }}>
        <Tabs tabs={[{ id: 'team', label: 'Team' }, { id: 'billing', label: 'Billing' }, { id: 'audit', label: 'Audit Log' }]} active={tab} onChange={setTab} />
        <div style={{ padding: '24px 0', maxWidth: 820 }}>
          {tab === 'team' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <span style={{ fontSize: 15, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Team members</span>
                <Btn size="sm">+ Invite member</Btn>
              </div>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: T.surfaceAlt }}>
                      {['Member', 'Role', 'Last Active', 'Status', 'Actions'].map(h => (
                        <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.06em', borderBottom: `1px solid ${T.border}`, fontFamily: "'DM Sans', sans-serif" }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEAM_MEMBERS.map(m => (
                      <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                        <td style={{ padding: '11px 16px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <div style={{ width: 32, height: 32, borderRadius: '50%', background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.blue, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{m.avatar}</div>
                            <div>
                              <div style={{ fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{m.name}</div>
                              <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{m.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <select defaultValue={m.role} style={{ background: T.bg, border: `1px solid ${T.border}`, borderRadius: 6, padding: '4px 8px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", outline: 'none' }}>
                            <option>Admin</option><option>Reviewer</option><option>Viewer</option>
                          </select>
                        </td>
                        <td style={{ padding: '11px 16px', color: T.inkSoft, fontSize: 12, fontFamily: "'DM Sans', sans-serif" }}>{m.lastLogin}</td>
                        <td style={{ padding: '11px 16px' }}>
                          {m.status === 'pending'
                            ? <Badge label="Pending" color={T.orange} bg={T.orangeBg} dot />
                            : <Badge label="Active" color={T.green} bg={T.greenBg} dot />}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          {m.id !== 1 && <Btn size="sm" variant="danger">Remove</Btn>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === 'billing' && (
            <div style={{ maxWidth: 440 }}>
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '22px 24px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Current Plan</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Professional</div>
                    <div style={{ fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>£299/month · 50 contracts/month</div>
                  </div>
                  <Btn variant="secondary" size="sm">Upgrade</Btn>
                </div>
                <div style={{ height: 6, background: T.border, borderRadius: 4 }}>
                  <div style={{ width: '72%', height: '100%', background: T.blue, borderRadius: 4 }} />
                </div>
                <div style={{ fontSize: 12, color: T.inkSoft, marginTop: 6, fontFamily: "'DM Sans', sans-serif" }}>36 / 50 analyses used this month</div>
              </div>
            </div>
          )}
          {tab === 'audit' && <div style={{ fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>Full audit log coming in v1.</div>}
        </div>
      </div>
    </PageShell>
  );
}

Object.assign(window, { DeepDiveScreen, CompareScreen, PortfolioScreen, PlaybookScreen, ExportScreen, RenewalsScreen, SettingsScreen });
