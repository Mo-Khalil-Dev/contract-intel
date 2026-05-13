// v4 — Portfolio, Playbook, Renewals, Settings, Upload, Processing

const { useState } = React;

// ─── Portfolio ────────────────────────────────────────────────────
function PortfolioScreen4({ onSelectContract }) {
  const { CONTRACTS, RENEWALS } = window.APP_DATA;
  const complete = CONTRACTS.filter((c) => c.status === 'complete');
  const avgRisk = (complete.reduce((s, c) => s + c.riskScore, 0) / complete.length).toFixed(1);
  const totalRed = complete.reduce((s, c) => s + c.flags.red, 0);
  const unlimitedCount = complete.filter((c) =>
    c.riskFlags.some((f) => f.title.toLowerCase().includes('unlimited')),
  ).length;
  const urgent = RENEWALS.filter((r) => r.daysRemaining < 60).length;

  const kpis = [
    { label: 'Total Contracts', value: CONTRACTS.length, sub: `${complete.length} analysed` },
    {
      label: 'Average Risk',
      value: avgRisk,
      sub: 'Out of 10.0',
      color: wRisk(parseFloat(avgRisk)),
    },
    { label: 'Red Flags', value: totalRed, sub: 'High severity', color: W.red },
    { label: 'Unlimited Liability', value: unlimitedCount, sub: 'Contracts exposed', color: W.red },
    { label: 'Urgent Renewals', value: urgent, sub: 'Within 60 days', color: W.orange },
  ];

  const sorted = [...complete].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <PageShell
      title="Portfolio"
      subtitle={`${complete.length} contracts analysed`}
      actions={
        <>
          <WBtn variant="secondary" small>
            Export CSV
          </WBtn>
          <WBtn small>Generate Report</WBtn>
        </>
      }
    >
      <div style={{ padding: '20px 28px', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* KPI row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 12 }}>
          {kpis.map((k) => (
            <div
              key={k.label}
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                padding: '14px 16px',
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: W.textSoft,
                  textTransform: 'uppercase',
                  letterSpacing: '0.07em',
                  marginBottom: 6,
                }}
              >
                {k.label}
              </div>
              <div
                style={{
                  fontSize: 26,
                  fontWeight: 800,
                  color: k.color || W.text,
                  fontFamily: "'IBM Plex Mono',monospace",
                  lineHeight: 1,
                }}
              >
                {k.value}
              </div>
              <div style={{ fontSize: 11, color: W.textMute, marginTop: 4 }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Table + liability */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16 }}>
          {/* Risk table */}
          <div
            style={{
              background: W.surface,
              border: `1px solid ${W.border}`,
              borderRadius: 6,
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '12px 16px',
                borderBottom: `1px solid ${W.border}`,
                fontSize: 13,
                fontWeight: 700,
                color: W.text,
              }}
            >
              Contracts by Risk Score
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ background: W.bg }}>
                  {['#', 'Contract', 'Type', 'Risk', 'Flags', 'Expiry'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '8px 14px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 700,
                        color: W.textSoft,
                        textTransform: 'uppercase',
                        letterSpacing: '0.06em',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sorted.map((c, i) => (
                  <tr
                    key={c.id}
                    onClick={() => onSelectContract(c.id)}
                    style={{ borderTop: `1px solid ${W.border}`, cursor: 'pointer' }}
                    onMouseEnter={(e) => (e.currentTarget.style.background = W.accentBg)}
                    onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                  >
                    <td
                      style={{
                        padding: '9px 14px',
                        color: W.textMute,
                        fontSize: 11,
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >
                      {i + 1}
                    </td>
                    <td style={{ padding: '9px 14px', maxWidth: 200 }}>
                      <div
                        style={{
                          fontWeight: 600,
                          color: W.text,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {c.name.replace(/\.[^.]+$/, '')}
                      </div>
                      <div style={{ fontSize: 10, color: W.textSoft }}>{c.parties[0]}</div>
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <WTypePill type={c.type} />
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <RiskBar score={c.riskScore} />
                    </td>
                    <td style={{ padding: '9px 14px' }}>
                      <WFlags flags={c.flags} />
                    </td>
                    <td
                      style={{
                        padding: '9px 14px',
                        color: W.textSoft,
                        fontSize: 11,
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >
                      {c.terminationDate || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Side column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Liability */}
            <div
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: W.text, marginBottom: 12 }}>
                Liability Exposure
              </div>
              {[
                { label: 'Capped (2× annual)', count: 4, pct: 50, color: W.green },
                { label: 'Other caps', count: 2, pct: 25, color: W.orange },
                {
                  label: 'Unlimited / Unknown',
                  count: unlimitedCount,
                  pct: (unlimitedCount / complete.length) * 100,
                  color: W.red,
                },
              ].map((row) => (
                <div key={row.label} style={{ marginBottom: 12 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}
                  >
                    <span style={{ fontSize: 11, color: W.textMid }}>{row.label}</span>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: row.color,
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >
                      {row.count}
                    </span>
                  </div>
                  <div
                    style={{ height: 4, background: W.border, borderRadius: 2, overflow: 'hidden' }}
                  >
                    <div
                      style={{
                        width: `${row.pct}%`,
                        height: '100%',
                        background: row.color,
                        borderRadius: 2,
                      }}
                    ></div>
                  </div>
                </div>
              ))}
              {unlimitedCount > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '7px 10px',
                    background: W.redBg,
                    border: `1px solid ${W.redBorder}`,
                    borderRadius: 5,
                    fontSize: 11,
                    color: W.red,
                  }}
                >
                  ⚠ {unlimitedCount} contract{unlimitedCount !== 1 ? 's' : ''} with unlimited
                  liability
                </div>
              )}
            </div>

            {/* Renewals */}
            <div
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                padding: '14px 16px',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: W.text, marginBottom: 10 }}>
                Upcoming Renewals
              </div>
              {RENEWALS.filter((r) => r.daysRemaining < 90)
                .sort((a, b) => a.daysRemaining - b.daysRemaining)
                .slice(0, 4)
                .map((r) => {
                  const rc =
                    r.daysRemaining < 0
                      ? W.red
                      : r.daysRemaining < 30
                        ? W.red
                        : r.daysRemaining < 60
                          ? W.orange
                          : W.green;
                  return (
                    <div
                      key={r.id}
                      style={{
                        padding: '7px 0',
                        borderBottom: `1px solid ${W.border}`,
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0, marginRight: 8 }}>
                        <div
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: W.text,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {r.name.replace(/\.[^.]+$/, '').slice(0, 24)}
                        </div>
                        <div style={{ fontSize: 10, color: W.textSoft }}>
                          {r.noticePeriod} notice
                        </div>
                      </div>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: rc,
                          fontFamily: "'IBM Plex Mono',monospace",
                          flexShrink: 0,
                        }}
                      >
                        {r.daysRemaining < 0
                          ? `${Math.abs(r.daysRemaining)}d late`
                          : `${r.daysRemaining}d`}
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

// ─── Playbook ─────────────────────────────────────────────────────
const PB_CLAUSES = [
  {
    id: 'liability',
    cat: 'Risk',
    clause: 'Liability Cap',
    position: 'Capped at 2× annual contract value',
    acceptable: 'Any cap ≥ 1× annual value',
    flagMatch: (f) => f.title.toLowerCase().includes('liability'),
  },
  {
    id: 'indemnification',
    cat: 'Risk',
    clause: 'Indemnification',
    position: 'Mutual and reciprocal',
    acceptable: 'Minor asymmetry tolerated if limited',
    flagMatch: (f) => f.title.toLowerCase().includes('indemni'),
  },
  {
    id: 'ip',
    cat: 'Intellectual Property',
    clause: 'IP Ownership',
    position: 'Custom deliverables owned by us',
    acceptable: 'Joint ownership for R&D only',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('ip') || f.title.toLowerCase().includes('intellectual'),
  },
  {
    id: 'termination',
    cat: 'Risk',
    clause: 'Termination',
    position: '30 days notice, no penalty',
    acceptable: 'Up to 60 days, no financial penalty',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('termination') || f.title.toLowerCase().includes('penalty'),
  },
  {
    id: 'change_control',
    cat: 'Risk',
    clause: 'Change of Control',
    position: 'Right to terminate within 90 days of acquisition',
    acceptable: 'Minimum 60-day opt-out',
    flagMatch: (f) => f.title.toLowerCase().includes('change of control'),
  },
  {
    id: 'auto_renewal',
    cat: 'Commercial',
    clause: 'Auto-Renewal',
    position: 'No automatic renewal without consent',
    acceptable: 'OK if notice period ≥ 90 days',
    flagMatch: (f) => f.title.toLowerCase().includes('renewal'),
  },
  {
    id: 'dispute',
    cat: 'Governance',
    clause: 'Dispute Resolution',
    position: 'English law, England & Wales courts',
    acceptable: 'London arbitration acceptable',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('dispute') || f.title.toLowerCase().includes('arbitration'),
  },
  {
    id: 'price_escalation',
    cat: 'Commercial',
    clause: 'Price Escalation',
    position: 'CPI-linked, capped at 3% p.a.',
    acceptable: 'Fixed ≤ 3% p.a.',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('escalation') || f.title.toLowerCase().includes('price'),
  },
  {
    id: 'confidentiality',
    cat: 'Governance',
    clause: 'Confidentiality',
    position: 'Mutual NDA, 3-year post-term',
    acceptable: '2-year minimum; mutual',
    flagMatch: (f) => f.title.toLowerCase().includes('confidential'),
  },
  {
    id: 'sla',
    cat: 'Commercial',
    clause: 'SLA / Uptime',
    position: '99.9% uptime, credits ≥ 15% monthly fee',
    acceptable: '99.5% min; auto credits',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('sla') || f.title.toLowerCase().includes('uptime'),
  },
];

function getStatus(clause, contract) {
  if (!contract) return 'unknown';
  const m = contract.riskFlags.find((f) => clause.flagMatch(f));
  if (!m) return 'pass';
  if (m.severity === 'red') return 'fail';
  if (m.severity === 'orange') return 'warn';
  return 'pass';
}

function PlaybookScreen4({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const complete = CONTRACTS.filter((c) => c.status === 'complete');
  const [selectedId, setSelectedId] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [positions, setPositions] = useState(
    Object.fromEntries(PB_CLAUSES.map((c) => [c.id, c.position])),
  );
  const contract = complete.find((c) => c.id === selectedId) || null;
  const cats = [...new Set(PB_CLAUSES.map((c) => c.cat))];
  const sm = {
    pass: { c: W.green, bg: W.greenBg, icon: '✓', l: 'Compliant' },
    warn: { c: W.orange, bg: W.orangeBg, icon: '⚠', l: 'Deviation' },
    fail: { c: W.red, bg: W.redBg, icon: '✕', l: 'Non-compliant' },
    unknown: { c: W.textMute, bg: W.bg, icon: '—', l: 'N/A' },
  };
  const counts = contract
    ? {
        pass: PB_CLAUSES.filter((c) => getStatus(c, contract) === 'pass').length,
        warn: PB_CLAUSES.filter((c) => getStatus(c, contract) === 'warn').length,
        fail: PB_CLAUSES.filter((c) => getStatus(c, contract) === 'fail').length,
      }
    : null;

  return (
    <PageShell title="Playbook" subtitle="Your standard positions on key clauses">
      <div style={{ padding: '0 28px 28px' }}>
        {/* Contract selector strip */}
        <div
          style={{
            padding: '12px 0',
            borderBottom: `1px solid ${W.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            flexWrap: 'wrap',
            marginBottom: 0,
          }}
        >
          <span style={{ fontSize: 12, color: W.textSoft }}>Compare against:</span>
          <select
            value={selectedId || ''}
            onChange={(e) => setSelectedId(e.target.value ? Number(e.target.value) : null)}
            style={{
              background: W.bg,
              border: `1px solid ${W.border2}`,
              borderRadius: 5,
              padding: '5px 10px',
              fontSize: 12,
              color: W.text,
              minWidth: 240,
            }}
          >
            <option value="">— Select a contract to compare —</option>
            {complete.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.replace(/\.[^.]+$/, '')}
              </option>
            ))}
          </select>
          {contract && (
            <>
              <span style={{ width: 1, height: 14, background: W.border }}></span>
              <span style={{ fontSize: 12, color: W.green, fontWeight: 600 }}>
                ✓ {counts.pass} compliant
              </span>
              {counts.warn > 0 && (
                <span style={{ fontSize: 12, color: W.orange, fontWeight: 600 }}>
                  ⚠ {counts.warn} deviations
                </span>
              )}
              {counts.fail > 0 && (
                <span style={{ fontSize: 12, color: W.red, fontWeight: 600 }}>
                  ✕ {counts.fail} non-compliant
                </span>
              )}
              <div
                style={{
                  flex: 1,
                  maxWidth: 160,
                  height: 4,
                  background: W.border,
                  borderRadius: 3,
                  overflow: 'hidden',
                  display: 'flex',
                }}
              >
                <div
                  style={{
                    width: `${(counts.pass / PB_CLAUSES.length) * 100}%`,
                    background: W.green,
                    height: '100%',
                  }}
                ></div>
                <div
                  style={{
                    width: `${(counts.warn / PB_CLAUSES.length) * 100}%`,
                    background: W.orange,
                    height: '100%',
                  }}
                ></div>
                <div
                  style={{
                    width: `${(counts.fail / PB_CLAUSES.length) * 100}%`,
                    background: W.red,
                    height: '100%',
                  }}
                ></div>
              </div>
              <span
                style={{ fontSize: 11, color: W.textSoft, fontFamily: "'IBM Plex Mono',monospace" }}
              >
                {Math.round((counts.pass / PB_CLAUSES.length) * 100)}% aligned
              </span>
              <button
                onClick={() => onSelectContract(contract.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 12,
                  color: W.accent,
                  fontWeight: 600,
                  padding: 0,
                  marginLeft: 'auto',
                }}
              >
                Open contract →
              </button>
            </>
          )}
        </div>

        {cats.map((cat) => (
          <div key={cat} style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: W.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 0 6px',
                borderBottom: `1px solid ${W.border}`,
              }}
            >
              {cat}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {[
                    'Clause',
                    'Your Standard Position',
                    contract && 'Contract Language',
                    contract ? 'Status' : 'Acceptable Range',
                  ]
                    .filter(Boolean)
                    .map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '7px 10px 7px 0',
                          textAlign: 'left',
                          fontSize: 10,
                          fontWeight: 700,
                          color: W.textMute,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: `1px solid ${W.border}`,
                          width: h === 'Clause' ? '16%' : undefined,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {PB_CLAUSES.filter((c) => c.cat === cat).map((pc) => {
                  const status = getStatus(pc, contract);
                  const s = sm[status];
                  const flag = contract?.riskFlags.find((f) => pc.flagMatch(f));
                  return (
                    <tr key={pc.id} style={{ borderBottom: `1px solid ${W.border}` }}>
                      <td style={{ padding: '10px 10px 10px 0', verticalAlign: 'top' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: W.text }}>
                          {pc.clause}
                        </span>
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'top' }}>
                        {editingId === pc.id ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <textarea
                              value={positions[pc.id]}
                              onChange={(e) =>
                                setPositions((p) => ({ ...p, [pc.id]: e.target.value }))
                              }
                              rows={2}
                              style={{
                                width: '100%',
                                background: W.bg,
                                border: `1px solid ${W.accent}`,
                                borderRadius: 4,
                                padding: '5px 7px',
                                fontSize: 12,
                                color: W.text,
                                resize: 'none',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 5 }}>
                              <WBtn small onClick={() => setEditingId(null)}>
                                Save
                              </WBtn>
                              <WBtn small variant="ghost" onClick={() => setEditingId(null)}>
                                Cancel
                              </WBtn>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}
                            onMouseEnter={(e) => {
                              const b = e.currentTarget.querySelector('.eb');
                              if (b) b.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              const b = e.currentTarget.querySelector('.eb');
                              if (b) b.style.opacity = '0';
                            }}
                          >
                            <span
                              style={{ fontSize: 12, color: W.textMid, lineHeight: 1.5, flex: 1 }}
                            >
                              {positions[pc.id]}
                            </span>
                            <button
                              className="eb"
                              onClick={() => setEditingId(pc.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 10,
                                color: W.textMute,
                                opacity: 0,
                                transition: 'opacity 0.1s',
                                flexShrink: 0,
                                marginTop: 2,
                              }}
                            >
                              Edit
                            </button>
                          </div>
                        )}
                      </td>
                      {contract && (
                        <td style={{ padding: '10px', verticalAlign: 'top' }}>
                          {flag ? (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: W.textMid,
                                  fontStyle: 'italic',
                                  lineHeight: 1.5,
                                  marginBottom: 2,
                                }}
                              >
                                {flag.description.slice(0, 80)}…
                              </div>
                              <span style={{ fontSize: 10, color: W.textSoft }}>
                                Pg {flag.page}, §{flag.section}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: W.green }}>
                              No deviations flagged
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '10px', verticalAlign: 'top' }}>
                        {contract ? (
                          <div>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: s.bg,
                                borderRadius: 4,
                                padding: '3px 8px',
                              }}
                            >
                              <span style={{ fontSize: 12, color: s.c, fontWeight: 700 }}>
                                {s.icon}
                              </span>
                              <span style={{ fontSize: 11, color: s.c, fontWeight: 600 }}>
                                {s.l}
                              </span>
                            </span>
                            {flag && flag.severity !== 'green' && (
                              <div style={{ marginTop: 5 }}>
                                <button
                                  onClick={() => onSelectContract(contract.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 10,
                                    color: W.accent,
                                    fontWeight: 600,
                                    padding: 0,
                                  }}
                                >
                                  View flag →
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span style={{ fontSize: 11, color: W.textSoft, lineHeight: 1.5 }}>
                            {pc.acceptable}
                          </span>
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

// ─── Renewals ─────────────────────────────────────────────────────
function RenewalsScreen4() {
  const { RENEWALS } = window.APP_DATA;
  const [selected, setSelected] = useState(null);
  function rc(r) {
    return r.daysRemaining < 0
      ? W.red
      : r.daysRemaining < 30
        ? W.red
        : r.daysRemaining < 60
          ? W.orange
          : W.green;
  }
  return (
    <PageShell title="Renewals" subtitle="Upcoming contract renewals and notice deadlines">
      <div
        style={{
          padding: '20px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 20,
          maxWidth: 1000,
        }}
      >
        <div
          style={{
            background: W.surface,
            border: `1px solid ${W.border}`,
            borderRadius: 6,
            overflow: 'hidden',
          }}
        >
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: W.bg }}>
                {['Contract', 'Renewal Date', 'Days', 'Notice Required', 'Risk'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '9px 14px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      color: W.textSoft,
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                    }}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...RENEWALS]
                .sort((a, b) => a.daysRemaining - b.daysRemaining)
                .map((r) => (
                  <tr
                    key={r.id}
                    onClick={() => setSelected(r.id === selected ? null : r.id)}
                    style={{
                      borderTop: `1px solid ${W.border}`,
                      cursor: 'pointer',
                      background: selected === r.id ? W.accentBg : '',
                    }}
                    onMouseEnter={(e) => {
                      if (selected !== r.id) e.currentTarget.style.background = W.bg;
                    }}
                    onMouseLeave={(e) => {
                      if (selected !== r.id) e.currentTarget.style.background = '';
                    }}
                  >
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 600,
                        color: W.text,
                        borderLeft: `3px solid ${rc(r)}`,
                      }}
                    >
                      {r.name.replace(/\.[^.]+$/, '')}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        color: W.textMid,
                        fontFamily: "'IBM Plex Mono',monospace",
                        fontSize: 11,
                      }}
                    >
                      {r.renewalDate}
                    </td>
                    <td
                      style={{
                        padding: '10px 14px',
                        fontWeight: 700,
                        color: rc(r),
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >
                      {r.daysRemaining < 0
                        ? `${Math.abs(r.daysRemaining)}d overdue`
                        : r.daysRemaining === 0
                          ? 'TODAY'
                          : `${r.daysRemaining}d`}
                    </td>
                    <td style={{ padding: '10px 14px', color: W.textSoft }}>{r.noticePeriod}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <RiskBar score={r.riskScore} />
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
        <div>
          {selected ? (
            (() => {
              const r = RENEWALS.find((x) => x.id === selected);
              if (!r) return null;
              const color = rc(r);
              return (
                <div
                  style={{
                    background: W.surface,
                    border: `1px solid ${W.border}`,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      padding: '12px 14px',
                      background: wRiskBg(r.riskScore),
                      borderBottom: `1px solid ${W.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color,
                        textTransform: 'uppercase',
                        marginBottom: 3,
                      }}
                    >
                      {r.daysRemaining < 0
                        ? '⚠ Overdue'
                        : r.daysRemaining < 30
                          ? '⚠ Urgent'
                          : 'Renewal Detail'}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: W.text }}>{r.name}</div>
                  </div>
                  <div style={{ padding: 14 }}>
                    {[
                      ['Renewal Date', r.renewalDate],
                      [
                        'Days',
                        r.daysRemaining < 0
                          ? `${Math.abs(r.daysRemaining)}d overdue`
                          : `${r.daysRemaining} days`,
                      ],
                      ['Notice Period', r.noticePeriod],
                      ['Risk Score', `${r.riskScore}/10`],
                    ].map(([k, v]) => (
                      <div
                        key={k}
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          padding: '7px 0',
                          borderBottom: `1px solid ${W.border}`,
                          fontSize: 12,
                        }}
                      >
                        <span style={{ color: W.textSoft }}>{k}</span>
                        <span style={{ fontWeight: 600, color: W.text }}>{v}</span>
                      </div>
                    ))}
                    <div
                      style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}
                    >
                      <WBtn style={{ width: '100%', justifyContent: 'center' }}>View Contract</WBtn>
                      <WBtn variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        Acknowledge
                      </WBtn>
                    </div>
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{ color: W.textMute, fontSize: 12 }}>Select a renewal for details</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Settings ─────────────────────────────────────────────────────
function SettingsScreen4() {
  const { TEAM_MEMBERS } = window.APP_DATA;
  const [tab, setTab] = useState('team');
  return (
    <PageShell title="Settings">
      <div style={{ padding: '0 28px' }}>
        <WTabs
          tabs={[
            { id: 'team', label: 'Team' },
            { id: 'billing', label: 'Billing' },
            { id: 'audit', label: 'Audit Log' },
          ]}
          active={tab}
          onChange={setTab}
        />
        <div style={{ padding: '20px 0', maxWidth: 860 }}>
          {tab === 'team' && (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: W.text }}>Team Members</span>
                <WBtn small>+ Invite Member</WBtn>
              </div>
              <div
                style={{
                  background: W.surface,
                  border: `1px solid ${W.border}`,
                  borderRadius: 6,
                  overflow: 'hidden',
                }}
              >
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: W.bg }}>
                      {['Member', 'Role', 'Last Active', 'Status', 'Actions'].map((h) => (
                        <th
                          key={h}
                          style={{
                            padding: '9px 14px',
                            textAlign: 'left',
                            fontSize: 10,
                            fontWeight: 700,
                            color: W.textSoft,
                            textTransform: 'uppercase',
                            letterSpacing: '0.06em',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {TEAM_MEMBERS.map((m) => (
                      <tr key={m.id} style={{ borderTop: `1px solid ${W.border}` }}>
                        <td style={{ padding: '10px 14px' }}>
                          <div style={{ fontWeight: 600, color: W.text }}>{m.name}</div>
                          <div style={{ fontSize: 11, color: W.textSoft }}>{m.email}</div>
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <select
                            defaultValue={m.role}
                            style={{
                              background: W.bg,
                              border: `1px solid ${W.border}`,
                              borderRadius: 4,
                              padding: '3px 7px',
                              fontSize: 12,
                            }}
                          >
                            <option>Admin</option>
                            <option>Reviewer</option>
                            <option>Viewer</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 14px', color: W.textSoft, fontSize: 12 }}>
                          {m.lastLogin}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {m.status === 'pending' ? (
                            <span style={{ color: W.orange, fontSize: 12, fontWeight: 600 }}>
                              ⏳ Pending
                            </span>
                          ) : (
                            <span style={{ color: W.green, fontSize: 12, fontWeight: 600 }}>
                              ● Active
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          {m.id !== 1 && (
                            <WBtn small variant="danger">
                              Remove
                            </WBtn>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
          {tab === 'billing' && (
            <div style={{ maxWidth: 480 }}>
              <div
                style={{
                  background: W.surface,
                  border: `1px solid ${W.border}`,
                  borderRadius: 6,
                  padding: '18px 20px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: 14,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: W.textSoft,
                        textTransform: 'uppercase',
                        marginBottom: 4,
                      }}
                    >
                      Current Plan
                    </div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: W.text }}>Professional</div>
                    <div style={{ fontSize: 12, color: W.textSoft, marginTop: 2 }}>
                      £299/month · 50 contracts/month
                    </div>
                  </div>
                  <WBtn variant="secondary" small>
                    Upgrade
                  </WBtn>
                </div>
                <div style={{ height: 4, background: W.border, borderRadius: 3 }}>
                  <div
                    style={{ width: '72%', height: '100%', background: W.accent, borderRadius: 3 }}
                  ></div>
                </div>
                <div style={{ fontSize: 11, color: W.textSoft, marginTop: 5 }}>
                  36 / 50 contracts used this month
                </div>
              </div>
            </div>
          )}
          {tab === 'audit' && (
            <div style={{ fontSize: 12, color: W.textSoft }}>Audit log — full detail in v1.</div>
          )}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Upload Screen ────────────────────────────────────────────────
function UploadScreen4({ onBack, onDone }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [dragging, setDragging] = useState(false);
  function addFiles(f) {
    setFiles((p) => [
      ...p,
      ...Array.from(f).map((x) => ({ name: x.name, size: x.size, id: Math.random() })),
    ]);
  }
  function fmt(b) {
    if (!b) return '';
    if (b < 1024) return `${b}B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
    return `${(b / 1048576).toFixed(1)}MB`;
  }
  return (
    <PageShell
      title="Upload Contracts"
      subtitle="Files are processed asynchronously — you'll be notified when done"
      actions={
        <WBtn variant="secondary" onClick={onBack}>
          ← Back
        </WBtn>
      }
    >
      <div style={{ padding: '32px 28px', display: 'flex', justifyContent: 'center' }}>
        <div style={{ width: '100%', maxWidth: 560 }}>
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragging(false);
              addFiles(e.dataTransfer.files);
            }}
            onClick={() => document.getElementById('v4-file').click()}
            style={{
              border: `2px dashed ${dragging ? W.accent : W.border2}`,
              borderRadius: 8,
              padding: '36px 24px',
              textAlign: 'center',
              background: dragging ? W.accentBg : W.surface,
              cursor: 'pointer',
              marginBottom: 16,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 26, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: W.text, marginBottom: 4 }}>
              Drag & drop contracts here
            </div>
            <div style={{ fontSize: 12, color: W.textSoft, marginBottom: 10 }}>
              or click to browse
            </div>
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                color: W.textMute,
                background: W.bg,
                borderRadius: 4,
                padding: '3px 10px',
              }}
            >
              PDF · DOCX · PPTX — max 50 MB
            </div>
            <input
              id="v4-file"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          {files.length > 0 && (
            <div
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  background: W.bg,
                  borderBottom: `1px solid ${W.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: W.textSoft,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                {files.length} file{files.length !== 1 ? 's' : ''} selected
              </div>
              {files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: `1px solid ${W.border}`,
                  }}
                >
                  <span>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: W.text }}>{f.name}</div>
                    {f.size > 0 && (
                      <div style={{ fontSize: 11, color: W.textSoft }}>{fmt(f.size)}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: W.textMute,
                      fontSize: 14,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: 22,
              fontSize: 12,
              color: W.textMid,
              lineHeight: 1.5,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2, flexShrink: 0 }}
            />
            I understand that ContractIntel will process these files using Claude AI to extract
            legal terms and identify risk clauses. Files are stored securely.
          </label>
          <div style={{ display: 'flex', gap: 8 }}>
            <WBtn variant="secondary" onClick={onBack}>
              Cancel
            </WBtn>
            <WBtn disabled={files.length === 0 || !agreed} onClick={() => onDone(files)}>
              Submit{' '}
              {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : ''} for
              Analysis
            </WBtn>
          </div>
        </div>
      </div>
    </PageShell>
  );
}

// ─── Processing Screen ────────────────────────────────────────────
function ProcessingScreen4({ files, onBack }) {
  return (
    <PageShell title="Analysis in Progress">
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 28px',
        }}
      >
        <div style={{ maxWidth: 500, textAlign: 'center' }}>
          <div style={{ marginBottom: 24, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                style={{ animation: 'spin 2s linear infinite' }}
              >
                <circle cx="32" cy="32" r="26" fill="none" stroke={W.border} strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke={W.accent}
                  strokeWidth="4"
                  strokeDasharray="40 124"
                  strokeLinecap="round"
                />
              </svg>
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                }}
              >
                📄
              </div>
            </div>
          </div>
          <h2 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: W.text }}>
            Analysis in progress
          </h2>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: W.textSoft, lineHeight: 1.6 }}>
            ContractIntel is extracting terms, identifying risk clauses, and scoring your contracts
            using Claude AI.
          </p>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: W.textMute, lineHeight: 1.6 }}>
            This runs asynchronously — you'll be notified when results are ready. You can safely
            close this page.
          </p>
          {files && files.length > 0 && (
            <div
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                overflow: 'hidden',
                marginBottom: 24,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  background: W.bg,
                  borderBottom: `1px solid ${W.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: W.textSoft,
                  textTransform: 'uppercase',
                }}
              >
                {files.length} file{files.length !== 1 ? 's' : ''} queued
              </div>
              {files.map((f, i) => (
                <div
                  key={f.id || i}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '9px 14px',
                    borderBottom: i < files.length - 1 ? `1px solid ${W.border}` : 'none',
                  }}
                >
                  <span>📄</span>
                  <span style={{ flex: 1, fontSize: 13, color: W.textMid }}>{f.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: W.accent,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 5,
                        height: 5,
                        borderRadius: '50%',
                        background: W.accent,
                        display: 'inline-block',
                        animation: 'pulse 1.4s infinite',
                        animationDelay: `${i * 0.2}s`,
                      }}
                    ></span>
                    Queued
                  </span>
                </div>
              ))}
            </div>
          )}
          <div
            style={{
              background: W.surface,
              border: `1px solid ${W.border}`,
              borderRadius: 6,
              padding: '16px 18px',
              textAlign: 'left',
              marginBottom: 20,
            }}
          >
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: W.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              What happens next
            </div>
            {[
              ['1', 'Text extraction', 'PDF/DOCX content prepared for analysis'],
              ['2', 'AI analysis', 'Claude identifies parties, dates, financial terms and risks'],
              ['3', 'Risk scoring', 'Each clause scored and flagged by severity'],
              ['4', 'Notification', 'You receive an in-app notification when results are ready'],
            ].map(([n, l, d]) => (
              <div key={n} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: W.bg,
                    border: `1px solid ${W.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: W.textSoft,
                    flexShrink: 0,
                  }}
                >
                  {n}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: W.text }}>{l}</div>
                  <div style={{ fontSize: 11, color: W.textSoft, marginTop: 1 }}>{d}</div>
                </div>
              </div>
            ))}
          </div>
          <WBtn variant="secondary" onClick={onBack}>
            Back to Contracts
          </WBtn>
        </div>
      </div>
      <style>{`@keyframes spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}} @keyframes pulse{0%,100%{opacity:1}50%{opacity:0.3}}`}</style>
    </PageShell>
  );
}

Object.assign(window, {
  PortfolioScreen4,
  PlaybookScreen4,
  RenewalsScreen4,
  SettingsScreen4,
  UploadScreen4,
  ProcessingScreen4,
});
