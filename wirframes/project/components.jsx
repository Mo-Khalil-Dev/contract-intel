// ContractIntel Redesign — Shared Components
const { useState, useRef, useEffect } = React;

// ─── Google Fonts injected via HTML ──────────────────────────────

// ─── Button ──────────────────────────────────────────────────────
function Btn({ children, variant = 'primary', size = 'md', onClick, disabled, full, style: ex }) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    borderRadius: 8,
    border: 'none',
    transition: 'all 0.15s',
    opacity: disabled ? 0.45 : 1,
    width: full ? '100%' : undefined,
    whiteSpace: 'nowrap',
    letterSpacing: '-0.01em',
  };
  const sizes = {
    sm: { padding: '6px 14px', fontSize: 13 },
    md: { padding: '10px 20px', fontSize: 14 },
    lg: { padding: '14px 28px', fontSize: 16 },
  };
  const variants = {
    primary: { background: T.blue, color: '#fff' },
    secondary: { background: T.surface, color: T.inkMid, border: `1px solid ${T.borderMid}` },
    ghost: { background: 'transparent', color: T.inkSoft },
    danger: { background: T.redBg, color: T.red, border: `1px solid ${T.redBorder}` },
    success: { background: T.greenBg, color: T.greenDark, border: `1px solid ${T.greenBorder}` },
    dark: { background: T.ink, color: '#fff' },
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        ...base,
        ...sizes[size],
        ...variants[variant],
        ...ex,
        background: 'rgb(220, 235, 37)',
      }}
    >
      {children}
    </button>
  );
}

// ─── Badge ────────────────────────────────────────────────────────
function Badge({ label, color, bg, border, dot }) {
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: bg,
        color,
        border: `1px solid ${border || color + '33'}`,
        borderRadius: 6,
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {dot && (
        <span
          style={{ width: 6, height: 6, borderRadius: '50%', background: color, flexShrink: 0 }}
        />
      )}
      {label}
    </span>
  );
}

// ─── Risk Badge ───────────────────────────────────────────────────
function RiskBadge({ score, size = 'sm' }) {
  const c = T.riskColor(score),
    bg = T.riskBg(score);
  const p = size === 'lg' ? '5px 12px' : '3px 9px';
  const fs = size === 'lg' ? 14 : 12;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        background: bg,
        color: c,
        borderRadius: 6,
        padding: p,
        fontSize: fs,
        fontWeight: 700,
        fontFamily: "'DM Mono', monospace",
        border: `1px solid ${c}33`,
      }}
    >
      <span
        style={{
          width: size === 'lg' ? 8 : 6,
          height: size === 'lg' ? 8 : 6,
          borderRadius: '50%',
          background: c,
        }}
      />
      {score.toFixed(1)}
    </span>
  );
}

// ─── Type Pill ────────────────────────────────────────────────────
function TypePill({ type }) {
  const map = {
    vendor: { color: '#6D28D9', bg: '#F5F3FF' },
    license: { color: '#0369A1', bg: '#F0F9FF' },
    partnership: { color: '#0F766E', bg: '#F0FDFA' },
    customer: { color: '#BE185D', bg: '#FDF2F8' },
    lease: { color: '#92400E', bg: '#FFFBEB' },
    nda: { color: '#374151', bg: '#F9FAFB' },
  };
  const { color, bg } = map[type] || map.nda;
  return (
    <span
      style={{
        background: bg,
        color,
        borderRadius: 6,
        padding: '3px 9px',
        fontSize: 12,
        fontWeight: 600,
        textTransform: 'capitalize',
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {type}
    </span>
  );
}

// ─── Risk Bar ─────────────────────────────────────────────────────
function RiskBar({ score, width = 72 }) {
  const c = T.riskColor(score);
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width,
          height: 5,
          background: T.border,
          borderRadius: 3,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        <div style={{ width: `${score * 10}%`, height: '100%', background: c, borderRadius: 3 }} />
      </div>
      <span
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: c,
          fontFamily: "'DM Mono', monospace",
          minWidth: 26,
        }}
      >
        {score.toFixed(1)}
      </span>
    </div>
  );
}

