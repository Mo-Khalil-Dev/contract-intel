// ContractIntel v2 — Dark mode design tokens + shared components

const { useState, useEffect, useRef } = React;

// ─── Design tokens ───────────────────────────────────────────────
const D = {
  bg: '#080c14',
  bg2: '#0c1220',
  surface: '#0f1825',
  surface2: '#141e2e',
  surface3: '#1a2538',
  border: '#1e2d42',
  border2: '#253450',
  text: '#e2e8f0',
  textMid: '#94a3b8',
  textSoft: '#64748b',
  textMute: '#334155',
  accent: '#3b82f6',
  accentDim: '#1d4ed8',
  accentGlow: 'rgba(59,130,246,0.15)',
  red: '#f43f5e',
  redDim: '#be123c',
  redGlow: 'rgba(244,63,94,0.15)',
  orange: '#fb923c',
  orangeDim: '#c2410c',
  orangeGlow: 'rgba(251,146,60,0.12)',
  green: '#34d399',
  greenDim: '#059669',
  greenGlow: 'rgba(52,211,153,0.12)',
  yellow: '#fbbf24',
  yellowGlow: 'rgba(251,191,36,0.12)',
};

function dRiskColor(s) {
  if (s >= 7) return D.red;
  if (s >= 4) return D.orange;
  return D.green;
}
function dRiskGlow(s) {
  if (s >= 7) return D.redGlow;
  if (s >= 4) return D.orangeGlow;
  return D.greenGlow;
}
function dSevColor(sev) {
  if (sev === 'red') return D.red;
  if (sev === 'orange') return D.orange;
  return D.green;
}

