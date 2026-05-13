// ContractIntel v6 — Deep navy + amber

const { useState, useRef } = React;

// ─── Design tokens ───────────────────────────────────────────────
const W = {
  navBg: '#0b1629',
  navBorder: 'rgba(255,255,255,0.07)',
  bg: '#f2f4f7',
  surface: '#ffffff',
  surface2: '#edf0f4',
  border: '#dde1e9',
  border2: '#c8cdd8',
  text: '#0b1629',
  textMid: '#2d3a52',
  textSoft: '#6b7899',
  textMute: '#9aa3bc',
  accent: '#c97d0a',
  accentBg: '#fdf3e3',
  accentHover: '#a86508',
  red: '#b83232',
  redBg: '#fdf0f0',
  redBorder: '#f5c6c6',
  orange: '#c07318',
  orangeBg: '#fdf5e8',
  orangeBorder: '#f5d9a0',
  green: '#1e7a44',
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
    { id: 'portfolio', label: 'Portfolio' },
    { id: 'playbook', label: 'Playbook' },
    { id: 'renewals', label: 'Renewals' },
    { id: 'risk-guide', label: 'Risk Guide' },
    { id: 'about', label: 'About' },
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
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
        borderBottom: `1px solid ${W.navBorder}`,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 32 }}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
          <rect x="2" y="3" width="14" height="18" rx="2" stroke={W.accent} strokeWidth="1.5" />
          <path
            d="M6 8h6M6 12h8M6 16h5"
            stroke={W.accent}
            strokeWidth="1.4"
            strokeLinecap="round"
          />
          <circle
            cx="19"
            cy="17"
            r="3.5"
            fill={W.accent}
            opacity="0.2"
            stroke={W.accent}
            strokeWidth="1.4"
          />
          <path
            d="M17.5 17h3M19 15.5v3"
            stroke={W.accent}
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
        <span
          style={{ fontSize: 14, fontWeight: 700, color: '#eef1f8', letterSpacing: '-0.025em' }}
        >
          ContractIntel
        </span>
      </div>
      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2, flex: 1, alignItems: 'stretch', height: '100%' }}>
        {links.map((l) => {
          const isInfo = l.id === 'risk-guide' || l.id === 'about';
          return (
            <button
              key={l.id}
              onClick={() => onNav(l.id)}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0 13px',
                fontSize: 13,
                fontWeight: active === l.id ? 600 : 400,
                color:
                  active === l.id
                    ? '#eef1f8'
                    : isInfo
                      ? 'rgba(238,241,248,0.35)'
                      : 'rgba(238,241,248,0.5)',
                position: 'relative',
                transition: 'color 0.15s',
                borderBottom: active === l.id ? `2px solid ${W.accent}` : '2px solid transparent',
                marginBottom: -1,
              }}
              onMouseEnter={(e) => {
                if (active !== l.id) e.currentTarget.style.color = 'rgba(238,241,248,0.8)';
              }}
              onMouseLeave={(e) => {
                if (active !== l.id)
                  e.currentTarget.style.color = isInfo
                    ? 'rgba(238,241,248,0.35)'
                    : 'rgba(238,241,248,0.5)';
              }}
            >
              {l.label}
            </button>
          );
        })}
      </div>
      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{ fontSize: 12, color: 'rgba(238,241,248,0.35)', fontWeight: 500 }}>
          James Whitfield
        </span>
        <div
          style={{
            width: 30,
            height: 30,
            borderRadius: 4,
            background: 'rgba(201,125,10,0.25)',
            border: `1px solid rgba(201,125,10,0.5)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
            color: W.accent,
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
        letterSpacing: '0.03em',
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
    partnership: '#1e7a44',
    customer: '#8f1a5c',
    lease: '#7a4f0a',
    nda: '#3a4a6b',
  };
  const bgs = {
    vendor: '#f3eeff',
    license: '#eaf5ff',
    partnership: '#eef8f2',
    customer: '#fdeef8',
    lease: '#fdf3e3',
    nda: '#edf0f7',
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
        letterSpacing: '0.06em',
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
    primary: { background: W.accent, color: '#fff', border: 'none' },
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
        background: 'rgba(11,22,41,0.6)',
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
          borderRadius: 8,
          width,
          maxWidth: '95vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 64px rgba(11,22,41,0.22)',
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
              letterSpacing: '-0.015em',
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
function PageShell({ title, subtitle, actions, children, noPad }) {
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
          padding: '16px 28px 14px',
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
              letterSpacing: '-0.03em',
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
    <div style={{ display: 'flex', borderBottom: `1px solid ${W.border}` }}>
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
      <span style={{ fontSize: 11, fontWeight: 700, color: wRisk(score), letterSpacing: '0.03em' }}>
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
