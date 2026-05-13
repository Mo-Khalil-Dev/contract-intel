// ContractIntel v5 — Redesigned visual identity

const { useState, useRef } = React;

// ─── Design tokens ───────────────────────────────────────────────
const W = {
  navBg: '#111714',
  bg: '#f4f1ec',
  surface: '#fdfcf9',
  surface2: '#f0ede7',
  border: '#e0d9ce',
  border2: '#ccc4b8',
  text: '#1c1917',
  textMid: '#3a342e',
  textSoft: '#7a6e65',
  textMute: '#b0a89f',
  accent: '#0d6659',
  accentBg: '#ebf5f3',
  accentHover: '#0a5549',
  red: '#b83232',
  redBg: '#fdf0f0',
  redBorder: '#f5c6c6',
  orange: '#c07318',
  orangeBg: '#fdf5e8',
  orangeBorder: '#f5d9a0',
  green: '#2a7a44',
  greenBg: '#eef8f2',
  greenBorder: '#a8dbb9',
};

function wRisk(s) {
  return s >= 7 ? W.red : s >= 4 ? W.orange : W.green;
}
function wRiskBg(s) {
  return s >= 7 ? W.redBg : s >= 4 ? W.orangeBg : W.greenBg;
}
function wRiskLabel(s) {
  return s >= 7 ? 'High' : s >= 4 ? 'Medium' : 'Low';
}
function wSev(sev) {
  return sev === 'red' ? W.red : sev === 'orange' ? W.orange : W.green;
}
function wSevBg(sev) {
  return sev === 'red' ? W.redBg : sev === 'orange' ? W.orangeBg : W.greenBg;
}

// ─── Top Nav ─────────────────────────────────────────────────────
function TopNav({ active, onNav }) {
  const links = [
    { id: 'contracts', label: 'Contracts' },
    { id: 'compare', label: 'Compare' },
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'playbook', label: 'Playbook' },
    { id: 'renewals', label: 'Renewals' },
    { id: 'settings', label: 'Settings' },
  ];
  return (
    <nav
      style={{
        background: W.navBg,
        height: 52,
        display: 'flex',
        alignItems: 'center',
        padding: '0 28px',
        gap: 0,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 36 }}>
        <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
          <rect x="1" y="1" width="20" height="20" rx="3" stroke={W.accent} strokeWidth="1.5" />
          <path
            d="M6 7h10M6 11h7M6 15h9"
            stroke={W.accent}
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: '#f4f1ec',
            letterSpacing: '-0.02em',
            fontFamily: "'Space Grotesk',sans-serif",
          }}
        >
          ContractIntel
        </span>
      </div>
      {/* Links */}
      <div style={{ display: 'flex', gap: 1, flex: 1 }}>
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => onNav(l.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '7px 14px',
              borderRadius: 4,
              fontSize: 13,
              fontWeight: active === l.id ? 600 : 400,
              color: active === l.id ? '#f4f1ec' : 'rgba(244,241,236,0.45)',
              position: 'relative',
              transition: 'color 0.15s',
            }}
            onMouseEnter={(e) => {
              if (active !== l.id) e.currentTarget.style.color = 'rgba(244,241,236,0.75)';
            }}
            onMouseLeave={(e) => {
              if (active !== l.id) e.currentTarget.style.color = 'rgba(244,241,236,0.45)';
            }}
          >
            {l.label}
            {active === l.id && (
              <span
                style={{
                  position: 'absolute',
                  bottom: 0,
                  left: 14,
                  right: 14,
                  height: 2,
                  background: W.accent,
                  borderRadius: '2px 2px 0 0',
                }}
              ></span>
            )}
          </button>
        ))}
      </div>
      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'rgba(244,241,236,0.4)', fontWeight: 500 }}>
          James Whitfield
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            background: 'rgba(13,102,89,0.7)',
            border: '1px solid rgba(13,102,89,0.9)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: '#f4f1ec',
            letterSpacing: '0.03em',
          }}
        >
          JW
        </div>
      </div>
    </nav>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────
function WRiskBadge({ score, size = 'sm' }) {
  const c = wRisk(score),
    bg = wRiskBg(score);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: bg,
        color: c,
        border: `1px solid ${c}40`,
        borderRadius: 3,
        padding: size === 'lg' ? '4px 10px' : '2px 7px',
        fontSize: size === 'lg' ? 12 : 11,
        fontWeight: 700,
        fontFamily: "'Space Grotesk',monospace",
        letterSpacing: '0.02em',
      }}
    >
      <span
        style={{
          width: size === 'lg' ? 7 : 5,
          height: size === 'lg' ? 7 : 5,
          borderRadius: '50%',
          background: c,
          flexShrink: 0,
        }}
      ></span>
      {score.toFixed(1)}
    </span>
  );
}

