// ContractIntel v6 — Info pages: Risk Guide + About

// ─── Risk Guide ───────────────────────────────────────────────────
function RiskGuideScreen() {
  const sections = [
    {
      title: 'How Risk Scores Work',
      content: `ContractIntel scores each contract on a 0–10 scale. The score is a weighted composite of clause-level findings, counterparty exposure, financial materiality, and deadline proximity. A higher score indicates more potential exposure requiring attention.`,
    },
    {
      title: 'Score Bands',
      bands: [
        {
          label: 'High Risk',
          range: '7.0 – 10.0',
          color: '#b83232',
          bg: '#fdf0f0',
          desc: 'Significant clauses require immediate legal review. Potential financial, operational, or compliance exposure.',
        },
        {
          label: 'Medium Risk',
          range: '4.0 – 6.9',
          color: '#c07318',
          bg: '#fdf5e8',
          desc: 'Notable issues present. Review recommended before renewal or execution. Monitor flagged clauses closely.',
        },
        {
          label: 'Low Risk',
          range: '0 – 3.9',
          color: '#1e7a44',
          bg: '#eef8f2',
          desc: 'Standard language with minor considerations. Routine review cadence is sufficient.',
        },
      ],
    },
    {
      title: 'Flag Types',
      flags: [
        {
          sev: 'red',
          label: 'Critical',
          desc: 'Clauses with direct legal, financial, or regulatory risk. Examples: uncapped liability, automatic renewal without notice, unilateral termination rights.',
        },
        {
          sev: 'orange',
          label: 'Advisory',
          desc: 'Clauses that deviate from standard market terms or your playbook. Warrant negotiation or explicit approval.',
        },
        {
          sev: 'green',
          label: 'Informational',
          desc: 'Observations or non-standard language worth noting, but unlikely to create material risk on their own.',
        },
      ],
    },
    {
      title: 'Scoring Factors',
      factors: [
        {
          label: 'Clause Severity',
          weight: '40%',
          desc: 'Weighted sum of individual clause flags by severity level',
        },
        {
          label: 'Financial Exposure',
          weight: '25%',
          desc: 'Contract value, liability caps, penalty clauses relative to threshold',
        },
        {
          label: 'Counterparty Profile',
          weight: '20%',
          desc: 'Jurisdiction, counterparty concentration, and credit indicators',
        },
        {
          label: 'Deadline Proximity',
          weight: '15%',
          desc: 'Days to expiry, renewal windows, and missed notice periods',
        },
      ],
    },
    {
      title: 'Playbook Compliance',
      content: `Playbook checks compare extracted clauses against your organisation's approved standards. A clause marked "non-compliant" means it deviates from the approved position — it does not automatically indicate legal risk, but does require review and sign-off before execution.`,
    },
    {
      title: 'Limitations',
      content: `ContractIntel uses AI-assisted extraction and is designed to surface issues for human review — not to replace legal counsel. Scores and flags may not capture all jurisdiction-specific nuances, and complex or bespoke agreements should always be reviewed by a qualified lawyer.`,
      warning: true,
    },
  ];

  return (
    <PageShell title="Risk Guide" subtitle="How ContractIntel analyses and scores contracts">
      <div style={{ maxWidth: 760, margin: '0 auto', padding: '32px 28px' }}>
        {sections.map((s, i) => (
          <section key={i} style={{ marginBottom: 40 }}>
            <h2
              style={{
                margin: '0 0 14px',
                fontSize: 15,
                fontWeight: 700,
                color: W.text,
                letterSpacing: '-0.02em',
                paddingBottom: 10,
                borderBottom: `1px solid ${W.border}`,
              }}
            >
              {s.title}
            </h2>

            {s.content && (
              <p
                style={{
                  margin: 0,
                  fontSize: 13.5,
                  lineHeight: 1.7,
                  color: s.warning ? W.textMid : W.textMid,
                  background: s.warning ? W.orangeBg : 'transparent',
                  border: s.warning ? `1px solid ${W.orangeBorder}` : 'none',
                  borderRadius: s.warning ? 6 : 0,
                  padding: s.warning ? '12px 16px' : 0,
                }}
              >
                {s.warning && <strong style={{ color: W.orange }}>Note: </strong>}
                {s.content}
              </p>
            )}

            {s.bands && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {s.bands.map((b, j) => (
                  <div
                    key={j}
                    style={{
                      display: 'flex',
                      gap: 14,
                      alignItems: 'flex-start',
                      background: b.bg,
                      border: `1px solid ${b.color}30`,
                      borderRadius: 6,
                      padding: '12px 16px',
                    }}
                  >
                    <div style={{ minWidth: 90 }}>
                      <div style={{ fontWeight: 700, fontSize: 12, color: b.color }}>{b.label}</div>
                      <div
                        style={{
                          fontSize: 11,
                          color: b.color,
                          opacity: 0.8,
                          fontWeight: 600,
                          marginTop: 2,
                        }}
                      >
                        {b.range}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: W.textMid }}>
                      {b.desc}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {s.flags && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {s.flags.map((f, j) => {
                  const c = f.sev === 'red' ? W.red : f.sev === 'orange' ? W.orange : W.green;
                  const bg =
                    f.sev === 'red' ? W.redBg : f.sev === 'orange' ? W.orangeBg : W.greenBg;
                  return (
                    <div
                      key={j}
                      style={{
                        display: 'flex',
                        gap: 14,
                        alignItems: 'flex-start',
                        padding: '11px 16px',
                        background: bg,
                        border: `1px solid ${c}30`,
                        borderRadius: 6,
                      }}
                    >
                      <div style={{ minWidth: 100 }}>
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            fontWeight: 700,
                            fontSize: 12,
                            color: c,
                          }}
                        >
                          <span
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: '50%',
                              background: c,
                              flexShrink: 0,
                              display: 'inline-block',
                            }}
                          ></span>
                          {f.label}
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.6, color: W.textMid }}>
                        {f.desc}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}

            {s.factors && (
              <div style={{ border: `1px solid ${W.border}`, borderRadius: 6, overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                  <thead>
                    <tr style={{ background: W.surface2 }}>
                      <th
                        style={{
                          padding: '9px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: 11,
                          color: W.textSoft,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: `1px solid ${W.border}`,
                        }}
                      >
                        Factor
                      </th>
                      <th
                        style={{
                          padding: '9px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: 11,
                          color: W.textSoft,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: `1px solid ${W.border}`,
                          width: 80,
                        }}
                      >
                        Weight
                      </th>
                      <th
                        style={{
                          padding: '9px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          fontSize: 11,
                          color: W.textSoft,
                          textTransform: 'uppercase',
                          letterSpacing: '0.06em',
                          borderBottom: `1px solid ${W.border}`,
                        }}
                      >
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {s.factors.map((f, j) => (
                      <tr
                        key={j}
                        style={{
                          borderBottom: j < s.factors.length - 1 ? `1px solid ${W.border}` : 'none',
                          background: W.surface,
                        }}
                      >
                        <td style={{ padding: '10px 16px', fontWeight: 600, color: W.text }}>
                          {f.label}
                        </td>
                        <td style={{ padding: '10px 16px', fontWeight: 700, color: W.accent }}>
                          {f.weight}
                        </td>
                        <td style={{ padding: '10px 16px', color: W.textMid, lineHeight: 1.5 }}>
                          {f.desc}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}
      </div>
    </PageShell>
  );
}

// ─── About Screen ─────────────────────────────────────────────────
function AboutScreen() {
  const capabilities = [
    {
      title: 'Contract Extraction',
      desc: 'Automatically parses uploaded PDFs and Word documents, identifying parties, dates, governing law, payment terms, and over 40 standard clause types.',
    },
    {
      title: 'Risk Analysis',
      desc: 'Scores each contract 0–10 using a weighted model covering clause severity, financial exposure, counterparty risk, and deadline proximity.',
    },
    {
      title: 'Playbook Compliance',
      desc: 'Checks extracted clauses against your approved standards library. Highlights deviations and suggests fall-back positions.',
    },
    {
      title: 'Portfolio Intelligence',
      desc: 'Aggregates across your entire contract portfolio to surface concentration risk, expiry clusters, and counterparty exposure at a glance.',
    },
    {
      title: 'Renewal Tracking',
      desc: 'Monitors upcoming renewals and expiries with configurable notice-period alerts so nothing falls through the cracks.',
    },
    {
      title: 'Audit Trail',
      desc: 'Every AI extraction, flag, and user action is logged with timestamps for full accountability and compliance readiness.',
    },
  ];

  const stats = [
    { value: '40+', label: 'Clause types extracted' },
    { value: '<2 min', label: 'Avg. processing time' },
    { value: '94%', label: 'Extraction accuracy' },
    { value: 'SOC 2', label: 'Type II certified' },
  ];

  return (
    <PageShell
      title="About ContractIntel"
      subtitle="AI-assisted contract review for legal and procurement teams"
    >
      <div style={{ maxWidth: 800, margin: '0 auto', padding: '32px 28px' }}>
        {/* Hero statement */}
        <div
          style={{
            background: W.navBg,
            borderRadius: 8,
            padding: '28px 32px',
            marginBottom: 36,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              position: 'absolute',
              top: -20,
              right: -20,
              width: 120,
              height: 120,
              borderRadius: '50%',
              background: `${W.accent}15`,
            }}
          ></div>
          <div
            style={{
              position: 'absolute',
              bottom: -30,
              right: 60,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: `${W.accent}10`,
            }}
          ></div>
          <p
            style={{
              margin: 0,
              fontSize: 16,
              lineHeight: 1.7,
              color: 'rgba(238,241,248,0.85)',
              maxWidth: 580,
              letterSpacing: '-0.01em',
              position: 'relative',
            }}
          >
            ContractIntel helps legal, procurement, and finance teams understand what's in their
            contracts — fast. Upload a document and get a structured risk summary in minutes, not
            hours.
          </p>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4,1fr)',
            gap: 12,
            marginBottom: 36,
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                padding: '16px 18px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 22,
                  fontWeight: 700,
                  color: W.accent,
                  letterSpacing: '-0.03em',
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: W.textSoft,
                  fontWeight: 500,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>

        {/* Capabilities */}
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 700,
            color: W.text,
            letterSpacing: '-0.02em',
            paddingBottom: 10,
            borderBottom: `1px solid ${W.border}`,
          }}
        >
          Capabilities
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 40 }}>
          {capabilities.map((c, i) => (
            <div
              key={i}
              style={{
                background: W.surface,
                border: `1px solid ${W.border}`,
                borderRadius: 6,
                padding: '16px 18px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: W.accent,
                    flexShrink: 0,
                    display: 'inline-block',
                  }}
                ></span>
                <span style={{ fontWeight: 700, fontSize: 13, color: W.text }}>{c.title}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12.5, lineHeight: 1.65, color: W.textMid }}>
                {c.desc}
              </p>
            </div>
          ))}
        </div>

        {/* Data & security */}
        <h2
          style={{
            margin: '0 0 16px',
            fontSize: 15,
            fontWeight: 700,
            color: W.text,
            letterSpacing: '-0.02em',
            paddingBottom: 10,
            borderBottom: `1px solid ${W.border}`,
          }}
        >
          Data & Security
        </h2>
        <div
          style={{
            background: W.surface,
            border: `1px solid ${W.border}`,
            borderRadius: 6,
            padding: '18px 20px',
            marginBottom: 40,
          }}
        >
          {[
            ['Encryption', 'All documents encrypted at rest (AES-256) and in transit (TLS 1.3).'],
            [
              'Data residency',
              'Data stored within your chosen region. No cross-border transfers without explicit consent.',
            ],
            [
              'Retention',
              'Documents and extractions retained for 7 years by default, configurable per organisation.',
            ],
            [
              'Access control',
              'Role-based permissions with SSO support (SAML 2.0, OIDC). Full audit logs.',
            ],
            [
              'AI processing',
              'Extraction models run within your tenancy boundary. Documents are never used for model training.',
            ],
          ].map(([label, val], i, arr) => (
            <div
              key={i}
              style={{
                display: 'flex',
                gap: 20,
                padding: '9px 0',
                borderBottom: i < arr.length - 1 ? `1px solid ${W.border}` : 'none',
              }}
            >
              <span
                style={{
                  minWidth: 130,
                  fontSize: 12,
                  fontWeight: 700,
                  color: W.textSoft,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  paddingTop: 1,
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: 13, color: W.textMid, lineHeight: 1.5 }}>{val}</span>
            </div>
          ))}
        </div>

        {/* Version */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderTop: `1px solid ${W.border}`,
          }}
        >
          <span style={{ fontSize: 12, color: W.textMute }}>
            ContractIntel · Version 4.2.1 · Last updated April 2026
          </span>
          <span style={{ fontSize: 12, color: W.textMute }}>© 2026 ContractIntel Ltd</span>
        </div>
      </div>
    </PageShell>
  );
}

Object.assign(window, { RiskGuideScreen, AboutScreen });
