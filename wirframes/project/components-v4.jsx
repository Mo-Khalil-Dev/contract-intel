// ContractIntel v4 — Top nav, full-width, professional SaaS

const { useState, useRef } = React;

// ─── Design tokens ───────────────────────────────────────────────
const W = {
  navBg: '#18181b',
  bg: '#fafafa',
  surface: '#ffffff',
  surface2: '#f4f4f5',
  border: '#e4e4e7',
  border2: '#d4d4d8',
  text: '#18181b',
  textMid: '#3f3f46',
  textSoft: '#71717a',
  textMute: '#a1a1aa',
  accent: '#2563eb',
  accentBg: '#eff6ff',
  accentHover: '#1d4ed8',
  red: '#dc2626',
  redBg: '#fef2f2',
  redBorder: '#fecaca',
  orange: '#d97706',
  orangeBg: '#fffbeb',
  orangeBorder: '#fed7aa',
  green: '#16a34a',
  greenBg: '#f0fdf4',
  greenBorder: '#bbf7d0',
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
        height: 48,
        display: 'flex',
        alignItems: 'center',
        padding: '0 24px',
        gap: 0,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}
    >
      {/* Logo */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginRight: 32 }}>
        <div
          style={{
            width: 26,
            height: 26,
            borderRadius: 5,
            background: W.accent,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 900,
            color: '#fff',
          }}
        >
          CI
        </div>
        <span style={{ fontSize: 14, fontWeight: 700, color: '#fff', letterSpacing: '-0.01em' }}>
          ContractIntel
        </span>
      </div>
      {/* Links */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => onNav(l.id)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px 12px',
              borderRadius: 5,
              fontSize: 13,
              fontWeight: active === l.id ? 600 : 400,
              color: active === l.id ? '#fff' : '#a1a1aa',
              backgroundColor: active === l.id ? 'rgba(255,255,255,0.1)' : 'transparent',
              transition: 'all 0.1s',
            }}
            onMouseEnter={(e) => {
              if (active !== l.id) e.currentTarget.style.color = '#e4e4e7';
            }}
            onMouseLeave={(e) => {
              if (active !== l.id) e.currentTarget.style.color = '#a1a1aa';
            }}
          >
            {l.label}
          </button>
        ))}
      </div>
      {/* User */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: '#a1a1aa' }}>James Whitfield</span>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: '50%',
            background: `linear-gradient(135deg,${W.accent},#7c3aed)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 700,
            color: '#fff',
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
        border: `1px solid ${c}33`,
        borderRadius: 4,
        padding: size === 'lg' ? '4px 10px' : '2px 7px',
        fontSize: size === 'lg' ? 13 : 11,
        fontWeight: 700,
        fontFamily: "'IBM Plex Mono',monospace",
      }}
    >
      <span
        style={{
          width: size === 'lg' ? 8 : 6,
          height: size === 'lg' ? 8 : 6,
          borderRadius: '50%',
          background: c,
        }}
      ></span>
      {score.toFixed(1)}
    </span>
  );
}

// ─── Type pill ────────────────────────────────────────────────────
function WTypePill({ type }) {
  const colors = {
    vendor: '#7c3aed',
    license: '#0369a1',
    partnership: '#0f766e',
    customer: '#be185d',
    lease: '#92400e',
    nda: '#374151',
  };
  const bgs = {
    vendor: '#f5f3ff',
    license: '#f0f9ff',
    partnership: '#f0fdfa',
    customer: '#fdf2f8',
    lease: '#fffbeb',
    nda: '#f9fafb',
  };
  return (
    <span
      style={{
        background: bgs[type] || bgs.nda,
        color: colors[type] || colors.nda,
        borderRadius: 4,
        padding: '2px 7px',
        fontSize: 11,
        fontWeight: 600,
        textTransform: 'capitalize',
      }}
    >
      {type}
    </span>
  );
}

// ─── Flag summary ─────────────────────────────────────────────────
function WFlags({ flags }) {
  return (
    <span style={{ display: 'inline-flex', gap: 6 }}>
      {flags.red > 0 && (
        <span
          style={{
            color: W.red,
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          ●{flags.red}
        </span>
      )}
      {flags.orange > 0 && (
        <span
          style={{
            color: W.orange,
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          ●{flags.orange}
        </span>
      )}
      {flags.green > 0 && (
        <span
          style={{
            color: W.green,
            fontWeight: 700,
            fontSize: 12,
            fontFamily: "'IBM Plex Mono',monospace",
          }}
        >
          ●{flags.green}
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
        borderRadius: 5,
        cursor: disabled ? 'not-allowed' : 'pointer',
        padding: small ? '4px 10px' : '6px 12px',
        fontSize: small ? 11 : 13,
        fontWeight: 600,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        opacity: disabled ? 0.4 : 1,
        transition: 'opacity 0.1s',
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
        background: 'rgba(0,0,0,0.45)',
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
          boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
        }}
      >
        <div
          style={{
            padding: '14px 18px',
            borderBottom: `1px solid ${W.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <h2 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: W.text }}>{title}</h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 16,
              color: W.textSoft,
            }}
          >
            ✕
          </button>
        </div>
        <div style={{ padding: 18 }}>{children}</div>
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
          padding: '20px 28px 16px',
          background: W.surface,
          borderBottom: `1px solid ${W.border}`,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: W.text }}>{title}</h1>
          {subtitle && (
            <p style={{ margin: '3px 0 0', fontSize: 12, color: W.textSoft }}>{subtitle}</p>
          )}
        </div>
        {actions && <div style={{ display: 'flex', gap: 7 }}>{actions}</div>}
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
            padding: '9px 14px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: active === t.id ? 700 : 400,
            color: active === t.id ? W.accent : W.textSoft,
            borderBottom: active === t.id ? `2px solid ${W.accent}` : '2px solid transparent',
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

// ─── Mini sparkline bar ───────────────────────────────────────────
function RiskBar({ score }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div
        style={{ width: 60, height: 5, background: W.border, borderRadius: 3, overflow: 'hidden' }}
      >
        <div
          style={{
            width: `${score * 10}%`,
            height: '100%',
            background: wRisk(score),
            borderRadius: 3,
          }}
        ></div>
      </div>
      <span
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: wRisk(score),
          fontFamily: "'IBM Plex Mono',monospace",
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
