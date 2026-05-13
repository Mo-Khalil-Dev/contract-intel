// v3 — Contract detail + Portfolio (workspace style, no dashboard widgets)

const { useState } = React;

// ─── Empty state ──────────────────────────────────────────────────
function VEmpty() {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: V.bg,
        color: V.textMute,
        gap: 10,
      }}
    >
      <div style={{ fontSize: 32, opacity: 0.3 }}>▤</div>
      <div style={{ fontSize: 13, fontWeight: 500 }}>Select a contract to review</div>
      <div style={{ fontSize: 11 }}>or upload a new one</div>
    </div>
  );
}

// ─── Contract Detail v3 ───────────────────────────────────────────
function ContractDetailV3({ contractId }) {
  const { CONTRACTS } = window.APP_DATA;
  const [tab, setTab] = useState('overview');
  const [expandedFlag, setExpandedFlag] = useState(null);
  const [resolvedFlags, setResolvedFlags] = useState([]);
  const [dismissedFlags, setDismissedFlags] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [editingField, setEditingField] = useState(null);
  const [notes, setNotes] = useState([
    {
      id: 1,
      author: 'Sarah Chen',
      date: '2026-04-11',
      text: 'Check if liability cap is negotiable before next review.',
      resolved: false,
    },
  ]);

  const c = CONTRACTS.find((x) => x.id === contractId);
  if (!c) return <VEmpty />;

  const color = vRiskColor(c.riskScore);
  const tabDefs = [
    { id: 'overview', label: 'Overview' },
    { id: 'risks', label: `Risks (${c.flags.red + c.flags.orange + c.flags.green})` },
    { id: 'document', label: 'Document' },
    { id: 'history', label: 'History' },
  ];

  function Field({ label, value }) {
    const [editing, setEditing] = useState(false);
    const [val, setVal] = useState(value || '—');
    if (editing)
      return (
        <div
          style={{
            display: 'flex',
            gap: 6,
            padding: '8px 0',
            borderBottom: `1px solid ${V.border}`,
          }}
        >
          <span
            style={{ width: 160, fontSize: 12, color: V.textSoft, flexShrink: 0, paddingTop: 6 }}
          >
            {label}
          </span>
          <input
            value={val}
            onChange={(e) => setVal(e.target.value)}
            autoFocus
            style={{
              flex: 1,
              background: V.surface,
              border: `1px solid ${V.accent}`,
              borderRadius: 4,
              padding: '4px 8px',
              fontSize: 12,
              color: V.text,
            }}
          />
          <VBtn small onClick={() => setEditing(false)}>
            Save
          </VBtn>
          <VBtn small variant="ghost" onClick={() => setEditing(false)}>
            ✕
          </VBtn>
        </div>
      );
    return (
      <div
        style={{ display: 'flex', padding: '8px 0', borderBottom: `1px solid ${V.border}` }}
        onMouseEnter={(e) => (e.currentTarget.querySelector('.edit-btn').style.opacity = '1')}
        onMouseLeave={(e) => (e.currentTarget.querySelector('.edit-btn').style.opacity = '0')}
      >
        <span style={{ width: 160, fontSize: 12, color: V.textSoft, flexShrink: 0 }}>{label}</span>
        <span style={{ flex: 1, fontSize: 12, fontWeight: 500, color: V.text }}>{val}</span>
        <button
          className="edit-btn"
          onClick={() => setEditing(true)}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            fontSize: 10,
            color: V.textMute,
            opacity: 0,
            transition: 'opacity 0.1s',
            padding: '0 4px',
          }}
        >
          Edit
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: V.bg,
        overflow: 'hidden',
        minHeight: 0,
      }}
    >
      {/* Contract header */}
      <div
        style={{ padding: '16px 24px', borderBottom: `1px solid ${V.border}`, background: V.panel }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            marginBottom: 10,
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 10,
                color: V.textMute,
                textTransform: 'uppercase',
                fontWeight: 700,
                letterSpacing: '0.08em',
                marginBottom: 5,
              }}
            >
              {c.type} · {c.parties[0]}
            </div>
            <h1
              style={{
                margin: 0,
                fontSize: 16,
                fontWeight: 700,
                color: V.text,
                lineHeight: 1.3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.name.replace(/\.[^.]+$/, '')}
            </h1>
          </div>
          <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
            <VBtn small variant="secondary">
              Export
            </VBtn>
            <VBtn small variant="success">
              Approve
            </VBtn>
          </div>
        </div>

        {/* Inline risk strip */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: color,
                display: 'inline-block',
              }}
            ></span>
            <span
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: color,
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            >
              {c.riskScore.toFixed(1)}/10
            </span>
            <span style={{ fontSize: 11, color: V.textSoft }}>{vRiskLabel(c.riskScore)} risk</span>
          </div>
          <span
            style={{ width: 1, height: 14, background: V.border, display: 'inline-block' }}
          ></span>
          {c.flags.red > 0 && (
            <span style={{ fontSize: 11, color: V.red, fontWeight: 600 }}>
              {c.flags.red} high severity
            </span>
          )}
          {c.flags.orange > 0 && (
            <span style={{ fontSize: 11, color: V.orange, fontWeight: 600 }}>
              {c.flags.orange} medium
            </span>
          )}
          {c.flags.green > 0 && (
            <span style={{ fontSize: 11, color: V.green }}>{c.flags.green} informational</span>
          )}
          <span
            style={{ width: 1, height: 14, background: V.border, display: 'inline-block' }}
          ></span>
          <span style={{ fontSize: 11, color: V.textSoft }}>
            {c.terminationDate ? `Expires ${c.terminationDate}` : 'No expiry'}
          </span>
          <span style={{ fontSize: 11, color: V.textSoft }}>
            {c.paymentAmount && c.paymentAmount !== 'N/A' ? c.paymentAmount : null}
          </span>
        </div>
      </div>

      <VTabs tabs={tabDefs} active={tab} onChange={setTab} />

      {/* Tab content */}
      <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>
        {/* ── OVERVIEW ── */}
        {tab === 'overview' && (
          <div style={{ maxWidth: 640, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {[
              {
                title: 'Parties',
                rows: [
                  ['Vendor / Provider', c.parties[0]],
                  ['Buyer / Client', c.parties[1]],
                ],
              },
              {
                title: 'Key Dates',
                rows: [
                  ['Effective Date', c.effectiveDate],
                  ['Termination Date', c.terminationDate],
                  ['Notice Period', c.noticePeriod],
                  ['Auto-Renewal', c.autoRenewal],
                ],
              },
              {
                title: 'Financial Terms',
                rows: [
                  ['Payment Amount', c.paymentAmount],
                  ['Currency', c.currency],
                  ['Schedule', c.paymentSchedule],
                  ['Price Escalation', c.priceEscalation],
                  ['Payment Terms', c.paymentTerms],
                ],
              },
            ].map((section) => (
              <div key={section.title}>
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: V.textMute,
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 2,
                    padding: '0 0 6px',
                    borderBottom: `1px solid ${V.border}`,
                  }}
                >
                  {section.title}
                </div>
                {section.rows.map(([k, v]) => (
                  <Field key={k} label={k} value={v} />
                ))}
              </div>
            ))}

            {/* Notes */}
            <div>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: V.textMute,
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 2,
                  padding: '0 0 6px',
                  borderBottom: `1px solid ${V.border}`,
                }}
              >
                Notes
              </div>
              {notes.map((n) => (
                <div
                  key={n.id}
                  style={{ padding: '10px 0', borderBottom: `1px solid ${V.border}` }}
                >
                  <div style={{ fontSize: 11, color: V.textSoft, marginBottom: 4 }}>
                    <strong style={{ color: V.textMid }}>{n.author}</strong> · {n.date}
                    {n.resolved && (
                      <span style={{ color: V.green, marginLeft: 8 }}>✓ Resolved</span>
                    )}
                  </div>
                  <div style={{ fontSize: 13, color: V.textMid, lineHeight: 1.5 }}>{n.text}</div>
                  {!n.resolved && (
                    <button
                      onClick={() =>
                        setNotes((ns) =>
                          ns.map((x) => (x.id === n.id ? { ...x, resolved: true } : x)),
                        )
                      }
                      style={{
                        marginTop: 5,
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: 11,
                        color: V.green,
                        fontWeight: 600,
                        padding: 0,
                      }}
                    >
                      Mark resolved
                    </button>
                  )}
                </div>
              ))}
              <div style={{ display: 'flex', gap: 8, paddingTop: 12 }}>
                <input
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="Add a note…"
                  style={{
                    flex: 1,
                    background: V.surface,
                    border: `1px solid ${V.border}`,
                    borderRadius: 5,
                    padding: '6px 10px',
                    fontSize: 12,
                    color: V.text,
                  }}
                />
                <VBtn
                  small
                  onClick={() => {
                    if (noteInput.trim()) {
                      setNotes((ns) => [
                        ...ns,
                        {
                          id: Date.now(),
                          author: 'James Whitfield',
                          date: '2026-04-27',
                          text: noteInput,
                          resolved: false,
                        },
                      ]);
                      setNoteInput('');
                    }
                  }}
                >
                  Add
                </VBtn>
              </div>
            </div>
          </div>
        )}

        {/* ── RISKS ── */}
        {tab === 'risks' && (
          <div style={{ maxWidth: 680 }}>
            {/* Risk summary line */}
            <div
              style={{
                padding: '10px 14px',
                background: V.surface,
                border: `1px solid ${V.border}`,
                borderRadius: 6,
                marginBottom: 16,
                fontSize: 12,
                color: V.textMid,
              }}
            >
              <strong style={{ color: V.text }}>
                {c.riskFlags.filter((f) => !dismissedFlags.includes(f.id)).length}
              </strong>{' '}
              flags identified · <span style={{ color: V.red }}>{c.flags.red} high</span> ·{' '}
              <span style={{ color: V.orange }}>{c.flags.orange} medium</span> ·{' '}
              <span style={{ color: V.green }}>{c.flags.green} informational</span>
            </div>

            {c.riskFlags
              .filter((f) => !dismissedFlags.includes(f.id))
              .map((f) => {
                const isResolved = resolvedFlags.includes(f.id);
                const isExpanded = expandedFlag === f.id;
                const fc = vSevColor(f.severity);
                return (
                  <div
                    key={f.id}
                    style={{
                      borderBottom: `1px solid ${V.border}`,
                      opacity: isResolved ? 0.5 : 1,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 0',
                        cursor: 'pointer',
                      }}
                      onClick={() => setExpandedFlag(isExpanded ? null : f.id)}
                    >
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: fc,
                          flexShrink: 0,
                        }}
                      ></span>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600, color: V.text }}>
                        {f.title}
                      </span>
                      {isResolved && <span style={{ fontSize: 11, color: V.green }}>✓</span>}
                      <span style={{ fontSize: 11, color: V.textMute }}>§{f.section}</span>
                      <span style={{ fontSize: 11, color: V.textMute }}>
                        {isExpanded ? '▲' : '▼'}
                      </span>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '0 0 14px 16px' }}>
                        <p
                          style={{
                            margin: '0 0 10px',
                            fontSize: 12,
                            color: V.textMid,
                            lineHeight: 1.7,
                          }}
                        >
                          {f.description}
                        </p>
                        <div
                          style={{
                            padding: '8px 12px',
                            background: V.surface,
                            border: `1px solid ${V.border}`,
                            borderRadius: 5,
                            fontSize: 12,
                            color: V.textMid,
                            marginBottom: 12,
                            lineHeight: 1.6,
                          }}
                        >
                          <span style={{ fontWeight: 600, color: V.accent }}>Recommendation: </span>
                          {f.recommendation}
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <VBtn
                            small
                            variant="success"
                            onClick={() =>
                              setResolvedFlags((rs) =>
                                rs.includes(f.id) ? rs.filter((x) => x !== f.id) : [...rs, f.id],
                              )
                            }
                          >
                            {isResolved ? 'Undo' : '✓ Resolve'}
                          </VBtn>
                          <VBtn
                            small
                            variant="ghost"
                            onClick={() => setDismissedFlags((ds) => [...ds, f.id])}
                          >
                            Dismiss
                          </VBtn>
                          <span style={{ fontSize: 11, color: V.textMute, paddingTop: 5 }}>
                            Page {f.page}, §{f.section}
                          </span>
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
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, maxWidth: 900 }}
          >
            <div
              style={{
                background: V.surface,
                border: `1px solid ${V.border}`,
                borderRadius: 8,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  background: V.surface2,
                  borderBottom: `1px solid ${V.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: V.textSoft }}>📄 {c.name}</span>
                <div style={{ display: 'flex', gap: 5 }}>
                  {['−', '100%', '+'].map((x) => (
                    <button
                      key={x}
                      style={{
                        background: V.bg,
                        border: `1px solid ${V.border}`,
                        borderRadius: 3,
                        padding: '2px 7px',
                        fontSize: 11,
                        color: V.textSoft,
                        cursor: 'pointer',
                      }}
                    >
                      {x}
                    </button>
                  ))}
                </div>
              </div>
              <div
                style={{
                  padding: '20px 24px',
                  fontFamily: 'Georgia, serif',
                  fontSize: 12,
                  lineHeight: 1.8,
                  color: '#3d444d',
                  background: '#fff',
                  minHeight: 380,
                }}
              >
                <div
                  style={{
                    fontWeight: 700,
                    textAlign: 'center',
                    fontSize: 13,
                    color: '#1f2328',
                    textTransform: 'uppercase',
                    letterSpacing: '0.08em',
                    marginBottom: 20,
                  }}
                >
                  Vendor Agreement
                </div>
                <p>
                  This Agreement is entered into as of{' '}
                  <strong style={{ color: '#1f2328' }}>{c.effectiveDate}</strong>, between{' '}
                  <strong style={{ color: '1f2328' }}>{c.parties[0]}</strong> ("Vendor") and{' '}
                  <strong style={{ color: '#1f2328' }}>{c.parties[1]}</strong> ("Buyer").
                </p>
                <p style={{ marginTop: 12 }}>
                  <strong style={{ color: '#1f2328' }}>5. PAYMENT</strong>
                  <br />
                  Buyer agrees to pay {c.paymentAmount} on a {c.paymentSchedule} basis under terms
                  of {c.paymentTerms}.
                </p>
                <div
                  style={{
                    marginTop: 12,
                    padding: '9px 12px',
                    background: 'rgba(210,153,34,0.06)',
                    border: '1px solid rgba(210,153,34,0.2)',
                    borderRadius: 4,
                  }}
                >
                  <strong style={{ color: V.orange }}>7. LIABILITY</strong>
                  <br />
                  <span
                    style={{
                      background: 'rgba(210,153,34,0.1)',
                      padding: '1px 2px',
                      borderRadius: 2,
                    }}
                  >
                    Vendor's liability hereunder shall not be limited in any manner whatsoever…
                  </span>
                </div>
                <div
                  style={{
                    marginTop: 12,
                    padding: '9px 12px',
                    background: 'rgba(248,81,73,0.06)',
                    border: '1px solid rgba(248,81,73,0.2)',
                    borderRadius: 4,
                  }}
                >
                  <strong style={{ color: V.red }}>10. INDEMNIFICATION</strong>
                  <br />
                  <span
                    style={{
                      background: 'rgba(248,81,73,0.1)',
                      padding: '1px 2px',
                      borderRadius: 2,
                    }}
                  >
                    Buyer shall indemnify Vendor for any IP infringement. Vendor indemnifies Buyer
                    only for gross negligence…
                  </span>
                </div>
                <p style={{ marginTop: 12, color: '#444c56', fontStyle: 'italic' }}>
                  [Pages 3–8 continue…]
                </p>
              </div>
              <div
                style={{
                  padding: '7px 14px',
                  borderTop: `1px solid ${V.border}`,
                  display: 'flex',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <VBtn small variant="secondary">
                  ← Prev
                </VBtn>
                <span style={{ fontSize: 11, color: V.textSoft, padding: '4px 8px' }}>
                  Page 1 of 8
                </span>
                <VBtn small variant="secondary">
                  Next →
                </VBtn>
              </div>
            </div>

            {/* Clause sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div
                style={{
                  background: V.surface,
                  border: `1px solid ${V.border}`,
                  borderRadius: 8,
                  padding: '14px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: V.textMute,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 8,
                  }}
                >
                  Selected Clause
                </div>
                <div style={{ fontSize: 13, fontWeight: 600, color: V.text, marginBottom: 10 }}>
                  §7.2 — Liability
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: V.textMid,
                    fontStyle: 'italic',
                    borderLeft: `2px solid ${V.orange}`,
                    paddingLeft: 8,
                    marginBottom: 10,
                    lineHeight: 1.6,
                  }}
                >
                  "Vendor's liability hereunder shall not be limited in any manner whatsoever…"
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 10 }}>
                  <span
                    style={{ width: 6, height: 6, borderRadius: '50%', background: V.red }}
                  ></span>
                  <span style={{ fontSize: 11, fontWeight: 600, color: V.red }}>
                    Unlimited Liability
                  </span>
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: V.textSoft,
                    marginBottom: 6,
                    fontWeight: 600,
                    textTransform: 'uppercase',
                  }}
                >
                  Recommendation
                </div>
                <p style={{ fontSize: 11, color: V.textMid, margin: '0 0 10px', lineHeight: 1.6 }}>
                  Add: "Vendor liability shall not exceed two times the annual contract value."
                </p>
                <VBtn small variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                  Copy Clause
                </VBtn>
              </div>
            </div>
          </div>
        )}

        {/* ── HISTORY ── */}
        {tab === 'history' && (
          <div style={{ maxWidth: 620 }}>
            {[
              {
                time: '2026-04-10 09:14',
                user: 'James Whitfield',
                action: 'Contract uploaded',
                detail: c.name,
                color: V.accent,
              },
              {
                time: '2026-04-10 09:15',
                user: 'Claude API (claude-opus-4-5)',
                action: 'Analysis complete',
                detail: `Risk score ${c.riskScore}/10 · ${c.riskFlags.length} flags identified`,
                color: V.green,
              },
              {
                time: '2026-04-11 14:22',
                user: 'Sarah Chen',
                action: 'Note added',
                detail: 'Check if liability cap is negotiable before next review.',
                color: V.textSoft,
              },
              {
                time: '2026-04-14 10:05',
                user: 'Sarah Chen',
                action: 'Risk flag viewed',
                detail: 'Unlimited Liability',
                color: V.orange,
              },
            ].map((e, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  gap: 12,
                  padding: '10px 0',
                  borderBottom: `1px solid ${V.border}`,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: e.color,
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                ></div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 2 }}
                  >
                    <span style={{ fontSize: 12, fontWeight: 600, color: V.text }}>{e.action}</span>
                    <span
                      style={{
                        fontSize: 10,
                        color: V.textMute,
                        fontFamily: "'IBM Plex Mono',monospace",
                      }}
                    >
                      {e.time}
                    </span>
                  </div>
                  <div style={{ fontSize: 11, color: V.textSoft, marginBottom: 3 }}>{e.user}</div>
                  <div style={{ fontSize: 11, color: V.textMid }}>{e.detail}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Portfolio v3 (clean list, no widget cards) ───────────────────
function PortfolioV3({ onSelectContract }) {
  const { CONTRACTS, RENEWALS } = window.APP_DATA;
  const complete = CONTRACTS.filter((c) => c.status === 'complete');
  const sorted = [...complete].sort((a, b) => b.riskScore - a.riskScore);
  const typeColors = {
    vendor: '#818cf8',
    license: '#38bdf8',
    partnership: '#2dd4bf',
    customer: '#f472b6',
    lease: '#fb923c',
    nda: '#768390',
  };

  function renewColor(r) {
    if (r.daysRemaining < 0) return V.red;
    if (r.daysRemaining < 30) return V.red;
    if (r.daysRemaining < 60) return V.orange;
    return V.green;
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', background: V.bg }}>
      <div
        style={{ padding: '16px 24px', borderBottom: `1px solid ${V.border}`, background: V.panel }}
      >
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: V.text }}>Portfolio</h1>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: V.textSoft }}>
          {complete.length} contracts analysed
        </p>
      </div>

      <div
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 24,
          maxWidth: 1100,
        }}
      >
        {/* Main table */}
        <div>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: V.textMute,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 10,
            }}
          >
            All Contracts by Risk
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ borderBottom: `1px solid ${V.border}` }}>
                {['Contract', 'Type', 'Risk', 'Flags', 'Counterparty', 'Expiry'].map((h) => (
                  <th
                    key={h}
                    style={{
                      padding: '6px 10px',
                      textAlign: 'left',
                      fontSize: 10,
                      fontWeight: 700,
                      color: V.textMute,
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
              {sorted.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectContract(c.id)}
                  style={{ borderBottom: `1px solid ${V.border}`, cursor: 'pointer' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = V.surface)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = '')}
                >
                  <td
                    style={{ padding: '9px 10px', fontWeight: 600, color: V.text, maxWidth: 200 }}
                  >
                    <div
                      style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    >
                      {c.name.replace(/\.[^.]+$/, '')}
                    </div>
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: typeColors[c.type],
                        textTransform: 'capitalize',
                      }}
                    >
                      {c.type}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <RiskDot score={c.riskScore} />
                  </td>
                  <td style={{ padding: '9px 10px' }}>
                    <span style={{ display: 'flex', gap: 6 }}>
                      {c.flags.red > 0 && (
                        <span style={{ fontSize: 11, color: V.red, fontWeight: 600 }}>
                          {c.flags.red}h
                        </span>
                      )}
                      {c.flags.orange > 0 && (
                        <span style={{ fontSize: 11, color: V.orange, fontWeight: 600 }}>
                          {c.flags.orange}m
                        </span>
                      )}
                    </span>
                  </td>
                  <td style={{ padding: '9px 10px', color: V.textSoft }}>{c.parties[0]}</td>
                  <td
                    style={{
                      padding: '9px 10px',
                      color: V.textSoft,
                      fontFamily: "'IBM Plex Mono',monospace",
                      fontSize: 11,
                    }}
                  >
                    {c.terminationDate || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Right column: renewals + liability summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: V.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              Upcoming Renewals
            </div>
            {RENEWALS.filter((r) => r.daysRemaining < 90)
              .sort((a, b) => a.daysRemaining - b.daysRemaining)
              .map((r) => (
                <div
                  key={r.id}
                  style={{
                    padding: '9px 0',
                    borderBottom: `1px solid ${V.border}`,
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
                        color: V.text,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {r.name.replace(/\.[^.]+$/, '').slice(0, 30)}
                    </div>
                    <div style={{ fontSize: 10, color: V.textSoft, marginTop: 2 }}>
                      {r.noticePeriod} notice
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      fontFamily: "'IBM Plex Mono',monospace",
                      color: renewColor(r),
                      fontWeight: 700,
                      flexShrink: 0,
                    }}
                  >
                    {r.daysRemaining < 0
                      ? `${Math.abs(r.daysRemaining)}d late`
                      : `${r.daysRemaining}d`}
                  </div>
                </div>
              ))}
          </div>

          <div>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: V.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                marginBottom: 10,
              }}
            >
              Liability Summary
            </div>
            {[
              { label: 'Capped (standard)', count: 4, color: V.green },
              { label: 'Other caps', count: 2, color: V.orange },
              {
                label: 'Unlimited / Unknown',
                count: complete.filter((c) =>
                  c.riskFlags.some((f) => f.title.toLowerCase().includes('unlimited')),
                ).length,
                color: V.red,
              },
            ].map((row) => (
              <div
                key={row.label}
                style={{
                  padding: '7px 0',
                  borderBottom: `1px solid ${V.border}`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <span style={{ fontSize: 12, color: V.textMid }}>{row.label}</span>
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
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Renewal Calendar v3 ─────────────────────────────────────────
function RenewalCalendarV3() {
  const { RENEWALS } = window.APP_DATA;
  const [selected, setSelected] = useState(null);
  function rc(r) {
    return r.daysRemaining < 0
      ? V.red
      : r.daysRemaining < 30
        ? V.red
        : r.daysRemaining < 60
          ? V.orange
          : V.green;
  }
  return (
    <div style={{ flex: 1, overflow: 'auto', background: V.bg }}>
      <div
        style={{ padding: '16px 24px', borderBottom: `1px solid ${V.border}`, background: V.panel }}
      >
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: V.text }}>Renewals</h1>
        <p style={{ margin: '3px 0 0', fontSize: 12, color: V.textSoft }}>
          Upcoming contract renewals and notice deadlines
        </p>
      </div>
      <div
        style={{
          padding: '20px 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 280px',
          gap: 20,
          maxWidth: 900,
        }}
      >
        <div>
          {[...RENEWALS]
            .sort((a, b) => a.daysRemaining - b.daysRemaining)
            .map((r) => (
              <div
                key={r.id}
                onClick={() => setSelected(r.id === selected ? null : r.id)}
                style={{
                  padding: '12px 0',
                  borderBottom: `1px solid ${V.border}`,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = V.surface)}
                onMouseLeave={(e) => (e.currentTarget.style.background = '')}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: rc(r),
                    flexShrink: 0,
                  }}
                ></span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: V.text,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {r.name}
                  </div>
                  <div style={{ fontSize: 11, color: V.textSoft, marginTop: 2 }}>
                    {r.renewalDate} · {r.noticePeriod} notice required
                  </div>
                </div>
                <div
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    color: rc(r),
                    fontFamily: "'IBM Plex Mono',monospace",
                    flexShrink: 0,
                  }}
                >
                  {r.daysRemaining < 0
                    ? `${Math.abs(r.daysRemaining)}d overdue`
                    : r.daysRemaining === 0
                      ? 'TODAY'
                      : `${r.daysRemaining}d`}
                </div>
              </div>
            ))}
        </div>
        <div>
          {selected ? (
            (() => {
              const r = RENEWALS.find((x) => x.id === selected);
              if (!r) return null;
              return (
                <div
                  style={{
                    background: V.panel,
                    border: `1px solid ${V.border}`,
                    borderRadius: 8,
                    padding: '16px',
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: V.text, marginBottom: 12 }}>
                    {r.name}
                  </div>
                  {[
                    ['Renewal Date', r.renewalDate],
                    [
                      'Days',
                      r.daysRemaining < 0
                        ? `${Math.abs(r.daysRemaining)}d overdue`
                        : `${r.daysRemaining}d remaining`,
                    ],
                    ['Notice Period', r.noticePeriod],
                    ['Risk Score', `${r.riskScore}/10`],
                  ].map(([k, v]) => (
                    <div
                      key={k}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        padding: '6px 0',
                        borderBottom: `1px solid ${V.border}`,
                        fontSize: 12,
                      }}
                    >
                      <span style={{ color: V.textSoft }}>{k}</span>
                      <span style={{ fontWeight: 600, color: V.text }}>{v}</span>
                    </div>
                  ))}
                  <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 7 }}>
                    <VBtn style={{ width: '100%', justifyContent: 'center' }}>View Contract</VBtn>
                    <VBtn variant="secondary" style={{ width: '100%', justifyContent: 'center' }}>
                      Acknowledge
                    </VBtn>
                  </div>
                </div>
              );
            })()
          ) : (
            <div style={{ color: V.textMute, fontSize: 12, padding: '20px 0' }}>
              Select a renewal for details
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Settings v3 ─────────────────────────────────────────────────
function SettingsV3() {
  const { TEAM_MEMBERS } = window.APP_DATA;
  const [tab, setTab] = useState('team');
  return (
    <div style={{ flex: 1, overflow: 'auto', background: V.bg }}>
      <div
        style={{ padding: '16px 24px', borderBottom: `1px solid ${V.border}`, background: V.panel }}
      >
        <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: V.text }}>Settings</h1>
      </div>
      <VTabs
        tabs={[
          { id: 'team', label: 'Team' },
          { id: 'billing', label: 'Billing' },
          { id: 'audit', label: 'Audit Log' },
        ]}
        active={tab}
        onChange={setTab}
      />
      <div style={{ padding: '20px 24px', maxWidth: 800 }}>
        {tab === 'team' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
              <span style={{ fontSize: 13, fontWeight: 700, color: V.text }}>Team Members</span>
              <VBtn small>+ Invite</VBtn>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
              <thead>
                <tr style={{ borderBottom: `1px solid ${V.border}` }}>
                  {['Member', 'Role', 'Last Active', 'Status'].map((h) => (
                    <th
                      key={h}
                      style={{
                        padding: '7px 10px',
                        textAlign: 'left',
                        fontSize: 10,
                        fontWeight: 700,
                        color: V.textMute,
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
                  <tr key={m.id} style={{ borderBottom: `1px solid ${V.border}` }}>
                    <td style={{ padding: '9px 10px' }}>
                      <div style={{ fontWeight: 600, color: V.text }}>{m.name}</div>
                      <div style={{ fontSize: 10, color: V.textSoft }}>{m.email}</div>
                    </td>
                    <td style={{ padding: '9px 10px', color: V.textMid }}>{m.role}</td>
                    <td style={{ padding: '9px 10px', color: V.textSoft }}>{m.lastLogin}</td>
                    <td style={{ padding: '9px 10px' }}>
                      {m.status === 'pending' ? (
                        <span style={{ color: V.orange, fontSize: 11, fontWeight: 600 }}>
                          Pending
                        </span>
                      ) : (
                        <span style={{ color: V.green, fontSize: 11, fontWeight: 600 }}>
                          Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
        {tab === 'billing' && (
          <div style={{ maxWidth: 500 }}>
            <div
              style={{
                padding: '16px',
                background: V.panel,
                border: `1px solid ${V.border}`,
                borderRadius: 8,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  fontSize: 10,
                  color: V.textMute,
                  textTransform: 'uppercase',
                  fontWeight: 700,
                  marginBottom: 4,
                }}
              >
                Current Plan
              </div>
              <div style={{ fontSize: 18, fontWeight: 800, color: V.text }}>Professional</div>
              <div style={{ fontSize: 12, color: V.textSoft, marginTop: 2 }}>
                £299/month · 50 contracts/month
              </div>
              <div style={{ marginTop: 12, height: 3, background: V.border, borderRadius: 2 }}>
                <div
                  style={{ width: '72%', height: '100%', background: V.accent, borderRadius: 2 }}
                ></div>
              </div>
              <div style={{ fontSize: 11, color: V.textSoft, marginTop: 4 }}>
                36 / 50 contracts used
              </div>
            </div>
          </div>
        )}
        {tab === 'audit' && (
          <div style={{ fontSize: 12, color: V.textSoft, paddingTop: 8 }}>
            Audit log available — see v1 for full detail.
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Upload Screen (full page) ───────────────────────────────────
function UploadScreenV3({ onBack, onDone }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [dragging, setDragging] = useState(false);

  function addFiles(newFiles) {
    setFiles((p) => [
      ...p,
      ...Array.from(newFiles).map((f) => ({ name: f.name, size: f.size, id: Math.random() })),
    ]);
  }

  function formatSize(bytes) {
    if (!bytes) return '';
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  }

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: V.bg,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 24px',
          background: V.panel,
          borderBottom: `1px solid ${V.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: V.accent,
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          ← Back
        </button>
        <span style={{ color: V.textMute }}>·</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: V.text }}>Upload Contracts</span>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 580 }}>
          <h1 style={{ margin: '0 0 6px', fontSize: 20, fontWeight: 800, color: V.text }}>
            Upload contracts for analysis
          </h1>
          <p style={{ margin: '0 0 28px', fontSize: 13, color: V.textSoft }}>
            ContractIntel will extract key terms, identify risk clauses, and flag issues using
            Claude AI. Analysis runs asynchronously — you'll be notified when results are ready.
          </p>

          {/* Drop zone */}
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
            onClick={() => document.getElementById('v3-upload-input').click()}
            style={{
              border: `2px dashed ${dragging ? V.accent : V.border}`,
              borderRadius: 8,
              padding: '36px 24px',
              textAlign: 'center',
              background: dragging ? V.accentBg : V.panel,
              cursor: 'pointer',
              transition: 'all 0.15s',
              marginBottom: 16,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 10 }}>📄</div>
            <div style={{ fontSize: 14, fontWeight: 600, color: V.text, marginBottom: 4 }}>
              Drag & drop contracts here
            </div>
            <div style={{ fontSize: 12, color: V.textSoft, marginBottom: 10 }}>
              or click to browse your files
            </div>
            <div
              style={{
                display: 'inline-block',
                fontSize: 11,
                color: V.textMute,
                background: V.surface2,
                borderRadius: 4,
                padding: '3px 10px',
              }}
            >
              PDF · DOCX · PPTX — max 50 MB per file
            </div>
            <input
              id="v3-upload-input"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>

          {/* File list */}
          {files.length > 0 && (
            <div
              style={{
                background: V.panel,
                border: `1px solid ${V.border}`,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: `1px solid ${V.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: V.textMute,
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
                    padding: '10px 14px',
                    borderBottom: `1px solid ${V.border}`,
                  }}
                >
                  <span style={{ fontSize: 16 }}>📄</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500, color: V.text }}>{f.name}</div>
                    {f.size > 0 && (
                      <div style={{ fontSize: 11, color: V.textSoft }}>{formatSize(f.size)}</div>
                    )}
                  </div>
                  <button
                    onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      color: V.textMute,
                      fontSize: 14,
                      padding: '2px 4px',
                      borderRadius: 3,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Consent */}
          <label
            style={{
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: 24,
              fontSize: 12,
              color: V.textMid,
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
            legal terms and identify risk clauses. Files are stored securely and not shared with
            third parties.
          </label>

          {/* Actions */}
          <div style={{ display: 'flex', gap: 8 }}>
            <VBtn variant="secondary" onClick={onBack}>
              Cancel
            </VBtn>
            <VBtn disabled={files.length === 0 || !agreed} onClick={() => onDone(files)}>
              Submit{' '}
              {files.length > 0 ? `${files.length} file${files.length !== 1 ? 's' : ''}` : ''} for
              Analysis
            </VBtn>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Processing / holding screen ─────────────────────────────────
function ProcessingScreenV3({ files, onBack }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: V.bg,
        overflow: 'auto',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 24px',
          background: V.panel,
          borderBottom: `1px solid ${V.border}`,
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <button
          onClick={onBack}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: V.accent,
            fontSize: 12,
            fontWeight: 600,
            padding: 0,
          }}
        >
          ← Back to Contracts
        </button>
      </div>

      {/* Body */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px 24px',
        }}
      >
        <div style={{ width: '100%', maxWidth: 520, textAlign: 'center' }}>
          {/* Animated indicator */}
          <div style={{ marginBottom: 28, display: 'flex', justifyContent: 'center' }}>
            <div style={{ position: 'relative', width: 64, height: 64 }}>
              <svg
                width="64"
                height="64"
                viewBox="0 0 64 64"
                style={{ animation: 'spin 2s linear infinite' }}
              >
                <circle cx="32" cy="32" r="26" fill="none" stroke={V.border} strokeWidth="4" />
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  fill="none"
                  stroke={V.accent}
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

          <h1 style={{ margin: '0 0 10px', fontSize: 20, fontWeight: 800, color: V.text }}>
            Analysis in progress
          </h1>
          <p style={{ margin: '0 0 6px', fontSize: 14, color: V.textSoft, lineHeight: 1.6 }}>
            ContractIntel is extracting key terms, identifying risk clauses, and scoring your
            contracts using Claude AI.
          </p>
          <p style={{ margin: '0 0 32px', fontSize: 13, color: V.textMute, lineHeight: 1.6 }}>
            This runs asynchronously — you'll receive a notification when results are ready. You can
            safely close this page.
          </p>

          {/* File list */}
          {files && files.length > 0 && (
            <div
              style={{
                background: V.panel,
                border: `1px solid ${V.border}`,
                borderRadius: 8,
                overflow: 'hidden',
                marginBottom: 28,
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  padding: '8px 14px',
                  borderBottom: `1px solid ${V.border}`,
                  fontSize: 11,
                  fontWeight: 700,
                  color: V.textMute,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
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
                    padding: '10px 14px',
                    borderBottom: i < files.length - 1 ? `1px solid ${V.border}` : 'none',
                  }}
                >
                  <span style={{ fontSize: 14 }}>📄</span>
                  <span style={{ flex: 1, fontSize: 13, color: V.textMid }}>{f.name}</span>
                  <span
                    style={{
                      fontSize: 11,
                      color: V.accent,
                      fontWeight: 600,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: V.accent,
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

          {/* What happens next */}
          <div
            style={{
              background: V.panel,
              border: `1px solid ${V.border}`,
              borderRadius: 8,
              padding: '16px 18px',
              textAlign: 'left',
              marginBottom: 24,
            }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: V.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 10,
              }}
            >
              What happens next
            </div>
            {[
              {
                step: '1',
                label: 'Text extraction',
                desc: 'PDF/DOCX content extracted and prepared for analysis',
              },
              {
                step: '2',
                label: 'AI analysis',
                desc: 'Claude identifies parties, dates, financial terms and risk clauses',
              },
              {
                step: '3',
                label: 'Risk scoring',
                desc: 'Each clause is scored and flagged by severity',
              },
              {
                step: '4',
                label: 'Notification',
                desc: 'You receive an in-app notification when results are ready',
              },
            ].map((s, i) => (
              <div key={i} style={{ display: 'flex', gap: 12, marginBottom: i < 3 ? 10 : 0 }}>
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: V.surface2,
                    border: `1px solid ${V.border}`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 10,
                    fontWeight: 700,
                    color: V.textSoft,
                    flexShrink: 0,
                  }}
                >
                  {s.step}
                </div>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: V.text }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: V.textSoft, marginTop: 1 }}>{s.desc}</div>
                </div>
              </div>
            ))}
          </div>

          <VBtn variant="secondary" onClick={onBack}>
            Back to Contracts
          </VBtn>
        </div>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
    </div>
  );
}

// ─── Upload Modal v3 ─────────────────────────────────────────────
function UploadModalV3({ onClose }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [done, setDone] = useState(false);
  const [progress, setProgress] = useState({});
  const [dragging, setDragging] = useState(false);
  function addFiles(newFiles) {
    setFiles((p) => [
      ...p,
      ...Array.from(newFiles).map((f) => ({ name: f.name, id: Math.random() })),
    ]);
  }
  function startUpload() {
    setUploading(true);
    const init = {};
    files.forEach((f) => {
      init[f.id] = 0;
    });
    setProgress(init);
    const iv = setInterval(() => {
      setProgress((p) => {
        const next = { ...p };
        let all = true;
        files.forEach((f) => {
          if (next[f.id] < 100) {
            next[f.id] = Math.min(100, next[f.id] + Math.random() * 25);
            all = false;
          }
        });
        if (all) {
          clearInterval(iv);
          setTimeout(() => setDone(true), 400);
        }
        return next;
      });
    }, 300);
  }
  return (
    <VModal title="Upload Contracts" onClose={onClose}>
      {done ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{ fontSize: 32, color: V.green, marginBottom: 10 }}>✓</div>
          <div style={{ fontSize: 14, fontWeight: 700, color: V.text, marginBottom: 5 }}>
            Upload complete
          </div>
          <div style={{ fontSize: 12, color: V.textSoft, marginBottom: 16 }}>
            {files.length} file{files.length !== 1 ? 's' : ''} queued for analysis.
          </div>
          <VBtn onClick={onClose}>Done</VBtn>
        </div>
      ) : (
        <>
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
            onClick={() => document.getElementById('v3-file').click()}
            style={{
              border: `2px dashed ${dragging ? V.accent : V.border}`,
              borderRadius: 7,
              padding: '24px',
              textAlign: 'center',
              background: dragging ? V.accentBg : V.surface,
              cursor: 'pointer',
              marginBottom: 12,
              transition: 'all 0.15s',
            }}
          >
            <div style={{ fontSize: 13, fontWeight: 600, color: V.text, marginBottom: 3 }}>
              Drag & drop or click to browse
            </div>
            <div style={{ fontSize: 11, color: V.textSoft }}>PDF, DOCX, PPTX — max 50MB each</div>
            <input
              id="v3-file"
              type="file"
              multiple
              accept=".pdf,.docx,.pptx"
              style={{ display: 'none' }}
              onChange={(e) => addFiles(e.target.files)}
            />
          </div>
          {files.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {files.map((f) => (
                <div
                  key={f.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '6px 0',
                    borderBottom: `1px solid ${V.border}`,
                  }}
                >
                  <span
                    style={{
                      fontSize: 12,
                      flex: 1,
                      color: V.textMid,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    📄 {f.name}
                  </span>
                  {uploading ? (
                    <div style={{ width: 64, height: 3, background: V.border, borderRadius: 2 }}>
                      <div
                        style={{
                          width: `${progress[f.id] || 0}%`,
                          height: '100%',
                          background: V.accent,
                          borderRadius: 2,
                        }}
                      ></div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setFiles((p) => p.filter((x) => x.id !== f.id))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: V.textMute,
                        fontSize: 12,
                      }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
          <label
            style={{
              display: 'flex',
              gap: 8,
              alignItems: 'flex-start',
              cursor: 'pointer',
              marginBottom: 14,
              fontSize: 12,
              color: V.textMid,
            }}
          >
            <input
              type="checkbox"
              checked={agreed}
              onChange={(e) => setAgreed(e.target.checked)}
              style={{ marginTop: 2 }}
            />
            I understand ContractIntel will analyse these files using Claude AI for legal risk
            extraction.
          </label>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 7 }}>
            <VBtn variant="secondary" onClick={onClose}>
              Cancel
            </VBtn>
            <VBtn disabled={files.length === 0 || !agreed || uploading} onClick={startUpload}>
              {uploading ? 'Uploading…' : `Upload${files.length > 0 ? ` (${files.length})` : ''}`}
            </VBtn>
          </div>
        </>
      )}
    </VModal>
  );
}

// ─── Playbook Screen ─────────────────────────────────────────────
const PLAYBOOK_CLAUSES = [
  {
    id: 'liability',
    category: 'Risk',
    clause: 'Liability Cap',
    position: 'Capped at 2× annual contract value',
    acceptable: 'Any cap ≥ 1× annual value is acceptable',
    flagMatch: (f) => f.title.toLowerCase().includes('liability'),
  },
  {
    id: 'indemnification',
    category: 'Risk',
    clause: 'Indemnification',
    position: 'Mutual and reciprocal — both parties indemnify equally',
    acceptable: 'Minor asymmetry tolerated if overall exposure is limited',
    flagMatch: (f) => f.title.toLowerCase().includes('indemni'),
  },
  {
    id: 'ip',
    category: 'Intellectual Property',
    clause: 'IP Ownership',
    position: 'Custom deliverables owned by us; vendor retains pre-existing IP',
    acceptable: 'Joint ownership acceptable for collaborative R&D only',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('ip') || f.title.toLowerCase().includes('intellectual'),
  },
  {
    id: 'termination',
    category: 'Risk',
    clause: 'Termination for Convenience',
    position: 'Either party may terminate with 30 days notice, no penalty',
    acceptable: 'Up to 60-day notice; no financial penalty',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('termination') || f.title.toLowerCase().includes('penalty'),
  },
  {
    id: 'change_control',
    category: 'Risk',
    clause: 'Change of Control',
    position: 'Right to terminate within 90 days of counterparty acquisition',
    acceptable: 'Minimum 60-day opt-out window required',
    flagMatch: (f) => f.title.toLowerCase().includes('change of control'),
  },
  {
    id: 'auto_renewal',
    category: 'Commercial',
    clause: 'Auto-Renewal',
    position: 'No automatic renewal without explicit written consent',
    acceptable: 'Auto-renewal OK if notice period ≥ 90 days',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('renewal') || f.title.toLowerCase().includes('auto-renew'),
  },
  {
    id: 'dispute',
    category: 'Governance',
    clause: 'Dispute Resolution',
    position: 'English law, courts of England and Wales',
    acceptable: 'London arbitration acceptable as alternative',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('dispute') || f.title.toLowerCase().includes('arbitration'),
  },
  {
    id: 'price_escalation',
    category: 'Commercial',
    clause: 'Price Escalation',
    position: 'CPI-linked only, capped at 3% per annum',
    acceptable: 'Fixed escalation ≤ 3% per annum',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('price') || f.title.toLowerCase().includes('escalation'),
  },
  {
    id: 'confidentiality',
    category: 'Governance',
    clause: 'Confidentiality',
    position: 'Mutual NDA, 3-year post-termination period',
    acceptable: '2-year minimum; must be mutual',
    flagMatch: (f) => f.title.toLowerCase().includes('confidential'),
  },
  {
    id: 'sla',
    category: 'Commercial',
    clause: 'SLA / Uptime',
    position: '99.9% uptime with monthly credits ≥ 15% of fee',
    acceptable: '99.5% minimum; credits must be auto-applied',
    flagMatch: (f) =>
      f.title.toLowerCase().includes('sla') || f.title.toLowerCase().includes('uptime'),
  },
];

function getClauseStatus(clause, contract) {
  if (!contract) return 'unknown';
  const match = contract.riskFlags.find((f) => clause.flagMatch(f));
  if (!match) return 'pass';
  if (match.severity === 'red') return 'fail';
  if (match.severity === 'orange') return 'warn';
  return 'pass';
}

function PlaybookScreen({ onSelectContract }) {
  const { CONTRACTS } = window.APP_DATA;
  const complete = CONTRACTS.filter((c) => c.status === 'complete');
  const [selectedContractId, setSelectedContractId] = useState(null);
  const [editingClause, setEditingClause] = useState(null);
  const [positions, setPositions] = useState(
    Object.fromEntries(PLAYBOOK_CLAUSES.map((c) => [c.id, c.position])),
  );

  const selectedContract = complete.find((c) => c.id === selectedContractId) || null;
  const categories = [...new Set(PLAYBOOK_CLAUSES.map((c) => c.category))];
  const statusMeta = {
    pass: { color: V.green, bg: V.greenBg, icon: '✓', label: 'Compliant' },
    warn: { color: V.orange, bg: V.orangeBg, icon: '⚠', label: 'Deviation' },
    fail: { color: V.red, bg: V.redBg, icon: '✕', label: 'Non-compliant' },
    unknown: { color: V.textMute, bg: V.surface2, icon: '—', label: 'Not checked' },
  };
  const counts = selectedContract
    ? {
        pass: PLAYBOOK_CLAUSES.filter((c) => getClauseStatus(c, selectedContract) === 'pass')
          .length,
        warn: PLAYBOOK_CLAUSES.filter((c) => getClauseStatus(c, selectedContract) === 'warn')
          .length,
        fail: PLAYBOOK_CLAUSES.filter((c) => getClauseStatus(c, selectedContract) === 'fail')
          .length,
      }
    : null;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: V.bg,
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          padding: '14px 24px',
          background: V.panel,
          borderBottom: `1px solid ${V.border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: V.text }}>Playbook</h1>
          <p style={{ margin: '2px 0 0', fontSize: 12, color: V.textSoft }}>
            Your standard positions — compare against any contract
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: V.textSoft }}>Compare against:</span>
          <select
            value={selectedContractId || ''}
            onChange={(e) => setSelectedContractId(e.target.value ? Number(e.target.value) : null)}
            style={{
              background: V.panel,
              border: `1px solid ${V.border}`,
              borderRadius: 5,
              padding: '5px 10px',
              fontSize: 12,
              color: V.text,
              minWidth: 220,
            }}
          >
            <option value="">— Select a contract —</option>
            {complete.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name.replace(/\.[^.]+$/, '')}
              </option>
            ))}
          </select>
          {selectedContract && (
            <button
              onClick={() => onSelectContract(selectedContract.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                color: V.accent,
                fontWeight: 600,
                padding: 0,
              }}
            >
              Open contract →
            </button>
          )}
        </div>
      </div>

      {/* Compliance summary */}
      {selectedContract && counts && (
        <div
          style={{
            padding: '9px 24px',
            background: V.panel,
            borderBottom: `1px solid ${V.border}`,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: V.text }}>
            {selectedContract.name.replace(/\.[^.]+$/, '')}
          </span>
          <span style={{ width: 1, height: 14, background: V.border }}></span>
          <span style={{ fontSize: 12, color: V.green, fontWeight: 600 }}>
            ✓ {counts.pass} compliant
          </span>
          {counts.warn > 0 && (
            <span style={{ fontSize: 12, color: V.orange, fontWeight: 600 }}>
              ⚠ {counts.warn} deviations
            </span>
          )}
          {counts.fail > 0 && (
            <span style={{ fontSize: 12, color: V.red, fontWeight: 600 }}>
              ✕ {counts.fail} non-compliant
            </span>
          )}
          <div
            style={{
              flex: 1,
              maxWidth: 180,
              height: 4,
              background: V.border,
              borderRadius: 3,
              overflow: 'hidden',
              display: 'flex',
            }}
          >
            <div
              style={{
                width: `${(counts.pass / PLAYBOOK_CLAUSES.length) * 100}%`,
                height: '100%',
                background: V.green,
              }}
            ></div>
            <div
              style={{
                width: `${(counts.warn / PLAYBOOK_CLAUSES.length) * 100}%`,
                height: '100%',
                background: V.orange,
              }}
            ></div>
            <div
              style={{
                width: `${(counts.fail / PLAYBOOK_CLAUSES.length) * 100}%`,
                height: '100%',
                background: V.red,
              }}
            ></div>
          </div>
          <span
            style={{ fontSize: 11, color: V.textSoft, fontFamily: "'IBM Plex Mono',monospace" }}
          >
            {Math.round((counts.pass / PLAYBOOK_CLAUSES.length) * 100)}% aligned
          </span>
        </div>
      )}

      {/* Table */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 24px 24px' }}>
        {categories.map((cat) => (
          <div key={cat} style={{ marginTop: 20 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: V.textMute,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                padding: '0 0 6px',
                borderBottom: `1px solid ${V.border}`,
                marginBottom: 0,
              }}
            >
              {cat}
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <colgroup>
                <col style={{ width: '16%' }} />
                <col style={{ width: selectedContract ? '30%' : '50%' }} />
                {selectedContract && <col style={{ width: '30%' }} />}
                <col style={{ width: selectedContract ? '24%' : '34%' }} />
              </colgroup>
              <thead>
                <tr>
                  {[
                    'Clause',
                    'Your Standard Position',
                    selectedContract && 'Contract Language',
                    selectedContract ? 'Status' : 'Acceptable Range',
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
                          color: V.textMute,
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          borderBottom: `1px solid ${V.border}`,
                        }}
                      >
                        {h}
                      </th>
                    ))}
                </tr>
              </thead>
              <tbody>
                {PLAYBOOK_CLAUSES.filter((c) => c.category === cat).map((pc) => {
                  const status = getClauseStatus(pc, selectedContract);
                  const sm = statusMeta[status];
                  const matchFlag = selectedContract?.riskFlags.find((f) => pc.flagMatch(f));
                  const isEditing = editingClause === pc.id;
                  return (
                    <tr key={pc.id} style={{ borderBottom: `1px solid ${V.border}` }}>
                      <td style={{ padding: '10px 10px 10px 0', verticalAlign: 'top' }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: V.text }}>
                          {pc.clause}
                        </span>
                      </td>
                      <td style={{ padding: '10px', verticalAlign: 'top' }}>
                        {isEditing ? (
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                            <textarea
                              value={positions[pc.id]}
                              onChange={(e) =>
                                setPositions((p) => ({ ...p, [pc.id]: e.target.value }))
                              }
                              rows={2}
                              style={{
                                width: '100%',
                                background: V.panel,
                                border: `1px solid ${V.accent}`,
                                borderRadius: 4,
                                padding: '5px 7px',
                                fontSize: 12,
                                color: V.text,
                                resize: 'none',
                              }}
                            />
                            <div style={{ display: 'flex', gap: 5 }}>
                              <VBtn small onClick={() => setEditingClause(null)}>
                                Save
                              </VBtn>
                              <VBtn small variant="ghost" onClick={() => setEditingClause(null)}>
                                Cancel
                              </VBtn>
                            </div>
                          </div>
                        ) : (
                          <div
                            style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}
                            onMouseEnter={(e) => {
                              const b = e.currentTarget.querySelector('.edit-btn');
                              if (b) b.style.opacity = '1';
                            }}
                            onMouseLeave={(e) => {
                              const b = e.currentTarget.querySelector('.edit-btn');
                              if (b) b.style.opacity = '0';
                            }}
                          >
                            <span
                              style={{ fontSize: 12, color: V.textMid, lineHeight: 1.5, flex: 1 }}
                            >
                              {positions[pc.id]}
                            </span>
                            <button
                              className="edit-btn"
                              onClick={() => setEditingClause(pc.id)}
                              style={{
                                background: 'none',
                                border: 'none',
                                cursor: 'pointer',
                                fontSize: 10,
                                color: V.textMute,
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
                      {selectedContract && (
                        <td style={{ padding: '10px', verticalAlign: 'top' }}>
                          {matchFlag ? (
                            <div>
                              <div
                                style={{
                                  fontSize: 11,
                                  color: V.textMid,
                                  lineHeight: 1.5,
                                  fontStyle: 'italic',
                                  marginBottom: 3,
                                }}
                              >
                                §{matchFlag.section} — {matchFlag.description.slice(0, 90)}
                                {matchFlag.description.length > 90 ? '…' : ''}
                              </div>
                              <span style={{ fontSize: 10, color: V.textSoft }}>
                                Pg {matchFlag.page}, §{matchFlag.section}
                              </span>
                            </div>
                          ) : (
                            <span style={{ fontSize: 11, color: V.green }}>
                              No deviations flagged
                            </span>
                          )}
                        </td>
                      )}
                      <td style={{ padding: '10px', verticalAlign: 'top' }}>
                        {selectedContract ? (
                          <div>
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: sm.bg,
                                borderRadius: 4,
                                padding: '3px 8px',
                              }}
                            >
                              <span style={{ fontSize: 12, color: sm.color, fontWeight: 700 }}>
                                {sm.icon}
                              </span>
                              <span style={{ fontSize: 11, color: sm.color, fontWeight: 600 }}>
                                {sm.label}
                              </span>
                            </div>
                            {matchFlag && matchFlag.severity !== 'green' && (
                              <div style={{ marginTop: 5 }}>
                                <button
                                  onClick={() => onSelectContract(selectedContract.id)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    cursor: 'pointer',
                                    fontSize: 10,
                                    color: V.accent,
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
                          <span style={{ fontSize: 11, color: V.textSoft, lineHeight: 1.5 }}>
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
    </div>
  );
}

Object.assign(window, {
  VEmpty,
  ContractDetailV3,
  PortfolioV3,
  RenewalCalendarV3,
  SettingsV3,
  UploadScreenV3,
  ProcessingScreenV3,
  UploadModalV3,
  PlaybookScreen,
});