// ─── Type pill ────────────────────────────────────────────────────
function WTypePill({ type }) {
  const colors = {
    vendor: '#5c3a9e',
    license: '#0a5c8f',
    partnership: '#0d6659',
    customer: '#8f1a5c',
    lease: '#7a4f0a',
    nda: '#4a5568',
  };
  const bgs = {
    vendor: '#f3eeff',
    license: '#eaf5ff',
    partnership: '#ebf5f3',
    customer: '#fdeef8',
    lease: '#fdf3e3',
    nda: '#f5f6f8',
  };
  return (
    <span
      style={{
        background: bgs[type] || bgs.nda,
        color: colors[type] || colors.nda,
        borderRadius: 3,
        padding: '2px 8px',
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.05em',
      }}
    >
      {type}
    </span>
  );
}

// ─── Flag summary ─────────────────────────────────────────────────
function WFlags({ flags }) {
  return (
    <span style={{ display: 'inline-flex', gap: 8, alignItems: 'center' }}>
      {flags.red > 0 && (
        <span
          style={{
            color: W.red,
            fontWeight: 700,
            fontSize: 11,
            fontFamily: "'Space Grotesk',sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: W.red,
              display: 'inline-block',
            }}
          ></span>
          {flags.red}
        </span>
      )}
      {flags.orange > 0 && (
        <span
          style={{
            color: W.orange,
            fontWeight: 700,
            fontSize: 11,
            fontFamily: "'Space Grotesk',sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: W.orange,
              display: 'inline-block',
            }}
          ></span>
          {flags.orange}
        </span>
      )}
      {flags.green > 0 && (
        <span
          style={{
            color: W.green,
            fontWeight: 700,
            fontSize: 11,
            fontFamily: "'Space Grotesk',sans-serif",
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: W.green,
              display: 'inline-block',
            }}
          ></span>
          {flags.green}
        </span>
      )}
      {flags.red === 0 && flags.orange === 0 && (
        <span style={{ color: W.textMute, fontSize: 11 }}>—</span>
      )}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────
function WBtn({ children, variant = 'primary', onClick, small, disabled, style: ex }) {
  const s = {
    primary: { background: W.accent, color: '#f4f1ec', border: 'none' },
    secondary: { background: W.surface, color: W.textMid, border: `1px solid ${W.border2}` },
    ghost: { background: 'transparent', color: W.textSoft, border: 'none' },
    danger: { background: W.redBg, color: W.red, border: `1px solid ${W.redBorder}` },
    success: { background: W.greenBg, color: W.green, border: `1px solid ${W.greenBorder}` },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...s[variant],
        borderRadius: 4,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: small ? '4px 10px' : '6px 14px',
        fontSize: small ? 11 : 12,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.1s',
        letterSpacing: '0.01em',
        fontFamily: "'Space Grotesk',sans-serif",
        ...ex,
      }}
    >
      {children}
    </button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function WModal({ title, onClose, children, width = 500 }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(28,25,23,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: W.surface,
          border: `1px solid ${W.border}`,
          borderRadius: 6,
          width,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 64px rgba(28,25,23,0.18)',
        }}
      >
        <div
          style={{
            padding: '14px 20px',
            borderBottom: `1px solid ${W.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 700,
              color: W.text,
              letterSpacing: '-0.01em',
            }}
          >
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: W.textSoft,
              lineHeight: 1,
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

// ─── Page shell ───────────────────────────────────────────────────
function PageShell({ title, subtitle, actions, children }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: W.bg,
        overflow: 'auto',
      }}
    >
      <div
        style={{
          padding: '18px 28px 14px',
          background: W.surface,
          borderBottom: `1px solid ${W.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 12 }}>
          <h1
            style={{
              margin: 0,
              fontSize: 17,
              fontWeight: 700,
              color: W.text,
              letterSpacing: '-0.025em',
            }}
          >
            {title}
          </h1>
          {subtitle && (
            <span style={{ fontSize: 12, color: W.textMute, fontWeight: 500 }}>{subtitle}</span>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 8 }}>{actions}</div>}
      </div>
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function WTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display: 'flex', borderBottom: `1px solid ${W.border}`, paddingLeft: 0 }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '9px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: active === t.id ? 700 : 400,
            color: active === t.id ? W.accent : W.textSoft,
            borderBottom: active === t.id ? `2px solid ${W.accent}` : '2px solid transparent',
            marginBottom: -1,
            whiteSpace: 'nowrap',
            letterSpacing: '0.01em',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

// ─── Mini sparkline bar ───────────────────────────────────────────
function RiskBar({ score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
      <div
        style={{ width: 56, height: 4, background: W.border, borderRadius: 2, overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${score * 10}%`,
            height: '100%',
            background: wRisk(score),
            borderRadius: 2,
          }}
        ></div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: wRisk(score),
          fontFamily: "'Space Grotesk',sans-serif",
          letterSpacing: '0.02em',
        }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

Object.assign(window, {
  W,
  wRisk,
  wRiskBg,
  wRiskLabel,
  wSev,
  wSevBg,
  TopNav,
  WRiskBadge,
  WTypePill,
  WFlags,
  WBtn,
  WModal,
  PageShell,
  WTabs,
  RiskBar,
});
