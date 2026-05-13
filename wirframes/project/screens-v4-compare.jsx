
// v4 — Contract Comparison Screen
// Side-by-side comparison of 2-5 contracts with median-based color coding
// and a recommendation summary when a clear winner exists.

const { useState: useStateCmp, useMemo: useMemoCmp } = React;

// ──────────────────────────────────────────────────────────────────
// Helpers — parse text values into comparable numbers
// ──────────────────────────────────────────────────────────────────

// Parse "60 days", "6 months" → days
function parseDays(s) {
  if (!s || s === 'N/A' || s === '—') return null;
  const m = String(s).match(/(\d+)\s*(day|month|year|week)/i);
  if (!m) return null;
  const n = parseInt(m[1], 10);
  const unit = m[2].toLowerCase();
  if (unit.startsWith('day'))   return n;
  if (unit.startsWith('week'))  return n * 7;
  if (unit.startsWith('month')) return n * 30;
  if (unit.startsWith('year'))  return n * 365;
  return null;
}

// Parse "5% annual", "RPI linked", "CPI only" → number or marker
function parseEscalation(s) {
  if (!s || s === 'N/A' || s === '—') return null;
  const m = String(s).match(/([\d.]+)\s*%/);
  if (m) return parseFloat(m[1]);
  if (/cpi|rpi/i.test(s)) return 2.5; // treat index-linked as ~CPI baseline
  return null;
}

// Term length in days between effective/termination
function termLengthDays(c) {
  if (!c.effectiveDate || !c.terminationDate) return null;
  return Math.round((new Date(c.terminationDate) - new Date(c.effectiveDate)) / 86400000);
}

// Detect favourable/unfavourable boolean clauses based on flag titles
function hasFlagMatching(c, regex) {
  return c.riskFlags && c.riskFlags.some(f => regex.test(f.title));
}

// ──────────────────────────────────────────────────────────────────
// Comparison row schema
// Each row: { id, group, label, get(c), fmt(v,c), kind, betterIs }
// kind: 'numeric' (color by median), 'check' (✓/✗ binary), 'text' (neutral)
// betterIs: 'lower' | 'higher' for numeric
// ──────────────────────────────────────────────────────────────────

function buildCompareRows() {
  return [
    // ── Identity / Parties ───────────────────────────────────────
    { group:'Parties', id:'counterparty', label:'Counterparty',
      get:c=>c.parties[0], fmt:v=>v, kind:'text' },
    { group:'Parties', id:'type', label:'Contract Type',
      get:c=>c.type, fmt:v=>v && <WTypePill type={v} />, kind:'text' },

    // ── Dates ─────────────────────────────────────────────────────
    { group:'Dates', id:'effective', label:'Effective Date',
      get:c=>c.effectiveDate, fmt:v=>v||'—', kind:'text' },
    { group:'Dates', id:'expires', label:'Expiry Date',
      get:c=>c.terminationDate, fmt:v=>v||'—', kind:'text' },
    { group:'Dates', id:'term', label:'Term Length',
      get:c=>termLengthDays(c),
      fmt:v=>v?`${(v/365).toFixed(1)} years`:'—',
      kind:'numeric', betterIs:'higher' },
    { group:'Dates', id:'notice', label:'Notice Period',
      get:c=>parseDays(c.noticePeriod),
      fmt:(v,c)=>c.noticePeriod||'—',
      kind:'numeric', betterIs:'higher' },
    { group:'Dates', id:'autorenew', label:'Auto-Renewal',
      get:c=>c.autoRenewal,
      fmt:v=>v||'—',
      kind:'check',
      isFavourable:v=>!v||/^no$/i.test(v)||/mutual/i.test(v) },

    // ── Financial ─────────────────────────────────────────────────
    { group:'Financial', id:'amount', label:'Payment Amount',
      get:c=>c.paymentAmount, fmt:v=>v||'—', kind:'text' },
    { group:'Financial', id:'schedule', label:'Schedule',
      get:c=>c.paymentSchedule, fmt:v=>v||'—', kind:'text' },
    { group:'Financial', id:'escalation', label:'Price Escalation',
      get:c=>parseEscalation(c.priceEscalation),
      fmt:(v,c)=>c.priceEscalation||'—',
      kind:'numeric', betterIs:'lower' },
    { group:'Financial', id:'paymentterms', label:'Payment Terms',
      get:c=>parseDays(c.paymentTerms),
      fmt:(v,c)=>c.paymentTerms||'—',
      kind:'numeric', betterIs:'higher' },

    // ── Risk Profile ──────────────────────────────────────────────
    { group:'Risk Profile', id:'risk', label:'Risk Score',
      get:c=>c.riskScore,
      fmt:v=>v!=null?v.toFixed(1):'—',
      kind:'numeric', betterIs:'lower', emphasised:true },
    { group:'Risk Profile', id:'red', label:'High-Severity Flags',
      get:c=>c.flags.red,
      fmt:v=>v,
      kind:'numeric', betterIs:'lower' },
    { group:'Risk Profile', id:'orange', label:'Medium-Severity Flags',
      get:c=>c.flags.orange,
      fmt:v=>v,
      kind:'numeric', betterIs:'lower' },

    // ── Key Clauses (boolean ✓/✗) ─────────────────────────────────
    { group:'Key Clauses', id:'liabcap', label:'Liability Cap',
      get:c=>!hasFlagMatching(c,/unlimited liability|liability/i),
      fmt:v=>v?'Capped':'Unlimited / unclear',
      kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'mutualindem', label:'Mutual Indemnification',
      get:c=>!hasFlagMatching(c,/one-sided|asymmet|indemn/i),
      fmt:v=>v?'Mutual':'One-sided',
      kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'ipreten', label:'IP Retained by You',
      get:c=>!hasFlagMatching(c,/ip|intellectual prop/i),
      fmt:v=>v?'Yes':'Assigned away',
      kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'dataport', label:'Data Portability',
      get:c=>!hasFlagMatching(c,/data portability|export|portab/i),
      fmt:v=>v?'Guaranteed':'Not guaranteed',
      kind:'check', isFavourable:v=>v===true },
    { group:'Key Clauses', id:'changectrl', label:'Change-of-Control',
      get:c=>!hasFlagMatching(c,/change of control/i),
      fmt:v=>v?'Addressed':'Not addressed',
      kind:'check', isFavourable:v=>v===true },
  ];
}