// ─── Flags Summary ────────────────────────────────────────────────
function FlagsSummary({ flags }) {
  return (
    <span style={{ display: 'inline-flex', gap: 7 }}>
      {flags.red > 0 && (
        <span
          style={{
            color: T.red,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ●{flags.red}
        </span>
      )}
      {flags.orange > 0 && (
        <span
          style={{
            color: T.orange,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ●{flags.orange}
        </span>
      )}
      {flags.green > 0 && (
        <span
          style={{
            color: T.green,
            fontSize: 12,
            fontWeight: 700,
            fontFamily: "'DM Mono', monospace",
          }}
        >
          ●{flags.green}
        </span>
      )}
      {flags.red === 0 && flags.orange === 0 && (
        <span style={{ color: T.inkMute, fontSize: 12 }}>—</span>
      )}
    </span>
  );
}

// ─── Top Nav ──────────────────────────────────────────────────────
function TopNav({ screen, onNav }) {
  const links = [
    { id: 'home', label: 'Home' },
    { id: 'portfolio', label: 'Contracts' },
    { id: 'compare', label: 'Compare' },
    { id: 'renewals', label: 'Renewals' },
    { id: 'settings', label: 'Settings' },
  ];

  const activeLink = links.find((l) => l.id === screen)
    ? screen
    : screen === 'upload' ||
        screen === 'processing' ||
        screen === 'results' ||
        screen === 'deepdive' ||
        screen === 'export'
      ? 'portfolio'
      : 'home';

  return (
    <nav
      style={{
        background: T.nav,
        height: 56,
        display: 'flex',
        alignItems: 'center',
        padding: '0 32px',
        gap: 0,
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 200,
        borderBottom: `1px solid ${T.navBorder}`,
      }}
    >
      {/* Logo */}
      <div
        onClick={() => onNav('home')}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginRight: 40,
          cursor: 'pointer',
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            background: T.blue,
            borderRadius: 7,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M3 2h7l3 3v9H3V2z" stroke="#fff" strokeWidth="1.5" strokeLinejoin="round" />
            <path
              d="M10 2v3h3"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path d="M5 8h6M5 11h4" stroke="#fff" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 15,
            fontWeight: 700,
            color: '#fff',
            letterSpacing: '-0.03em',
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          ContractIntel
        </span>
      </div>

      {/* Nav links */}
      <div style={{ display: 'flex', gap: 2, flex: 1 }}>
        {links.map((l) => (
          <button
            key={l.id}
            onClick={() => onNav(l.id)}
            style={{
              background: activeLink === l.id ? 'rgba(255,255,255,0.08)' : 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '7px 14px',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: activeLink === l.id ? 600 : 400,
              color: activeLink === l.id ? '#fff' : 'rgba(255,255,255,0.55)',
              fontFamily: "'DM Sans', sans-serif",
              transition: 'all 0.12s',
            }}
            onMouseEnter={(e) => {
              if (activeLink !== l.id) e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              if (activeLink !== l.id) e.currentTarget.style.color = 'rgba(255,255,255,0.55)';
            }}
          >
            {l.label}
          </button>
        ))}
      </div>

      {/* User + Upload CTA */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Btn
          size="sm"
          onClick={() => onNav('upload')}
          style={{ background: T.blue, color: '#fff', border: 'none' }}
        >
          + Upload
        </Btn>
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.12)',
            border: '1.5px solid rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 12,
            fontWeight: 700,
            color: '#fff',
            fontFamily: "'DM Sans', sans-serif",
            cursor: 'pointer',
          }}
        >
          JW
        </div>
      </div>
    </nav>
  );
}

// ─── Page Shell ───────────────────────────────────────────────────
function PageShell({ title, subtitle, actions, children, noPad }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        background: T.bg,
        overflow: 'auto',
        minHeight: 0,
      }}
    >
      {(title || actions) && (
        <div
          style={{
            padding: '20px 32px 16px',
            background: T.surface,
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            flexShrink: 0,
          }}
        >
          <div>
            <h1
              style={{
                margin: 0,
                fontSize: 22,
                fontWeight: 700,
                color: T.ink,
                fontFamily: "'DM Sans', sans-serif",
                letterSpacing: '-0.03em',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <p
                style={{
                  margin: '3px 0 0',
                  fontSize: 13,
                  color: T.inkSoft,
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {subtitle}
              </p>
            )}
          </div>
          {actions && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>{actions}</div>
          )}
        </div>
      )}
      <div style={{ flex: 1, overflow: 'auto', padding: noPad ? 0 : undefined }}>{children}</div>
    </div>
  );
}

// ─── Section Label ────────────────────────────────────────────────
function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: T.inkMute,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        marginBottom: 10,
        fontFamily: "'DM Sans', sans-serif",
      }}
    >
      {children}
    </div>
  );
}

// ─── Divider ──────────────────────────────────────────────────────
function Divider({ my = 20 }) {
  return <div style={{ height: 1, background: T.border, margin: `${my}px 0` }} />;
}

// ─── Stat Card ────────────────────────────────────────────────────
function StatCard({ label, value, sub, color }) {
  return (
    <div
      style={{
        background: T.surface,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        padding: '16px 20px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 700,
          color: T.inkMute,
          textTransform: 'uppercase',
          letterSpacing: '0.07em',
          marginBottom: 8,
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: color || T.ink,
          fontFamily: "'DM Mono', monospace",
          lineHeight: 1.1,
        }}
      >
        {value}
      </div>
      {sub && (
        <div
          style={{
            fontSize: 12,
            color: T.inkMute,
            marginTop: 5,
            fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.4)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: T.surface,
          borderRadius: 12,
          width,
          maxWidth: '92vw',
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
          border: `1px solid ${T.border}`,
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: `1px solid ${T.border}`,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: T.ink,
              fontFamily: "'DM Sans', sans-serif",
            }}
          >
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 18,
              color: T.inkSoft,
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

// ─── Tabs ─────────────────────────────────────────────────────────
function Tabs({ tabs, active, onChange }) {
  return (
    <div
      style={{
        display: 'flex',
        borderBottom: `1px solid ${T.border}`,
        background: T.surface,
        paddingLeft: 0,
      }}
    >
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            padding: '11px 18px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: active === t.id ? 700 : 400,
            color: active === t.id ? T.blue : T.inkSoft,
            borderBottom: active === t.id ? `2px solid ${T.blue}` : '2px solid transparent',
            marginBottom: -1,
            fontFamily: "'DM Sans', sans-serif",
            transition: 'color 0.12s',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

Object.assign(window, {
  Btn,
  Badge,
  RiskBadge,
  TypePill,
  RiskBar,
  FlagsSummary,
  TopNav,
  PageShell,
  SectionLabel,
  Divider,
  StatCard,
  Modal,
  Tabs,
});
