
// v4 — Contracts list + Contract detail

const { useState } = React;

// ─── Contracts Screen ─────────────────────────────────────────────
function ContractsScreen({ onSelect, onUpload }) {
  const { CONTRACTS } = window.APP_DATA;
  const [search, setSearch]       = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [sortBy, setSortBy]       = useState('riskScore');
  const [page, setPage]           = useState(1);
  const PER = 8;

  const filtered = CONTRACTS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.parties.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRisk==='high'   && c.riskScore < 7) return false;
    if (filterRisk==='medium' && (c.riskScore<4||c.riskScore>=7)) return false;
    if (filterRisk==='low'    && c.riskScore >= 4) return false;
    if (filterType!=='all' && c.type!==filterType) return false;
    return true;
  }).sort((a,b) => {
    if (sortBy==='riskScore') return b.riskScore - a.riskScore;
    if (sortBy==='date')      return new Date(b.uploadDate)-new Date(a.uploadDate);
    if (sortBy==='flags')     return (b.flags.red+b.flags.orange)-(a.flags.red+a.flags.orange);
    return a.name.localeCompare(b.name);
  });

  const pages = Math.ceil(filtered.length/PER);
  const paged = filtered.slice((page-1)*PER, page*PER);

  const sel = (lbl, opts, val, set) => (
    <select value={val} onChange={e=>{set(e.target.value);setPage(1);}} style={{
      background:W.surface, border:`1px solid ${W.border2}`, borderRadius:5,
      padding:'5px 8px', fontSize:12, color:W.textMid, cursor:'pointer',
    }}>{opts}</select>
  );

  return (
    <PageShell title="Contracts"
      subtitle={`${filtered.length} contracts`}
      actions={<WBtn onClick={onUpload}>+ Upload</WBtn>}
    >
      {/* Filter strip */}
      <div style={{ padding:'10px 28px', background:W.surface, borderBottom:`1px solid ${W.border}`, display:'flex', gap:8, flexWrap:'wrap', alignItems:'center' }}>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(1);}}
          placeholder="Search by name, party…"
          style={{ flex:1, minWidth:200, background:W.bg, border:`1px solid ${W.border2}`, borderRadius:5, padding:'5px 10px', fontSize:12, color:W.text }} />
        {sel(filterRisk, <><option value="all">All Risk</option><option value="high">High (7+)</option><option value="medium">Medium (4–7)</option><option value="low">Low (&lt;4)</option></>, filterRisk, setFilterRisk)}
        {sel(filterType, <><option value="all">All Types</option><option value="vendor">Vendor</option><option value="license">License</option><option value="partnership">Partnership</option><option value="customer">Customer</option><option value="lease">Lease</option><option value="nda">NDA</option></>, filterType, setFilterType)}
        {sel(sortBy, <><option value="riskScore">Sort: Risk</option><option value="date">Sort: Date</option><option value="flags">Sort: Flags</option><option value="name">Sort: Name</option></>, sortBy, setSortBy)}
      </div>

      {/* Table */}
      <div style={{ padding:'20px 28px' }}>
        <div style={{ background:W.surface, border:`1px solid ${W.border}`, borderRadius:6, overflow:'hidden' }}>
          <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
            <thead>
              <tr style={{ background:W.bg, borderBottom:`1px solid ${W.border}` }}>
                {['Contract','Type','Risk Score','Flags','Counterparty','Expiry','Uploaded','Status'].map(h => (
                  <th key={h} style={{ padding:'9px 14px', textAlign:'left', fontSize:10, fontWeight:700, color:W.textSoft, textTransform:'uppercase', letterSpacing:'0.06em', whiteSpace:'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c,i) => (
                <tr key={c.id}
                  onClick={() => c.status==='complete' && onSelect(c.id)}
                  style={{ borderBottom:`1px solid ${W.border}`, cursor:c.status==='complete'?'pointer':'default', background: i%2===1 ? W.bg : W.surface }}
                  onMouseEnter={e => { if (c.status==='complete') e.currentTarget.style.background=W.accentBg; }}
                  onMouseLeave={e => e.currentTarget.style.background = i%2===1?W.bg:W.surface}
                >
                  <td style={{ padding:'10px 14px', maxWidth:240 }}>
                    <div style={{ fontWeight:600, color:W.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.name}</div>
                  </td>
                  <td style={{ padding:'10px 14px' }}><WTypePill type={c.type} /></td>
                  <td style={{ padding:'10px 14px' }}>
                    {c.status==='complete' ? <RiskBar score={c.riskScore} /> : <span style={{ color:W.textMute, fontSize:12 }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    {c.status==='complete' ? <WFlags flags={c.flags} /> : <span style={{ color:W.textMute }}>—</span>}
                  </td>
                  <td style={{ padding:'10px 14px', color:W.textMid, fontSize:12, maxWidth:160 }}>
                    <div style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.parties[0]}</div>
                  </td>
                  <td style={{ padding:'10px 14px', color:W.textSoft, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", whiteSpace:'nowrap' }}>
                    {c.terminationDate || '—'}
                  </td>
                  <td style={{ padding:'10px 14px', color:W.textSoft, fontSize:11, fontFamily:"'IBM Plex Mono',monospace", whiteSpace:'nowrap' }}>
                    {c.uploadDate}
                  </td>
                  <td style={{ padding:'10px 14px' }}>
                    {c.status==='complete' && <span style={{ background:W.greenBg, color:W.green, fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 7px' }}>Complete</span>}
                    {c.status==='processing' && (
                      <span style={{ background:W.accentBg, color:W.accent, fontSize:11, fontWeight:600, borderRadius:4, padding:'2px 7px', display:'inline-flex', alignItems:'center', gap:4 }}>
                        <span style={{ width:5, height:5, borderRadius:'50%', background:W.accent, animation:'pulse 1.2s infinite' }}></span>
                        {c.progress}%
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filtered.length===0 && (
            <div style={{ padding:'48px', textAlign:'center', color:W.textMute, fontSize:13 }}>No contracts match your filters.</div>
          )}
        </div>

        {/* Pagination */}
        {pages > 1 && (
          <div style={{ display:'flex', justifyContent:'center', gap:4, marginTop:14 }}>
            {Array.from({length:pages},(_,i)=>(
              <button key={i} onClick={()=>setPage(i+1)} style={{
                width:28, height:28, borderRadius:4, border:`1px solid ${W.border}`,
                background:page===i+1?W.accent:W.surface, color:page===i+1?'#fff':W.textMid,
                cursor:'pointer', fontSize:12, fontWeight:600,
              }}>{i+1}</button>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}

// ─── Contract Detail ──────────────────────────────────────────────
function ContractDetailScreen4({ contractId, onBack, onNav }) {
  const { CONTRACTS } = window.APP_DATA;
  const [tab, setTab] = useState('overview');
  const [expandedFlag, setExpandedFlag] = useState(null);
  const [resolvedFlags, setResolvedFlags] = useState([]);
  const [dismissedFlags, setDismissedFlags] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([{ id:1, author:'Sarah Chen', date:'2026-04-11', text:'Check if liability cap is negotiable before next review.', resolved:false }]);

  const idx = CONTRACTS.findIndex(c => c.id===contractId);
  const c = CONTRACTS[idx];
  if (!c) return null;
  const prev = CONTRACTS[idx-1];
  const next = CONTRACTS[idx+1];

  const tabDefs = [
    { id:'overview', label:'Overview'  },
    { id:'risks',    label:`Risk Flags (${c.flags.red+c.flags.orange+c.flags.green})` },
    { id:'document', label:'Document'  },
    { id:'history',  label:'History'   },
  ];

  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:W.bg, overflow:'auto' }}>
      {/* Breadcrumb */}
      <div style={{ padding:'10px 28px', background:W.surface, borderBottom:`1px solid ${W.border}`, display:'flex', alignItems:'center', gap:8, fontSize:12 }}>
        <button onClick={onBack} style={{ background:'none', border:'none', cursor:'pointer', color:W.accent, fontWeight:600, padding:0, fontSize:12 }}>Contracts</button>
        <span style={{ color:W.textMute }}>/</span>
        <span style={{ color:W.textMid, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', maxWidth:320 }}>{c.name}</span>
        <div style={{ marginLeft:'auto', display:'flex', gap:6 }}>
          {prev && <WBtn small variant="secondary" onClick={()=>onNav(prev.id)}>← Prev</WBtn>}
          {next && <WBtn small variant="secondary" onClick={()=>onNav(next.id)}>Next →</WBtn>}
          <WBtn small variant="secondary">Export</WBtn>
          <WBtn small variant="success">Approve</WBtn>
        </div>
      </div>

      {/* Main layout: content + sidebar */}
      <div style={{ display:'flex', flex:1, overflow:'hidden', minHeight:0 }}>
        {/* Left: tabs */}
        <div style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden', borderRight:`1px solid ${W.border}` }}>
          <WTabs tabs={tabDefs} active={tab} onChange={setTab} />
          <div style={{ flex:1, overflow:'auto', padding:'24px 28px' }}>

            {/* OVERVIEW */}
            {tab==='overview' && (
              <div style={{ maxWidth:580 }}>
                {[
                  { title:'Parties', rows:[['Vendor / Provider', c.parties[0]], ['Buyer / Client', c.parties[1]]] },
                  { title:'Key Dates', rows:[['Effective Date', c.effectiveDate], ['Termination Date', c.terminationDate], ['Notice Period', c.noticePeriod], ['Auto-Renewal', c.autoRenewal]] },
                  { title:'Financial Terms', rows:[['Payment Amount', c.paymentAmount], ['Currency', c.currency], ['Schedule', c.paymentSchedule], ['Price Escalation', c.priceEscalation], ['Payment Terms', c.paymentTerms]] },
                ].map(sec => (
                  <div key={sec.title} style={{ marginBottom:24 }}>
                    <div style={{ fontSize:10, fontWeight:700, color:W.textMute, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, paddingBottom:6, borderBottom:`1px solid ${W.border}` }}>{sec.title}</div>
                    {sec.rows.map(([k,v]) => (
                      <div key={k} style={{ display:'flex', padding:'8px 0', borderBottom:`1px solid ${W.border}` }}>
                        <span style={{ width:170, flexShrink:0, fontSize:12, color:W.textSoft }}>{k}</span>
                        <span style={{ fontSize:12, fontWeight:500, color:W.text }}>{v||'—'}</span>
                      </div>
                    ))}
                  </div>
                ))}
                {/* Notes */}
                <div>
                  <div style={{ fontSize:10, fontWeight:700, color:W.textMute, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:4, paddingBottom:6, borderBottom:`1px solid ${W.border}` }}>Notes</div>
                  {notes.map(n => (
                    <div key={n.id} style={{ padding:'10px 0', borderBottom:`1px solid ${W.border}` }}>
                      <div style={{ fontSize:11, color:W.textSoft, marginBottom:4 }}>
                        <strong style={{ color:W.textMid }}>{n.author}</strong> · {n.date}
                        {n.resolved && <span style={{ color:W.green, marginLeft:8 }}>✓ Resolved</span>}
                      </div>
                      <div style={{ fontSize:13, color:W.textMid, lineHeight:1.5 }}>{n.text}</div>
                      {!n.resolved && <button onClick={()=>setNotes(ns=>ns.map(x=>x.id===n.id?{...x,resolved:true}:x))} style={{ marginTop:4, background:'none', border:'none', cursor:'pointer', fontSize:11, color:W.green, fontWeight:600, padding:0 }}>Mark resolved</button>}
                    </div>
                  ))}
                  <div style={{ display:'flex', gap:7, paddingTop:12 }}>
                    <input value={noteInput} onChange={e=>setNoteInput(e.target.value)} placeholder="Add a note…"
                      style={{ flex:1, background:W.bg, border:`1px solid ${W.border2}`, borderRadius:5, padding:'6px 10px', fontSize:12, color:W.text }} />
                    <WBtn small onClick={()=>{ if(noteInput.trim()){setNotes(ns=>[...ns,{id:Date.now(),author:'James Whitfield',date:'2026-04-27',text:noteInput,resolved:false}]);setNoteInput('');} }}>Add</WBtn>
                  </div>
                </div>
              </div>
            )}

            {/* RISKS */}
            {tab==='risks' && (
              <div style={{ maxWidth:680 }}>
                <div style={{ padding:'8px 12px', background:W.bg, border:`1px solid ${W.border}`, borderRadius:5, marginBottom:16, fontSize:12, color:W.textMid }}>
                  <strong style={{ color:W.text }}>{c.riskFlags.filter(f=>!dismissedFlags.includes(f.id)).length}</strong> flags ·{' '}
                  <span style={{ color:W.red }}>{c.flags.red} high</span> ·{' '}
                  <span style={{ color:W.orange }}>{c.flags.orange} medium</span> ·{' '}
                  <span style={{ color:W.green }}>{c.flags.green} informational</span>
                </div>
                {c.riskFlags.filter(f=>!dismissedFlags.includes(f.id)).map(f => {
                  const isResolved = resolvedFlags.includes(f.id);
                  const isExpanded = expandedFlag===f.id;
                  const fc = wSev(f.severity);
                  return (
                    <div key={f.id} style={{ borderBottom:`1px solid ${W.border}`, opacity:isResolved?0.5:1 }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10, padding:'11px 0', cursor:'pointer' }}
                        onClick={()=>setExpandedFlag(isExpanded?null:f.id)}>
                        <span style={{ width:7, height:7, borderRadius:'50%', background:fc, flexShrink:0 }}></span>
                        <span style={{ flex:1, fontSize:13, fontWeight:600, color:W.text }}>{f.title}</span>
                        {isResolved && <span style={{ fontSize:11, color:W.green, fontWeight:600 }}>✓ Resolved</span>}
                        <span style={{ fontSize:11, color:W.textMute }}>§{f.section}</span>
                        <span style={{ fontSize:11, color:W.textMute }}>{isExpanded?'▲':'▼'}</span>
                      </div>
                      {isExpanded && (
                        <div style={{ padding:'0 0 14px 17px' }}>
                          <p style={{ margin:'0 0 10px', fontSize:12, color:W.textMid, lineHeight:1.7 }}>{f.description}</p>
                          <div style={{ padding:'8px 12px', background:W.bg, border:`1px solid ${W.border}`, borderRadius:5, fontSize:12, color:W.textMid, marginBottom:12, lineHeight:1.6 }}>
                            <span style={{ fontWeight:600, color:W.accent }}>Recommendation: </span>{f.recommendation}
                          </div>
                          <div style={{ display:'flex', gap:7 }}>
                            <WBtn small variant="success" onClick={()=>setResolvedFlags(rs=>rs.includes(f.id)?rs.filter(x=>x!==f.id):[...rs,f.id])}>
                              {isResolved?'Undo':'✓ Resolve'}
                            </WBtn>
                            <WBtn small variant="ghost" onClick={()=>setDismissedFlags(ds=>[...ds,f.id])}>Dismiss</WBtn>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* DOCUMENT */}
            {tab==='document' && (
              <div style={{ display:'grid', gridTemplateColumns:'1fr 280px', gap:16, maxWidth:860 }}>
                <div style={{ background:W.surface, border:`1px solid ${W.border}`, borderRadius:6, overflow:'hidden' }}>
                  <div style={{ padding:'8px 14px', background:W.bg, borderBottom:`1px solid ${W.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:W.textSoft }}>📄 {c.name}</span>
                    <div style={{ display:'flex', gap:5 }}>{['−','100%','+'].map(x=><button key={x} style={{ background:W.surface, border:`1px solid ${W.border}`, borderRadius:3, padding:'2px 7px', fontSize:11, color:W.textSoft, cursor:'pointer' }}>{x}</button>)}</div>
                  </div>
                  <div style={{ padding:'24px', fontFamily:'Georgia, serif', fontSize:12, lineHeight:1.8, color:'#374151', background:'#fff', minHeight:380 }}>
                    <div style={{ fontWeight:700, textAlign:'center', fontSize:13, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:20 }}>Vendor Agreement</div>
                    <p>This Agreement is entered into as of <strong>{c.effectiveDate}</strong>, between <strong>{c.parties[0]}</strong> ("Vendor") and <strong>{c.parties[1]}</strong> ("Buyer").</p>
                    <p style={{marginTop:12}}><strong>5. PAYMENT</strong><br/>Buyer agrees to pay {c.paymentAmount} on a {c.paymentSchedule} basis under terms of {c.paymentTerms}.</p>
                    <div style={{ marginTop:12, padding:'9px 12px', background:'#fffbeb', border:'1px solid #fed7aa', borderRadius:4 }}>
                      <strong style={{color:W.orange}}>7. LIABILITY</strong><br/>
                      <span style={{background:'#fde68a', padding:'1px 2px', borderRadius:2}}>Vendor's liability hereunder shall not be limited in any manner whatsoever…</span>
                    </div>
                    <div style={{ marginTop:12, padding:'9px 12px', background:'#fef2f2', border:'1px solid #fecaca', borderRadius:4 }}>
                      <strong style={{color:W.red}}>10. INDEMNIFICATION</strong><br/>
                      <span style={{background:'#fca5a5', padding:'1px 2px', borderRadius:2}}>Buyer shall indemnify Vendor for any IP infringement. Vendor indemnifies Buyer only for gross negligence…</span>
                    </div>
                    <p style={{marginTop:12, color:'#9ca3af', fontStyle:'italic'}}>[Pages 3–8 continue…]</p>
                  </div>
                  <div style={{ padding:'7px 14px', borderTop:`1px solid ${W.border}`, display:'flex', justifyContent:'center', gap:6 }}>
                    <WBtn small variant="secondary">← Prev</WBtn>
                    <span style={{ fontSize:11, color:W.textSoft, padding:'4px 8px' }}>Page 1 of 8</span>
                    <WBtn small variant="secondary">Next →</WBtn>
                  </div>
                </div>
                <div style={{ background:W.surface, border:`1px solid ${W.border}`, borderRadius:6, padding:14 }}>
                  <div style={{ fontSize:10, fontWeight:700, color:W.textMute, textTransform:'uppercase', letterSpacing:'0.06em', marginBottom:8 }}>Selected Clause</div>
                  <div style={{ fontSize:13, fontWeight:600, color:W.text, marginBottom:8 }}>§7.2 — Liability</div>
                  <div style={{ fontSize:12, color:W.textMid, fontStyle:'italic', borderLeft:`2px solid ${W.orange}`, paddingLeft:8, marginBottom:10, lineHeight:1.6 }}>
                    "Vendor's liability hereunder shall not be limited in any manner whatsoever…"
                  </div>
                  <div style={{ fontSize:11, fontWeight:700, color:W.red, marginBottom:8 }}>● Unlimited Liability</div>
                  <div style={{ fontSize:11, color:W.textSoft, marginBottom:5, fontWeight:600, textTransform:'uppercase' }}>Recommendation</div>
                  <p style={{ fontSize:11, color:W.textMid, margin:'0 0 12px', lineHeight:1.6 }}>Add: "Vendor liability shall not exceed two times the annual contract value."</p>
                  <WBtn small variant="secondary" style={{width:'100%', justifyContent:'center'}}>Copy Clause</WBtn>
                </div>
              </div>
            )}

            {/* HISTORY */}
            {tab==='history' && (
              <div style={{ maxWidth:580 }}>
                {[
                  { time:'2026-04-10 09:14', user:'James Whitfield', action:'Contract uploaded', detail:c.name, color:W.accent },
                  { time:'2026-04-10 09:15', user:'Claude API (claude-opus-4-5)', action:'Analysis complete', detail:`Risk score ${c.riskScore}/10 · ${c.riskFlags.length} flags`, color:W.green },
                  { time:'2026-04-11 14:22', user:'Sarah Chen', action:'Note added', detail:'Check if liability cap is negotiable.', color:W.textSoft },
                  { time:'2026-04-14 10:05', user:'Sarah Chen', action:'Risk flag viewed', detail:'Unlimited Liability', color:W.orange },
                ].map((e,i) => (
                  <div key={i} style={{ display:'flex', gap:12, padding:'10px 0', borderBottom:`1px solid ${W.border}` }}>
                    <div style={{ width:7, height:7, borderRadius:'50%', background:e.color, marginTop:4, flexShrink:0 }}></div>
                    <div style={{ flex:1 }}>
                      <div style={{ display:'flex', justifyContent:'space-between', marginBottom:2 }}>
                        <span style={{ fontSize:12, fontWeight:600, color:W.text }}>{e.action}</span>
                        <span style={{ fontSize:10, color:W.textMute, fontFamily:"'IBM Plex Mono',monospace" }}>{e.time}</span>
                      </div>
                      <div style={{ fontSize:11, color:W.textSoft, marginBottom:2 }}>{e.user}</div>
                      <div style={{ fontSize:11, color:W.textMid }}>{e.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: metadata sidebar */}
        <div style={{ width:280, flexShrink:0, background:W.surface, overflow:'auto', padding:'20px 18px' }}>
          {/* Risk score */}
          <div style={{ marginBottom:20, padding:'14px', background:wRiskBg(c.riskScore), border:`1px solid ${wRisk(c.riskScore)}33`, borderRadius:6, textAlign:'center' }}>
            <div style={{ fontSize:10, fontWeight:700, color:W.textSoft, textTransform:'uppercase', letterSpacing:'0.08em', marginBottom:6 }}>Risk Score</div>
            <div style={{ fontSize:32, fontWeight:900, color:wRisk(c.riskScore), fontFamily:"'IBM Plex Mono',monospace", lineHeight:1 }}>{c.riskScore.toFixed(1)}</div>
            <div style={{ fontSize:11, fontWeight:700, color:wRisk(c.riskScore), marginTop:4, textTransform:'uppercase' }}>{wRiskLabel(c.riskScore)} Risk</div>
            <div style={{ display:'flex', justifyContent:'center', gap:12, marginTop:10 }}>
              {[{n:c.flags.red,c:W.red,l:'High'},{n:c.flags.orange,c:W.orange,l:'Med'},{n:c.flags.green,c:W.green,l:'OK'}].map(f=>(
                <div key={f.l} style={{ textAlign:'center' }}>
                  <div style={{ fontSize:16, fontWeight:800, color:f.c, fontFamily:"'IBM Plex Mono',monospace" }}>{f.n}</div>
                  <div style={{ fontSize:9, color:W.textSoft, textTransform:'uppercase', fontWeight:600 }}>{f.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick meta */}
          {[
            { label:'Type', value:<WTypePill type={c.type} /> },
            { label:'Counterparty', value:c.parties[0] },
            { label:'Effective', value:c.effectiveDate||'—' },
            { label:'Expires', value:c.terminationDate||'—' },
            { label:'Notice', value:c.noticePeriod||'—' },
            { label:'Auto-Renewal', value:c.autoRenewal||'—' },
            { label:'Value', value:c.paymentAmount||'—' },
            { label:'Schedule', value:c.paymentSchedule||'—' },
          ].map(row => (
            <div key={row.label} style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', padding:'7px 0', borderBottom:`1px solid ${W.border}`, gap:8 }}>
              <span style={{ fontSize:11, color:W.textSoft, flexShrink:0 }}>{row.label}</span>
              <span style={{ fontSize:11, fontWeight:500, color:W.text, textAlign:'right' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { ContractsScreen, ContractDetailScreen4 });
