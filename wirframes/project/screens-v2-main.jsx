
// v2 Dashboard (card grid) + Contract Detail (dark, rich)

const { useState } = React;

// ─── Dashboard v2 ────────────────────────────────────────────────
function DashboardV2({ onSelect, onUpload }) {
  const { CONTRACTS } = window.APP_DATA;
  const [search, setSearch]       = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy]       = useState('riskScore');
  const [view, setView]           = useState('grid'); // 'grid' | 'list'

  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const avgRisk  = (complete.reduce((s,c) => s + c.riskScore, 0) / complete.length).toFixed(1);
  const urgent   = complete.filter(c => c.riskScore >= 7).length;

  const filtered = CONTRACTS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.parties.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRisk === 'high' && c.riskScore < 7) return false;
    if (filterRisk === 'medium' && (c.riskScore < 4 || c.riskScore >= 7)) return false;
    if (filterRisk === 'low' && c.riskScore >= 4) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
    if (sortBy === 'date')      return new Date(b.uploadDate) - new Date(a.uploadDate);
    if (sortBy === 'flags')     return (b.flags.red + b.flags.orange) - (a.flags.red + a.flags.orange);
    return a.name.localeCompare(b.name);
  });

  const pillBtn = (val, cur, set, label) => (
    <button key={val} onClick={() => set(val)} style={{
      padding: '5px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600,
      border: `1px solid ${cur === val ? D.accent : D.border}`,
      background: cur === val ? D.accentGlow : 'transparent',
      color: cur === val ? D.accent : D.textSoft, cursor: 'pointer',
    }}>{label}</button>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: D.bg, overflow: 'auto' }}>
      {/* Top bar */}
      <div style={{
        padding: '16px 24px', background: D.bg2, borderBottom: `1px solid ${D.border}`,
        display: 'flex', gap: 12, alignItems: 'center',
      }}>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: D.text }}>Contracts</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: D.textSoft }}>{filtered.length} contracts · {urgent} high risk</p>
        </div>
        {/* Quick stats */}
        <div style={{ display: 'flex', gap: 8 }}>
          {[
            { label: 'Total', val: CONTRACTS.length, color: D.text },
            { label: 'Avg Risk', val: avgRisk, color: dRiskColor(parseFloat(avgRisk)) },
            { label: 'Urgent', val: urgent, color: D.red },
          ].map(s => (
            <div key={s.label} style={{
              background: D.surface, border: `1px solid ${D.border}`,
              borderRadius: 8, padding: '8px 14px', textAlign: 'center', minWidth: 64,
            }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 10, color: D.textMute, marginTop: 3, textTransform: 'uppercase', fontWeight: 600 }}>{s.label}</div>
            </div>
          ))}
        </div>
        <DBtn onClick={onUpload}>+ Upload</DBtn>
      </div>

      {/* Filter bar */}
      <div style={{
        padding: '10px 24px', background: D.bg2, borderBottom: `1px solid ${D.border}`,
        display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap',
      }}>
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contracts…"
          style={{
            width: 220, background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: 6, padding: '6px 10px', fontSize: 12, color: D.text,
          }} />
        <div style={{ display: 'flex', gap: 4 }}>
          {pillBtn('all','all' === filterRisk, setFilterRisk, 'All Risk')}
          {pillBtn('high', filterRisk, setFilterRisk, '🔴 High')}
          {pillBtn('medium', filterRisk, setFilterRisk, '🟠 Med')}
          {pillBtn('low', filterRisk, setFilterRisk, '🟢 Low')}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          {['all','vendor','license','partnership','customer','nda'].map(t =>
            pillBtn(t, filterType, setFilterType, t === 'all' ? 'All Types' : t.charAt(0).toUpperCase() + t.slice(1))
          )}
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6, alignItems: 'center' }}>
          <select value={sortBy} onChange={e => setSortBy(e.target.value)} style={{
            background: D.surface, border: `1px solid ${D.border}`,
            borderRadius: 6, padding: '5px 8px', fontSize: 12, color: D.textMid, cursor: 'pointer',
          }}>
            <option value="riskScore">Sort: Risk</option>
            <option value="date">Sort: Date</option>
            <option value="flags">Sort: Flags</option>
            <option value="name">Sort: Name</option>
          </select>
          {['grid','list'].map(v => (
            <button key={v} onClick={() => setView(v)} style={{
              width: 30, height: 30, borderRadius: 6, border: `1px solid ${D.border}`,
              background: view === v ? D.accentGlow : 'transparent',
              color: view === v ? D.accent : D.textSoft, cursor: 'pointer', fontSize: 14,
            }}>{v === 'grid' ? '⊞' : '≡'}</button>
          ))}
        </div>
      </div>

      {/* Cards / List */}
      <div style={{ padding: '20px 24px', flex: 1 }}>
        {view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {filtered.map(c => (
              <ContractCard key={c.id} contract={c}
                onClick={() => c.status === 'complete' && onSelect(c.id)} />
            ))}
          </div>
        ) : (
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: D.surface2, borderBottom: `1px solid ${D.border}` }}>
                  {['Contract', 'Type', 'Risk', 'Flags', 'Counterparty', 'Date'].map(h => (
                    <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: D.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => (
                  <tr key={c.id} onClick={() => c.status === 'complete' && onSelect(c.id)}
                    style={{ borderBottom: `1px solid ${D.border}`, cursor: c.status === 'complete' ? 'pointer' : 'default' }}
                    onMouseEnter={e => { if (c.status === 'complete') e.currentTarget.style.background = D.surface2; }}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '10px 14px', fontWeight: 600, color: D.text, maxWidth: 220 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: {vendor:'#818cf8',license:'#38bdf8',partnership:'#2dd4bf',customer:'#f472b6',lease:'#fb923c',nda:'#94a3b8'}[c.type] || D.textMid, textTransform: 'capitalize' }}>{c.type}</span>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {c.status === 'complete' ? (
                        <span style={{ color: dRiskColor(c.riskScore), fontWeight: 800, fontFamily: "'IBM Plex Mono',monospace" }}>{c.riskScore.toFixed(1)}</span>
                      ) : <span style={{ color: D.textMute }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        {c.flags.red > 0 && <span style={{ color: D.red, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>●{c.flags.red}</span>}
                        {c.flags.orange > 0 && <span style={{ color: D.orange, fontWeight: 700, fontFamily: "'IBM Plex Mono',monospace" }}>●{c.flags.orange}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '10px 14px', color: D.textMid, fontSize: 12 }}>{c.parties[0]}</td>
                    <td style={{ padding: '10px 14px', color: D.textSoft, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>{c.uploadDate}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Contract Detail v2 ───────────────────────────────────────────
function ContractDetailV2({ contractId, onBack, onNav }) {
  const { CONTRACTS } = window.APP_DATA;
  const [tab, setTab] = useState('overview');
  const [expandedFlag, setExpandedFlag] = useState(null);
  const [resolvedFlags, setResolvedFlags] = useState([]);
  const [dismissedFlags, setDismissedFlags] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([{ id:1, author:'Sarah Chen', date:'2026-04-11', text:'Check if liability cap is negotiable before next review.', resolved:false }]);

  const idx = CONTRACTS.findIndex(c => c.id === contractId);
  const c = CONTRACTS[idx];
  if (!c) return null;
  const prev = CONTRACTS[idx - 1];
  const next = CONTRACTS[idx + 1];
  const color = dRiskColor(c.riskScore);
  const tabDefs = [
    { id:'overview',  label:'Overview'  },
    { id:'risks',     label:`Risk Flags (${c.flags.red + c.flags.orange})` },
    { id:'document',  label:'Document'  },
    { id:'history',   label:'History'   },
  ];

  function MetaRow({ label, value }) {
    return (
      <div style={{ display:'flex', justifyContent:'space-between', padding:'8px 0', borderBottom:`1px solid ${D.border}` }}>
        <span style={{ fontSize:12, color:D.textSoft }}>{label}</span>
        <span style={{ fontSize:12, fontWeight:600, color:D.text, textAlign:'right', maxWidth:200 }}>{value || '—'}</span>
      </div>
    );
  }

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:D.bg, overflow:'auto' }}>
      {/* Breadcrumb */}
      <div style={{ padding:'10px 24px', background:D.bg2, borderBottom:`1px solid ${D.border}`, display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:D.accent, fontWeight:600, padding:0, fontSize:12 }}>← Contracts</button>
        <span style={{ color:D.textMute }}>/</span>
        <span style={{ color:D.textMid, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:300 }}>{c.name}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {prev && <button onClick={() => onNav(prev.id)} style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:4, cursor:'pointer', color:D.textMid, fontSize:11, padding:'3px 8px' }}>← Prev</button>}
          {next && <button onClick={() => onNav(next.id)} style={{ background:'none', border:`1px solid ${D.border}`, borderRadius:4, cursor:'pointer', color:D.textMid, fontSize:11, padding:'3px 8px' }}>Next →</button>}
        </div>
      </div>

      {/* Hero risk bar */}
      <div style={{
        padding:'20px 24px', background:`linear-gradient(180deg, ${D.bg2} 0%, ${D.bg} 100%)`,
        borderBottom:`1px solid ${D.border}`,
        display:'flex', alignItems:'center', gap:24, flexWrap:'wrap',
      }}>
        <div style={{ display:'flex', alignItems:'center', gap:16 }}>
          <RiskGauge score={c.riskScore} size={88} />
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:D.textSoft, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4 }}>Overall Risk Score</div>
            <div style={{ fontSize:13, fontWeight:700, color, background:dRiskGlow(c.riskScore), border:`1px solid ${color}33`, borderRadius:5, padding:'4px 12px', display:'inline-block' }}>
              {c.riskScore >= 7 ? 'HIGH RISK' : c.riskScore >= 4 ? 'MEDIUM RISK' : 'LOW RISK'}
            </div>
          </div>
        </div>
        <div style={{ width:1, height:52, background:D.border }}></div>
        {/* Flag breakdown */}
        <div style={{ display:'flex', gap:16 }}>
          {[
            { count:c.flags.red,    color:D.red,    label:'High' },
            { count:c.flags.orange, color:D.orange, label:'Medium' },
            { count:c.flags.green,  color:D.green,  label:'Low' },
          ].map(f => (
            <div key={f.label} style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:800, color:f.color, fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{f.count}</div>
              <div style={{ fontSize:10, color:D.textMute, marginTop:3, textTransform:'uppercase', fontWeight:600 }}>{f.label}</div>
            </div>
          ))}
        </div>
        <div style={{ width:1, height:52, background:D.border }}></div>
        {/* Key meta */}
        <div style={{ display:'flex', gap:20 }}>
          {[
            { label:'Counterparty', val:c.parties[0] },
            { label:'Termination',  val:c.terminationDate || '—' },
            { label:'Value',        val:c.paymentAmount || '—' },
          ].map(m => (
            <div key={m.label}>
              <div style={{ fontSize:10, color:D.textMute, textTransform:'uppercase', fontWeight:700, letterSpacing:'0.06em', marginBottom:3 }}>{m.label}</div>
              <div style={{ fontSize:13, fontWeight:600, color:D.text }}>{m.val}</div>
            </div>
          ))}
        </div>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          <DBtn variant="secondary" small>Export</DBtn>
          <DBtn variant="success" small>Approve</DBtn>
        </div>
      </div>

      <DTabs tabs={tabDefs} active={tab} onChange={setTab} />

      {/* Content */}
      <div style={{ flex:1, overflow:'auto', padding:'24px' }}>

        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16, maxWidth:1000 }}>
            {[
              { title:'Parties', rows:[['Vendor', c.parties[0]], ['Buyer', c.parties[1]]] },
              { title:'Key Dates', rows:[['Effective', c.effectiveDate], ['Termination', c.terminationDate], ['Notice Period', c.noticePeriod], ['Auto-Renewal', c.autoRenewal]] },
              { title:'Financial Terms', rows:[['Amount', c.paymentAmount], ['Currency', c.currency], ['Schedule', c.paymentSchedule], ['Escalation', c.priceEscalation], ['Payment Terms', c.paymentTerms]] },
            ].map(section => (
              <div key={section.title} style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'16px 18px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:D.textSoft, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:10 }}>{section.title}</div>
                {section.rows.map(([k,v]) => <MetaRow key={k} label={k} value={v} />)}
              </div>
            ))}

            {/* Notes */}
            <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'16px 18px', gridColumn:'1/-1' }}>
              <div style={{ fontSize:10, fontWeight:700, color:D.textSoft, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:12 }}>Notes</div>
              <div style={{ marginBottom:12 }}>
                {notes.map(n => (
                  <div key={n.id} style={{ padding:'10px 12px', background:D.surface2, border:`1px solid ${D.border}`, borderRadius:6, marginBottom:8 }}>
                    <div style={{ fontSize:11, color:D.textSoft, marginBottom:4 }}>
                      <strong style={{ color:D.textMid }}>{n.author}</strong> · {n.date}
                      {n.resolved && <span style={{ color:D.green, marginLeft:8 }}>✓ Resolved</span>}
                    </div>
                    <div style={{ fontSize:13, color:D.text }}>{n.text}</div>
                    {!n.resolved && (
                      <button onClick={() => setNotes(ns => ns.map(x => x.id===n.id ? {...x,resolved:true} : x))}
                        style={{ marginTop:6, background:'none', border:'none', cursor:'pointer', fontSize:11, color:D.green, fontWeight:600, padding:0 }}>
                        Mark resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Add a note…"
                  style={{ flex:1, background:D.surface2, border:`1px solid ${D.border}`, borderRadius:6, padding:'7px 10px', fontSize:12, color:D.text }} />
                <DBtn small onClick={() => { if (noteInput.trim()) { setNotes(ns => [...ns, {id:Date.now(), author:'James Whitfield', date:'2026-04-27', text:noteInput, resolved:false}]); setNoteInput(''); } }}>Add</DBtn>
              </div>
            </div>
          </div>
        )}

        {/* ── RISKS ── */}
        {tab === 'risks' && (
          <div style={{ maxWidth:760 }}>
            {c.riskFlags.filter(f => !dismissedFlags.includes(f.id)).map(f => {
              const isResolved = resolvedFlags.includes(f.id);
              const isExpanded = expandedFlag === f.id;
              const fc = dSevColor(f.severity);
              return (
                <div key={f.id} style={{
                  background:D.surface, border:`1px solid ${isResolved ? D.border : fc + '33'}`,
                  borderLeft:`3px solid ${isResolved ? D.border : fc}`,
                  borderRadius:8, marginBottom:10, overflow:'hidden',
                  opacity:isResolved ? 0.6 : 1,
                }}>
                  <div style={{ padding:'12px 16px', cursor:'pointer', display:'flex', alignItems:'center', gap:10 }}
                    onClick={() => setExpandedFlag(isExpanded ? null : f.id)}>
                    <div style={{
                      width:8, height:8, borderRadius:'50%', background:fc, flexShrink:0,
                      boxShadow:`0 0 6px ${fc}`,
                    }}></div>
                    <span style={{ flex:1, fontWeight:600, fontSize:14, color:D.text }}>{f.title}</span>
                    {isResolved && <span style={{ fontSize:11, color:D.green, fontWeight:600 }}>✓ Resolved</span>}
                    <span style={{ fontSize:11, color:D.textMute }}>Pg {f.page} §{f.section}</span>
                    <span style={{ color:D.textMute, fontSize:12 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ padding:'0 16px 14px', borderTop:`1px solid ${D.border}` }}>
                      <p style={{ fontSize:13, color:D.textMid, lineHeight:1.6, margin:'12px 0 8px' }}>{f.description}</p>
                      <div style={{ fontSize:12, color:D.text, background:D.surface2, padding:'9px 12px', borderRadius:6, marginBottom:12, lineHeight:1.6 }}>
                        <span style={{ color:D.accent, fontWeight:700 }}>Rec: </span>{f.recommendation}
                      </div>
                      <div style={{ display:'flex', gap:8 }}>
                        <DBtn small variant="success" onClick={() => setResolvedFlags(rs => rs.includes(f.id) ? rs.filter(x=>x!==f.id) : [...rs,f.id])}>
                          {isResolved ? 'Undo' : '✓ Resolve'}
                        </DBtn>
                        <DBtn small variant="danger" onClick={() => setDismissedFlags(ds => [...ds,f.id])}>Dismiss</DBtn>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DOCUMENT ── */}
        {tab === 'document' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:16, maxWidth:1000 }}>
            {/* PDF mock */}
            <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, overflow:'hidden' }}>
              <div style={{ padding:'10px 14px', background:D.surface2, borderBottom:`1px solid ${D.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                <span style={{ fontSize:12, fontWeight:600, color:D.textMid }}>📄 {c.name}</span>
                <div style={{ display:'flex', gap:6 }}>
                  {['−','100%','+'].map(v => (
                    <button key={v} style={{ background:D.surface3, border:`1px solid ${D.border}`, borderRadius:4, padding:'3px 8px', fontSize:11, color:D.textMid, cursor:'pointer' }}>{v}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding:24, fontFamily:'Georgia, serif', fontSize:12, lineHeight:1.8, color:'#cdd5e0', minHeight:420, background:'#0d1520' }}>
                <div style={{ fontWeight:700, textAlign:'center', marginBottom:20, fontSize:14, color:'#e2e8f0', textTransform:'uppercase', letterSpacing:'0.1em' }}>Vendor Agreement</div>
                <p>This Agreement is entered into as of <strong style={{color:'#e2e8f0'}}>{c.effectiveDate}</strong>, between <strong style={{color:'#e2e8f0'}}>{c.parties[0]}</strong> ("Vendor") and <strong style={{color:'#e2e8f0'}}>{c.parties[1]}</strong> ("Buyer").</p>
                <p style={{ marginTop:14 }}><strong style={{color:'#e2e8f0'}}>5. PAYMENT</strong><br/>Buyer agrees to pay {c.paymentAmount} on a {c.paymentSchedule} basis under terms of {c.paymentTerms}.</p>
                <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(251,146,60,0.08)', border:'1px solid rgba(251,146,60,0.3)', borderRadius:5 }}>
                  <strong style={{color:D.orange}}>7. LIABILITY</strong><br/>
                  <span style={{ background:'rgba(251,146,60,0.15)', padding:'1px 3px', borderRadius:2 }}>Vendor's liability hereunder shall not be limited in any manner whatsoever, and Buyer acknowledges that Vendor may face unlimited exposure...</span>
                </div>
                <div style={{ marginTop:14, padding:'10px 12px', background:'rgba(244,63,94,0.08)', border:'1px solid rgba(244,63,94,0.3)', borderRadius:5 }}>
                  <strong style={{color:D.red}}>10. INDEMNIFICATION</strong><br/>
                  <span style={{ background:'rgba(244,63,94,0.15)', padding:'1px 3px', borderRadius:2 }}>Buyer shall indemnify and hold harmless Vendor from any IP infringement claims. Vendor shall only indemnify Buyer for its own gross negligence...</span>
                </div>
                <p style={{ marginTop:14, color:'#475569', fontStyle:'italic' }}>[Pages 3–8 continue…]</p>
              </div>
              <div style={{ padding:'8px 14px', borderTop:`1px solid ${D.border}`, display:'flex', justifyContent:'center', gap:8 }}>
                <DBtn small variant="secondary">← Prev</DBtn>
                <span style={{ fontSize:12, color:D.textSoft, padding:'5px 8px' }}>Page 1 of 8</span>
                <DBtn small variant="secondary">Next →</DBtn>
              </div>
            </div>

            {/* Clause panel */}
            <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
              <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, overflow:'hidden' }}>
                <div style={{ padding:'12px 14px', borderBottom:`1px solid ${D.border}`, background:D.surface2 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:D.textSoft, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:3 }}>Selected Clause</div>
                  <div style={{ fontSize:13, fontWeight:700, color:D.text }}>§7.2 — Liability</div>
                </div>
                <div style={{ padding:14 }}>
                  <div style={{ fontSize:12, lineHeight:1.7, color:D.textMid, fontStyle:'italic', borderLeft:`2px solid ${D.orange}`, paddingLeft:10, marginBottom:12 }}>
                    "Vendor's liability hereunder shall not be limited in any manner whatsoever…"
                  </div>
                  <div style={{ display:'inline-flex', alignItems:'center', gap:6, background:D.redGlow, border:`1px solid ${D.red}33`, borderRadius:5, padding:'4px 10px', marginBottom:10 }}>
                    <span style={{ width:6, height:6, borderRadius:'50%', background:D.red, boxShadow:`0 0 6px ${D.red}` }}></span>
                    <span style={{ fontSize:11, fontWeight:700, color:D.red }}>HIGH — Unlimited Liability</span>
                  </div>
                  <div style={{ fontSize:11, color:D.textMute, marginBottom:8, fontWeight:600, textTransform:'uppercase', letterSpacing:'0.05em' }}>Recommendation</div>
                  <div style={{ fontSize:12, color:D.textMid, background:D.surface2, padding:'8px 10px', borderRadius:6, marginBottom:12 }}>
                    Negotiate to add: "Vendor liability shall not exceed two times the annual contract value."
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    <DBtn small variant="secondary" ex={{ flex:1, justifyContent:'center' }}>Copy</DBtn>
                    <DBtn small variant="primary" ex={{ flex:1, justifyContent:'center' }} onClick={() => setTab('risks')}>Flag →</DBtn>
                  </div>
                </div>
              </div>

              {/* Risk legend */}
              <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, fontWeight:700, color:D.textSoft, textTransform:'uppercase', marginBottom:8 }}>Highlights</div>
                {[{c:D.red,l:'High Risk'},{c:D.orange,l:'Medium Risk'},{c:D.yellow,l:'Info'}].map(({c,l}) => (
                  <div key={l} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:5 }}>
                    <div style={{ width:10, height:10, borderRadius:2, background:c, boxShadow:`0 0 6px ${c}` }}></div>
                    <span style={{ fontSize:12, color:D.textMid }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div style={{ maxWidth:680 }}>
            {[
              { time:'2026-04-10 09:14', user:'James Whitfield', action:'Contract Uploaded', detail:c.name, color:D.accent },
              { time:'2026-04-10 09:15', user:'Claude API (claude-opus-4-5)', action:'Analysis Complete', detail:`Risk score ${c.riskScore}/10 · ${c.riskFlags.length} flags`, color:D.green },
              { time:'2026-04-11 14:22', user:'Sarah Chen', action:'Note Added', detail:'Check if liability cap is negotiable before next review.', color:D.textMid },
              { time:'2026-04-14 10:05', user:'Sarah Chen', action:'Flag Viewed', detail:'Unlimited Liability (Red Flag)', color:D.orange },
            ].map((e,i) => (
              <div key={i} style={{ display:'flex', gap:14, marginBottom:14, paddingBottom:14, borderBottom:`1px solid ${D.border}` }}>
                <div style={{ width:32, height:32, borderRadius:'50%', background:e.color+'18', color:e.color, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, flexShrink:0, marginTop:2 }}>◆</div>
                <div style={{ flex:1 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:3 }}>
                    <span style={{ fontWeight:600, fontSize:13, color:D.text }}>{e.action}</span>
                    <span style={{ fontSize:11, color:D.textSoft, fontFamily:"'IBM Plex Mono',monospace" }}>{e.time}</span>
                  </div>
                  <div style={{ fontSize:12, color:D.textSoft }}>{e.user}</div>
                  <div style={{ fontSize:12, color:D.textMid, marginTop:4, background:D.surface2, padding:'4px 8px', borderRadius:4 }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { DashboardV2, ContractDetailV2 });