// ──────────────────────────────────────────────────────────────────
// Score a row across the selected set
// Returns { byContract: {id: 'better'|'worse'|'neutral'|'na'} }
// ──────────────────────────────────────────────────────────────────
function scoreRow(row, contracts) {
  const out = {};
  if (row.kind === 'text') {
    contracts.forEach(c => out[c.id] = 'neutral');
    return out;
  }
  if (row.kind === 'check') {
    contracts.forEach(c => {
      const v = row.get(c);
      if (v == null) { out[c.id] = 'na'; return; }
      out[c.id] = row.isFavourable(v) ? 'better' : 'worse';
    });
    return out;
  }
  // numeric: compare to median of present values
  const vals = contracts.map(c => row.get(c)).filter(v => v != null && !Number.isNaN(v));
  if (vals.length < 2) {
    contracts.forEach(c => out[c.id] = 'neutral');
    return out;
  }
  const sorted = [...vals].sort((a,b)=>a-b);
  const mid = sorted.length % 2
    ? sorted[(sorted.length-1)/2]
    : (sorted[sorted.length/2-1] + sorted[sorted.length/2]) / 2;
  contracts.forEach(c => {
    const v = row.get(c);
    if (v == null || Number.isNaN(v)) { out[c.id] = 'na'; return; }
    if (v === mid) { out[c.id] = 'neutral'; return; }
    const isLow  = v < mid;
    const better = row.betterIs === 'lower' ? isLow : !isLow;
    out[c.id] = better ? 'better' : 'worse';
  });
  return out;
}

// ──────────────────────────────────────────────────────────────────
// Determine winner: most 'better' cells, must lead by ≥ 1, and must
// not have the worst risk score.
// ──────────────────────────────────────────────────────────────────
function pickWinner(rows, contracts) {
  if (contracts.length < 2) return null;
  const tally = Object.fromEntries(contracts.map(c => [c.id, { better:0, worse:0 }]));
  rows.forEach(row => {
    const s = scoreRow(row, contracts);
    contracts.forEach(c => {
      if (s[c.id] === 'better') tally[c.id].better++;
      if (s[c.id] === 'worse')  tally[c.id].worse++;
    });
  });
  const ranked = contracts.map(c => ({ c, ...tally[c.id], net: tally[c.id].better - tally[c.id].worse }))
                          .sort((a,b) => b.net - a.net);
  if (ranked.length < 2) return null;
  if (ranked[0].net <= ranked[1].net) return null; // tie
  // sanity: winner shouldn't have highest risk
  const maxRisk = Math.max(...contracts.map(c => c.riskScore));
  if (ranked[0].c.riskScore === maxRisk && contracts.length > 2) return null;
  return { ...ranked[0], ranking: ranked };
}

