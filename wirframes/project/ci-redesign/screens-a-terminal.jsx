// ContractIntel Terminal — Screens A: Home, Upload, Processing, Results
const { useState, useEffect, useRef } = React;

// ─── Screen 1: Home ───────────────────────────────────────────────
function HomeScreen({ onNav }) {
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setTick(x => x + 1), 1000);
    return () => clearInterval(t);
  }, []);

  const cursor = tick % 2 === 0 ? '█' : ' ';

  const stats = [
    { label: 'CONTRACTS ANALYZED', value: '150,421' },
    { label: 'CRITICAL FLAGS TODAY', value: '2,847' },
    { label: 'AVG ANALYSIS TIME', value: '< 60s' },
    { label: 'LEGAL FEES SAVED', value: '£2.4M+' },
  ];

  const risks = [
    { code: 'UL-001', label: 'Unlimited liability exposure',   sev: 'red' },
    { code: 'AR-002', label: 'Hidden auto-renewal clause',      sev: 'orange' },
    { code: 'IP-003', label: 'One-sided IP assignment',         sev: 'red' },
    { code: 'SL-004', label: 'Below-market SLA credits',        sev: 'orange' },
    { code: 'CC-005', label: 'Change-of-control gap',           sev: 'red' },
    { code: 'PE-006', label: 'Price escalation above CPI',      sev: 'orange' },
  ];

  const steps = [
    { n: '01', label: 'UPLOAD',  desc: 'PDF or DOCX · up to 50 MB' },
    { n: '02', label: 'ANALYZE', desc: 'AI reads every clause < 60s' },
    { n: '03', label: 'REVIEW',  desc: 'Plain-English risk breakdown' },
    { n: '04', label: 'ACT',     desc: 'Export · share · negotiate' },
  ];

  const plans = [
    { name: 'FREE',     price: '£0',   features: ['5 analyses / month', 'Basic risk flags', 'PDF export'] },
    { name: 'PRO',      price: '£20',  period: '/mo', features: ['50 analyses / month', 'Full risk analysis', 'Team (5 seats)', 'All export formats'], highlight: true },
    { name: 'BUSINESS', price: '£100', period: '/mo', features: ['500 analyses / month', 'Unlimited seats', 'Bulk upload + API', 'Templates'] },
  ];

  return (
    <div style={{ flex: 1, background: T.bg, overflow: 'auto', fontFamily: MONO }}>

      {/* ── Hero terminal block ── */}
      <div style={{ background: T.surface, borderBottom: `1px solid ${T.border}`, padding: '48px 24px' }}>
        <div style={{ maxWidth: 760, margin: '0 auto' }}>

          {/* system header */}
          <div style={{ display: 'flex', gap: 24, marginBottom: 32, fontSize: 10, color: T.inkSoft, letterSpacing: '0.08em', borderBottom: `1px solid ${T.border}`, paddingBottom: 12 }}>
            <span style={{ color: T.amber }}>CONTRACTINTEL v2.0</span>
            <span>LEGAL INTELLIGENCE PLATFORM</span>
            <span style={{ marginLeft: 'auto' }}>{new Date().toISOString().slice(0, 10)}</span>
          </div>

          <div style={{ marginBottom: 8, fontSize: 10, color: T.inkSoft, letterSpacing: '0.08em' }}>
            &gt; SYSTEM READY · AI-POWERED CONTRACT ANALYSIS
          </div>
          <h1 style={{ margin: '0 0 6px', fontSize: 36, fontWeight: 400, color: T.ink, fontFamily: MONO, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            REVIEW CONTRACTS IN
          </h1>
          <h1 style={{ margin: '0 0 28px', fontSize: 36, fontWeight: 400, fontFamily: MONO, letterSpacing: '-0.01em', lineHeight: 1.15 }}>
            <span style={{ color: T.amber }}>MINUTES, NOT WEEKS.</span>
            <span style={{ color: T.amber, fontSize: 30, marginLeft: 4 }}>{cursor}</span>
          </h1>
          <p style={{ margin: '0 0 32px', fontSize: 12, color: T.inkMid, lineHeight: 1.8, maxWidth: 560, letterSpacing: '0.02em' }}>
            Upload any contract. Instant plain-English analysis — risks flagged,
            terms extracted, negotiation language ready to copy.
          </p>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <Btn size="lg" onClick={() => onNav('upload')}>RUN ANALYSIS</Btn>
            <Btn size="lg" variant="secondary" onClick={() => onNav('results')}>VIEW SAMPLE REPORT</Btn>
          </div>
          <div style={{ marginTop: 14, fontSize: 10, color: T.inkMute, letterSpacing: '0.06em' }}>
            NO CREDIT CARD REQUIRED &nbsp;·&nbsp; 5 FREE ANALYSES / MONTH
          </div>
        </div>
      </div>

      {/* ── Stats ticker ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, background: T.bgAlt }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '0 24px', display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)' }}>
          {stats.map((s, i) => (
            <div key={s.label} style={{
              padding: '16px 0',
              borderRight: i < 3 ? `1px solid ${T.border}` : 'none',
              paddingLeft: i > 0 ? 24 : 0,
            }}>
              <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', marginBottom: 5 }}>{s.label}</div>
              <div style={{ fontSize: 20, color: T.amber, letterSpacing: '0.02em' }}>{s.value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── How it works ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.16em', marginBottom: 20, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>WORKFLOW</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 0 }}>
          {steps.map((s, i) => (
            <div key={s.n} style={{ padding: '16px 20px 16px 0', borderRight: i < 3 ? `1px solid ${T.border}` : 'none', paddingLeft: i > 0 ? 20 : 0 }}>
              <div style={{ fontSize: 18, color: T.amber, marginBottom: 8, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 11, color: T.ink, marginBottom: 5, letterSpacing: '0.06em' }}>{s.label}</div>
              <div style={{ fontSize: 10, color: T.inkSoft, lineHeight: 1.6 }}>{s.desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Risk examples ── */}
      <div style={{ background: T.surface, borderTop: `1px solid ${T.border}`, borderBottom: `1px solid ${T.border}` }}>
        <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 24px' }}>
          <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.16em', marginBottom: 16, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>COMMON RISK FLAGS — LIVE DATABASE SAMPLE</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, border: `1px solid ${T.border}` }}>
            {risks.map((r, i) => (
              <div key={r.code} style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '9px 14px',
                borderBottom: i < risks.length - 2 ? `1px solid ${T.border}` : 'none',
                borderRight: i % 2 === 0 ? `1px solid ${T.border}` : 'none',
                background: i % 2 === 0 ? T.surface : T.bgAlt,
              }}>
                <span style={{ fontSize: 9, color: T.inkMute, fontFamily: MONO, minWidth: 50 }}>{r.code}</span>
                <span style={{ width: 5, height: 5, background: T.sevColor(r.sev), borderRadius: '50%', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: T.inkMid }}>{r.label}</span>
                <SevTag severity={r.sev} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Pricing ── */}
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px' }}>
        <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.16em', marginBottom: 20, paddingBottom: 8, borderBottom: `1px solid ${T.border}` }}>PRICING SCHEDULE</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 0, border: `1px solid ${T.border}` }}>
          {plans.map((p, i) => (
            <div key={p.name} style={{
              padding: '24px 20px',
              borderRight: i < 2 ? `1px solid ${T.border}` : 'none',
              background: p.highlight ? T.surfaceAlt : T.surface,
              borderTop: p.highlight ? `2px solid ${T.amber}` : '2px solid transparent',
              display: 'flex', flexDirection: 'column',
            }}>
              <div style={{ fontSize: 9, color: p.highlight ? T.amber : T.inkMute, letterSpacing: '0.14em', marginBottom: 12 }}>{p.name}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 20 }}>
                <span style={{ fontSize: 28, color: T.ink }}>{p.price}</span>
                {p.period && <span style={{ fontSize: 10, color: T.inkSoft }}>{p.period}</span>}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 20 }}>
                {p.features.map(f => (
                  <div key={f} style={{ display: 'flex', gap: 8, fontSize: 10, color: T.inkMid, alignItems: 'center' }}>
                    <span style={{ color: T.amber, flexShrink: 0 }}>+</span>{f}
                  </div>
                ))}
              </div>
              <Btn full variant={p.highlight ? 'primary' : 'secondary'} onClick={() => onNav('upload')}>
                {p.highlight ? 'START FREE TRIAL' : p.name === 'FREE' ? 'GET STARTED' : 'CONTACT SALES'}
              </Btn>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
}

// ─── Screen 2: Upload ─────────────────────────────────────────────
function UploadScreen({ onBack, onDone, uploadStyle }) {
  const [files, setFiles] = useState([]);
  const [agreed, setAgreed] = useState(false);
  const [dragging, setDragging] = useState(false);

  function addFiles(f) {
    setFiles(p => [...p, ...Array.from(f).map(x => ({ name: x.name, size: x.size, id: Math.random() }))]);
  }
  function fmt(b) {
    if (!b) return '';
    if (b < 1024) return `${b}B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)}KB`;
    return `${(b / 1048576).toFixed(1)}MB`;
  }

  return (
    <PageShell title="UPLOAD" subtitle="PDF · DOCX · PPTX — max 50MB each · up to 20 files"
      actions={<Btn variant="ghost" size="sm" onClick={onBack}>← BACK</Btn>}>
      <div style={{ maxWidth: 580, margin: '32px auto', padding: '0 24px' }}>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={e => { e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files); }}
          onClick={() => document.getElementById('ci-file-input').click()}
          style={{
            border: `1px solid ${dragging ? T.amber : T.borderMid}`,
            background: dragging ? T.amberDim : T.surface,
            padding: '40px 32px', textAlign: 'center', cursor: 'pointer',
            marginBottom: 12, transition: 'all 0.1s',
          }}
        >
          <div style={{ fontSize: 24, color: dragging ? T.amber : T.inkMute, marginBottom: 12, fontFamily: MONO }}>
            {dragging ? '⬇' : '↑'}
          </div>
          <div style={{ fontSize: 11, color: dragging ? T.amber : T.ink, marginBottom: 6, letterSpacing: '0.08em' }}>
            {dragging ? 'DROP TO UPLOAD' : 'DRAG FILES HERE TO UPLOAD'}
          </div>
          <div style={{ fontSize: 10, color: T.inkSoft, marginBottom: 14, letterSpacing: '0.04em' }}>or click to browse</div>
          <div style={{ display: 'inline-flex', gap: 8 }}>
            {['PDF', 'DOCX', 'PPTX'].map(ext => (
              <span key={ext} style={{ background: T.bgAlt, border: `1px solid ${T.border}`, padding: '2px 8px', fontSize: 10, color: T.inkSoft, fontFamily: MONO, letterSpacing: '0.06em' }}>{ext}</span>
            ))}
          </div>
          <input id="ci-file-input" type="file" multiple accept=".pdf,.docx,.pptx" style={{ display: 'none' }} onChange={e => addFiles(e.target.files)} />
        </div>

        {/* File list */}
        {files.length > 0 && (
          <div style={{ border: `1px solid ${T.border}`, marginBottom: 12, background: T.surface }}>
            <div style={{ padding: '7px 14px', borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', background: T.surfaceAlt }}>
              <span style={{ fontSize: 10, color: T.amber, letterSpacing: '0.1em' }}>{files.length} FILE{files.length !== 1 ? 'S' : ''} QUEUED</span>
              <button onClick={() => setFiles([])} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, color: T.inkMute, fontFamily: MONO, letterSpacing: '0.06em' }}>CLEAR</button>
            </div>
            {files.map((f, i) => (
              <div key={f.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 14px', borderBottom: i < files.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                <span style={{ fontSize: 9, color: T.amber, minWidth: 20, fontFamily: MONO }}>{String(i + 1).padStart(2, '0')}</span>
                <span style={{ flex: 1, fontSize: 11, color: T.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontFamily: MONO }}>{f.name}</span>
                {f.size > 0 && <span style={{ fontSize: 10, color: T.inkSoft, fontFamily: MONO, flexShrink: 0 }}>{fmt(f.size)}</span>}
                <button onClick={() => setFiles(p => p.filter(x => x.id !== f.id))} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.inkMute, fontSize: 12, lineHeight: 1, fontFamily: MONO }}>×</button>
              </div>
            ))}
          </div>
        )}

        {/* Consent */}
        <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 20, fontSize: 10, color: T.inkSoft, lineHeight: 1.6, letterSpacing: '0.02em', fontFamily: MONO }}>
          <input type="checkbox" checked={agreed} onChange={e => setAgreed(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, accentColor: T.amber }} />
          <span>I understand ContractIntel uses Claude AI to analyze documents. Files are encrypted in transit and stored securely. <span style={{ color: T.amber, cursor: 'pointer', textDecoration: 'underline' }}>PRIVACY POLICY</span></span>
        </label>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 8 }}>
          <Btn variant="secondary" onClick={onBack}>CANCEL</Btn>
          <Btn disabled={files.length === 0 || !agreed} onClick={() => onDone(files)} full>
            ANALYZE {files.length > 0 ? `${files.length} CONTRACT${files.length !== 1 ? 'S' : ''}` : 'CONTRACTS'}
          </Btn>
        </div>

        <div style={{ marginTop: 16, display: 'flex', gap: 20, flexWrap: 'wrap' }}>
          {['END-TO-END ENCRYPTED', 'NEVER SHARED', 'DELETE ANYTIME'].map(r => (
            <span key={r} style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.08em', fontFamily: MONO }}>+ {r}</span>
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
    { code: 'READ', label: 'READING DOCUMENT',     desc: 'Extracting text from PDF' },
    { code: 'PART', label: 'IDENTIFYING PARTIES',  desc: 'Finding signatories' },
    { code: 'TERM', label: 'EXTRACTING KEY TERMS', desc: 'Dates, values, schedules' },
    { code: 'RISK', label: 'ANALYZING RISK CLAUSES',desc: 'Liability, indemnity, IP' },
    { code: 'SCOR', label: 'SCORING & RANKING',    desc: 'Prioritizing by severity' },
    { code: 'RPRT', label: 'BUILDING REPORT',      desc: 'Formatting results' },
  ];

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
    const interval = setInterval(() => setStepIdx(i => Math.min(i + 1, steps.length - 1)), 1500);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (progress >= 100) {
      const t = setTimeout(onDone, 800);
      return () => clearTimeout(t);
    }
  }, [progress]);

  const bars = Math.floor(progress / 5);

  return (
    <div style={{ flex: 1, background: T.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'auto', padding: '40px 24px' }}>
      <div style={{ maxWidth: 500, width: '100%' }}>

        {/* Header */}
        <div style={{ marginBottom: 24, paddingBottom: 12, borderBottom: `1px solid ${T.border}` }}>
          <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', marginBottom: 6 }}>ANALYSIS ENGINE</div>
          <div style={{ fontSize: 16, color: T.ink, fontFamily: MONO }}>
            {progress < 100 ? 'PROCESSING CONTRACT...' : 'ANALYSIS COMPLETE'}
          </div>
          {files && files.length > 0 && (
            <div style={{ fontSize: 10, color: T.inkSoft, marginTop: 4, fontFamily: MONO }}>
              {files[0].name}{files.length > 1 ? ` +${files.length - 1} more` : ''}
            </div>
          )}
        </div>

        {/* ASCII progress bar */}
        <div style={{ marginBottom: 24 }}>
          <div style={{ fontSize: 10, color: T.inkMid, fontFamily: MONO, marginBottom: 6, display: 'flex', justifyContent: 'space-between' }}>
            <span>PROGRESS</span>
            <span style={{ color: T.amber }}>{Math.round(progress)}%</span>
          </div>
          <div style={{ background: T.border, height: 2, marginBottom: 4 }}>
            <div style={{ width: `${progress}%`, height: '100%', background: T.amber, transition: 'width 0.4s ease' }} />
          </div>
          <div style={{ fontSize: 10, color: T.amber, fontFamily: MONO, letterSpacing: 2 }}>
            {'█'.repeat(bars)}{'░'.repeat(20 - bars)}
          </div>
        </div>

        {/* Step log */}
        <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
          {steps.map((s, i) => (
            <div key={s.code} style={{
              display: 'flex', gap: 12, padding: '8px 14px',
              borderBottom: i < steps.length - 1 ? `1px solid ${T.border}` : 'none',
              opacity: i > stepIdx ? 0.25 : 1, transition: 'opacity 0.3s',
              background: i === stepIdx ? T.surfaceAlt : 'transparent',
            }}>
              <span style={{ fontSize: 9, color: i < stepIdx ? T.green : i === stepIdx ? T.amber : T.inkMute, fontFamily: MONO, minWidth: 32, letterSpacing: '0.08em' }}>
                {i < stepIdx ? 'DONE' : i === stepIdx ? 'RUN>' : s.code}
              </span>
              <span style={{ fontSize: 11, color: i === stepIdx ? T.ink : T.inkMid, flex: 1, fontFamily: MONO }}>{s.label}</span>
              {i === stepIdx && (
                <span style={{ fontSize: 10, color: T.inkSoft, fontFamily: MONO }}>{s.desc}</span>
              )}
            </div>
          ))}
        </div>

        <style>{`@keyframes ciPulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    </div>
  );
}

// ─── Screen 4: Results ─────────────────────────────────────────────
function ResultsScreen({ contractId, onBack, onDeepDive, onExport, onNav, riskStyle }) {
  const { CONTRACTS } = window.APP_DATA;
  const c = CONTRACTS.find(x => x.id === contractId) || CONTRACTS[0];
  const [tab, setTab] = useState('overview');
  const [expandedFlag, setExpandedFlag] = useState(null);
  const [resolvedFlags, setResolvedFlags] = useState([]);
  const [dismissedFlags, setDismissedFlags] = useState([]);
  const [noteInput, setNoteInput] = useState('');
  const [notes, setNotes] = useState([{ id: 1, author: 'S.CHEN', date: '2026-04-11', text: 'Check if liability cap is negotiable before next review.', resolved: false }]);

  const visibleFlags = c.riskFlags.filter(f => !dismissedFlags.includes(f.id));
  const rc = T.riskColor(c.riskScore);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'hidden', minHeight: 0, fontFamily: MONO }}>

      {/* Breadcrumb */}
      <div style={{ padding: '8px 24px', background: T.surface, borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8, fontSize: 10, flexShrink: 0, letterSpacing: '0.06em' }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', color: T.amber, padding: 0, fontSize: 10, fontFamily: MONO, letterSpacing: '0.06em' }}>PORTFOLIO</button>
        <span style={{ color: T.inkMute }}> / </span>
        <span style={{ color: T.inkMid, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 380 }}>{c.name}</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <Btn size="sm" variant="secondary" onClick={onExport}>EXPORT</Btn>
          <Btn size="sm" variant="success">APPROVE</Btn>
        </div>
      </div>

      <div style={{ display: 'flex', flex: 1, overflow: 'hidden', minHeight: 0 }}>

        {/* Main content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', borderRight: `1px solid ${T.border}` }}>
          <Tabs tabs={[
            { id: 'overview', label: 'OVERVIEW' },
            { id: 'risks',    label: `FLAGS (${visibleFlags.length})` },
            { id: 'document', label: 'DOCUMENT' },
            { id: 'history',  label: 'HISTORY' },
          ]} active={tab} onChange={setTab} />

          <div style={{ flex: 1, overflow: 'auto', padding: '20px 24px' }}>

            {/* OVERVIEW */}
            {tab === 'overview' && (
              <div style={{ maxWidth: 560 }}>

                {/* Risk header */}
                <div style={{ background: T.riskBg(c.riskScore), border: `1px solid ${T.riskBorder(c.riskScore)}`, padding: '16px 20px', marginBottom: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', marginBottom: 6 }}>RISK ASSESSMENT</div>
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
                      <span style={{ fontSize: 40, color: rc, fontFamily: MONO, lineHeight: 1 }}>{c.riskScore.toFixed(1)}</span>
                      <span style={{ fontSize: 11, color: rc, letterSpacing: '0.1em' }}>{T.riskLabel(c.riskScore)}</span>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {[{ n: c.flags.red, c: T.red, l: 'CRITICAL' }, { n: c.flags.orange, c: T.orange, l: 'CAUTION' }, { n: c.flags.green, c: T.green, l: 'INFO' }].map(f => (
                      <div key={f.l} style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 22, color: f.c }}>{f.n}</div>
                        <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.1em', marginTop: 2 }}>{f.l}</div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Key details */}
                {[
                  { title: 'PARTIES', rows: [['PROVIDER', c.parties[0]], ['CLIENT', c.parties[1]]] },
                  { title: 'KEY DATES', rows: [['EFFECTIVE', c.effectiveDate], ['EXPIRES', c.terminationDate], ['NOTICE PERIOD', c.noticePeriod], ['AUTO-RENEWAL', c.autoRenewal]] },
                  { title: 'FINANCIAL TERMS', rows: [['VALUE', c.paymentAmount], ['CURRENCY', c.currency], ['SCHEDULE', c.paymentSchedule], ['ESCALATION', c.priceEscalation], ['PAYMENT TERMS', c.paymentTerms]] },
                ].map(sec => (
                  <div key={sec.title} style={{ marginBottom: 20 }}>
                    <SectionLabel>{sec.title}</SectionLabel>
                    <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                      {sec.rows.map(([k, v], i) => (
                        <DataRow key={k} label={k} value={v} last={i === sec.rows.length - 1} />
                      ))}
                    </div>
                  </div>
                ))}

                {/* Notes */}
                <div>
                  <SectionLabel>NOTES</SectionLabel>
                  <div style={{ border: `1px solid ${T.border}`, background: T.surface, marginBottom: 8 }}>
                    {notes.map((n, i) => (
                      <div key={n.id} style={{ padding: '10px 14px', borderBottom: i < notes.length - 1 ? `1px solid ${T.border}` : 'none' }}>
                        <div style={{ fontSize: 9, color: T.inkSoft, marginBottom: 4, letterSpacing: '0.06em' }}>
                          <span style={{ color: T.inkMid }}>{n.author}</span> · {n.date}
                          {n.resolved && <span style={{ color: T.green, marginLeft: 10, letterSpacing: '0.08em' }}>✓ RESOLVED</span>}
                        </div>
                        <div style={{ fontSize: 11, color: T.inkMid, lineHeight: 1.6 }}>{n.text}</div>
                        {!n.resolved && <button onClick={() => setNotes(ns => ns.map(x => x.id === n.id ? { ...x, resolved: true } : x))} style={{ marginTop: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 9, color: T.green, padding: 0, fontFamily: MONO, letterSpacing: '0.08em' }}>MARK RESOLVED</button>}
                      </div>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <input value={noteInput} onChange={e => setNoteInput(e.target.value)} placeholder="ADD NOTE..."
                      style={{ flex: 1, background: T.surface, border: `1px solid ${T.borderMid}`, padding: '7px 12px', fontSize: 11, color: T.ink, fontFamily: MONO, outline: 'none', borderRadius: 0 }} />
                    <Btn size="sm" onClick={() => { if (noteInput.trim()) { setNotes(ns => [...ns, { id: Date.now(), author: 'J.WHITFIELD', date: '2026-05-02', text: noteInput, resolved: false }]); setNoteInput(''); } }}>ADD</Btn>
                  </div>
                </div>
              </div>
            )}

            {/* RISK FLAGS */}
            {tab === 'risks' && (
              <div style={{ maxWidth: 680 }}>
                <div style={{ padding: '8px 14px', background: T.surface, border: `1px solid ${T.border}`, fontSize: 10, color: T.inkMid, display: 'flex', gap: 20, marginBottom: 14, letterSpacing: '0.06em' }}>
                  <span><span style={{ color: T.ink }}>{visibleFlags.length}</span> TOTAL</span>
                  <span style={{ color: T.red }}>{c.flags.red} CRITICAL</span>
                  <span style={{ color: T.orange }}>{c.flags.orange} CAUTION</span>
                  <span style={{ color: T.green }}>{c.flags.green} INFO</span>
                </div>

                <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                  {visibleFlags.map((f, i) => {
                    const isExpanded = expandedFlag === f.id;
                    const isResolved = resolvedFlags.includes(f.id);
                    const fc = T.sevColor(f.severity);
                    return (
                      <div key={f.id} style={{ borderBottom: i < visibleFlags.length - 1 ? `1px solid ${T.border}` : 'none', opacity: isResolved ? 0.45 : 1 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', cursor: 'pointer', background: isExpanded ? T.surfaceAlt : 'transparent' }}
                          onClick={() => setExpandedFlag(isExpanded ? null : f.id)}>
                          <SevTag severity={f.severity} />
                          <span style={{ flex: 1, fontSize: 11, color: T.ink, letterSpacing: '0.02em' }}>{f.title}</span>
                          {isResolved && <span style={{ fontSize: 9, color: T.green, letterSpacing: '0.08em' }}>RESOLVED</span>}
                          <span style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.04em' }}>§{f.section}</span>
                          <span style={{ color: T.inkMute, fontSize: 10 }}>{isExpanded ? '▲' : '▼'}</span>
                        </div>
                        {isExpanded && (
                          <div style={{ padding: '12px 14px 14px 14px', borderTop: `1px solid ${T.border}`, background: T.bgAlt }}>
                            <p style={{ margin: '0 0 10px', fontSize: 11, color: T.inkMid, lineHeight: 1.7 }}>{f.description}</p>
                            <div style={{ background: T.surface, borderLeft: `2px solid ${T.amber}`, padding: '8px 12px', fontSize: 11, color: T.inkMid, marginBottom: 12, lineHeight: 1.6 }}>
                              <span style={{ color: T.amber, letterSpacing: '0.06em', fontSize: 9 }}>RECOMMENDATION: </span>{f.recommendation}
                            </div>
                            <div style={{ display: 'flex', gap: 8 }}>
                              <Btn size="sm" variant="success" onClick={() => setResolvedFlags(rs => rs.includes(f.id) ? rs.filter(x => x !== f.id) : [...rs, f.id])}>
                                {isResolved ? 'UNDO' : '✓ RESOLVE'}
                              </Btn>
                              <Btn size="sm" variant="ghost" onClick={() => setDismissedFlags(ds => [...ds, f.id])}>DISMISS</Btn>
                              <Btn size="sm" variant="secondary" onClick={() => onDeepDive(f.id)}>DEEP DIVE →</Btn>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* DOCUMENT */}
            {tab === 'document' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 260px', gap: 14, maxWidth: 840 }}>
                <div style={{ border: `1px solid ${T.border}`, background: T.surface }}>
                  <div style={{ padding: '8px 14px', background: T.surfaceAlt, borderBottom: `1px solid ${T.border}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 10, color: T.inkSoft, letterSpacing: '0.04em' }}>{c.name}</span>
                    <div style={{ display: 'flex', gap: 5 }}>
                      {['−', '100%', '+'].map(x => (
                        <button key={x} style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '2px 8px', fontSize: 10, color: T.inkSoft, cursor: 'pointer', fontFamily: MONO }}>{x}</button>
                      ))}
                    </div>
                  </div>
                  <div style={{ padding: '24px 28px', fontFamily: MONO, fontSize: 11, lineHeight: 2, color: T.inkMid, background: T.surface, minHeight: 400 }}>
                    <div style={{ fontWeight: 400, textAlign: 'center', fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 20, color: T.ink }}>VENDOR AGREEMENT</div>
                    <p>This Agreement is entered into as of <span style={{ color: T.amber }}>{c.effectiveDate}</span>, between <span style={{ color: T.ink }}>{c.parties[0]}</span> ("Vendor") and <span style={{ color: T.ink }}>{c.parties[1]}</span> ("Buyer").</p>
                    <p style={{ marginTop: 14 }}>5. PAYMENT — Buyer agrees to pay {c.paymentAmount} on a {c.paymentSchedule} basis.</p>
                    <div style={{ marginTop: 14, padding: '8px 12px', background: T.orangeDim, borderLeft: `2px solid ${T.orange}` }}>
                      <span style={{ color: T.orange }}>7. LIABILITY</span><br />
                      <span style={{ background: T.orangeDim, color: T.inkMid }}>Vendor's liability shall not be limited in any manner whatsoever…</span>
                    </div>
                    <div style={{ marginTop: 10, padding: '8px 12px', background: T.redDim, borderLeft: `2px solid ${T.red}` }}>
                      <span style={{ color: T.red }}>10. INDEMNIFICATION</span><br />
                      <span style={{ color: T.inkMid }}>Buyer shall indemnify Vendor for any IP infringement…</span>
                    </div>
                    <p style={{ marginTop: 14, color: T.inkMute, fontStyle: 'italic', fontSize: 10 }}>[Pages 3–8 continue…]</p>
                  </div>
                  <div style={{ padding: '8px 14px', borderTop: `1px solid ${T.border}`, display: 'flex', justifyContent: 'center', gap: 8 }}>
                    <Btn size="sm" variant="secondary">← PREV</Btn>
                    <span style={{ fontSize: 10, color: T.inkSoft, padding: '5px 10px', fontFamily: MONO, letterSpacing: '0.04em' }}>PG 1 / 8</span>
                    <Btn size="sm" variant="secondary">NEXT →</Btn>
                  </div>
                </div>
                <div style={{ border: `1px solid ${T.border}`, background: T.surface, padding: '14px' }}>
                  <SectionLabel>SELECTED CLAUSE</SectionLabel>
                  <div style={{ fontSize: 11, color: T.ink, marginBottom: 8, letterSpacing: '0.04em' }}>§7.2 — LIABILITY</div>
                  <div style={{ fontSize: 10, color: T.inkMid, fontStyle: 'italic', borderLeft: `2px solid ${T.orange}`, paddingLeft: 10, marginBottom: 12, lineHeight: 1.7, fontFamily: MONO }}>"Vendor's liability shall not be limited in any manner whatsoever…"</div>
                  <SevTag severity="orange" />
                  <Divider my={12} />
                  <SectionLabel>RECOMMENDATION</SectionLabel>
                  <p style={{ fontSize: 10, color: T.inkMid, margin: '0 0 12px', lineHeight: 1.7 }}>Add: "Vendor liability shall not exceed two times the annual contract value."</p>
                  <Btn size="sm" variant="secondary" full>COPY CLAUSE LANGUAGE</Btn>
                </div>
              </div>
            )}

            {/* HISTORY */}
            {tab === 'history' && (
              <div style={{ maxWidth: 560 }}>
                {[
                  { time: '2026-04-10 09:14', user: 'J.WHITFIELD', action: 'CONTRACT UPLOADED', detail: c.name, color: T.amber },
                  { time: '2026-04-10 09:15', user: 'CI-AI', action: 'ANALYSIS COMPLETE', detail: `RISK ${c.riskScore}/10 · ${c.riskFlags.length} FLAGS`, color: T.green },
                  { time: '2026-04-11 14:22', user: 'S.CHEN', action: 'NOTE ADDED', detail: 'Check if liability cap is negotiable.', color: T.inkSoft },
                  { time: '2026-04-14 10:05', user: 'S.CHEN', action: 'FLAG REVIEWED', detail: 'Unlimited Liability', color: T.orange },
                ].map((e, i) => (
                  <div key={i} style={{ display: 'flex', gap: 14, padding: '10px 0', borderBottom: `1px solid ${T.border}` }}>
                    <span style={{ fontSize: 9, color: T.inkMute, minWidth: 130, letterSpacing: '0.04em', paddingTop: 2 }}>{e.time}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 2 }}>
                        <span style={{ width: 5, height: 5, background: e.color, borderRadius: '50%', flexShrink: 0 }} />
                        <span style={{ fontSize: 10, color: T.ink, letterSpacing: '0.06em' }}>{e.action}</span>
                        <span style={{ fontSize: 9, color: T.inkSoft, marginLeft: 4 }}>{e.user}</span>
                      </div>
                      <div style={{ fontSize: 10, color: T.inkSoft, paddingLeft: 13 }}>{e.detail}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right sidebar */}
        <div style={{ width: 240, flexShrink: 0, background: T.surface, overflow: 'auto', padding: '16px', borderLeft: `1px solid ${T.border}` }}>
          <div style={{ marginBottom: 16, padding: '14px', background: T.riskBg(c.riskScore), border: `1px solid ${T.riskBorder(c.riskScore)}`, textAlign: 'center' }}>
            <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', marginBottom: 5 }}>RISK SCORE</div>
            <div style={{ fontSize: 36, color: T.riskColor(c.riskScore), fontFamily: MONO }}>{c.riskScore.toFixed(1)}</div>
            <div style={{ fontSize: 10, color: T.riskColor(c.riskScore), marginTop: 3, letterSpacing: '0.1em' }}>{T.riskShort(c.riskScore)} RISK</div>
          </div>
          <SectionLabel>CONTRACT DETAILS</SectionLabel>
          {[
            { label: 'TYPE',         value: <TypePill type={c.type} /> },
            { label: 'COUNTERPARTY', value: c.parties[0] },
            { label: 'EFFECTIVE',    value: c.effectiveDate || '—' },
            { label: 'EXPIRES',      value: c.terminationDate || '—' },
            { label: 'NOTICE',       value: c.noticePeriod || '—' },
            { label: 'AUTO-RENEW',   value: c.autoRenewal || '—' },
            { label: 'VALUE',        value: c.paymentAmount || '—' },
          ].map((row, i, arr) => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 0', borderBottom: i < arr.length - 1 ? `1px solid ${T.border}` : 'none', gap: 8 }}>
              <span style={{ fontSize: 9, color: T.inkSoft, flexShrink: 0, letterSpacing: '0.06em' }}>{row.label}</span>
              <span style={{ fontSize: 10, color: T.ink, textAlign: 'right' }}>{row.value}</span>
            </div>
          ))}
          <div style={{ marginTop: 14, display: 'flex', flexDirection: 'column', gap: 6 }}>
            <Btn size="sm" variant="primary" full onClick={onExport}>EXPORT PDF</Btn>
            <Btn size="sm" variant="secondary" full>SHARE WITH TEAM</Btn>
          </div>
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { HomeScreen, UploadScreen, ProcessingScreen, ResultsScreen });
