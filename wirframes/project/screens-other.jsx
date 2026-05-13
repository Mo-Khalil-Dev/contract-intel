
// Portfolio, Renewal Calendar, Settings, Upload Modal, Report Modal

const { useState } = React;

// ─── Portfolio Dashboard ─────────────────────────────────────────
function PortfolioScreen({ onSelectContract }) {
  const { CONTRACTS, RENEWALS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const avgRisk = (complete.reduce((s, c) => s + c.riskScore, 0) / complete.length).toFixed(1);
  const totalRed = complete.reduce((s, c) => s + c.flags.red, 0);
  const totalOrange = complete.reduce((s, c) => s + c.flags.orange, 0);
  const unlimitedLiability = complete.filter(c => c.riskFlags.some(f => f.title.toLowerCase().includes('unlimited'))).length;

  const bands = [
    { label: '0–2', min: 0, max: 2, color: T.green },
    { label: '2–4', min: 2, max: 4, color: '#22c55e' },
    { label: '4–6', min: 4, max: 6, color: T.orange },
    { label: '6–8', min: 6, max: 8, color: '#f97316' },
    { label: '8–10', min: 8, max: 10, color: T.red },
  ];
  const bandData = bands.map(b => ({
    label: b.label,
    value: complete.filter(c => c.riskScore >= b.min && c.riskScore < b.max).length,
    color: b.color,
  }));

  const typeData = ['vendor', 'license', 'partnership', 'customer', 'lease', 'nda'].map(t => ({
    label: t, value: complete.filter(c => c.type === t).length,
    color: { vendor: '#6366f1', license: '#0ea5e9', partnership: '#14b8a6', customer: '#ec4899', lease: '#f59e0b', nda: '#64748b' }[t],
  })).filter(d => d.value > 0);

  const topRisks = [...complete].sort((a, b) => b.riskScore - a.riskScore).slice(0, 5);
  const upcoming = RENEWALS.filter(r => r.daysRemaining < 60).sort((a, b) => a.daysRemaining - b.daysRemaining);

  return (
    <div style={{ flex: 1, background: T.bg, overflow: 'auto' }}>
      <PageHeader title="Portfolio Analysis"
        subtitle={`${complete.length} contracts analysed · Last updated 2026-04-27`}
        actions={<><Btn variant="secondary" small>Export CSV</Btn><Btn small>Generate Report</Btn></>}
      />
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          <StatCard label="Total Contracts" value={CONTRACTS.length} sub="9 total, 8 complete" mono />
          <StatCard label="Avg Risk Score" value={avgRisk} sub="Out of 10.0" color={riskColor(parseFloat(avgRisk))} mono />
          <StatCard label="Red Flags" value={totalRed} sub="Across all contracts" color={T.red} mono />
          <StatCard label="Unlimited Liability" value={unlimitedLiability} sub="Contracts exposed" color={T.red} mono />
          <StatCard label="Upcoming Renewals" value={upcoming.length} sub="Within 60 days" color={T.orange} mono />
        </div>

        {/* Charts row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Risk distribution */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: T.text }}>Risk Score Distribution</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.textSoft }}>{complete.length} complete contracts</p>
            <MiniBarChart data={bandData} height={140} />
          </div>

          {/* By type */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
            <h3 style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: T.text }}>Contracts by Type</h3>
            <p style={{ margin: '0 0 16px', fontSize: 12, color: T.textSoft }}>Portfolio composition</p>
            <MiniBarChart data={typeData} height={140} />
          </div>
        </div>

        {/* Bottom grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 20 }}>
          {/* Top risks table */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
            <div style={{ padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <h3 style={{ margin: 0, fontSize: 13, fontWeight: 700, color: T.text }}>Highest-Risk Contracts</h3>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['#', 'Contract', 'Score', 'Flags'].map((h, i) => (
                    <th key={i} style={{ padding: '7px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {topRisks.map((c, i) => (
                  <tr key={c.id} onClick={() => onSelectContract(c.id)}
                    style={{ borderTop: `1px solid ${T.border}`, cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eff6ff'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}
                  >
                    <td style={{ padding: '9px 14px', color: T.textMute, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace" }}>{i + 1}</td>
                    <td style={{ padding: '9px 14px', fontWeight: 600, color: T.text, maxWidth: 200 }}>
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</div>
                      <div style={{ fontSize: 10, color: T.textSoft }}>{c.parties[0]}</div>
                    </td>
                    <td style={{ padding: '9px 14px' }}><RiskBadge score={c.riskScore} /></td>
                    <td style={{ padding: '9px 14px' }}><FlagCount flags={c.flags} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Liability analysis */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 18px' }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.text }}>Liability Analysis</h3>
            {[
              { label: 'Capped at 2× annual value', count: 4, bar: 50, color: T.green },
              { label: 'Capped at other amounts', count: 2, bar: 25, color: T.orange },
              { label: 'Unlimited / Unknown', count: unlimitedLiability, bar: unlimitedLiability / complete.length * 100, color: T.red },
            ].map((row, i) => (
              <div key={i} style={{ marginBottom: 14 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                  <span style={{ fontSize: 12, color: T.textMid }}>{row.label}</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: row.color, fontFamily: "'IBM Plex Mono', monospace" }}>{row.count}</span>
                </div>
                <div style={{ height: 5, background: T.bg, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ width: `${row.bar}%`, height: '100%', background: row.color, borderRadius: 3 }}></div>
                </div>
              </div>
            ))}
            <div style={{
              marginTop: 16, padding: '10px 12px',
              background: T.redBg, border: `1px solid ${T.redBorder}`,
              borderRadius: 4, fontSize: 12, color: T.red, fontWeight: 500,
            }}>
              ⚠ {unlimitedLiability} contract{unlimitedLiability !== 1 ? 's' : ''} with unlimited liability exposure — action required.
            </div>

            <h3 style={{ margin: '20px 0 10px', fontSize: 13, fontWeight: 700, color: T.text }}>Renewals (Next 60 Days)</h3>
            {upcoming.length === 0 ? (
              <div style={{ fontSize: 12, color: T.textSoft }}>No urgent renewals.</div>
            ) : upcoming.map(r => (
              <div key={r.id} style={{
                padding: '8px 10px', marginBottom: 6,
                background: r.daysRemaining < 0 ? T.redBg : r.daysRemaining < 30 ? T.orangeBg : T.yellowBg,
                border: `1px solid ${r.daysRemaining < 0 ? T.redBorder : r.daysRemaining < 30 ? T.orangeBorder : T.yellowBorder}`,
                borderRadius: 4,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: T.text }}>{r.name}</div>
                <div style={{ fontSize: 11, color: T.textSoft, marginTop: 2 }}>
                  {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : r.daysRemaining === 0 ? 'Today!' : `${r.daysRemaining}d remaining`}
                  {' · '}{r.noticePeriod} notice required
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Renewal Calendar ────────────────────────────────────────────
function RenewalCalendarScreen() {
  const { RENEWALS } = window.APP_DATA;
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState('all');
  const now = new Date('2026-04-27');
  const year = now.getFullYear();
  const months = Array.from({ length: 12 }, (_, i) => {
    const d = new Date(year, now.getMonth() + i, 1);
    return { year: d.getFullYear(), month: d.getMonth(), label: d.toLocaleString('default', { month: 'long', year: 'numeric' }) };
  });

  function renewalColor(r) {
    if (r.daysRemaining < 0) return T.red;
    if (r.daysRemaining < 30) return T.red;
    if (r.daysRemaining < 60) return T.orange;
    if (r.daysRemaining < 90) return '#eab308';
    return T.green;
  }

  function getRenewalsForMonth(y, m) {
    return RENEWALS.filter(r => {
      const d = new Date(r.renewalDate);
      return d.getFullYear() === y && d.getMonth() === m;
    });
  }

  const filtered = RENEWALS.filter(r => {
    if (filter === 'urgent') return r.daysRemaining < 30;
    if (filter === 'approaching') return r.daysRemaining >= 30 && r.daysRemaining < 90;
    if (filter === 'ontrack') return r.daysRemaining >= 90;
    return true;
  });

  return (
    <div style={{ flex: 1, background: T.bg, overflow: 'auto' }}>
      <PageHeader title="Renewal Calendar" subtitle="Track upcoming contract renewals and notice periods" />
      <div style={{ padding: '16px 28px 0' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {[['all', 'All'], ['urgent', '🔴 Action Required'], ['approaching', '🟠 Approaching'], ['ontrack', '🟢 On Track']].map(([val, label]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              padding: '4px 12px', borderRadius: 3, border: `1px solid ${T.border}`,
              background: filter === val ? T.navy : '#fff', color: filter === val ? '#fff' : T.textMid,
              cursor: 'pointer', fontSize: 12, fontWeight: 600,
            }}>{label}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: '0 28px 28px', display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        {/* Calendar list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {months.slice(0, 4).map(({ year: y, month: m, label }) => {
            const renewals = getRenewalsForMonth(y, m).filter(r => {
              if (filter === 'urgent') return r.daysRemaining < 30;
              if (filter === 'approaching') return r.daysRemaining >= 30 && r.daysRemaining < 90;
              if (filter === 'ontrack') return r.daysRemaining >= 90;
              return true;
            });
            return (
              <div key={label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ padding: '10px 16px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`, fontSize: 13, fontWeight: 700, color: T.text }}>
                  {label} {renewals.length > 0 && <span style={{ fontSize: 11, background: T.blue + '22', color: T.blue, borderRadius: 9, padding: '1px 7px', marginLeft: 6 }}>{renewals.length}</span>}
                </div>
                {renewals.length === 0 ? (
                  <div style={{ padding: '12px 16px', fontSize: 12, color: T.textMute }}>No renewals this month</div>
                ) : renewals.map(r => (
                  <div key={r.id} onClick={() => setSelected(r.id === selected ? null : r.id)}
                    style={{
                      padding: '12px 16px', cursor: 'pointer', borderBottom: `1px solid ${T.border}`,
                      borderLeft: `3px solid ${renewalColor(r)}`,
                      background: selected === r.id ? '#eff6ff' : '#fff',
                    }}
                    onMouseEnter={e => { if (selected !== r.id) e.currentTarget.style.background = '#f8fafc'; }}
                    onMouseLeave={e => { if (selected !== r.id) e.currentTarget.style.background = '#fff'; }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{r.name}</div>
                      <div style={{ fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", color: renewalColor(r), fontWeight: 700 }}>
                        {r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d overdue` : r.daysRemaining === 0 ? 'TODAY' : `${r.daysRemaining}d`}
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: T.textSoft, marginTop: 3 }}>
                      {r.renewalDate} · {r.noticePeriod} notice · Risk <span style={{ color: riskColor(r.riskScore), fontWeight: 700 }}>{r.riskScore}</span>
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </div>

        {/* Detail panel */}
        <div style={{ position: 'sticky', top: 20, alignSelf: 'start' }}>
          {selected ? (() => {
            const r = RENEWALS.find(x => x.id === selected);
            if (!r) return null;
            const color = renewalColor(r);
            return (
              <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
                <div style={{ padding: '12px 16px', background: color + '12', borderBottom: `1px solid ${color}33` }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>
                    {r.daysRemaining < 0 ? '⚠ OVERDUE' : r.daysRemaining < 30 ? '⚠ URGENT' : r.daysRemaining < 90 ? 'APPROACHING' : 'ON TRACK'}
                  </div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.text }}>{r.name}</div>
                </div>
                <div style={{ padding: 16 }}>
                  {[
                    ['Renewal Date', r.renewalDate],
                    ['Days Remaining', r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)} days overdue` : `${r.daysRemaining} days`],
                    ['Notice Period', r.noticePeriod],
                    ['Risk Score', r.riskScore + '/10'],
                  ].map(([k, v]) => (
                    <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '7px 0', borderBottom: `1px solid ${T.border}`, fontSize: 13 }}>
                      <span style={{ color: T.textSoft }}>{k}</span>
                      <span style={{ fontWeight: 600, color: T.text, fontFamily: k.includes('Days') || k.includes('Score') ? "'IBM Plex Mono', monospace" : 'inherit' }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <Btn style={{ width: '100%', justifyContent: 'center' }}>View Contract</Btn>
                    <Btn variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>Mark Acknowledged</Btn>
                  </div>
                </div>
              </div>
            );
          })() : (
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: 24, textAlign: 'center' }}>
              <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.3 }}>◻</div>
              <div style={{ fontSize: 13, color: T.textSoft }}>Click a renewal to see details</div>
            </div>
          )}

          {/* Export */}
          <div style={{ marginTop: 12, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '12px 16px' }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: T.text, marginBottom: 8 }}>Export Calendar</div>
            <div style={{ display: 'flex', gap: 6 }}>
              <Btn small variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>Outlook</Btn>
              <Btn small variant="secondary" style={{ flex: 1, justifyContent: 'center' }}>Google Cal</Btn>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Template Library ─────────────────────────────────────────────
function TemplatesScreen() {
  const [templates, setTemplates] = useState([
    { id: 1, name: 'Standard Vendor Agreement', type: 'vendor', uploaded: '3mo ago' },
    { id: 2, name: 'NDA Template', type: 'nda', uploaded: '2mo ago' },
    { id: 3, name: 'Customer Agreement', type: 'customer', uploaded: '1mo ago' },
    { id: 4, name: 'Partnership Agreement', type: 'partnership', uploaded: '2w ago' },
    { id: 5, name: 'Software Licence Template', type: 'license', uploaded: '1w ago' },
  ]);
  const [filterType, setFilterType] = useState('all');
  const filtered = templates.filter(t => filterType === 'all' || t.type === filterType);

  return (
    <div style={{ flex: 1, background: T.bg, overflow: 'auto' }}>
      <PageHeader title="Template Library" subtitle="Manage standard contract templates for comparison"
        actions={<Btn>+ Upload Template</Btn>} />
      <div style={{ padding: '20px 28px' }}>
        <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
          {['all', 'vendor', 'customer', 'partnership', 'license', 'nda'].map(t => (
            <button key={t} onClick={() => setFilterType(t)} style={{
              padding: '4px 12px', borderRadius: 3, border: `1px solid ${T.border}`,
              background: filterType === t ? T.navy : '#fff', color: filterType === t ? '#fff' : T.textMid,
              cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
            }}>{t === 'all' ? 'All' : t}</button>
          ))}
        </div>
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                {['Template Name', 'Type', 'Uploaded', 'Actions'].map((h, i) => (
                  <th key={i} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map(t => (
                <tr key={t.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600, color: T.text }}>📄 {t.name}</td>
                  <td style={{ padding: '10px 16px' }}><TypeBadge type={t.type} /></td>
                  <td style={{ padding: '10px 16px', color: T.textSoft, fontSize: 12 }}>{t.uploaded}</td>
                  <td style={{ padding: '10px 16px' }}>
                    <div style={{ display: 'flex', gap: 6 }}>
                      <Btn small variant="secondary">Download</Btn>
                      <Btn small variant="danger" onClick={() => setTemplates(ts => ts.filter(x => x.id !== t.id))}>Delete</Btn>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Team Settings ────────────────────────────────────────────────
function SettingsScreen() {
  const { TEAM_MEMBERS } = window.APP_DATA;
  const [settingsTab, setSettingsTab] = useState('team');
  const [members, setMembers] = useState(TEAM_MEMBERS);

  const tabs = [
    { id: 'team', label: 'Team' },
    { id: 'account', label: 'Account' },
    { id: 'billing', label: 'Billing' },
    { id: 'api', label: 'API Keys' },
    { id: 'audit', label: 'Audit Log' },
  ];

  return (
    <div style={{ flex: 1, background: T.bg, overflow: 'auto' }}>
      <PageHeader title="Settings" />
      <Tabs tabs={tabs} active={settingsTab} onChange={setSettingsTab} />
      <div style={{ padding: '24px 28px' }}>

        {settingsTab === 'team' && (
          <div style={{ maxWidth: 860 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: T.text }}>Team Members</h2>
              <Btn>+ Invite Member</Btn>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden', marginBottom: 20 }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                    {['Member', 'Role', 'Last Active', 'Status', 'Actions'].map((h, i) => (
                      <th key={i} style={{ padding: '9px 16px', textAlign: 'left', fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {members.map(m => (
                    <tr key={m.id} style={{ borderBottom: `1px solid ${T.border}` }}>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 30, height: 30, borderRadius: '50%', background: T.blue + '22', color: T.blue,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700,
                          }}>{m.avatar}</div>
                          <div>
                            <div style={{ fontWeight: 600, color: T.text }}>{m.name}</div>
                            <div style={{ fontSize: 11, color: T.textSoft }}>{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <select defaultValue={m.role} style={{ border: `1px solid ${T.border}`, borderRadius: 3, padding: '3px 7px', fontSize: 12, color: T.text }}>
                          <option>Admin</option><option>Reviewer</option><option>Viewer</option>
                        </select>
                      </td>
                      <td style={{ padding: '10px 16px', color: T.textSoft, fontSize: 12 }}>{m.lastLogin}</td>
                      <td style={{ padding: '10px 16px' }}>
                        {m.status === 'pending'
                          ? <span style={{ color: T.orange, fontSize: 12, fontWeight: 600 }}>⏳ Pending</span>
                          : <span style={{ color: T.green, fontSize: 12, fontWeight: 600 }}>● Active</span>}
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {m.status === 'pending' && <Btn small variant="secondary">Resend</Btn>}
                          {m.id !== 1 && <Btn small variant="danger" onClick={() => setMembers(ms => ms.filter(x => x.id !== m.id))}>Remove</Btn>}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Roles ref */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
              <h3 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 700, color: T.text }}>Roles & Permissions</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {[
                  { role: 'Admin', perms: ['View all contracts', 'Edit contract data', 'Delete contracts', 'Manage team', 'Access billing'], denied: [] },
                  { role: 'Reviewer', perms: ['View all contracts', 'Add comments', 'Assign contracts'], denied: ['Delete contracts', 'Manage team'] },
                  { role: 'Viewer', perms: ['View all contracts'], denied: ['Edit data', 'Add comments', 'Delete contracts'] },
                ].map(r => (
                  <div key={r.role} style={{ border: `1px solid ${T.border}`, borderRadius: 4, padding: '12px 14px' }}>
                    <div style={{ fontWeight: 700, fontSize: 13, color: T.text, marginBottom: 8 }}>{r.role}</div>
                    {r.perms.map(p => <div key={p} style={{ fontSize: 12, color: T.green, marginBottom: 3 }}>✓ {p}</div>)}
                    {r.denied.map(p => <div key={p} style={{ fontSize: 12, color: T.textMute, marginBottom: 3 }}>✗ {p}</div>)}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {settingsTab === 'billing' && (
          <div style={{ maxWidth: 600 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '20px 24px', marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Current Plan</div>
                  <div style={{ fontSize: 22, fontWeight: 800, color: T.text }}>Professional</div>
                  <div style={{ fontSize: 13, color: T.textSoft, marginTop: 2 }}>£299/month · Up to 50 contracts/month</div>
                </div>
                <Btn variant="secondary">Upgrade Plan</Btn>
              </div>
              <div style={{ marginTop: 16, height: 6, background: T.bg, borderRadius: 3 }}>
                <div style={{ width: '72%', height: '100%', background: T.blue, borderRadius: 3 }}></div>
              </div>
              <div style={{ fontSize: 12, color: T.textSoft, marginTop: 6 }}>36 / 50 contracts used this month</div>
            </div>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, fontWeight: 700, fontSize: 13 }}>Billing History</div>
              {[
                { date: '2026-04-01', amount: '£299.00', status: 'Paid' },
                { date: '2026-03-01', amount: '£299.00', status: 'Paid' },
                { date: '2026-02-01', amount: '£299.00', status: 'Paid' },
              ].map((inv, i) => (
                <div key={i} style={{ padding: '10px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', fontSize: 13 }}>
                  <span style={{ color: T.textMid }}>{inv.date}</span>
                  <span style={{ fontFamily: "'IBM Plex Mono', monospace", fontWeight: 600 }}>{inv.amount}</span>
                  <span style={{ color: T.green, fontWeight: 600 }}>✓ {inv.status}</span>
                  <Btn small variant="ghost">Download</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {settingsTab === 'audit' && (
          <div style={{ maxWidth: 860 }}>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ fontWeight: 700, fontSize: 13 }}>Audit Log</div>
                <Btn small variant="secondary">Export CSV</Btn>
              </div>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: '#f8fafc' }}>
                    {['Timestamp', 'User', 'Action', 'Details'].map((h, i) => (
                      <th key={i} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { ts: '2026-04-27 11:42', user: 'James Whitfield', action: 'Contract Uploaded', detail: 'Q1 2026 Outsourcing Review.pdf', color: T.blue },
                    { ts: '2026-04-14 10:05', user: 'Sarah Chen', action: 'Risk Flag Viewed', detail: 'Unlimited Liability · Acme Vendor Agreement', color: T.orange },
                    { ts: '2026-04-11 14:22', user: 'Sarah Chen', action: 'Note Added', detail: 'Acme Vendor Agreement 2024.pdf', color: T.textMid },
                    { ts: '2026-04-10 09:15', user: 'Claude API (claude-opus-4-5)', action: 'Analysis Complete', detail: 'Acme Vendor Agreement 2024.pdf · Score 8.5/10', color: T.green },
                    { ts: '2026-04-10 09:14', user: 'James Whitfield', action: 'Contract Uploaded', detail: 'Acme Vendor Agreement 2024.pdf', color: T.blue },
                    { ts: '2026-04-09 16:30', user: 'James Whitfield', action: 'Contract Exported', detail: 'TechCo Software License 2023.pdf · PDF', color: T.textMid },
                  ].map((e, i) => (
                    <tr key={i} style={{ borderTop: `1px solid ${T.border}` }}>
                      <td style={{ padding: '9px 16px', fontFamily: "'IBM Plex Mono', monospace", fontSize: 11, color: T.textSoft, whiteSpace: 'nowrap' }}>{e.ts}</td>
                      <td style={{ padding: '9px 16px', fontWeight: 500, color: T.textMid }}>{e.user}</td>
                      <td style={{ padding: '9px 16px' }}>
                        <span style={{ color: e.color, fontWeight: 600 }}>{e.action}</span>
                      </td>
                      <td style={{ padding: '9px 16px', color: T.textSoft, maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.detail}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {(settingsTab === 'account' || settingsTab === 'api') && (
          <div style={{ maxWidth: 500, background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '20px 24px' }}>
            <Empty message={`${settingsTab === 'account' ? 'Account' : 'API key'} management coming soon`} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Modal ─────────────────────────────────────────────────
function UploadModal({ onClose }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({});
  const [dragging, setDragging] = useState(false);

  function addFiles(newFiles) {
    const arr = Array.from(newFiles).map(f => ({ name: f.name, size: f.size, id: Math.random() }));
    setFiles(prev => [...prev, ...arr]);
  }

  function startUpload() {
    setUploading(true);
    const init = {};
    files.forEach(f => { init[f.id] = 0; });
    setProgress(init);
    const interval = setInterval(() => {
      setProgress(prev => {
        const next = { ...prev };
        let allDone = true;
        files.forEach(f => {
          if (next[f.id] < 100) { next[f.id] = Math.min(100, next[f.id] + Math.random() * 25); allDone = false; }
        });
        if (allDone) { clearInterval(interval); setTimeout(() => setDone(true), 400); }
        return next;
      });
    }, 300);
  }

  return (
    <Modal title="Upload Contracts for Analysis" onClose={onClose} width={520}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '24px 0' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>✓</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Upload Complete</div>
          <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 20 }}>{files.length} file{files.length !== 1 ? 's' : ''} queued for analysis. You'll be notified when complete.</div>
          <Btn onClick={onClose}>Back to Dashboard</Btn>
        </div>
      ) : (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true); }}
            onDragLeave={() => setDragging(false)}
            onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
            style={{
              border: `2px dashed ${dragging ? T.blue : T.border}`,
              borderRadius: 6, padding: '32px 20px', textAlign: 'center',
              background: dragging ? '#eff6ff' : T.bg, cursor: 'pointer',
              transition: 'all 0.15s', marginBottom: 16,
            }}
            onClick={() => document.getElementById('ci-file-input').click()}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: T.text, marginBottom: 4 }}>Drag & drop contracts here</div>
            <div style={{ fontSize: 12, color: T.textSoft }}>or click to browse</div>
            <div style={{ marginTop: 10, fontSize: 11, color: T.textMute }}>Supports: PDF, DOCX, PPTX (up to 50MB)</div>
            <input id="ci-file-input" type="file" multiple accept=".pdf,.docx,.pptx" style={{ display: 'none' }}
              onChange={e => addFiles(e.target.files)} />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              {files.map(f => (
                <div key={f.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '7px 10px',
                  background: T.bg, borderRadius: 4, marginBottom: 5,
                }}>
                  <span style={{ fontSize: 14 }}>📄</span>
                  <span style={{ flex: 1, fontSize: 12, color: T.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</span>
                  {uploading ? (
                    <div style={{ width: 80, height: 4, background: T.border, borderRadius: 2 }}>
                      <div style={{ width: `${progress[f.id] || 0}%`, height: '100%', background: T.blue, borderRadius: 2, transition: 'width 0.3s' }}></div>
                    </div>
                  ) : (
                    <button onClick={() => setFiles(prev => prev.filter(x => x.id !== f.id))}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.textMute, fontSize: 14 }}>✕</button>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Consent */}
          <label style={{ display: 'flex', gap: 8, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 18, fontSize: 12, color: T.textMid }}>
            <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2 }} />
            I understand ContractIntel will analyse these files using Claude AI for legal risk extraction and data processing.
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn disabled={files.length === 0 || !agreed || uploading} onClick={startUpload}>
              {uploading ? 'Uploading…' : `Upload ${files.length > 0 ? `(${files.length})` : ''}`}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

// ─── Report Modal ─────────────────────────────────────────────────
function ReportModal({ onClose }) {
  const sections = [
    'Executive Summary', 'Contract Inventory', 'Material Contracts Analysis',
    'Key Risks & Issues', 'Liability Exposure Analysis', 'Change of Control Analysis',
    'Renewal Obligations', 'Appendix (Detailed Analysis)',
  ];
  const [checked, setChecked] = useState(new Set(sections));
  const [format, setFormat] = useState('pdf');
  const [analyst, setAnalyst] = useState('James Whitfield');
  const [title, setTitle] = useState('Due Diligence Summary — Q1 2026');
  const [generating, setGenerating] = useState(false);
  const [done, setDone] = useState(false);

  function generate() {
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setDone(true); }, 2000);
  }

  return (
    <Modal title="Generate Due Diligence Report" onClose={onClose} width={500}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 36, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.text, marginBottom: 6 }}>Report Ready</div>
          <div style={{ fontSize: 13, color: T.textSoft, marginBottom: 20 }}>Your {format.toUpperCase()} report has been generated.</div>
          <Btn onClick={onClose}>Download Report</Btn>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSoft, display: 'block', marginBottom: 5 }}>Report Title</label>
            <input value={title} onChange={e => setTitle(e.target.value)}
              style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 4, padding: '7px 10px', fontSize: 13 }} />
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: T.textSoft, display: 'block', marginBottom: 8 }}>Report Sections</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
              {sections.map(s => (
                <label key={s} style={{ display: 'flex', gap: 7, alignItems: 'center', fontSize: 12, color: T.textMid, cursor: 'pointer', padding: '3px 0' }}>
                  <input type="checkbox" checked={checked.has(s)} onChange={e => {
                    const next = new Set(checked);
                    e.target.checked ? next.add(s) : next.delete(s);
                    setChecked(next);
                  }} />
                  {s}
                </label>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', gap: 16, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSoft, display: 'block', marginBottom: 5 }}>Format</label>
              <div style={{ display: 'flex', gap: 8 }}>
                {['pdf', 'pptx'].map(f => (
                  <label key={f} style={{ display: 'flex', gap: 6, alignItems: 'center', cursor: 'pointer', fontSize: 13, color: T.textMid, fontWeight: format === f ? 700 : 400 }}>
                    <input type="radio" name="format" value={f} checked={format === f} onChange={() => setFormat(f)} /> {f.toUpperCase()}
                  </label>
                ))}
              </div>
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: T.textSoft, display: 'block', marginBottom: 5 }}>Analyst Name</label>
              <input value={analyst} onChange={e => setAnalyst(e.target.value)}
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontSize: 13 }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
            <Btn variant="secondary" onClick={onClose}>Cancel</Btn>
            <Btn onClick={generate} disabled={generating}>
              {generating ? 'Generating…' : 'Generate Report'}
            </Btn>
          </div>
        </>
      )}
    </Modal>
  );
}

Object.assign(window, { PortfolioScreen, RenewalCalendarScreen, TemplatesScreen, SettingsScreen, UploadModal, ReportModal });