// ──────────────────────────────────────────────────────────────────
// Cell renderer
// ──────────────────────────────────────────────────────────────────
function CompareCell({ row, contract, verdict }) {
  const v = row.get(contract);
  const display = row.fmt(v, contract);

  let bg = 'transparent';
  let bdc = W.border;
  let chip = null;

  if (verdict === 'better') {
    bg = W.greenBg;
    bdc = W.greenBorder;
    chip = <span style={{ color:W.green, fontWeight:800 }}>✓</span>;
  } else if (verdict === 'worse') {
    bg = W.redBg;
    bdc = W.redBorder;
    chip = <span style={{ color:W.red, fontWeight:800 }}>✗</span>;
  } else if (verdict === 'na') {
    bg = W.bg; bdc = W.border;
  }

  // Special render for risk score row — show big number + badge
  if (row.id === 'risk') {
    const rc = wRisk(contract.riskScore);
    return (
      <div style={{ background:bg, border:`1px solid ${bdc}`, borderRadius:5, padding:'10px 12px', display:'flex', alignItems:'center', justifyContent:'space-between', minHeight:46 }}>
        <span style={{ fontSize:22, fontWeight:800, color:rc, fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{contract.riskScore.toFixed(1)}</span>
        <span style={{ fontSize:10, fontWeight:700, color:rc, textTransform:'uppercase', letterSpacing:'0.06em' }}>{wRiskLabel(contract.riskScore)}</span>
      </div>
    );
  }

  return (
    <div style={{
      background:bg, border:`1px solid ${bdc}`, borderRadius:5,
      padding:'8px 12px', minHeight:36, display:'flex', alignItems:'center',
      justifyContent:'space-between', gap:8,
    }}>
      <span style={{ fontSize:12, color:W.text, fontWeight:row.emphasised?700:500, lineHeight:1.4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
        {display}
      </span>
      {chip && <span style={{ fontSize:14, flexShrink:0 }}>{chip}</span>}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Add-contract picker (modal-ish dropdown)
// ──────────────────────────────────────────────────────────────────
function AddContractPicker({ candidates, onPick, onClose }) {
  return (
    <div style={{ position:'absolute', top:'calc(100% + 6px)', left:0, zIndex:50,
      background:W.surface, border:`1px solid ${W.border}`, borderRadius:6,
      boxShadow:'0 8px 24px rgba(0,0,0,0.10)', width:340, maxHeight:340, overflow:'auto',
    }}>
      <div style={{ padding:'8px 12px', borderBottom:`1px solid ${W.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <span style={{ fontSize:11, fontWeight:700, color:W.textSoft, textTransform:'uppercase', letterSpacing:'0.06em' }}>Add a contract</span>
        <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', color:W.textSoft, fontSize:13 }}>✕</button>
      </div>
      {candidates.length === 0
        ? <div style={{ padding:'20px', textAlign:'center', fontSize:12, color:W.textMute }}>No more contracts to add.</div>
        : candidates.map(c => (
          <button key={c.id} onClick={()=>onPick(c.id)} style={{
            display:'flex', width:'100%', padding:'9px 12px', alignItems:'center', gap:10,
            background:'transparent', border:'none', borderBottom:`1px solid ${W.border}`,
            cursor:'pointer', textAlign:'left',
          }}
            onMouseEnter={e=>e.currentTarget.style.background=W.accentBg}
            onMouseLeave={e=>e.currentTarget.style.background='transparent'}
          >
            <WRiskBadge score={c.riskScore} />
            <div style={{ flex:1, overflow:'hidden' }}>
              <div style={{ fontSize:12, fontWeight:600, color:W.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
              <div style={{ fontSize:10, color:W.textSoft, marginTop:1 }}>{c.parties[0]}</div>
            </div>
            <WTypePill type={c.type} />
          </button>
        ))
      }
    </div>
  );
}

// ──────────────────────────────────────────────────────────────────
// Main screen
// ──────────────────────────────────────────────────────────────────
function CompareScreen4({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const completed = CONTRACTS.filter(c => c.status === 'complete');

  // Default selection — start with 3 high-signal contracts
  const [selectedIds, setSelectedIds] = useStateCmp([1, 2, 7]);
  const [pickerOpen, setPickerOpen]   = useStateCmp(false);
  const [showExport, setShowExport]   = useStateCmp(false);

  const selected = selectedIds.map(id => completed.find(c=>c.id===id)).filter(Boolean);
  const candidates = completed.filter(c => !selectedIds.includes(c.id));
  const rows = useMemoCmp(buildCompareRows, []);

  const groups = ['Parties','Dates','Financial','Risk Profile','Key Clauses'];

  const verdicts = useMemoCmp(() => {
    const map = {};
    rows.forEach(r => map[r.id] = scoreRow(r, selected));
    return map;
  }, [rows, selectedIds]);

  const winner = useMemoCmp(() => pickWinner(rows, selected), [rows, selectedIds]);

  function addContract(id) {
    if (selectedIds.length >= 5) return;
    setSelectedIds([...selectedIds, id]);
    setPickerOpen(false);
  }
  function removeContract(id) {
    setSelectedIds(selectedIds.filter(x => x !== id));
  }

  const canCompare = selected.length >= 2;
  const colCount = selected.length;
  const gridCols = `220px repeat(${colCount}, minmax(200px, 1fr))`;

  return (
    <PageShell
      title="Compare Contracts"
      subtitle={`Side-by-side analysis · ${selected.length} of 5 selected`}
      actions={
        <>
          <WBtn variant="secondary" small onClick={()=>setShowExport(true)} disabled={!canCompare}>↓ Export Report</WBtn>
          <WBtn variant="secondary" small disabled={!canCompare}>🖶 Print</WBtn>
        </>
      }
    >
      <div style={{ padding:'18px 28px 36px' }}>

        {/* Selection bar — chips of selected contracts + add button */}
        <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap', marginBottom:14, position:'relative' }}>
          <span style={{ fontSize:11, fontWeight:700, color:W.textSoft, textTransform:'uppercase', letterSpacing:'0.06em', marginRight:4 }}>Comparing</span>
          {selected.map(c => (
            <div key={c.id} style={{
              display:'inline-flex', alignItems:'center', gap:8,
              background:W.surface, border:`1px solid ${W.border}`, borderRadius:5,
              padding:'5px 5px 5px 10px', fontSize:12,
            }}>
              <WRiskBadge score={c.riskScore} />
              <span style={{ color:W.text, fontWeight:600, maxWidth:220, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name.replace(/\.(pdf|docx)$/i,'')}</span>
              <button onClick={()=>removeContract(c.id)} disabled={selected.length<=2}
                title={selected.length<=2?'Minimum 2 contracts required':'Remove'}
                style={{
                  background:selected.length<=2?'transparent':W.bg, border:`1px solid ${W.border}`, borderRadius:3,
                  width:20, height:20, cursor:selected.length<=2?'not-allowed':'pointer',
                  fontSize:11, color:W.textSoft, display:'flex', alignItems:'center', justifyContent:'center',
                  opacity:selected.length<=2?0.4:1,
                }}>✕</button>
            </div>
          ))}

          <div style={{ position:'relative' }}>
            <WBtn variant="secondary" small
              onClick={()=>setPickerOpen(o=>!o)}
              disabled={selected.length>=5}>
              + Add Contract
            </WBtn>
            {pickerOpen && (
              <AddContractPicker candidates={candidates} onPick={addContract} onClose={()=>setPickerOpen(false)} />
            )}
          </div>

          <span style={{ fontSize:11, color:W.textMute, marginLeft:'auto' }}>
            Select between 2 and 5 contracts · {colCount}/5
          </span>
        </div>

        {/* Validation: < 2 selected */}
        {!canCompare && (
          <div style={{ padding:'48px 32px', textAlign:'center', background:W.surface, border:`1px dashed ${W.border2}`, borderRadius:8 }}>
            <div style={{ fontSize:32, marginBottom:8, opacity:0.5 }}>⇄</div>
            <div style={{ fontSize:14, fontWeight:700, color:W.text, marginBottom:4 }}>Pick at least 2 contracts to compare</div>
            <div style={{ fontSize:12, color:W.textSoft }}>You can compare up to five at once.</div>
          </div>
        )}

        {canCompare && (
          <>
            {/* Recommendation banner */}
            {winner ? (
              <div style={{
                background:W.greenBg,
                border:`1px solid ${W.greenBorder}`, borderRadius:8,
                padding:'14px 18px', marginBottom:16,
                display:'flex', alignItems:'center', gap:14,
              }}>
                <div style={{
                  width:40, height:40, borderRadius:8, background:W.green, color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0,
                }}>★</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:W.green, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:3 }}>Recommended Choice</div>
                  <div style={{ fontSize:14, fontWeight:700, color:W.text, marginBottom:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                    {winner.c.name.replace(/\.(pdf|docx)$/i,'')}
                  </div>
                  <div style={{ fontSize:12, color:W.textMid, lineHeight:1.5 }}>
                    Leads on <strong style={{color:W.green}}>{winner.better}</strong> comparable terms
                    {winner.worse>0 && <> against <strong style={{color:W.red}}>{winner.worse}</strong> losses</>}
                    {' '}— net advantage <strong>+{winner.net}</strong>.
                    Lowest risk profile and most favourable clause coverage in the set.
                  </div>
                </div>
                <WBtn small onClick={()=>onSelectContract(winner.c.id)}>Open contract →</WBtn>
              </div>
            ) : (
              <div style={{
                background:W.bg, border:`1px solid ${W.border}`, borderRadius:8,
                padding:'12px 16px', marginBottom:16,
                display:'flex', alignItems:'center', gap:12,
              }}>
                <div style={{ width:32, height:32, borderRadius:6, background:W.surface2, color:W.textSoft, display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>≈</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:W.text, marginBottom:2 }}>No clear winner</div>
                  <div style={{ fontSize:12, color:W.textSoft }}>The selected contracts trade off across categories. Review each row to weigh priorities.</div>
                </div>
              </div>
            )}

            {/* Comparison grid */}
            <div style={{
              background:W.surface, border:`1px solid ${W.border}`, borderRadius:8,
              overflow:'auto',
            }}>
              {/* Sticky column headers */}
              <div style={{
                display:'grid', gridTemplateColumns:gridCols, gap:0,
                borderBottom:`1px solid ${W.border}`, background:W.bg,
                position:'sticky', top:0, zIndex:5,
              }}>
                <div style={{ padding:'14px 16px', borderRight:`1px solid ${W.border}`, position:'sticky', left:0, background:W.bg, zIndex:6 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:W.textMute, textTransform:'uppercase', letterSpacing:'0.08em' }}>Term</div>
                </div>
                {selected.map((c, i) => {
                  const isWinner = winner && winner.c.id === c.id;
                  return (
                    <div key={c.id} style={{
                      padding:'12px 14px', borderRight: i<selected.length-1?`1px solid ${W.border}`:'none',
                      background: isWinner ? W.greenBg : W.bg, position:'relative',
                    }}>
                      {isWinner && (
                        <div style={{ position:'absolute', top:0, left:0, right:0, height:3, background:W.green }}></div>
                      )}
                      <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:5 }}>
                        <WTypePill type={c.type} />
                        {isWinner && <span style={{ fontSize:10, fontWeight:700, color:W.green, textTransform:'uppercase', letterSpacing:'0.06em' }}>★ Winner</span>}
                      </div>
                      <button onClick={()=>onSelectContract(c.id)} style={{
                        background:'none', border:'none', padding:0, cursor:'pointer', textAlign:'left',
                        fontSize:13, fontWeight:700, color:W.text, lineHeight:1.3,
                        overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:'100%', display:'block',
                      }}
                        onMouseEnter={e=>e.currentTarget.style.color=W.accent}
                        onMouseLeave={e=>e.currentTarget.style.color=W.text}
                      >{c.name.replace(/\.(pdf|docx)$/i,'')}</button>
                      <div style={{ fontSize:11, color:W.textSoft, marginTop:2, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.parties[0]}</div>
                    </div>
                  );
                })}
              </div>

              {/* Rows by group */}
              {groups.map(g => {
                const groupRows = rows.filter(r => r.group === g);
                return (
                  <div key={g}>
                    {/* Group header */}
                    <div style={{
                      display:'grid', gridTemplateColumns:gridCols,
                      background:W.surface2, borderBottom:`1px solid ${W.border}`, borderTop:`1px solid ${W.border}`,
                    }}>
                      <div style={{
                        padding:'7px 16px',
                        fontSize:10, fontWeight:700, color:W.textSoft, textTransform:'uppercase', letterSpacing:'0.08em',
                        position:'sticky', left:0, background:W.surface2, zIndex:2,
                        gridColumn: `1 / span ${colCount + 1}`,
                      }}>{g}</div>
                    </div>
                    {groupRows.map((row, ri) => (
                      <div key={row.id} style={{
                        display:'grid', gridTemplateColumns:gridCols,
                        borderBottom: ri<groupRows.length-1?`1px solid ${W.border}`:'none',
                        background: row.emphasised ? W.accentBg : W.surface,
                      }}>
                        <div style={{
                          padding:'10px 16px', borderRight:`1px solid ${W.border}`,
                          position:'sticky', left:0,
                          background: row.emphasised ? W.accentBg : W.surface, zIndex:1,
                          display:'flex', alignItems:'center',
                        }}>
                          <span style={{ fontSize:12, fontWeight: row.emphasised?700:500, color:W.textMid }}>{row.label}</span>
                        </div>
                        {selected.map((c, ci) => (
                          <div key={c.id} style={{
                            padding:'8px 10px',
                            borderRight: ci<selected.length-1?`1px solid ${W.border}`:'none',
                          }}>
                            <CompareCell row={row} contract={c} verdict={verdicts[row.id][c.id]} />
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display:'flex', gap:18, marginTop:14, fontSize:11, color:W.textSoft, alignItems:'center', flexWrap:'wrap' }}>
              <span style={{ fontWeight:700, color:W.textMid, textTransform:'uppercase', letterSpacing:'0.06em', fontSize:10 }}>Legend</span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <span style={{ width:14, height:14, borderRadius:3, background:'#f0fdf4', border:`1px solid ${W.greenBorder}` }}></span>
                Better than median
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <span style={{ width:14, height:14, borderRadius:3, background:'#fef2f2', border:`1px solid ${W.redBorder}` }}></span>
                Worse than median
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <span style={{ width:14, height:14, borderRadius:3, background:W.surface, border:`1px solid ${W.border}` }}></span>
                Neutral / non-comparable
              </span>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6 }}>
                <span style={{ color:W.green, fontWeight:800, fontSize:13 }}>✓</span>/
                <span style={{ color:W.red, fontWeight:800, fontSize:13 }}>✗</span>
                Favourable / unfavourable clause
              </span>
            </div>
          </>
        )}
      </div>

      {/* Export modal */}
      {showExport && (
        <WModal title="Export Comparison Report" onClose={()=>setShowExport(false)} width={460}>
          <div style={{ fontSize:12, color:W.textMid, lineHeight:1.6, marginBottom:14 }}>
            Generate a formatted report covering all {rows.length} comparison rows across the {selected.length} selected contracts.
          </div>
          <div style={{ display:'grid', gap:8, marginBottom:18 }}>
            {[
              { fmt:'PDF', desc:'Formatted report with charts and full clause excerpts', size:'~280 KB' },
              { fmt:'XLSX', desc:'Spreadsheet with one row per term, one column per contract', size:'~45 KB' },
              { fmt:'DOCX', desc:'Editable document for sharing with stakeholders', size:'~120 KB' },
            ].map(f => (
              <label key={f.fmt} style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                border:`1px solid ${W.border}`, borderRadius:5, cursor:'pointer',
              }}
                onMouseEnter={e=>e.currentTarget.style.borderColor=W.accent}
                onMouseLeave={e=>e.currentTarget.style.borderColor=W.border}
              >
                <input type="radio" name="exfmt" defaultChecked={f.fmt==='PDF'} style={{ accentColor:W.accent }} />
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:12, fontWeight:700, color:W.text }}>{f.fmt}</div>
                  <div style={{ fontSize:11, color:W.textSoft, marginTop:1 }}>{f.desc}</div>
                </div>
                <span style={{ fontSize:10, color:W.textMute, fontFamily:"'IBM Plex Mono',monospace" }}>{f.size}</span>
              </label>
            ))}
          </div>
          <div style={{ display:'flex', gap:7, justifyContent:'flex-end' }}>
            <WBtn variant="secondary" small onClick={()=>setShowExport(false)}>Cancel</WBtn>
            <WBtn small onClick={()=>setShowExport(false)}>Generate Report</WBtn>
          </div>
        </WModal>
      )}
    </PageShell>
  );
}

Object.assign(window, { CompareScreen4 });
