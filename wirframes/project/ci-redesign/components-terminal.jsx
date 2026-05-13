// ContractIntel — Terminal Components
const { useState, useRef, useEffect } = React;

const MONO = "'IBM Plex Mono', 'Courier New', monospace";

// ─── Button ──────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, full, style: ex }) {
  const base = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
    fontFamily: MONO, fontWeight: 400, cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 1, border: 'none', transition: 'all 0.1s',
    opacity: disabled ? 0.3 : 1, width: full ? '100%' : undefined,
    whiteSpace: 'nowrap', letterSpacing: '0.04em', textTransform: 'uppercase', fontSize: 11,
  };
  const sizes = {
    sm: { padding: '5px 12px' },
    md: { padding: '8px 18px', fontSize: 11 },
    lg: { padding: '11px 24px', fontSize: 12 },
  };
  const variants = {
    primary:   { background: T.amber, color: '#000', border: `1px solid ${T.amber}` },
    secondary: { background: 'transparent', color: T.inkMid, border: `1px solid ${T.borderMid}` },
    ghost:     { background: 'transparent', color: T.inkSoft, border: `1px solid transparent` },
    danger:    { background: 'transparent', color: T.red, border: `1px solid ${T.redBorder}` },
    success:   { background: 'transparent', color: T.green, border: `1px solid ${T.greenBorder}` },
    dark:      { background: T.surfaceAlt, color: T.ink, border: `1px solid ${T.borderMid}` },
    amber:     { background: T.amberDim, color: T.amber, border: `1px solid ${T.amberBorder}` },
  };
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ ...base, ...sizes[size], ...variants[variant], ...ex }}
      onMouseEnter={e => { if (!disabled) e.currentTarget.style.opacity = '0.8'; }}
      onMouseLeave={e => { if (!disabled) e.currentTarget.style.opacity = '1'; }}
    >
      {children}
    </button>
  );
}

// ─── Status Code ─────────────────────────────────────────────────
function StatusCode({ label, color, bg, border }) {
  return (
    <span style={{
      display: 'inline-block',
      fontFamily: MONO, fontSize: 10, fontWeight: 400, letterSpacing: '0.1em',
      color, background: bg || 'transparent',
      border: `1px solid ${border || color + '44'}`,
      padding: '2px 7px', borderRadius: 1,
    }}>{label}</span>
  );
}

// ─── Risk Code ───────────────────────────────────────────────────
function RiskCode({ score, size = 'sm' }) {
  const c = T.riskColor(score);
  const bg = T.riskBg(score);
  const border = T.riskBorder(score);
  const fs = size === 'lg' ? 12 : 10;
  const pad = size === 'lg' ? '4px 10px' : '2px 7px';
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      background: bg, color: c, border: `1px solid ${border}`,
      padding: pad, fontSize: fs, fontFamily: MONO,
      letterSpacing: '0.08em', borderRadius: 1,
    }}>
      <span style={{ fontWeight: 400 }}>{T.riskCode(score)}</span>
      <span style={{ color: c + 'AA', fontSize: fs - 1 }}>{score.toFixed(1)}</span>
    </span>
  );
}

// ─── Severity Tag ────────────────────────────────────────────────
function SevTag({ severity }) {
  const c = T.sevColor(severity);
  const bg = T.sevBg(severity);
  const border = T.sevBorder(severity);
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
      color: c, background: bg, border: `1px solid ${border}`,
      padding: '2px 7px', borderRadius: 1,
    }}>{T.sevLabel(severity)}</span>
  );
}

// ─── Type Tag ────────────────────────────────────────────────────
function TypePill({ type }) {
  return (
    <span style={{
      fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em',
      color: T.inkMid, background: T.surfaceAlt,
      border: `1px solid ${T.border}`,
      padding: '2px 7px', borderRadius: 1, textTransform: 'uppercase',
    }}>{type}</span>
  );
}

// ─── Risk Badge (alias) ───────────────────────────────────────────
function RiskBadge({ score, size = 'sm' }) {
  return <RiskCode score={score} size={size} />;
}

// ─── Badge (generic) ─────────────────────────────────────────────
function Badge({ label, color, bg, border, dot }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontFamily: MONO, fontSize: 10, letterSpacing: '0.08em',
      color: color || T.inkMid,
      background: bg || 'transparent',
      border: `1px solid ${border || (color ? color + '33' : T.border)}`,
      padding: '2px 7px', borderRadius: 1,
    }}>
      {dot && <span style={{ width: 5, height: 5, background: color, borderRadius: '50%', flexShrink: 0 }} />}
      {label}
    </span>
  );
}

// ─── Risk Bar ─────────────────────────────────────────────────────
function RiskBar({ score, width = 60 }) {
  const c = T.riskColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div style={{ width, height: 2, background: T.border, flexShrink: 0 }}>
        <div style={{ width: `${score * 10}%`, height: '100%', background: c }} />
      </div>
      <span style={{ fontSize: 11, color: c, fontFamily: MONO, minWidth: 24 }}>{score.toFixed(1)}</span>
    </div>
  );
}

