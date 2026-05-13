
// Dashboard + Contract Detail screens

const { useState, useRef } = React;

// ─── Dashboard ──────────────────────────────────────────────────
function DashboardScreen({ onSelect, onUpload }) {
  const { CONTRACTS } = window.APP_DATA;
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('riskScore');
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const filtered = CONTRACTS.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.parties.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterRisk === 'high' && c.riskScore < 7) return false;
    if (filterRisk === 'medium' && (c.riskScore < 4 || c.riskScore >= 7)) return false;
    if (filterRisk === 'low' && c.riskScore >= 4) return false;
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    return true;
  }).sort((a, b) => {
    if (sortBy === 'riskScore') return b.riskScore - a.riskScore;
    if (sortBy === 'date') return new Date(b.uploadDate) - new Date(a.uploadDate);
    if (sortBy === 'flags') return (b.flags.red + b.flags.orange) - (a.flags.red + a.flags.orange);
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.ceil(filtered.length / PER_PAGE);
  const paged = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  const sel = (id, val, set) => (
    <select value={id} onChange={e => { set(e.target.value); setPage(1); }} style={{
      border: `1px solid ${T.border}`, borderRadius: 4, padding: '5px 8px',
      fontSize: 12, color: T.textMid, background: '#fff', cursor: 'pointer',
    }}>{val}</select>
  );

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'auto' }}>
      <PageHeader title="My Contracts"
        subtitle={`${filtered.length} contract${filtered.length !== 1 ? 's' : ''} — sorted by ${sortBy === 'riskScore' ? 'risk score' : sortBy}`}
        actions={<Btn onClick={onUpload}>+ Upload</Btn>}
      />

      {/* Filters */}
      <div style={{
        padding: '12px 28px', background: T.surface,
        borderBottom: `1px solid ${T.border}`, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center',
      }}>
        <input value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
          placeholder="Search by name, party, keyword…"
          style={{
            flex: 1, minWidth: 220, border: `1px solid ${T.border}`, borderRadius: 4,
            padding: '5px 10px', fontSize: 12, color: T.text, background: '#fff',
          }} />
        {sel(filterRisk, <>
          <option value="all">Risk: All</option>
          <option value="high">High (7–10)</option>
          <option value="medium">Medium (4–7)</option>
          <option value="low">Low (0–4)</option>
        </>, setFilterRisk)}
        {sel(filterStatus, <>
          <option value="all">Status: All</option>
          <option value="complete">Complete</option>
          <option value="processing">Processing</option>
          <option value="error">Error</option>
        </>, setFilterStatus)}
        {sel(filterType, <>
          <option value="all">Type: All</option>
          <option value="vendor">Vendor</option>
          <option value="license">License</option>
          <option value="partnership">Partnership</option>
          <option value="customer">Customer</option>
          <option value="lease">Lease</option>
          <option value="nda">NDA</option>
        </>, setFilterType)}
        {sel(sortBy, <>
          <option value="riskScore">Sort: Risk Score</option>
          <option value="date">Sort: Upload Date</option>
          <option value="flags">Sort: Flag Count</option>
          <option value="name">Sort: Name A–Z</option>
        </>, setSortBy)}
      </div>

      {/* Table */}
      <div style={{ padding: '20px 28px', flex: 1 }}>
        <div style={{
          background: T.surface, border: `1px solid ${T.border}`,
          borderRadius: 5, overflow: 'hidden',
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: '#f8fafc', borderBottom: `1px solid ${T.border}` }}>
                {['Contract', 'Type', 'Risk Score', 'Flags', 'Parties', 'Uploaded', 'Status', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '9px 14px', textAlign: 'left', fontSize: 11,
                    fontWeight: 700, color: T.textSoft, textTransform: 'uppercase',
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((c, i) => (
                <tr key={c.id} onClick={() => c.status === 'complete' && onSelect(c.id)}
                  style={{
                    borderBottom: `1px solid ${T.border}`,
                    cursor: c.status === 'complete' ? 'pointer' : 'default',
                    background: i % 2 === 1 ? '#fbfcfd' : '#fff',
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={e => { if (c.status === 'complete') e.currentTarget.style.background = '#eff6ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = i % 2 === 1 ? '#fbfcfd' : '#fff'; }}
                >
                  <td style={{ padding: '10px 14px', maxWidth: 220 }}>
                    <div style={{ fontWeight: 600, color: T.text, fontSize: 13, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 200 }}>
                      {c.name}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px' }}><TypeBadge type={c.type} /></td>
                  <td style={{ padding: '10px 14px' }}>
                    {c.status === 'complete' ? <RiskBadge score={c.riskScore} /> : <span style={{ color: T.textMute, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {c.status === 'complete' ? <FlagCount flags={c.flags} /> : <span style={{ color: T.textMute, fontSize: 12 }}>—</span>}
                  </td>
                  <td style={{ padding: '10px 14px', color: T.textMid, fontSize: 12, maxWidth: 160 }}>
                    <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {c.parties[0]}
                    </div>
                  </td>
                  <td style={{ padding: '10px 14px', color: T.textSoft, fontSize: 12, fontFamily: "'IBM Plex Mono', monospace", whiteSpace: 'nowrap' }}>
                    {c.uploadDate}
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    <StatusBadge status={c.status} progress={c.progress} />
                  </td>
                  <td style={{ padding: '10px 14px' }}>
                    {c.status === 'complete' && (
                      <span style={{ color: T.blue, fontSize: 13, fontWeight: 600 }}>→</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filtered.length === 0 && <Empty message="No contracts match your filters" />}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 4, marginTop: 16 }}>
            {Array.from({ length: totalPages }, (_, i) => (
              <button key={i} onClick={() => setPage(i + 1)} style={{
                width: 28, height: 28, borderRadius: 4, border: `1px solid ${T.border}`,
                background: page === i + 1 ? T.blue : '#fff', color: page === i + 1 ? '#fff' : T.textMid,
                cursor: 'pointer', fontSize: 12, fontWeight: 600,
              }}>{i + 1}</button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ContractDetail ─────────────────────────────────────────────
function ContractDetailScreen({ contractId, onBack, onNav }) {
  const { CONTRACTS } = window.APP_DATA;
  const [tab, setTab] = useState('overview');
  const [editField, setEditField] = useState(null);
  const [notes, setNotes] = useState([
    { id: 1, author: 'Sarah Chen', date: '2026-04-11', text: 'Check if liability cap is negotiable before next review.', resolved: false }
  ]);
  const [noteInput, setNoteInput] = useState('');
  const [flagFilter, setFlagFilter] = useState('all');
  const [dismissedFlags, setDismissedFlags] = useState([]);
  const [resolvedFlags, setResolvedFlags] = useState([]);
  const [expandedFlag, setExpandedFlag] = useState(null);

  const idx = CONTRACTS.findIndex(c => c.id === contractId);
  const c = CONTRACTS[idx];
  if (!c) return null;

  const prev = CONTRACTS[idx - 1];
  const next = CONTRACTS[idx + 1];
  const totalFlags = c.riskFlags.length;

  const visibleFlags = c.riskFlags.filter(f => {
    if (dismissedFlags.includes(f.id)) return false;
    if (flagFilter === 'resolved') return resolvedFlags.includes(f.id);
    if (flagFilter !== 'all' && f.severity !== flagFilter) return false;
    if (flagFilter === 'open') return !resolvedFlags.includes(f.id);
    return true;
  });

  const tabDefs = [
    { id: 'overview', label: 'Overview' },
    { id: 'risks', label: `Risk Flags (${c.flags.red + c.flags.orange})` },
    { id: 'document', label: 'Document' },
    { id: 'history', label: 'History' },
  ];

  function Field({ label, value, field }) {
    const isEditing = editField === field;
    const [val, setVal] = useState(value || '—');
    return (
      <div style={{ padding: '8px 0', display: 'flex', alignItems: 'flex-start', gap: 8, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ width: 180, flexShrink: 0, fontSize: 12, color: T.textSoft, paddingTop: 2 }}>{label}</div>
        {isEditing ? (
          <div style={{ flex: 1, display: 'flex', gap: 6 }}>
            <input value={val} onChange={e => setVal(e.target.value)}
              autoFocus
              style={{ flex: 1, border: `1px solid ${T.blue}`, borderRadius: 3, padding: '3px 6px', fontSize: 13 }} />
            <Btn small variant="primary" onClick={() => setEditField(null)}>Save</Btn>
            <Btn small variant="secondary" onClick={() => setEditField(null)}>Cancel</Btn>
          </div>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <span style={{ fontSize: 13, color: T.text, fontWeight: 500 }}>{val}</span>
            <button onClick={() => setEditField(field)} style={{
              background: 'none', border: 'none', cursor: 'pointer', color: T.textMute,
              fontSize: 11, padding: '2px 5px', borderRadius: 3,
              opacity: 0, transition: 'opacity 0.1s',
            }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
            >Edit</button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'auto', minHeight: 0 }}>
      {/* Breadcrumb */}
      <div style={{
        padding: '10px 28px', background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.textSoft,
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.blue, fontSize: 12, padding: 0, fontWeight: 600 }}>← Contracts</button>
        <span>/</span>
        <span style={{ color: T.text, fontWeight: 500, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.name}</span>
        <span style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          {prev && <button onClick={() => onNav(prev.id)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 3, cursor: 'pointer', color: T.textMid, fontSize: 11, padding: '3px 8px' }}>← Prev</button>}
          {next && <button onClick={() => onNav(next.id)} style={{ background: 'none', border: `1px solid ${T.border}`, borderRadius: 3, cursor: 'pointer', color: T.textMid, fontSize: 11, padding: '3px 8px' }}>Next →</button>}
        </span>
      </div>

      {/* Risk summary bar */}
      <div style={{
        padding: '14px 28px', background: T.surface, borderBottom: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', gap: 20, flexWrap: 'wrap',
      }}>
        <div>
          <div style={{ fontSize: 11, color: T.textSoft, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Overall Risk</div>
          <RiskBadge score={c.riskScore} size="lg" />
        </div>
        <div style={{ width: 1, height: 36, background: T.border }}></div>
        <div style={{ display: 'flex', gap: 20 }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.red, fontFamily: "'IBM Plex Mono', monospace" }}>{c.flags.red}</div>
            <div style={{ fontSize: 10, color: T.textSoft, fontWeight: 600, textTransform: 'uppercase' }}>Red Flags</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.orange, fontFamily: "'IBM Plex Mono', monospace" }}>{c.flags.orange}</div>
            <div style={{ fontSize: 10, color: T.textSoft, fontWeight: 600, textTransform: 'uppercase' }}>Orange</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 18, fontWeight: 800, color: T.green, fontFamily: "'IBM Plex Mono', monospace" }}>{c.flags.green}</div>
            <div style={{ fontSize: 10, color: T.textSoft, fontWeight: 600, textTransform: 'uppercase' }}>Green</div>
          </div>
        </div>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
          <Btn variant="secondary" small>Export</Btn>
          <Btn variant="success" small>Approve</Btn>
        </div>
      </div>

      <Tabs tabs={tabDefs} active={tab} onChange={setTab} />

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '24px 28px' }}>

        {/* ── OVERVIEW ─────────────────────── */}
        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 900 }}>
            {/* Parties */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Parties</h3>
              <Field label="Party 1 (Vendor)" value={c.parties[0]} field="party1" />
              <Field label="Party 2 (Buyer)" value={c.parties[1]} field="party2" />
            </div>

            {/* Key Dates */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Key Dates</h3>
              <Field label="Effective Date" value={c.effectiveDate} field="effective" />
              <Field label="Termination Date" value={c.terminationDate} field="termination" />
              <Field label="Notice Period" value={c.noticePeriod} field="notice" />
              <Field label="Auto-Renewal" value={c.autoRenewal} field="autorenew" />
            </div>

            {/* Financial Terms */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Financial Terms</h3>
              <Field label="Payment Amount" value={c.paymentAmount} field="payment" />
              <Field label="Currency" value={c.currency} field="currency" />
              <Field label="Payment Schedule" value={c.paymentSchedule} field="schedule" />
              <Field label="Price Escalation" value={c.priceEscalation} field="escalation" />
              <Field label="Payment Terms" value={c.paymentTerms} field="terms" />
            </div>

            {/* Notes */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, padding: '16px 20px' }}>
              <h3 style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 12px' }}>Notes</h3>
              <div style={{ marginBottom: 12 }}>
                {notes.map(n => (
                  <div key={n.id} style={{
                    padding: '10px 12px', background: n.resolved ? '#f8fafc' : T.yellowBg,
                    border: `1px solid ${n.resolved ? T.border : T.yellowBorder}`,
                    borderRadius: 4, marginBottom: 8,
                  }}>
                    <div style={{ fontSize: 11, color: T.textSoft, marginBottom: 4 }}>
                      <strong style={{ color: T.textMid }}>{n.author}</strong> · {n.date}
                      {n.resolved && <span style={{ color: T.green, marginLeft: 6 }}>✓ Resolved</span>}
                    </div>
                    <div style={{ fontSize: 13, color: T.text }}>{n.text}</div>
                    {!n.resolved && (
                      <button onClick={() => setNotes(ns => ns.map(x => x.id === n.id ? { ...x, resolved: true } : x))}
                        style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: T.green, fontWeight: 600, padding: 0 }}>
                        Mark resolved
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: 6 }}>
                <input value={noteInput} onChange={e => setNoteInput(e.target.value)}
                  placeholder="Add a note…"
                  style={{ flex: 1, border: `1px solid ${T.border}`, borderRadius: 4, padding: '6px 10px', fontSize: 12 }} />
                <Btn small onClick={() => { if (noteInput.trim()) { setNotes(ns => [...ns, { id: Date.now(), author: 'James Whitfield', date: '2026-04-27', text: noteInput, resolved: false }]); setNoteInput(''); } }}>Add</Btn>
              </div>
            </div>
          </div>
        )}

        {/* ── RISK FLAGS ───────────────────── */}
        {tab === 'risks' && (
          <div style={{ maxWidth: 740 }}>
            {/* Filter bar */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 16, flexWrap: 'wrap' }}>
              {['all', 'red', 'orange', 'green', 'resolved'].map(f => (
                <button key={f} onClick={() => setFlagFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 3,
                  border: `1px solid ${flagFilter === f ? severityColor(f === 'all' ? 'green' : f) : T.border}`,
                  background: flagFilter === f ? (f === 'all' ? T.navy : severityBg(f)) : '#fff',
                  color: flagFilter === f ? (f === 'all' ? '#fff' : severityColor(f)) : T.textSoft,
                  cursor: 'pointer', fontSize: 12, fontWeight: 600, textTransform: 'capitalize',
                }}>{f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}</button>
              ))}
              <span style={{ marginLeft: 'auto', fontSize: 12, color: T.textSoft, paddingTop: 6 }}>
                {visibleFlags.length} flag{visibleFlags.length !== 1 ? 's' : ''}
                {dismissedFlags.length > 0 && ` · ${dismissedFlags.length} dismissed`}
              </span>
            </div>

            {visibleFlags.length === 0 && <Empty message="No flags match this filter" />}

            {visibleFlags.map(f => {
              const isResolved = resolvedFlags.includes(f.id);
              const isExpanded = expandedFlag === f.id;
              return (
                <div key={f.id} style={{
                  background: T.surface, border: `1px solid ${isResolved ? T.border : severityColor(f.severity) + '33'}`,
                  borderLeft: `3px solid ${isResolved ? T.border : severityColor(f.severity)}`,
                  borderRadius: 5, marginBottom: 10, overflow: 'hidden',
                  opacity: isResolved ? 0.7 : 1,
                }}>
                  <div
                    style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10 }}
                    onClick={() => setExpandedFlag(isExpanded ? null : f.id)}
                  >
                    <SeverityBadge severity={f.severity} />
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: T.text }}>{f.title}</span>
                    {isResolved && <span style={{ fontSize: 11, color: T.green, fontWeight: 600 }}>✓ Resolved</span>}
                    {f.status === 'accepted' && <span style={{ fontSize: 11, color: T.textSoft }}>Accepted risk</span>}
                    <span style={{ fontSize: 12, color: T.textSoft }}>Pg {f.page}, §{f.section}</span>
                    <span style={{ color: T.textMute, fontSize: 12 }}>{isExpanded ? '▲' : '▼'}</span>
                  </div>
                  {isExpanded && (
                    <div style={{ padding: '0 16px 14px', borderTop: `1px solid ${T.border}` }}>
                      <div style={{ paddingTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Assessment</div>
                          <p style={{ margin: 0, fontSize: 13, color: T.textMid, lineHeight: 1.6 }}>{f.description}</p>
                        </div>
                        <div>
                          <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Recommendation</div>
                          <p style={{ margin: 0, fontSize: 13, color: T.text, lineHeight: 1.6, background: T.bg, padding: '8px 12px', borderRadius: 4 }}>{f.recommendation}</p>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <Btn small variant="success" onClick={() => setResolvedFlags(rs => rs.includes(f.id) ? rs.filter(x => x !== f.id) : [...rs, f.id])}>
                            {isResolved ? 'Undo Resolve' : '✓ Mark Resolved'}
                          </Btn>
                          <Btn small variant="secondary" onClick={() => setDismissedFlags(ds => [...ds, f.id])}>Dismiss</Btn>
                          <button onClick={() => setTab('document')} style={{
                            marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer',
                            color: T.blue, fontSize: 12, fontWeight: 600,
                          }}>View in Document →</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* ── DOCUMENT ─────────────────────── */}
        {tab === 'document' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, maxWidth: 1000 }}>
            {/* PDF mock */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{
                padding: '8px 14px', background: '#f8fafc', borderBottom: `1px solid ${T.border}`,
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: T.textMid }}>{c.name}</span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn small variant="secondary">−</Btn>
                  <span style={{ fontSize: 11, color: T.textSoft, padding: '5px 0' }}>100%</span>
                  <Btn small variant="secondary">+</Btn>
                </div>
              </div>
              <div style={{ padding: 20, fontFamily: 'Georgia, serif', fontSize: 12, lineHeight: 1.8, color: '#2d3748', minHeight: 400 }}>
                <div style={{ fontWeight: 700, textAlign: 'center', marginBottom: 20, fontSize: 14 }}>VENDOR AGREEMENT</div>
                <p>This Agreement is entered into as of <strong>{c.effectiveDate}</strong>, between <strong>{c.parties[0]}</strong> ("Vendor") and <strong>{c.parties[1]}</strong> ("Buyer").</p>
                <p style={{ marginTop: 12 }}><strong>1. SERVICES</strong><br />Vendor shall provide services as described in Exhibit A...</p>
                <p style={{ marginTop: 12 }}><strong>5. PAYMENT</strong><br />Buyer agrees to pay {c.paymentAmount} on a {c.paymentSchedule} basis under terms of {c.paymentTerms}...</p>
                <div style={{
                  marginTop: 12, padding: '8px 10px',
                  background: '#fff7ed', border: '1px solid #fed7aa', borderRadius: 3,
                }}>
                  <strong>7. LIABILITY</strong><br />
                  <span style={{ background: '#fde68a' }}>Vendor's liability hereunder shall not be limited in any manner whatsoever, and Buyer acknowledges that Vendor may face unlimited exposure under any circumstances...</span>
                </div>
                <div style={{
                  marginTop: 12, padding: '8px 10px',
                  background: '#fff1f2', border: '1px solid #fecdd3', borderRadius: 3,
                }}>
                  <strong>10. INDEMNIFICATION</strong><br />
                  <span style={{ background: '#fca5a5' }}>Buyer shall indemnify and hold harmless Vendor from any IP infringement claims. Vendor shall only indemnify Buyer for claims arising from Vendor's own gross negligence...</span>
                </div>
                <p style={{ marginTop: 12, color: '#94a3b8', fontStyle: 'italic' }}>[Pages 3–8 continue…]</p>
              </div>
              <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'center', gap: 8 }}>
                <Btn small variant="secondary">← Prev</Btn>
                <span style={{ fontSize: 12, color: T.textSoft, padding: '5px 8px' }}>Page 1 of 8</span>
                <Btn small variant="secondary">Next →</Btn>
              </div>
            </div>

            {/* Clause panel */}
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 5, overflow: 'hidden' }}>
              <div style={{ padding: '12px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Selected Clause</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: T.text }}>§7.2 — Liability</div>
              </div>
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, lineHeight: 1.7, color: T.textMid, fontStyle: 'italic', borderLeft: `3px solid ${T.orange}`, paddingLeft: 10, marginBottom: 12 }}>
                  "Vendor's liability hereunder shall not be limited in any manner whatsoever, and Buyer acknowledges that Vendor may face unlimited exposure under any circumstances arising from this Agreement..."
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Related Risk Flag</div>
                  <SeverityBadge severity="red" label="HIGH — Unlimited Liability" />
                </div>
                <div style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: T.textSoft, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6 }}>Recommendation</div>
                  <div style={{ fontSize: 12, color: T.textMid, background: T.bg, padding: '8px 10px', borderRadius: 4 }}>
                    Negotiate to add: "Vendor liability shall not exceed two times the annual contract value."
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  <Btn small variant="secondary">Copy</Btn>
                  <Btn small variant="secondary">Download</Btn>
                  <Btn small variant="primary" onClick={() => setTab('risks')}>View Flag →</Btn>
                </div>
              </div>
              <div style={{ padding: '10px 16px', borderTop: `1px solid ${T.border}`, background: '#f8fafc' }}>
                <div style={{ fontSize: 11, color: T.textSoft, marginBottom: 6, fontWeight: 600 }}>Legend</div>
                <div style={{ display: 'flex', gap: 12, fontSize: 11, color: T.textSoft }}>
                  <span><span style={{ color: T.red }}>■</span> High Risk</span>
                  <span><span style={{ color: T.orange }}>■</span> Medium Risk</span>
                  <span><span style={{ color: T.yellow }}>■</span> Info</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ─────────────────────── */}
        {tab === 'history' && (
          <div style={{ maxWidth: 700 }}>
            {[
              { time: '2026-04-10 09:14', user: 'James Whitfield', action: 'Contract Uploaded', detail: c.name, icon: '↑', color: T.blue },
              { time: '2026-04-10 09:15', user: 'Claude API (claude-opus-4-5)', action: 'Analysis Complete', detail: `Risk score: ${c.riskScore}/10 · ${totalFlags} flags identified`, icon: '◆', color: T.green },
              { time: '2026-04-11 14:22', user: 'Sarah Chen', action: 'Note Added', detail: 'Check if liability cap is negotiable before next review.', icon: '✎', color: T.textMid },
              { time: '2026-04-14 10:05', user: 'Sarah Chen', action: 'Flag Viewed', detail: 'Unlimited Liability (Red Flag)', icon: '◉', color: T.orange },
            ].map((e, i) => (
              <div key={i} style={{ display: 'flex', gap: 14, marginBottom: 16, paddingBottom: 16, borderBottom: `1px solid ${T.border}` }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: e.color + '18',
                  color: e.color, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 14, flexShrink: 0, marginTop: 2,
                }}>{e.icon}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                    <span style={{ fontWeight: 600, fontSize: 13, color: T.text }}>{e.action}</span>
                    <span style={{ fontSize: 11, color: T.textSoft, fontFamily: "'IBM Plex Mono', monospace" }}>{e.time}</span>
                  </div>
                  <div style={{ fontSize: 12, color: T.textSoft }}>{e.user}</div>
                  <div style={{ fontSize: 12, color: T.textMid, marginTop: 4, background: T.bg, padding: '4px 8px', borderRadius: 3 }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}

Object.assign(window, { DashboardScreen, ContractDetailScreen });
