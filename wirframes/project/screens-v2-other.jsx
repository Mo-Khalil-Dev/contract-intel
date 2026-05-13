
// v2 Portfolio (chart-heavy), Renewal Calendar, Templates, Settings, Modals

const { useState } = React;

// ─── Portfolio v2 ────────────────────────────────────────────────
function PortfolioV2({ onSelectContract }) {
  const { CONTRACTS, RENEWALS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const avgRisk = (complete.reduce((s, c) => s + c.riskScore, 0) / complete.length).toFixed(1);
  const totalRed = complete.reduce((s, c) => s + c.flags.red, 0);
  const totalOrange = complete.reduce((s, c) => s + c.flags.orange, 0);
  const unlimitedCount = complete.filter(c => c.riskFlags.some(f => f.title.toLowerCase().includes('unlimited'))).length;
  const urgentRenewals = RENEWALS.filter(r => r.daysRemaining < 60).length;

  const riskBands = [
    { label: '0–2', value: complete.filter(c => c.riskScore < 2).length, color: D.green },
    { label: '2–4', value: complete.filter(c => c.riskScore >= 2 && c.riskScore < 4).length, color: '#4ade80' },
    { label: '4–6', value: complete.filter(c => c.riskScore >= 4 && c.riskScore < 6).length, color: D.yellow },
    { label: '6–8', value: complete.filter(c => c.riskScore >= 6 && c.riskScore < 8).length, color: D.orange },
    { label: '8–10', value: complete.filter(c => c.riskScore >= 8).length, color: D.red },
  ];

  const typeBreakdown = ['vendor','license','partnership','customer','lease','nda'].map(t => ({
    label: t, value: complete.filter(c => c.type === t).length,
    color: {vendor:'#818cf8',license:'#38bdf8',partnership:'#2dd4bf',customer:'#f472b6',lease:'#fb923c',nda:'#94a3b8'}[t],
  })).filter(d => d.value > 0);

  const donutSegs = [
    { label:'High (7+)', value: complete.filter(c => c.riskScore >= 7).length, color: D.red },
    { label:'Med (4–7)', value: complete.filter(c => c.riskScore >= 4 && c.riskScore < 7).length, color: D.orange },
    { label:'Low (<4)',  value: complete.filter(c => c.riskScore < 4).length, color: D.green },
  ];

  const topRisks = [...complete].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const upcoming = RENEWALS.filter(r => r.daysRemaining < 90).sort((a, b) => a.daysRemaining - b.daysRemaining);

  function renewColor(r) {
    if (r.daysRemaining < 0) return D.red;
    if (r.daysRemaining < 30) return D.red;
    if (r.daysRemaining < 60) return D.orange;
    return D.yellow;
  }

  return (
    <div style={{ flex: 1, background: D.bg, overflow: 'auto' }}>
      {/* Header */}
      <div style={{ padding: '18px 24px', background: D.bg2, borderBottom: `1px solid ${D.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: D.text }}>Portfolio Analysis</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: D.textSoft }}>{complete.length} contracts analysed · Updated 2026-04-27</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <DBtn variant="secondary" small>Export CSV</DBtn>
          <DBtn small>Generate Report</DBtn>
        </div>
      </div>

      <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <DStatCard label="Total Contracts" value={CONTRACTS.length} sub="9 uploaded" />
          <DStatCard label="Avg Risk Score" value={avgRisk} sub="of 10.0" color={dRiskColor(parseFloat(avgRisk))} glow={dRiskGlow(parseFloat(avgRisk))} />
          <DStatCard label="Red Flags" value={totalRed} sub="High severity" color={D.red} glow={D.redGlow} />
          <DStatCard label="Unlimited Liability" value={unlimitedCount} sub="Contracts exposed" color={D.red} glow={D.redGlow} />
          <DStatCard label="Urgent Renewals" value={urgentRenewals} sub="Within 60 days" color={D.orange} glow={D.orangeGlow} />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>

          {/* Donut */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 4 }}>Risk Distribution</div>
            <div style={{ fontSize: 11, color: D.textSoft, marginBottom: 16 }}>{complete.length} complete contracts</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ position: 'relative', width: 110, height: 110, flexShrink: 0 }}>
                <DonutChart segments={donutSegs} size={110} thickness={16} />
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ fontSize: 20, fontWeight: 800, color: D.text, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>{complete.length}</div>
                  <div style={{ fontSize: 9, color: D.textMute, textTransform: 'uppercase', fontWeight: 600 }}>Total</div>
                </div>
              </div>
              <div style={{ flex: 1 }}>
                {donutSegs.map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, boxShadow: `0 0 6px ${s.color}` }}></div>
                      <span style={{ fontSize: 11, color: D.textMid }}>{s.label}</span>
                    </div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: s.color, fontFamily: "'IBM Plex Mono',monospace" }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Risk bands */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 4 }}>Score Bands</div>
            <div style={{ fontSize: 11, color: D.textSoft, marginBottom: 8 }}>Count per risk range</div>
            <GlowBarChart data={riskBands} height={150} />
          </div>

          {/* By type */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '18px 20px' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 4 }}>Contract Types</div>
            <div style={{ fontSize: 11, color: D.textSoft, marginBottom: 8 }}>Portfolio composition</div>
            <GlowBarChart data={typeBreakdown} height={150} />
          </div>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16 }}>
          {/* Top risks */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${D.border}` }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: D.text }}>Highest-Risk Contracts</span>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: D.surface2 }}>
                  {['#', 'Contract', 'Score', 'Flags', 'Action'].map(h => (
                    <th key={h} style={{ padding: '8px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: D.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRisks.map((c, i) => (
                  <tr key={c.id} style={{ borderTop: `1px solid ${D.border}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = D.surface2}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                    onClick={() => onSelectContract(c.id)}
                  >
                    <td style={{ padding: '9px 14px', color: D.textMute, fontSize: 11, fontFamily: "'IBM Plex Mono',monospace" }}>{i + 1}</td>
                    <td style={{ padding: '9px 14px', maxWidth: 200 }}>
                      <div style={{ fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                      <div style={{ fontSize: 10, color: D.textSoft }}>{c.parties[0]}</div>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <span style={{ color: dRiskColor(c.riskScore), fontWeight: 800, fontFamily: "'IBM Plex Mono',monospace", fontSize: 14 }}>{c.riskScore.toFixed(1)}</span>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <div style={{ display: 'flex', gap: 5 }}>
                        {c.flags.red > 0 && <span style={{ color: D.red, fontWeight: 700, fontSize: 12 }}>●{c.flags.red}</span>}
                        {c.flags.orange > 0 && <span style={{ color: D.orange, fontWeight: 700, fontSize: 12 }}>●{c.flags.orange}</span>}
                      </div>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <DBtn small variant="ghost">Review →</DBtn>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Liability + Renewals */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Liability */}
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '16px 18px', flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 12 }}>Liability Exposure</div>
              {[
                { label: 'Capped (2× annual)', count: 4, pct: 50, color: D.green },
                { label: 'Other caps', count: 2, pct: 25, color: D.orange },
                { label: 'Unlimited / Unknown', count: unlimitedCount, pct: unlimitedCount / complete.length * 100, color: D.red },
              ].map(row => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontSize: 11, color: D.textMid }}>{row.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontFamily: "'IBM Plex Mono',monospace" }}>{row.count}</span>
                  </div>
                  <div style={{ height: 4, background: D.border, borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${row.pct}%`, height: '100%', background: row.color, borderRadius: 2, boxShadow: `0 0 6px ${row.color}` }}></div>
                  </div>
                </div>
              ))}
              {unlimitedCount > 0 && (
                <div style={{ marginTop: 8, padding: '8px 10px', background: D.redGlow, border: `1px solid ${D.red}33`, borderRadius: 6, fontSize: 11, color: D.red }}>
                  ⚠ {unlimitedCount} contracts with unlimited liability — action required
                </div>
              )}
            </div>

            {/* Upcoming renewals widget */}
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '16px 18px' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: D.text, marginBottom: 10 }}>Upcoming Renewals</div>
              {upcoming.slice(0, 3).map(r => (
                <div key={r.id} style={{
                  padding: '8px 10px', marginBottom: 7,
                  background: renewColor(r) + '14', border: `1px solid ${renewColor(r)}33`,
                  borderRadius: 6, display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                }}>
                  <div style={{ fontSize: 12, fontWeight: 600, color: D.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>{r.name}</div>
                  <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono',monospace", color: renewColor(r), fontWeight: 700, flexShrink: 0 }}>
                    {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d late` : `${r.daysRemaining}d`}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Renewal Calendar v2 ──────────────────────────────────────────
function RenewalCalendarV2() {
  const { RENEWALS } = window.APP_DATA;
  const [selected, setSelected] = useState(null);
  function renewColor(r) {
    if (r.daysRemaining < 0)  return D.red;
    if (r.daysRemaining < 30) return D.red;
    if (r.daysRemaining < 60) return D.orange;
    if (r.daysRemaining < 90) return D.yellow;
    return D.green;
  }
  return (
    <div style={{ flex: 1, background: D.bg, overflow: 'auto' }}>
      <div style={{ padding: '18px 24px', background: D.bg2, borderBottom: `1px solid ${D.border}` }}>
        <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: D.text }}>Renewal Calendar</h1>
        <p style={{ margin: '2px 0 0', fontSize: 12, color: D.textSoft }}>Track upcoming contract renewals and notice periods</p>
      </div>
      <div style={{ padding: '20px 24px', display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
        <div>
          {/* KPI strip */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginBottom: 16 }}>
            {[
              { label: 'Overdue', count: RENEWALS.filter(r => r.daysRemaining < 0).length, color: D.red, glow: D.redGlow },
              { label: 'Within 30 days', count: RENEWALS.filter(r => r.daysRemaining >= 0 && r.daysRemaining < 30).length, color: D.orange, glow: D.orangeGlow },
              { label: 'Next 90 days', count: RENEWALS.filter(r => r.daysRemaining >= 0 && r.daysRemaining < 90).length, color: D.yellow, glow: D.yellowGlow },
            ].map(s => (
              <div key={s.label} style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 8, padding: '12px 16px', boxShadow: `0 0 16px ${s.glow}` }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: s.color, fontFamily: "'IBM Plex Mono',monospace", lineHeight: 1 }}>{s.count}</div>
                <div style={{ fontSize: 11, color: D.textSoft, marginTop: 4 }}>{s.label}</div>
              </div>
            ))}
          </div>
          {/* Renewals list */}
          <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ padding: '12px 16px', borderBottom: `1px solid ${D.border}`, fontSize: 13, fontWeight: 700, color: D.text }}>All Renewals</div>
            {[...RENEWALS].sort((a, b) => a.daysRemaining - b.daysRemaining).map(r => (
              <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                style={{
                  padding: '12px 16px', borderBottom: `1px solid ${D.border}`, cursor: 'pointer',
                  borderLeft: `3px solid ${renewColor(r)}`,
                  background: selected === r.id ? D.surface2 : 'transparent',
                  transition: 'background 0.12s',
                }}
                onMouseEnter={e => { if (selected !== r.id) e.currentTarget.style.background = D.surface2 + '88'; }}
                onMouseLeave={e => { if (selected !== r.id) e.currentTarget.style.background = 'transparent'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: D.text }}>{r.name}</div>
                  <div style={{ fontSize: 12, fontFamily: "'IBM Plex Mono',monospace", color: renewColor(r), fontWeight: 700 }}>
                    {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : r.daysRemaining === 0 ? 'TODAY' : `${r.daysRemaining}d`}
                  </div>
                </div>
                <div style={{ fontSize: 11, color: D.textSoft, marginTop: 3 }}>
                  {r.renewalDate} · {r.noticePeriod} notice · Risk score <span style={{ color: dRiskColor(r.riskScore), fontWeight: 700 }}>{r.riskScore}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Detail panel */}
        <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
          {selected ? (() => {
            const r = RENEWALS.find(x => x.id === selected);
            if (!r) return null;
            const rc = renewColor(r);
            return (
              <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: rc + '14', borderBottom: `1px solid ${rc}33` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: rc, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
                    {r.daysRemaining < 0 ? '⚠ OVERDUE' : r.daysRemaining < 30 ? '⚠ URGENT ACTION' : 'RENEWAL DETAIL'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: D.text }}>{r.name}</div>
                </div>
                <div style={{ padding: 14 }}>
                  {[['Renewal Date', r.renewalDate],['Days Remaining', r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : `${r.daysRemaining} days`],['Notice Period', r.noticePeriod],['Risk Score', `${r.riskScore}/10`]].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${D.border}`, fontSize: 12 }}>
                      <span style={{ color: D.textSoft }}>{k}</span>
                      <span style={{ fontWeight: 600, color: D.text, fontFamily: "'IBM Plex Mono',monospace" }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <DBtn style={{ width: '100%', justifyContent: 'center' }}>View Contract</DBtn>
                    <DBtn variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>Mark Acknowledged</DBtn>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '30px 20px', textAlign: 'center', color: D.textMute }}>
              <div style={{ fontSize: 28, marginBottom: 8, opacity: 0.4 }}>◻</div>
              <div style={{ fontSize: 13 }}>Select a renewal to view details</div>
            </div>
          )}
          <div style={{ marginTop: 12, background: D.surface, border: `1px solid ${D.border}`, borderRadius: 10, padding: '12px 14px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: D.text, marginBottom: 8 }}>Export</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <DBtn small variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>Outlook</DBtn>
              <DBtn small variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>Google Cal</DBtn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Simple fallback screens (Templates, Settings) ────────────────
function TemplatesV2() {
  const [templates] = useState([
    { id:1, name:'Standard Vendor Agreement', type:'vendor', uploaded:'3mo ago' },
    { id:2, name:'NDA Template', type:'nda', uploaded:'2mo ago' },
    { id:3, name:'Customer Agreement', type:'customer', uploaded:'1mo ago' },
    { id:4, name:'Partnership Agreement', type:'partnership', uploaded:'2w ago' },
    { id:5, name:'Software Licence', type:'license', uploaded:'1w ago' },
  ]);
  const typeColors = { vendor:'#818cf8', license:'#38bdf8', partnership:'#2dd4bf', customer:'#f472b6', lease:'#fb923c', nda:'#94a3b8' };
  return (
    <div style={{ flex:1, background:D.bg, overflow:'auto' }}>
      <div style={{ padding:'18px 24px', background:D.bg2, borderBottom:`1px solid ${D.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:D.text }}>Template Library</h1>
          <p style={{ margin:'2px 0 0', fontSize:12, color:D.textSoft }}>Standard contract templates for comparison</p>
        </div>
        <DBtn>+ Upload Template</DBtn>
      </div>
      <div style={{ padding:'20px 24px' }}>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(220px, 1fr))', gap:12 }}>
          {templates.map(t => (
            <div key={t.id} style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'16px 18px' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = typeColors[t.type]+'55'}
              onMouseLeave={e => e.currentTarget.style.borderColor = D.border}
            >
              <div style={{ fontSize:28, marginBottom:10 }}>📄</div>
              <div style={{ fontSize:13, fontWeight:700, color:D.text, marginBottom:4 }}>{t.name}</div>
              <div style={{ fontSize:11, fontWeight:700, color:typeColors[t.type], textTransform:'capitalize', marginBottom:8 }}>{t.type}</div>
              <div style={{ fontSize:11, color:D.textMute, marginBottom:12 }}>Uploaded {t.uploaded}</div>
              <div style={{ display:'flex', gap:6 }}>
                <DBtn small variant="secondary" style={{ flex:1, justifyContent:'center' }}>Download</DBtn>
                <DBtn small variant="danger">✕</DBtn>
              </div>
            </div>
          ))}
          {/* Upload card */}
          <div style={{ background:'transparent', border:`2px dashed ${D.border}`, borderRadius:10, padding:'20px 18px', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', cursor:'pointer', minHeight:160 }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = D.accent; e.currentTarget.style.background = D.accentGlow; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = D.border; e.currentTarget.style.background = 'transparent'; }}
          >
            <div style={{ fontSize:24, color:D.textMute, marginBottom:8 }}>+</div>
            <div style={{ fontSize:12, color:D.textSoft, textAlign:'center' }}>Upload new template</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SettingsV2() {
  const { TEAM_MEMBERS } = window.APP_DATA;
  const [settingsTab, setSettingsTab] = useState('team');
  const tabs = [{ id:'team', label:'Team' }, { id:'billing', label:'Billing' }, { id:'audit', label:'Audit Log' }, { id:'api', label:'API Keys' }];
  return (
    <div style={{ flex:1, background:D.bg, overflow:'auto' }}>
      <div style={{ padding:'18px 24px', background:D.bg2, borderBottom:`1px solid ${D.border}` }}>
        <h1 style={{ margin:0, fontSize:18, fontWeight:800, color:D.text }}>Settings</h1>
      </div>
      <DTabs tabs={tabs} active={settingsTab} onChange={setSettingsTab} />
      <div style={{ padding:'24px' }}>
        {settingsTab === 'team' && (
          <div style={{ maxWidth:820 }}>
            <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
              <h2 style={{ margin:0, fontSize:15, fontWeight:700, color:D.text }}>Team Members</h2>
              <DBtn>+ Invite Member</DBtn>
            </div>
            <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, overflow:'hidden' }}>
              <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                <thead>
                  <tr style={{ background:D.surface2, borderBottom:`1px solid ${D.border}` }}>
                    {['Member','Role','Last Active','Status'].map(h => (
                      <th key={h} style={{ padding:'9px 16px', textAlign:'left', fontSize:10, fontWeight:700, color:D.textSoft, textTransform:'uppercase', letterSpacing:'0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {TEAM_MEMBERS.map(m => (
                    <tr key={m.id} style={{ borderBottom:`1px solid ${D.border}` }}>
                      <td style={{ padding:'10px 16px' }}>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div style={{ width:30, height:30, borderRadius:'50%', background:`linear-gradient(135deg, ${D.accent}, #7c3aed)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff' }}>{m.avatar}</div>
                          <div>
                            <div style={{ fontWeight:600, color:D.text }}>{m.name}</div>
                            <div style={{ fontSize:11, color:D.textSoft }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding:'10px 16px' }}>
                        <span style={{ fontSize:12, fontWeight:700, color:{Admin:D.accent,Reviewer:D.yellow,Viewer:D.textSoft}[m.role] || D.textSoft }}>{m.role}</span>
                      </td>
                      <td style={{ padding:'10px 16px', color:D.textSoft, fontSize:12 }}>{m.lastLogin}</td>
                      <td style={{ padding:'10px 16px' }}>
                        {m.status === 'pending'
                          ? <span style={{ color:D.orange, fontSize:12, fontWeight:600 }}>⏳ Pending</span>
                          : <span style={{ color:D.green, fontSize:12, fontWeight:600 }}>● Active</span>}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {settingsTab === 'billing' && (
          <div style={{ maxWidth:540 }}>
            <div style={{ background:D.surface, border:`1px solid ${D.border}`, borderRadius:10, padding:'20px 24px', marginBottom:14 }}>
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
                <div>
                  <div style={{ fontSize:11, color:D.textMute, textTransform:'uppercase', fontWeight:700, letterSpacing:'0.06em', marginBottom:4 }}>Current Plan</div>
                  <div style={{ fontSize:22, fontWeight:800, color:D.text }}>Professional</div>
                  <div style={{ fontSize:13, color:D.textSoft, marginTop:2 }}>£299/month · 50 contracts/month</div>
                </div>
                <DBtn variant="secondary">Upgrade</DBtn>
              </div>
              <div style={{ height:5, background:D.border, borderRadius:3 }}>
                <div style={{ width:'72%', height:'100%', background:D.accent, borderRadius:3, boxShadow:`0 0 8px ${D.accent}` }}></div>
              </div>
              <div style={{ fontSize:11, color:D.textSoft, marginTop:5 }}>36 / 50 contracts used this month</div>
            </div>
          </div>
        )}
        {(settingsTab === 'audit' || settingsTab === 'api') && (
          <div style={{ color:D.textSoft, fontSize:14, padding:'20px 0' }}>{settingsTab === 'audit' ? 'Audit log' : 'API key management'} — see v1 for full detail.</div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Modal v2 ─────────────────────────────────────────────
function UploadModalV2({ onClose }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({});
  const [dragging, setDragging] = useState(false);
  function addFiles(newFiles) {
    setFiles(prev => [...prev, ...Array.from(newFiles).map(f => ({ name:f.name, size:f.size, id:Math.random() }))]);
  }
  function startUpload() {
    setUploading(true);
    const init = {};
    files.forEach(f => { init[f.id] = 0; });
    setProgress(init);
    const iv = setInterval(() => {
      setProgress(prev => {
        const next = { ...prev };
        let allDone = true;
        files.forEach(f => { if (next[f.id] < 100) { next[f.id] = Math.min(100, next[f.id] + Math.random() * 25); allDone = false; } });
        if (allDone) { clearInterval(iv); setTimeout(() => setDone(true), 400); }
        return next;
      });
    }, 300);
  }
  return (
    <DModal title="Upload Contracts" onClose={onClose}>
      {done ? (
        <div style={{ textAlign:'center', padding:'20px 0' }}>
          <div style={{ fontSize:40, color:D.green, marginBottom:12, textShadow:`0 0 20px ${D.green}` }}>✓</div>
          <div style={{ fontSize:16, fontWeight:700, color:D.text, marginBottom:6 }}>Upload Complete</div>
          <div style={{ fontSize:13, color:D.textSoft, marginBottom:20 }}>{files.length} file{files.length !== 1?'s':''} queued for analysis.</div>
          <DBtn onClick={onClose}>Back to Dashboard</DBtn>
        </div>
      ) : (
        <>
          <div onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            onClick={() => document.getElementById('ci-v2-file').click()}
            style={{ border:`2px dashed ${dragging ? D.accent : D.border}`, borderRadius:8, padding:'28px 20px', textAlign:'center', background:dragging ? D.accentGlow : D.surface2, cursor:'pointer', marginBottom:14, transition:'all 0.15s' }}>
            <div style={{ fontSize:26, marginBottom:8 }}>📄</div>
            <div style={{ fontSize:14, fontWeight:600, color:D.text, marginBottom:3 }}>Drag & drop contracts</div>
            <div style={{ fontSize:12, color:D.textSoft }}>PDF, DOCX, PPTX up to 50MB</div>
            <input id="ci-v2-file" type="file" multiple accept=".pdf,.docx,.pptx" style={{ display:'none' }} onChange={e => addFiles(e.target.files)} />
          </div>
          {files.length > 0 && (
            <div style={{ marginBottom:12 }}>
              {files.map(f => (
                <div key={f.id} style={{ display:'flex', alignItems:'center', gap:8, padding:'6px 10px', background:D.surface2, borderRadius:5, marginBottom:5 }}>
                  <span>📄</span>
                  <span style={{ flex:1, fontSize:12, color:D.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{f.name}</span>
                  {uploading ? (
                    <div style={{ width:72, height:3, background:D.border, borderRadius:2 }}>
                      <div style={{ width:`${progress[f.id]||0}%`, height:'100%', background:D.accent, borderRadius:2, boxShadow:`0 0 6px ${D.accent}` }}></div>
                    </div>
                  ) : (
                    <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))} style={{ background:'none', border:'none', cursor:'pointer', color:D.textMute, fontSize:13 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}
          <label style={{ display:'flex', gap:8, alignItems:'flex-start', cursor:'pointer', marginBottom:16, fontSize:12, color:D.textMid }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop:2 }} />
            I understand ContractIntel will analyse these files using Claude AI for legal risk extraction.
          </label>
          <div style={{ display:'flex', justifyContent:'space-between' }}>
            <DBtn variant="secondary" onClick={onClose}>Cancel</DBtn>
            <DBtn disabled={files.length === 0 || !agreed || uploading} onClick={startUpload}>
              {uploading ? 'Uploading…' : `Upload${files.length > 0 ? ` (${files.length})` : ''}`}
            </DBtn>
          </div>
        </>
      )}
    </DModal>
  );
}

Object.assign(window, { PortfolioV2, RenewalCalendarV2, TemplatesV2, SettingsV2, UploadModalV2 });