// ─── Flags Summary ────────────────────────────────────────────────
function FlagsSummary({ flags }) {
  return (
    <span style={{ display: 'inline-flex', gap: 8, fontFamily: MONO, fontSize: 11 }}>
      {flags.red > 0 && <span style={{ color: T.red }}>{flags.red}C</span>}
      {flags.orange > 0 && <span style={{ color: T.orange }}>{flags.orange}W</span>}
      {flags.green > 0 && <span style={{ color: T.green }}>{flags.green}I</span>}
      {flags.red === 0 && flags.orange === 0 && <span style={{ color: T.inkMute }}>—</span>}
    </span>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────
function TopNav({ screen, onNav }) {
  const links = [
    { id: 'home',      label: 'HOME' },
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'compare',   label: 'COMPARE' },
    { id: 'renewals',  label: 'RENEWALS' },
    { id: 'settings',  label: 'SETTINGS' },
  ];
  const activeLink = links.find(l => l.id === screen) ? screen :
    ['upload','processing','results','deepdive','export'].includes(screen) ? 'portfolio' : 'home';

  return (
    <nav style={{
      background: T.nav, height: 44, display: 'flex', alignItems: 'center',
      padding: '0 24px', flexShrink: 0,
      borderBottom: `1px solid ${T.navBorder}`,
      fontFamily: MONO,
    }}>
      {/* Logo */}
      <div onClick={() => onNav('home')} style={{ display: 'flex', alignItems: 'center', gap: 10, marginRight: 36, cursor: 'pointer', flexShrink: 0 }}>
        <span style={{ fontSize: 11, color: T.amber, letterSpacing: '0.12em', fontFamily: MONO }}>CI</span>
        <span style={{ fontSize: 11, color: T.inkMid, letterSpacing: '0.08em' }}>CONTRACTINTEL</span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 0, flex: 1, borderLeft: `1px solid ${T.border}`, height: '100%', alignItems: 'stretch' }}>
        {links.map(l => (
          <button key={l.id} onClick={() => onNav(l.id)} style={{
            background: activeLink === l.id ? T.surfaceAlt : 'transparent',
            borderLeft: 'none',
            borderRight: `1px solid ${T.border}`,
            borderTop: activeLink === l.id ? `1px solid ${T.amber}` : '1px solid transparent',
            borderBottom: 'none',
            cursor: 'pointer',
            padding: '0 16px',
            fontSize: 10, letterSpacing: '0.1em',
            color: activeLink === l.id ? T.amber : T.inkSoft,
            fontFamily: MONO, transition: 'all 0.1s',
          }}
            onMouseEnter={e => { if (activeLink !== l.id) e.currentTarget.style.color = T.inkMid; }}
            onMouseLeave={e => { if (activeLink !== l.id) e.currentTarget.style.color = T.inkSoft; }}
          >{l.label}</button>
        ))}
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginLeft: 16 }}>
        <button onClick={() => onNav('upload')} style={{
          background: T.amber, color: '#000', border: 'none', cursor: 'pointer',
          fontFamily: MONO, fontSize: 10, letterSpacing: '0.1em',
          padding: '5px 14px', borderRadius: 1,
        }}>+ UPLOAD</button>
        <div style={{
          width: 28, height: 28, background: T.surfaceAlt, border: `1px solid ${T.borderMid}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 10, color: T.inkMid, fontFamily: MONO, cursor: 'pointer', borderRadius: 1,
        }}>JW</div>
      </div>
    </nav>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────
function PageShell({ title, subtitle, actions, children }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: T.bg, overflow: 'auto', minHeight: 0 }}>
      {(title || actions) && (
        <div style={{
          padding: '12px 24px', background: T.surface,
          borderBottom: `1px solid ${T.border}`,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 14 }}>
            <span style={{ fontSize: 11, fontWeight: 400, color: T.amber, fontFamily: MONO, letterSpacing: '0.12em', textTransform: 'uppercase' }}>{title}</span>
            {subtitle && <span style={{ fontSize: 10, color: T.inkSoft, fontFamily: MONO, letterSpacing: '0.06em' }}>{subtitle}</span>}
          </div>
          {actions && <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto' }}>{children}</div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div style={{
      fontSize: 9, color: T.inkMute, letterSpacing: '0.16em',
      textTransform: 'uppercase', fontFamily: MONO,
      marginBottom: 8, paddingBottom: 5,
      borderBottom: `1px solid ${T.border}`,
    }}>{children}</div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
function Divider({ my = 16 }) {
  return <div style={{ height: 1, background: T.border, margin: `${my}px 0` }} />;
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: T.surface, border: `1px solid ${T.border}`, padding: '14px 18px' }}>
      <div style={{ fontSize: 9, color: T.inkMute, letterSpacing: '0.14em', textTransform: 'uppercase', fontFamily: MONO, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 24, color: color || T.ink, fontFamily: MONO, lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: T.inkSoft, marginTop: 4, fontFamily: MONO }}>{sub}</div>}
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }) {
  return (
    <div style={{
      display: 'flex', borderBottom: `1px solid ${T.border}`,
      background: T.surface, flexShrink: 0,
      padding: '0 24px',
    }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          background: 'transparent', border: 'none',
          borderBottom: active === t.id ? `1px solid ${T.amber}` : '1px solid transparent',
          padding: '10px 16px', marginBottom: -1,
          fontSize: 10, letterSpacing: '0.1em', textTransform: 'uppercase',
          color: active === t.id ? T.amber : T.inkSoft,
          fontFamily: MONO, cursor: 'pointer',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ─── Data Row ─────────────────────────────────────────────────────
function DataRow({ label, value, last }) {
  return (
    <div style={{
      display: 'flex', padding: '8px 14px',
      borderBottom: last ? 'none' : `1px solid ${T.border}`,
      gap: 12,
    }}>
      <span style={{ width: 140, flexShrink: 0, fontSize: 10, color: T.inkSoft, fontFamily: MONO, letterSpacing: '0.05em' }}>{label}</span>
      <span style={{ fontSize: 11, color: T.ink, fontFamily: MONO }}>{value || '—'}</span>
    </div>
  );
}

Object.assign(window, {
  Btn, StatusCode, RiskCode, SevTag, TypePill, RiskBadge, Badge,
  RiskBar, FlagsSummary, TopNav, PageShell, SectionLabel, Divider, StatCard, Tabs, DataRow,
  MONO,
});