// ─── SVG Risk Gauge ──────────────────────────────────────────────
function RiskGauge({ score, size = 72 }) {
  const R = size * 0.38,
    cx = size / 2,
    cy = size * 0.56;
  const startAngle = Math.PI * 1.15,
    endAngle = Math.PI * 1.85;
  const sweep = endAngle - startAngle;
  const pct = score / 10;
  const color = dRiskColor(score);

  function arc(start, end, r) {
    const x1 = cx + r * Math.cos(start),
      y1 = cy + r * Math.sin(start);
    const x2 = cx + r * Math.cos(end),
      y2 = cy + r * Math.sin(end);
    const large = end - start > Math.PI ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  }

  const trackPath = arc(startAngle, endAngle, R);
  const fillAngle = startAngle + sweep * pct;
  const fillPath = pct > 0 ? arc(startAngle, Math.min(fillAngle, endAngle - 0.01), R) : null;

  return (
    <svg width={size} height={size * 0.7} viewBox={`0 0 ${size} ${size * 0.7}`}>
      <path
        d={trackPath}
        fill="none"
        stroke={D.border2}
        strokeWidth={size * 0.07}
        strokeLinecap="round"
      />
      {fillPath && (
        <path
          d={fillPath}
          fill="none"
          stroke={color}
          strokeWidth={size * 0.07}
          strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 ${size * 0.06}px ${color})` }}
        />
      )}
      <text
        x={cx}
        y={cy + 2}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={color}
        fontSize={size * 0.22}
        fontWeight="800"
        fontFamily="'IBM Plex Mono', monospace"
      >
        {score.toFixed(1)}
      </text>
    </svg>
  );
}

// ─── Contract Card ───────────────────────────────────────────────
function ContractCard({ contract, onClick }) {
  const c = contract;
  const [hov, setHov] = useState(false);
  const color = dRiskColor(c.riskScore);
  const typeColors = {
    vendor: '#818cf8',
    license: '#38bdf8',
    partnership: '#2dd4bf',
    customer: '#f472b6',
    lease: '#fb923c',
    nda: '#94a3b8',
  };
  const tc = typeColors[c.type] || '#94a3b8';

  if (c.status === 'processing') {
    return (
      <div
        style={{
          background: D.surface,
          border: `1px solid ${D.border}`,
          borderRadius: 10,
          padding: 20,
          cursor: 'default',
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 8,
              background: D.surface3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 18,
            }}
          >
            📄
          </div>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: D.text,
                marginBottom: 3,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {c.name}
            </div>
            <div style={{ fontSize: 11, color: D.textSoft, textTransform: 'capitalize' }}>
              {c.type}
            </div>
          </div>
        </div>
        <div style={{ height: 4, background: D.border, borderRadius: 2, overflow: 'hidden' }}>
          <div
            style={{
              width: `${c.progress}%`,
              height: '100%',
              background: D.accent,
              borderRadius: 2,
              transition: 'width 0.3s',
            }}
          ></div>
        </div>
        <div style={{ fontSize: 12, color: D.textSoft }}>
          <span style={{ color: D.accent, fontWeight: 600 }}>●</span> Analysing… {c.progress}%
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: hov ? D.surface2 : D.surface,
        border: `1px solid ${hov ? color + '44' : D.border}`,
        borderRadius: 10,
        padding: 18,
        cursor: 'pointer',
        transition: 'all 0.18s',
        boxShadow: hov ? `0 0 0 1px ${color}22, 0 8px 24px rgba(0,0,0,0.4)` : 'none',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: tc,
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 5,
            }}
          >
            {c.type}
          </div>
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: D.text,
              lineHeight: 1.3,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {c.name.replace(/\.[^.]+$/, '')}
          </div>
        </div>
        <RiskGauge score={c.riskScore} size={64} />
      </div>

      {/* Flags */}
      <div style={{ display: 'flex', gap: 6 }}>
        {c.flags.red > 0 && (
          <div
            style={{
              flex: 1,
              background: D.redGlow,
              border: `1px solid ${D.red}33`,
              borderRadius: 6,
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: D.red,
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            >
              {c.flags.red}
            </div>
            <div
              style={{
                fontSize: 9,
                color: D.red,
                fontWeight: 700,
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              High
            </div>
          </div>
        )}
        {c.flags.orange > 0 && (
          <div
            style={{
              flex: 1,
              background: D.orangeGlow,
              border: `1px solid ${D.orange}33`,
              borderRadius: 6,
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: D.orange,
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            >
              {c.flags.orange}
            </div>
            <div
              style={{
                fontSize: 9,
                color: D.orange,
                fontWeight: 700,
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              Med
            </div>
          </div>
        )}
        {c.flags.green > 0 && (
          <div
            style={{
              flex: 1,
              background: D.greenGlow,
              border: `1px solid ${D.green}33`,
              borderRadius: 6,
              padding: '6px 8px',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                fontSize: 16,
                fontWeight: 800,
                color: D.green,
                fontFamily: "'IBM Plex Mono',monospace",
              }}
            >
              {c.flags.green}
            </div>
            <div
              style={{
                fontSize: 9,
                color: D.green,
                fontWeight: 700,
                textTransform: 'uppercase',
                opacity: 0.8,
              }}
            >
              OK
            </div>
          </div>
        )}
        {c.flags.red === 0 && c.flags.orange === 0 && c.flags.green === 0 && (
          <div style={{ color: D.textMute, fontSize: 12 }}>No flags</div>
        )}
      </div>

      {/* Footer */}
      <div
        style={{
          borderTop: `1px solid ${D.border}`,
          paddingTop: 10,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div>
          <div style={{ fontSize: 11, color: D.textSoft, marginBottom: 2 }}>{c.parties[0]}</div>
          <div style={{ fontSize: 10, color: D.textMute, fontFamily: "'IBM Plex Mono',monospace" }}>
            {c.uploadDate}
          </div>
        </div>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: color,
            background: dRiskGlow(c.riskScore),
            border: `1px solid ${color}33`,
            borderRadius: 4,
            padding: '3px 8px',
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          {c.riskScore >= 7 ? 'HIGH RISK' : c.riskScore >= 4 ? 'MEDIUM' : 'LOW RISK'}
        </div>
      </div>
    </div>
  );
}

// ─── Dark Sidebar v2 ─────────────────────────────────────────────
function SidebarV2({ active, onNav }) {
  const items = [
    { id: 'dashboard', label: 'Contracts', icon: '▤' },
    { id: 'portfolio', label: 'Portfolio', icon: '◫' },
    { id: 'calendar', label: 'Renewals', icon: '◻' },
    { id: 'templates', label: 'Templates', icon: '⊞' },
    { id: 'settings', label: 'Settings', icon: '⊙' },
  ];
  return (
    <div
      style={{
        width: 56,
        flexShrink: 0,
        background: D.bg2,
        borderRight: `1px solid ${D.border}`,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        height: '100vh',
        position: 'sticky',
        top: 0,
        padding: '12px 0',
      }}
    >
      {/* Logo */}
      <div
        style={{
          width: 34,
          height: 34,
          borderRadius: 8,
          background: D.accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 13,
          fontWeight: 900,
          color: '#fff',
          marginBottom: 20,
          boxShadow: `0 0 16px ${D.accentGlow}`,
        }}
      >
        CI
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {items.map((item) => (
          <button
            key={item.id}
            onClick={() => onNav(item.id)}
            title={item.label}
            style={{
              width: 38,
              height: 38,
              borderRadius: 8,
              border: 'none',
              background: active === item.id ? D.accentGlow : 'transparent',
              color: active === item.id ? D.accent : D.textSoft,
              cursor: 'pointer',
              fontSize: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.12s',
              boxShadow: active === item.id ? `0 0 0 1px ${D.accent}44` : 'none',
            }}
          >
            {item.icon}
          </button>
        ))}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: '50%',
          background: `linear-gradient(135deg, ${D.accent}, #7c3aed)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 11,
          fontWeight: 700,
          color: '#fff',
        }}
      >
        JW
      </div>
    </div>
  );
}

