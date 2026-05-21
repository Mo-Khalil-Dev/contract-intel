// ContractIntel Redesign — Screens 1-4: Home, Upload, Processing, Results
const { useState, useEffect, useRef } = React;

// ─── Screen 1: Home / Landing (Northwind Holdings — internal tool) ───
function HomeScreen({ onNav }) {
  const { CONTRACTS, RENEWALS, TEAM_MEMBERS } = window.APP_DATA;
  const complete = CONTRACTS.filter(c => c.status === 'complete');
  const inProgress = CONTRACTS.filter(c => c.status !== 'complete');
  const totalRed = complete.reduce((s, c) => s + c.flags.red, 0);
  const avgRisk = (complete.reduce((s, c) => s + c.riskScore, 0) / Math.max(1, complete.length)).toFixed(1);
  const recent = [...complete].sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate)).slice(0, 4);
  const urgent = RENEWALS ? [...RENEWALS].sort((a, b) => a.daysRemaining - b.daysRemaining).slice(0, 3) : [];
  const lastOpened = complete[0]; // pretend resumed contract

  const steps = [
    { n: '01', label: 'Upload', desc: 'Drop in any vendor, licence or partnership contract — PDF or DOCX.', who: 'Anyone in Legal Ops' },
    { n: '02', label: 'AI review', desc: 'ContractIntel scans every clause against the Northwind playbook.', who: 'Automated · ~60 seconds' },
    { n: '03', label: 'Reviewer sign-off', desc: 'A reviewer confirms risk flags and adds notes for the business owner.', who: 'Reviewer / Senior Counsel' },
    { n: '04', label: 'Approve & file', desc: 'Approved contracts are filed to the register; renewals tracked automatically.', who: 'Head of Legal' },
  ];

  return (
    <div style={{ flex: 1, background: T.bg, overflow: 'auto' }}>

      {/* Org banner */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}` }}>
        <div className="ci-pad-32 ci-home-banner" style={{ maxWidth: 1120, margin: '0 auto', padding: '14px 32px', display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><rect x="1" y="1" width="12" height="12" rx="2" fill={T.ink} /><path d="M4 10V4l3 4 3-4v6" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span style={{ fontWeight: 700, color: T.ink }}>Northwind Holdings Ltd</span>
          </div>
          <span style={{ color: T.inkMute }}>·</span>
          <span>Legal Operations · Contract Review Workspace</span>
          <span style={{ marginLeft: 'auto', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green }} />
            All systems operational
          </span>
        </div>
      </div>

      {/* Greeting + KPIs */}
      <div className="ci-pad-32 ci-pad-y-lg" style={{ maxWidth: 1120, margin: '0 auto', padding: '36px 32px 24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', gap: 24, flexWrap: 'wrap', marginBottom: 28 }}>
          <div>
            <h1 className="ci-page-h1-lg" style={{ margin: '0 0 6px', fontSize: 32, fontWeight: 800, color: T.ink, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.03em' }}>Good morning, James.</h1>
            <p style={{ margin: 0, fontSize: 15, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
              You have <strong style={{ color: T.red }}>{totalRed} critical flags</strong> across your portfolio and <strong style={{ color: urgent[0] && urgent[0].daysRemaining < 60 ? T.orange : T.ink }}>{urgent.filter(r => r.daysRemaining < 60).length} urgent renewals</strong> in the next 60 days.
            </p>
          </div>
          <div className="ci-actions-wrap" style={{ display: 'flex', gap: 10 }}>
            <Btn variant="secondary" onClick={() => onNav('portfolio')}>View all contracts</Btn>
            <Btn onClick={() => onNav('upload')}>+ Upload contract</Btn>
          </div>
        </div>

        {/* Quick stats */}
        <div className="ci-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32 }}>
          {[
            { label: 'Active contracts', value: complete.length, sub: `${inProgress.length} in review`, color: T.ink },
            { label: 'Average risk score', value: avgRisk, sub: parseFloat(avgRisk) >= 7 ? 'High — review needed' : parseFloat(avgRisk) >= 4 ? 'Medium' : 'Low', color: T.riskColor(parseFloat(avgRisk)) },
            { label: 'Critical flags open', value: totalRed, sub: 'Across all contracts', color: T.red },
            { label: 'Renewals < 60 days', value: urgent.filter(r => r.daysRemaining < 60).length, sub: urgent[0] ? `Next: ${urgent[0].renewalDate}` : '—', color: T.orange },
          ].map(k => (
            <div key={k.label} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 18px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>{k.label}</div>
              <div style={{ fontSize: 28, fontWeight: 800, color: k.color, fontFamily: "'DM Mono', monospace", lineHeight: 1.1 }}>{k.value}</div>
              <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 4, fontFamily: "'DM Sans', sans-serif" }}>{k.sub}</div>
            </div>
          ))}
        </div>

        {/* Where to start */}
        <div className="ci-stack-md" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 16, marginBottom: 36 }}>
          {/* Primary CTA: upload */}
          <div onClick={() => onNav('upload')}
            style={{ background: T.ink, borderRadius: 12, padding: '24px 28px', cursor: 'pointer', position: 'relative', overflow: 'hidden', color: '#fff' }}>
            <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: T.blue, opacity: 0.18 }} />
            <div style={{ position: 'relative' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.55)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 10, fontFamily: "'DM Sans', sans-serif" }}>Where to start</div>
              <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 6, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>Send a contract for review</div>
              <p style={{ margin: '0 0 18px', fontSize: 13, color: 'rgba(255,255,255,0.72)', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", maxWidth: 420 }}>
                Drop a PDF or Word file here and ContractIntel will run it against the Northwind playbook before passing it to a reviewer.
              </p>
              <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <Btn size="md" onClick={() => onNav('upload')} style={{ background: T.blue, color: '#fff' }}>+ Upload contract</Btn>
                <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.55)', fontFamily: "'DM Sans', sans-serif" }}>PDF, DOCX · up to 50 MB · 60s analysis</span>
              </div>
            </div>
          </div>

          {/* Resume / sample */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {lastOpened && (
              <div onClick={() => onNav('results')}
                style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', transition: 'border-color 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.borderColor = T.borderMid}
                onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
              >
                <div style={{ fontSize: 11, fontWeight: 700, color: T.inkMute, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Pick up where you left off</div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 4, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lastOpened.name.replace(/\.[^.]+$/, '')}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
                  <RiskBadge score={lastOpened.riskScore} />
                  <span>·</span>
                  <span>last viewed yesterday</span>
                </div>
              </div>
            )}
            <div onClick={() => onNav('portfolio')}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.borderMid}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Browse the contract register</div>
                <div style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{CONTRACTS.length} contracts on file</div>
              </div>
              <span style={{ color: T.inkMute, fontSize: 18 }}>→</span>
            </div>
            <div onClick={() => onNav('renewals')}
              style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '14px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              onMouseEnter={e => e.currentTarget.style.borderColor = T.borderMid}
              onMouseLeave={e => e.currentTarget.style.borderColor = T.border}
            >
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Review upcoming renewals</div>
                <div style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{urgent.filter(r => r.daysRemaining < 60).length} need attention this quarter</div>
              </div>
              <span style={{ color: T.inkMute, fontSize: 18 }}>→</span>
            </div>
          </div>
        </div>

        {/* Recent contracts + Renewals row */}
        <div className="ci-stack-md" style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 16, marginBottom: 36 }}>
          {/* Recent contracts */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Your recent contracts</div>
                <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>Most recently uploaded or reviewed</div>
              </div>
              <button onClick={() => onNav('portfolio')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.blue, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>See all →</button>
            </div>
            {recent.map((c, i) => (
              <div key={c.id} onClick={() => onNav('portfolio')}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 18px', borderBottom: i < recent.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer' }}
                onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                onMouseLeave={e => e.currentTarget.style.background = ''}
              >
                <TypePill type={c.type} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: "'DM Sans', sans-serif" }}>{c.name.replace(/\.[^.]+$/, '')}</div>
                  <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{c.parties[0]} · uploaded {c.uploadDate}</div>
                </div>
                <FlagsSummary flags={c.flags} />
                <RiskBadge score={c.riskScore} />
              </div>
            ))}
          </div>

          {/* Upcoming renewals */}
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderBottom: `1px solid ${T.border}` }}>
              <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>Upcoming renewals</div>
              <button onClick={() => onNav('renewals')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.blue, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>All →</button>
            </div>
            {urgent.length > 0 ? urgent.map((r, i) => {
              const c = r.daysRemaining < 30 ? T.red : r.daysRemaining < 60 ? T.orange : T.green;
              return (
                <div key={r.id} onClick={() => onNav('renewals')} style={{ padding: '12px 18px', borderBottom: i < urgent.length - 1 ? `1px solid ${T.border}` : 'none', cursor: 'pointer', borderLeft: `3px solid ${c}` }}
                  onMouseEnter={e => e.currentTarget.style.background = T.bgAlt}
                  onMouseLeave={e => e.currentTarget.style.background = ''}
                >
                  <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.name.replace(/\.[^.]+$/, '')}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                    <span style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{r.renewalDate} · {r.noticePeriod} notice</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: c, fontFamily: "'DM Mono', monospace" }}>{r.daysRemaining < 0 ? `${Math.abs(r.daysRemaining)}d late` : `${r.daysRemaining}d`}</span>
                  </div>
                </div>
              );
            }) : (
              <div style={{ padding: '20px 18px', fontSize: 13, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>No upcoming renewals.</div>
            )}
          </div>
        </div>
      </div>

      {/* How review works at Northwind */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div className="ci-pad-32" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 24, gap: 16, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>The Northwind process</div>
              <h2 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>How contracts move through Legal Ops</h2>
              <p style={{ margin: '6px 0 0', fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", maxWidth: 580 }}>
                All third-party contracts above £25k must be run through ContractIntel before signature. The platform applies our internal playbook, then routes the review to the right reviewer.
              </p>
            </div>
            <a href="#" onClick={e => { e.preventDefault(); onNav('settings'); }} style={{ fontSize: 13, color: T.blue, fontWeight: 600, fontFamily: "'DM Sans', sans-serif", textDecoration: 'none' }}>Read the full Legal Ops policy →</a>
          </div>

          <div className="ci-grid-4" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
            {steps.map((s, i) => (
              <div key={s.n} style={{ position: 'relative', background: T.bg, border: `1px solid ${T.border}`, borderRadius: 10, padding: '18px 18px 16px' }}>
                {i < steps.length - 1 && (
                  <div style={{ position: 'absolute', right: -8, top: 32, width: 16, height: 1, background: T.borderMid, zIndex: 1 }} />
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, background: i === 0 ? T.blue : T.surface, border: `1px solid ${i === 0 ? T.blue : T.borderMid}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: i === 0 ? '#fff' : T.inkMid, fontFamily: "'DM Mono', monospace" }}>{s.n}</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                </div>
                <div style={{ fontSize: 12, color: T.inkMid, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>{s.desc}</div>
                <div style={{ fontSize: 11, fontWeight: 600, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", paddingTop: 8, borderTop: `1px solid ${T.border}` }}>
                  <span style={{ color: T.inkMute, marginRight: 6 }}>Owner:</span>{s.who}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* What ContractIntel checks for at Northwind */}
      <div className="ci-pad-32" style={{ maxWidth: 1120, margin: '0 auto', padding: '40px 32px 56px' }}>
        <div className="ci-stack-md" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>The Northwind playbook</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>What every contract is checked against</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              Our playbook codifies the positions agreed with the Board and Finance. Anything outside these lines is flagged for review — no exceptions without sign-off from Head of Legal.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { label: 'Liability capped at 2× annual contract value', sev: 'red' },
                { label: 'Mutual, reciprocal indemnification', sev: 'red' },
                { label: 'Change-of-control termination right', sev: 'red' },
                { label: 'Price escalation capped at CPI + 1%', sev: 'orange' },
                { label: 'Data portability on termination (90 days)', sev: 'orange' },
                { label: 'Auto-renewal flagged 90 days before notice', sev: 'orange' },
                { label: 'English law and English courts', sev: 'green' },
              ].map(ex => (
                <div key={ex.label} style={{ display: 'flex', alignItems: 'center', gap: 10, background: T.surface, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.sevColor(ex.sev)}`, borderRadius: 6, padding: '9px 14px' }}>
                  <span style={{ fontSize: 13, color: T.inkMid, fontFamily: "'DM Sans', sans-serif" }}>{ex.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.blue, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Need a hand?</div>
            <h2 style={{ margin: '0 0 14px', fontSize: 22, fontWeight: 700, color: T.ink, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.02em' }}>Who to ask</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}>
              Reviews are handled by the Legal Ops team. If you're stuck on a clause or need an exception, reach out directly.
            </p>
            <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
              {[
                { name: 'Sarah Chen', role: 'Head of Legal', avatar: 'SC', topic: 'Exceptions, sign-off, escalations' },
                { name: 'Priya Anand', role: 'Senior Counsel', avatar: 'PA', topic: 'Vendor contracts, IP, indemnities' },
                { name: 'Marcus Webb', role: 'Commercial Counsel', avatar: 'MW', topic: 'Pricing, SLAs, renewals' },
                { name: 'Legal Ops inbox', role: 'legal-ops@northwind.co.uk', avatar: '✉', topic: 'Anything else — first response in 4h' },
              ].map((p, i, a) => (
                <div key={p.name} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '12px 16px', borderBottom: i < a.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: T.blue, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{p.avatar}</div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{p.role} · {p.topic}</div>
                  </div>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 12, padding: '12px 16px', background: T.blueLight, border: `1px solid ${T.blueMid}55`, borderRadius: 10, fontSize: 13, color: T.blue, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5 }}>
              <strong style={{ display: 'block', marginBottom: 4 }}>Reminder</strong>
              ContractIntel suggests language but doesn't replace sign-off. Every contract above £25k still needs a reviewer's approval before signature.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Screen 2: Upload ─────────────────────────────────────────────
function UploadScreen({ onBack, onDone, layoutVariant, uploadStyle }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [dragging, setDragging] = useState(false);

  function addFiles(f) {
    setFiles(p => [...p, ...Array.from(f).map(x => ({ name: x.name, size: x.size, id: Math.random() }))]);
  }
  function fmt(b) {
    if (!b) return '';
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  }

  const isSimple = uploadStyle === 'simple';

  return (
    <PageShell
      title="Upload contracts"
      subtitle="PDF or Word files up to 50 MB each. Bulk upload up to 20 at once."
      actions={<Btn variant="ghost" size="sm" onClick={onBack}>← Back</Btn>}
    >
      <div className="ci-pad-32" style={{ maxWidth: 600, margin: '40px auto', padding: '0 32px' }}>
        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('ci-file-input').click()}
          className="ci-dropzone"
          style={{
            border: `2px dashed ${dragging ? T.blue : T.borderMid}`,
            borderRadius: 12, padding: isSimple ? '60px 32px' : '48px 32px',
            background: dragging ? T.blueLight : T.surface,
            textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s',
            marginBottom: 16,
          }}
        >
          <div style={{ width: 48, height: 48, borderRadius: 12, background: dragging ? T.blue : T.bgAlt, border: `1px solid ${dragging ? T.blue : T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
            <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
              <path d="M11 14V4M7 8l4-4 4 4" stroke={dragging ? '#fff' : T.blue} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M4 16v1a2 2 0 002 2h10a2 2 0 002-2v-1" stroke={dragging ? '#fff' : T.inkSoft} strokeWidth="2" strokeLinecap="round" />
            </svg>
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: T.ink, marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>
            {dragging ? 'Drop to upload' : 'Drag files here to upload'}
          </div>
          <div style={{ fontSize: 13, color: T.inkSoft, marginBottom: 14, fontFamily: "'DM Sans', sans-serif" }}>or click to browse from your computer</div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            {['PDF', 'DOCX', 'PPTX'].map(ext => (
              <span key={ext} style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, fontWeight: 600, color: T.inkSoft, fontFamily: "'DM Mono', monospace" }}>{ext}</span>
            ))}
            <span style={{ fontSize: 12, color: T.inkMute, padding: '2px 4px', fontFamily: "'DM Sans', sans-serif" }}>· max 50 MB</span>
          </div>
          <input id="ci-file-input" type="file" multiple accept=".pdf,.docx,.pptx" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 16 }}>
            <div style={{ padding: '10px 16px', background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase', letterSpacing: '0.06em' }}>{files.length} file{files.length !== 1 ? 's' : ''} selected</span>
              <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>Clear all</button>
            </div>
            {files.map(f => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 16px', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ width: 32, height: 32, borderRadius: 6, background: T.blueLight, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M3 2h7l3 3v9H3V2z" stroke={T.blue} strokeWidth="1.5" strokeLinejoin="round" /><path d="M10 2v3h3" stroke={T.blue} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: T.ink, fontFamily: "'DM Sans', sans-serif", overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.name}</div>
                  {f.size > 0 && <div style={{ fontSize: 11, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>{fmt(f.size)}</div>}
                </div>
                <button onClick={() => setFiles(p => p.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkMute, fontSize: 16, lineHeight: 1 }}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Consent */}
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 24, fontSize: 13, color: T.inkMid, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: T.blue }} />
          <span>I understand that ContractIntel uses Claude AI to analyze these documents. Files are encrypted in transit and stored securely. <span style={{ color: T.blue, cursor: 'pointer' }}>Privacy policy →</span></span>
        </label>

        {/* Actions */}
        <div className="ci-actions-wrap" style={{ display: 'flex', gap: 10 }}>
          <Btn variant="secondary" onClick={onBack}>Cancel</Btn>
          <Btn disabled={files.length === 0 || !agreed} onClick={() => onDone(files)} full>
            Analyze {files.length > 0 ? `${files.length} contract${files.length !== 1 ? 's' : ''}` : 'contracts'}
          </Btn>
        </div>

        {/* Reassurance */}
        <div style={{ marginTop: 20, display: 'flex', gap: 20, justifyContent: 'center', flexWrap: 'wrap' }}>
          {['End-to-end encrypted', 'Never shared with third parties', 'Delete anytime'].map(r => (
            <span key={r} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l3 3 5-5" stroke={T.green} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              {r}
            </span>
          ))}
        </div>
      </div>
    </PageShell>
  );
}

// ─── Screen 3: Processing ─────────────────────────────────────────
function ProcessingScreen({ files, onDone }) {
  const [progress, setProgress] = useState(12);
  const [stepIdx, setStepIdx] = useState(0);
  const steps = [
    { label: 'Reading document', desc: 'Extracting text from your PDF' },
    { label: 'Identifying parties', desc: 'Finding who signed this contract' },
    { label: 'Extracting key terms', desc: 'Dates, values, payment schedules' },
    { label: 'Analyzing risk clauses', desc: 'Liability, indemnity, IP, termination' },
    { label: 'Scoring and ranking', desc: 'Prioritizing flags by severity' },
    { label: 'Building your report', desc: 'Formatting results and recommendations' },
  ];
  const tips = [
    'ContractIntel identifies risks that junior lawyers commonly miss on first read.',
    'Average contract has 4.2 risk flags worth negotiating.',
    'Unlimited liability clauses appear in 1 in 3 vendor contracts.',
    'Auto-renewal clauses cost businesses £12k/year on average when missed.',
    'Our AI is trained on 50,000+ real contracts across all major industries.',
  ];
  const [tipIdx, setTipIdx] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 98) { clearInterval(interval); return 100; }
        return Math.min(p + Math.random() * 6 + 1, 98);
      });
    }, 400);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setStepIdx(i => Math.min(i + 1, steps.length - 1));
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIdx(i => (i + 1) % tips.length);
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [progress]);

  return (
    <div style={{ flex: 1, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '40px 32px' }}>
      <div style={{ maxWidth: 480, width: '100%', textAlign: 'center' }}>
        {/* Spinner */}
        <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 28px' }}>
          <svg width="80" height="80" viewBox="0 0 80 80" style={{ animation: 'ciSpin 1.8s linear infinite' }}>
            <circle cx="40" cy="40" r="34" fill="none" stroke={T.border} strokeWidth="5" />
            <circle cx="40" cy="40" r="34" fill="none" stroke={T.blue} strokeWidth="5" strokeDasharray={`${progress * 2.136} 213.6`} strokeLinecap="round" strokeDashoffset="53.4" style={{ transition: 'stroke-dasharray 0.4s ease' }} />
          </svg>
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: T.ink, fontFamily: "'DM Mono', monospace" }}>{Math.round(progress)}%</div>
        </div>

        <h2 style={{ margin: '0 0 8px', fontSize: 24, fontWeight: 800, color: T.ink, fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.03em' }}>
          {progress < 100 ? 'Analyzing your contract…' : 'Analysis complete!'}
        </h2>

        {files && files.length > 0 && (
          <div style={{ margin: '0 0 24px', fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>
            {files[0].name}{files.length > 1 ? ` and ${files.length - 1} more` : ''}
          </div>
        )}

        {/* Progress bar */}
        <div style={{ height: 6, background: T.border, borderRadius: 6, overflow: 'hidden', marginBottom: 28 }}>
          <div style={{ width: `${progress}%`, height: '100%', background: T.blue, borderRadius: 6, transition: 'width 0.4s ease' }} />
        </div>

        {/* Steps */}
        <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 24, textAlign: 'left' }}>
          {steps.map((s, i) => (
            <div key={s.label} style={{ display: 'flex', gap: 12, padding: '11px 16px', borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : 'none', alignItems: 'center', opacity: i > stepIdx ? 0.35 : 1, transition: 'opacity 0.3s' }}>
              <div style={{ width: 20, height: 20, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: i < stepIdx ? T.green : i === stepIdx ? T.blue : T.border }}>
                {i < stepIdx
                  ? <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5 3.5-4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  : i === stepIdx
                    ? <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff', animation: 'ciPulse 1s infinite' }} />
                    : null}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: i <= stepIdx ? 600 : 400, color: i <= stepIdx ? T.ink : T.inkMute, fontFamily: "'DM Sans', sans-serif" }}>{s.label}</div>
                {i === stepIdx && <div style={{ fontSize: 11, color: T.inkSoft, marginTop: 1, fontFamily: "'DM Sans', sans-serif" }}>{s.desc}</div>}
              </div>
            </div>
          ))}
        </div>

        {/* Rotating tip */}
        <div style={{ background: T.blueLight, border: `1px solid ${T.blueMid}55`, borderRadius: 8, padding: '12px 16px', fontSize: 13, color: T.blue, fontFamily: "'DM Sans', sans-serif", lineHeight: 1.5, minHeight: 56, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.3s' }}>
          {tips[tipIdx]}
        </div>

        <style>{`
          @keyframes ciSpin { from { transform: rotate(-90deg) } to { transform: rotate(270deg) } }
          @keyframes ciPulse { 0%,100% { opacity:1 } 50% { opacity:0.3 } }
        `}</style>
      </div>
    </div>
  );
}