// ─── Shared dark button ──────────────────────────────────────────
function DBtn({ children, variant = 'primary', onClick, small, disabled, style: ex }) {
  const s = {
    primary: { background: D.accent, color: '#fff', border: 'none' },
    secondary: { background: D.surface2, color: D.text, border: `1px solid ${D.border2}` },
    ghost: { background: 'transparent', color: D.textMid, border: 'none' },
    danger: { background: D.redGlow, color: D.red, border: `1px solid ${D.red}33` },
    success: { background: D.greenGlow, color: D.green, border: `1px solid ${D.green}33` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s[variant],
        borderRadius: 6,
        cursor: disabled ? 'default' : 'pointer',
        padding: small ? '5px 10px' : '7px 14px',
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        opacity: disabled ? 0.4 : 1,
        transition: 'all 0.12s',
        ...ex,
      }}
    >
      {children}
    </button>
  );
}

// ─── Dark Modal ──────────────────────────────────────────────────
function DModal({ title, onClose, children, width = 520 }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.75)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        backdropFilter: 'blur(4px)',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: D.surface,
          border: `1px solid ${D.border2}`,
          borderRadius: 12,
          width,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${D.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: D.text }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: D.textSoft,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Dark Tabs ───────────────────────────────────────────────────
function DTabs({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: `1px solid ${D.border}`,
        paddingLeft: 20,
        background: D.bg2,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '10px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: active === t.id ? 700 : 400,
            color: active === t.id ? D.accent : D.textSoft,
            borderBottom: active === t.id ? `2px solid ${D.accent}` : '2px solid transparent',
            marginBottom: -1,
            whiteSpace: 'nowrap',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Dark stat card ──────────────────────────────────────────────
function DStatCard({ label, value, sub, color, glow }) {
  return (
    <div
      style={{
        background: D.surface,
        border: `1px solid ${D.border}`,
        borderRadius: 10,
        padding: '16px 18px',
        boxShadow: glow ? `0 0 20px ${glow}` : 'none',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: D.textSoft,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          marginBottom: 8,
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: color || D.text,
          fontFamily: "'IBM Plex Mono',monospace",
          lineHeight: 1,
        }}
      >
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: D.textMute, marginTop: 5 }}>{sub}</div>}
    </div>
  );
}

// ─── Glowing bar chart ───────────────────────────────────────────
function GlowBarChart({ data, height = 140 }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, paddingTop: 20 }}>
      {data.map((d, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            flex: 1,
            gap: 6,
          }}
        >
          <div style={{ fontSize: 11, color: D.textSoft, fontFamily: "'IBM Plex Mono',monospace" }}>
            {d.value}
          </div>
          <div
            style={{
              width: '100%',
              position: 'relative',
              height: max ? (d.value / max) * (height - 50) : 4,
              minHeight: 4,
            }}
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                background: `linear-gradient(to top, ${d.color}, ${d.color}99)`,
                borderRadius: '3px 3px 0 0',
                boxShadow: `0 0 12px ${d.color}66`,
              }}
            ></div>
          </div>
          <div style={{ fontSize: 10, color: D.textSoft, textAlign: 'center', lineHeight: 1.2 }}>
            {d.label}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Donut chart ─────────────────────────────────────────────────
function DonutChart({ segments, size = 120, thickness = 18 }) {
  const total = segments.reduce((s, d) => s + d.value, 0) || 1;
  const r = (size - thickness) / 2,
    cx = size / 2,
    cy = size / 2;
  const circ = 2 * Math.PI * r;
  let offset = 0;
  const arcs = segments.map((seg) => {
    const pct = seg.value / total;
    const dash = pct * circ;
    const arc = {
      pct,
      dash,
      offset: circ - offset,
      color: seg.color,
      label: seg.label,
      value: seg.value,
    };
    offset += dash;
    return arc;
  });
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      {arcs.map((a, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          stroke={a.color}
          strokeWidth={thickness}
          strokeDasharray={`${a.dash} ${circ}`}
          strokeDashoffset={-a.offset + circ}
          style={{ filter: `drop-shadow(0 0 6px ${a.color}88)` }}
        />
      ))}
    </svg>
  );
}

Object.assign(window, {
  D,
  dRiskColor,
  dRiskGlow,
  dSevColor,
  RiskGauge,
  ContractCard,
  SidebarV2,
  DBtn,
  DModal,
  DTabs,
  DStatCard,
  GlowBarChart,
  DonutChart,
});