// ─── Screen 4: Results ─────────────────────────────────────────────
function ResultsScreen({ contractId, onBack, onDeepDive, onExport, onNav, riskStyle, similarDemo }) {
  const { CONTRACTS } = window.APP_DATA;
  const c = CONTRACTS.find(x => x.id === contractId) || CONTRACTS[0];
  const [tab, setTab] = useState('overview');
  const [expandedFlag, setExpandedFlag] = useState(null);
  const [resolvedFlags, setResolvedFlags] = useState([]);
  const [dismissedFlags, setDismissedFlags] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([{ id: 1, author: 'Sarah Chen', date: '2026-04-11', text: 'Check if liability cap is negotiable before next review.', resolved: false }]);

  const visibleFlags = c.riskFlags.filter(f => !dismissedFlags.includes(f.id));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'hidden', minHeight: 0 }}>
      {/* Breadcrumb */}
      <div className="ci-breadcrumb" style={{ padding: '10px 32px', background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, flexShrink: 0 }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.blue, fontWeight: 600, padding: 0, fontSize: 13, fontFamily: "'DM Sans', sans-serif" }}>Contracts</button>
        <span style={{ color: T.inkMute }}>/</span>
        <span style={{ color: T.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 320, fontFamily: "'DM Sans', sans-serif" }}>{c.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn size="sm" variant="secondary" onClick={onExport}>Export</Btn>
          <Btn size="sm" variant="success">Approve</Btn>
        </div>
      </div>

      <div className="ci-results-row" style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>
        {/* Left: main content */}
        <div className="ci-results-main" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${T.border}` }}>
          <Tabs
            tabs={[
              { id: 'overview', label: 'Overview' },
              { id: 'risks', label: `Risk Flags (${visibleFlags.length})` },
              { id: 'clauses', label: 'Clauses' },
              { id: 'document', label: 'Document' },
              { id: 'history', label: 'History' },
            ]}
            active={tab}
            onChange={setTab}
          />

          <div className="ci-pad-32" style={{ flex: 1, overflow: 'auto', padding: '28px 32px' }}>

            {/* OVERVIEW TAB */}
            {tab === 'overview' && (
              <div style={{ maxWidth: 560 }}>
                {/* Quick snapshot card */}
                <div className="ci-risk-snap" style={{ background: T.riskBg(c.riskScore), border: `1px solid ${T.riskColor(c.riskScore)}33`, borderRadius: 10, padding: '20px 24px', marginBottom: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: T.inkSoft, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>Risk Assessment</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span className="ci-risk-mega" style={{ fontSize: 40, fontWeight: 900, color: T.riskColor(c.riskScore), fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{c.riskScore.toFixed(1)}</span>
                      <span style={{ fontSize: 14, fontWeight: 700, color: T.riskColor(c.riskScore), fontFamily: "'DM Sans', sans-serif" }}>{T.riskLabel(c.riskScore)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    {[{ n: c.flags.red, c: T.red, l: 'Critical' }, { n: c.flags.orange, c: T.orange, l: 'Caution' }, { n: c.flags.green, c: T.green, l: 'Info' }].map(f => (
                      <div key={f.l} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 22, fontWeight: 800, color: f.c, fontFamily: "'DM Mono', monospace" }}>{f.n}</div>
                        <div style={{ fontSize: 11, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{f.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key details */}
                {[
                  { title: 'Parties', rows: [['Provider', c.parties[0]], ['Client', c.parties[1]]] },
                  { title: 'Key Dates', rows: [['Effective', c.effectiveDate], ['Expires', c.terminationDate], ['Notice Period', c.noticePeriod], ['Auto-Renewal', c.autoRenewal]] },
                  { title: 'Financial Terms', rows: [['Value', c.paymentAmount], ['Currency', c.currency], ['Schedule', c.paymentSchedule], ['Escalation', c.priceEscalation], ['Payment Terms', c.paymentTerms]] },
                ].map(sec => (
                  <div key={sec.title} style={{ marginBottom: 24 }}>
                    <SectionLabel>{sec.title}</SectionLabel>
                    <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                      {sec.rows.map(([k, v], i) => (
                        <div className="ci-detail-row" key={k} style={{ display: 'flex', padding: '10px 16px', borderBottom: i < sec.rows.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                          <span style={{ width: 160, flexShrink: 0, fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{k}</span>
                          <span style={{ fontSize: 13, fontWeight: 500, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{v || '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <SectionLabel>Notes</SectionLabel>
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden', marginBottom: 10 }}>
                    {notes.map((n, i) => (
                      <div key={n.id} style={{ padding: '12px 16px', borderBottom: i < notes.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <div style={{ fontSize: 11, color: T.inkSoft, marginBottom: 4, fontFamily: "'DM Sans', sans-serif" }}>
                          <strong style={{ color: T.inkMid }}>{n.author}</strong> · {n.date}
                          {n.resolved && <span style={{ color: T.green, marginLeft: 8, fontWeight: 600 }}>✓ Resolved</span>}
                        </div>
                        <div style={{ fontSize: 13, color: T.inkMid, lineHeight: 1.5, fontFamily: "'DM Sans', sans-serif" }}>{n.text}</div>
                        {!n.resolved && <button onClick={() => setNotes(ns => ns.map(x => x.id === n.id ? { ...x, resolved: true } : x))} style={{ marginTop: 6, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: T.green, fontWeight: 600, padding: 0, fontFamily: "'DM Sans', sans-serif" }}>Mark resolved</button>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="Add a note…"
                      style={{ flex: 1, background: T.surface, border: `1px solid ${T.borderMid}`, borderRadius: 8, padding: '8px 12px', fontSize: 13, color: T.ink, fontFamily: "'DM Sans', sans-serif", outline: 'none' }} />
                    <Btn size="sm" onClick={() => { if (noteInput.trim()) { setNotes(ns => [...ns, { id: Date.now(), author: 'James Whitfield', date: '2026-05-01', text: noteInput, resolved: false }]); setNoteInput(''); } }}>Add</Btn>
                  </div>
                </div>
              </div>
            )}

            {/* RISK FLAGS TAB */}
            {tab === 'risks' && (
              <div style={{ maxWidth: 660 }}>
                <div style={{ marginBottom: 16, padding: '10px 14px', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 8, fontSize: 13, color: T.inkMid, display: 'flex', gap: 16, flexWrap: 'wrap', fontFamily: "'DM Sans', sans-serif" }}>
                  <span><strong style={{ color: T.ink }}>{visibleFlags.length}</strong> total</span>
                  <span style={{ color: T.red }}>● {c.flags.red} critical</span>
                  <span style={{ color: T.orange }}>● {c.flags.orange} caution</span>
                  <span style={{ color: T.green }}>● {c.flags.green} informational</span>
                </div>

                {/* STYLE: Accordion (default) */}
                {riskStyle !== 'cards' && (
                  <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                    {visibleFlags.map((f, i) => {
                      const isExpanded = expandedFlag === f.id;
                      const isResolved = resolvedFlags.includes(f.id);
                      const fc = T.sevColor(f.severity);
                      return (
                        <div key={f.id} style={{ borderBottom: i < visibleFlags.length - 1 ? `1px solid ${T.border}` : 'none', opacity: isResolved ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 16px', cursor: 'pointer' }}
                            onClick={() => setExpandedFlag(isExpanded ? null : f.id)}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: fc, flexShrink: 0 }} />
                            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{f.title}</span>
                            {isResolved && <Badge label="Resolved" color={T.green} bg={T.greenBg} />}
                            <span style={{ fontSize: 11, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>§{f.section}</span>
                            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.15s', color: T.inkMute }}>
                              <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          </div>
                          {isExpanded && (
                            <div style={{ padding: '0 16px 16px 36px' }}>
                              <p style={{ margin: '0 0 12px', fontSize: 13, color: T.inkMid, lineHeight: 1.7, fontFamily: "'DM Sans', sans-serif" }}>{f.description}</p>
                              <div style={{ background: T.bgAlt, border: `1px solid ${T.border}`, borderLeft: `3px solid ${T.blue}`, borderRadius: 6, padding: '10px 14px', fontSize: 13, color: T.inkMid, marginBottom: 14, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                                <span style={{ fontWeight: 600, color: T.blue }}>Recommendation: </span>{f.recommendation}
                              </div>
                              <div style={{ display: 'flex', gap: 8 }}>
                                <Btn size="sm" variant="success" onClick={() => setResolvedFlags(rs => rs.includes(f.id) ? rs.filter(x => x !== f.id) : [...rs, f.id])}>
                                  {isResolved ? 'Undo' : '✓ Mark resolved'}
                                </Btn>
                                <Btn size="sm" variant="ghost" onClick={() => setDismissedFlags(ds => [...ds, f.id])}>Dismiss</Btn>
                                <Btn size="sm" variant="secondary" onClick={() => onDeepDive(f.id)}>Deep dive →</Btn>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* STYLE: Cards */}
                {riskStyle === 'cards' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {visibleFlags.map(f => {
                      const isResolved = resolvedFlags.includes(f.id);
                      const fc = T.sevColor(f.severity);
                      const bg = T.sevBg(f.severity);
                      return (
                        <div key={f.id} style={{ background: T.surface, border: `1px solid ${T.border}`, borderLeft: `4px solid ${fc}`, borderRadius: 10, padding: '16px 20px', opacity: isResolved ? 0.5 : 1 }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                              <span style={{ display: 'inline-flex', background: bg, color: fc, border: `1px solid ${fc}33`, borderRadius: 5, padding: '2px 8px', fontSize: 11, fontWeight: 700, fontFamily: "'DM Sans', sans-serif", textTransform: 'uppercase' }}>{f.severity}</span>
                              <span style={{ fontSize: 11, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>§{f.section}, pg {f.page}</span>
                            </div>
                            {isResolved && <Badge label="Resolved" color={T.green} bg={T.greenBg} />}
                          </div>
                          <div style={{ fontSize: 15, fontWeight: 700, color: T.ink, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>{f.title}</div>
                          <p style={{ margin: '0 0 12px', fontSize: 13, color: T.inkMid, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>{f.description}</p>
                          <div style={{ background: T.bgAlt, borderLeft: `3px solid ${T.blue}`, borderRadius: 6, padding: '8px 12px', fontSize: 12, color: T.inkMid, marginBottom: 14, lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>
                            <span style={{ fontWeight: 600, color: T.blue }}>Recommendation: </span>{f.recommendation}
                          </div>
                          <div style={{ display: 'flex', gap: 8 }}>
                            <Btn size="sm" variant="success" onClick={() => setResolvedFlags(rs => rs.includes(f.id) ? rs.filter(x => x !== f.id) : [...rs, f.id])}>{isResolved ? 'Undo' : '✓ Resolve'}</Btn>
                            <Btn size="sm" variant="ghost" onClick={() => setDismissedFlags(ds => [...ds, f.id])}>Dismiss</Btn>
                            <Btn size="sm" variant="secondary" onClick={() => onDeepDive(f.id)}>Deep dive →</Btn>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* CLAUSES TAB — Similar Clauses feature lives here */}
            {tab === 'clauses' && (
              <ClausesTab contract={c} contracts={CONTRACTS} demoState={similarDemo} />
            )}

            {/* DOCUMENT TAB */}
            {tab === 'document' && (
              <div className="ci-doc-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 16, maxWidth: 860 }}>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, overflow: 'hidden' }}>
                  <div style={{ padding: '10px 16px', background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{c.name}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {['−', '100%', '+'].map(x => (
                        <button key={x} style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 4, padding: '2px 8px', fontSize: 11, color: T.inkSoft, cursor: 'pointer' }}>{x}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '28px 32px', fontFamily: 'Georgia, serif', fontSize: 13, lineHeight: 1.8, color: '#374151', background: '#fff', minHeight: 400 }}>
                    <div style={{ fontWeight: 700, textAlign: 'center', fontSize: 14, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 24 }}>Vendor Agreement</div>
                    <p>This Agreement is entered into as of <strong>{c.effectiveDate}</strong>, between <strong>{c.parties[0]}</strong> ("Vendor") and <strong>{c.parties[1]}</strong> ("Buyer").</p>
                    <p style={{ marginTop: 16 }}><strong>5. PAYMENT</strong><br />Buyer agrees to pay {c.paymentAmount} on a {c.paymentSchedule} basis under terms of {c.paymentTerms}.</p>
                    <div style={{ marginTop: 16, padding: '10px 14px', background: '#fffbeb', border: '1px solid #fed7aa', borderRadius: 6 }}>
                      <strong style={{ color: T.orange }}>7. LIABILITY</strong><br />
                      <span style={{ background: '#fde68a', padding: '1px 3px', borderRadius: 2 }}>Vendor's liability hereunder shall not be limited in any manner whatsoever…</span>
                    </div>
                    <div style={{ marginTop: 12, padding: '10px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 6 }}>
                      <strong style={{ color: T.red }}>10. INDEMNIFICATION</strong><br />
                      <span style={{ background: '#fca5a5', padding: '1px 3px', borderRadius: 2 }}>Buyer shall indemnify Vendor for any IP infringement…</span>
                    </div>
                    <p style={{ marginTop: 16, color: '#9ca3af', fontStyle: 'italic' }}>[Pages 3–8 continue…]</p>
                  </div>
                  <div style={{ padding: '8px 16px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <Btn size="sm" variant="secondary">← Prev</Btn>
                    <span style={{ fontSize: 12, color: T.inkSoft, padding: '5px 10px', fontFamily: "'DM Sans', sans-serif" }}>Page 1 of 8</span>
                    <Btn size="sm" variant="secondary">Next →</Btn>
                  </div>
                </div>
                <div style={{ background: T.surface, border: `1px solid ${T.border}`, borderRadius: 10, padding: '16px' }}>
                  <SectionLabel>Selected Clause</SectionLabel>
                  <div style={{ fontSize: 14, fontWeight: 700, color: T.ink, marginBottom: 8, fontFamily: "'DM Sans', sans-serif" }}>§7.2 — Liability</div>
                  <div style={{ fontSize: 13, color: T.inkMid, fontStyle: 'italic', borderLeft: `2px solid ${T.orange}`, paddingLeft: 10, marginBottom: 12, lineHeight: 1.6, fontFamily: 'Georgia, serif' }}>"Vendor's liability shall not be limited in any manner whatsoever…"</div>
                  <Badge label="Unlimited Liability" color={T.red} bg={T.redBg} dot />
                  <Divider my={12} />
                  <SectionLabel>Recommendation</SectionLabel>
                  <p style={{ fontSize: 13, color: T.inkMid, margin: '0 0 14px', lineHeight: 1.6, fontFamily: "'DM Sans', sans-serif" }}>Add: "Vendor liability shall not exceed two times the annual contract value."</p>
                  <Btn size="sm" variant="secondary" full>Copy clause language</Btn>
                </div>
              </div>
            )}

            {/* HISTORY TAB */}
            {tab === 'history' && (
              <div style={{ maxWidth: 560 }}>
                {[
                  { time: '2026-04-10 09:14', user: 'James Whitfield', action: 'Contract uploaded', detail: c.name, color: T.blue },
                  { time: '2026-04-10 09:15', user: 'ContractIntel AI', action: 'Analysis complete', detail: `Risk score ${c.riskScore}/10 · ${c.riskFlags.length} flags identified`, color: T.green },
                  { time: '2026-04-11 14:22', user: 'Sarah Chen', action: 'Note added', detail: 'Check if liability cap is negotiable.', color: T.inkSoft },
                  { time: '2026-04-14 10:05', user: 'Sarah Chen', action: 'Risk flag reviewed', detail: 'Unlimited Liability', color: T.orange },
                ].map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '12px 0', borderBottom: `1px solid ${T.border}` }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: e.color, marginTop: 5, flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: T.ink, fontFamily: "'DM Sans', sans-serif" }}>{e.action}</span>
                        <span style={{ fontSize: 11, color: T.inkMute, fontFamily: "'DM Mono', monospace" }}>{e.time}</span>
                      </div>
                      <div style={{ fontSize: 12, color: T.inkSoft, fontFamily: "'DM Sans', sans-serif" }}>{e.user}</div>
                      <div style={{ fontSize: 12, color: T.inkMid, marginTop: 2, fontFamily: "'DM Sans', sans-serif" }}>{e.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar: metadata */}
        <div className="ci-results-side" style={{ width: 272, flexShrink: 0, background: T.surface, overflow: 'auto', padding: '20px 18px', borderLeft: `1px solid ${T.border}` }}>
          <div style={{ marginBottom: 20, padding: '16px', background: T.riskBg(c.riskScore), border: `1px solid ${T.riskColor(c.riskScore)}33`, borderRadius: 10, textAlign: 'center' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: T.inkSoft, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 6, fontFamily: "'DM Sans', sans-serif" }}>Risk Score</div>
            <div style={{ fontSize: 36, fontWeight: 900, color: T.riskColor(c.riskScore), fontFamily: "'DM Mono', monospace", lineHeight: 1 }}>{c.riskScore.toFixed(1)}</div>
            <div style={{ fontSize: 12, fontWeight: 700, color: T.riskColor(c.riskScore), marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: "'DM Sans', sans-serif" }}>{T.riskShort(c.riskScore)} Risk</div>
          </div>
          <SectionLabel>Contract details</SectionLabel>
          {[
            { label: 'Type', value: <TypePill type={c.type} /> },
            { label: 'Counterparty', value: c.parties[0] },
            { label: 'Effective', value: c.effectiveDate || '—' },
            { label: 'Expires', value: c.terminationDate || '—' },
            { label: 'Notice', value: c.noticePeriod || '—' },
            { label: 'Auto-Renewal', value: c.autoRenewal || '—' },
            { label: 'Value', value: c.paymentAmount || '—' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', padding: '8px 0', borderBottom: `1px solid ${T.border}`, gap: 8 }}>
              <span style={{ fontSize: 12, color: T.inkSoft, flexShrink: 0, fontFamily: "'DM Sans', sans-serif" }}>{row.label}</span>
              <span style={{ fontSize: 12, fontWeight: 500, color: T.ink, textAlign: 'right', fontFamily: "'DM Sans', sans-serif" }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
            <Btn size="sm" variant="primary" full onClick={onExport}>Export PDF</Btn>
            <Btn size="sm" variant="secondary" full>Share with team</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, UploadScreen, ProcessingScreen, ResultsScreen });
