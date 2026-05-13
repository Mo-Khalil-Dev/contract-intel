
// ContractIntel — Lloyds Bank theme

const { useState, useRef } = React;

// ─── Design tokens ───────────────────────────────────────────────
const W = {
  navBg:       '#006A4D',
  navBg2:      '#005238',
  bg:          '#F4F8F6',
  surface:     '#FFFFFF',
  surface2:    '#EDF4EF',
  border:      '#D5E6DC',
  border2:     '#BBCFC6',
  text:        '#0D1F17',
  textMid:     '#2B4A38',
  textSoft:    '#537060',
  textMute:    '#8DAF9C',
  accent:      '#006A4D',
  accentBg:    '#E8F4EF',
  accentHover: '#005238',
  red:         '#C0392B', redBg:    '#FDF0EE', redBorder:    '#F5C6C0',
  orange:      '#C87500', orangeBg: '#FEF8EE', orangeBorder: '#F5DCAA',
  green:       '#1A7A46', greenBg:  '#EDF8F2', greenBorder:  '#A8DFC0',
};

function wRisk(s)      { return s >= 7 ? W.red    : s >= 4 ? W.orange    : W.green; }
function wRiskBg(s)    { return s >= 7 ? W.redBg  : s >= 4 ? W.orangeBg  : W.greenBg; }
function wRiskLabel(s) { return s >= 7 ? 'High'   : s >= 4 ? 'Medium'    : 'Low'; }
function wSev(sev)     { return sev==='red' ? W.red : sev==='orange' ? W.orange : W.green; }
function wSevBg(sev)   { return sev==='red' ? W.redBg : sev==='orange' ? W.orangeBg : W.greenBg; }

// ─── Black Horse SVG mark ─────────────────────────────────────────
function HorseMark({ size = 28, color = '#fff' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      {/* Simplified horse silhouette */}
      <path d="M22 4c-1 0-2 .5-2.5 1.2L18 7l-1.5-.5C15 6 13.5 6 12 6.5c-1.5.5-2.5 1.5-3 3l-.5 2H7l-1 1v2l1 .5-.5 2L5 17v2l1.5 1L7 22l1 .5v3.5h2V23l.5-1h5l.5 1v2.5h2V22l1-1 1 .5 1-3.5 1.5-1.5.5-2.5V12l1-1.5V8.5L22 4z" fill={color} />
      <ellipse cx="21.5" cy="5.5" rx="1.5" ry="1" fill={color} />
    </svg>
  );
}

// ─── Top Nav ─────────────────────────────────────────────────────
function TopNav({ active, onNav }) {
  const links = [
    { id:'contracts', label:'Contracts'  },
    { id:'portfolio', label:'Portfolio'  },
    { id:'playbook',  label:'Playbook'   },
    { id:'renewals',  label:'Renewals'   },
    { id:'settings',  label:'Settings'   },
  ];
  return (
    <nav style={{
      background: W.navBg, height: 52, display: 'flex', alignItems: 'center',
      padding: '0 28px', gap: 0, flexShrink: 0, position: 'sticky', top: 0, zIndex: 100,
      borderBottom: `2px solid ${W.navBg2}`,
    }}>
      {/* Logo */}
      <div style={{ display:'flex', alignItems:'center', gap:10, marginRight:36 }}>
        <HorseMark size={30} color="#fff" />
        <div>
          <span style={{ fontSize:15, fontWeight:700, color:'#fff', letterSpacing:'-0.02em', fontFamily:"'Lato', sans-serif" }}>ContractIntel</span>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.55)', display:'block', letterSpacing:'0.12em', textTransform:'uppercase', marginTop:-1 }}>by Lloyds</span>
        </div>
      </div>
      {/* Links */}
      <div style={{ display:'flex', gap:2, flex:1 }}>
        {links.map(l => (
          <button key={l.id} onClick={() => onNav(l.id)} style={{
            background: 'none', border: 'none', cursor: 'pointer',
            padding: '7px 14px', borderRadius: 4, fontSize: 13, fontWeight: active===l.id ? 700 : 400,
            color: active===l.id ? '#fff' : 'rgba(255,255,255,0.65)',
            backgroundColor: active===l.id ? W.navBg2 : 'transparent',
            borderBottom: active===l.id ? '2px solid rgba(255,255,255,0.8)' : '2px solid transparent',
            transition: 'all 0.15s',
            fontFamily: "'Lato', sans-serif",
          }}
            onMouseEnter={e => { if (active!==l.id) { e.currentTarget.style.color='#fff'; e.currentTarget.style.backgroundColor=W.navBg2+'99'; } }}
            onMouseLeave={e => { if (active!==l.id) { e.currentTarget.style.color='rgba(255,255,255,0.65)'; e.currentTarget.style.backgroundColor='transparent'; } }}
          >{l.label}</button>
        ))}
      </div>
      {/* User */}
      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
        <span style={{ fontSize:12, color:'rgba(255,255,255,0.65)', fontFamily:"'Lato', sans-serif" }}>James Whitfield</span>
        <div style={{ width:30, height:30, borderRadius:'50%', background:'rgba(255,255,255,0.2)', border:'1.5px solid rgba(255,255,255,0.4)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:700, color:'#fff', fontFamily:"'Lato', sans-serif" }}>JW</div>
      </div>
    </nav>
  );
}

// ─── Risk badge ───────────────────────────────────────────────────
function WRiskBadge({ score, size='sm' }) {
  const c = wRisk(score), bg = wRiskBg(score);
  return (
    <span style={{
      display:'inline-flex', alignItems:'center', gap:5,
      background: bg, color: c, border:`1px solid ${c}33`,
      borderRadius:3, padding: size==='lg' ? '4px 10px' : '2px 7px',
      fontSize: size==='lg' ? 13 : 11, fontWeight:700,
      fontFamily:"'IBM Plex Mono',monospace",
    }}>
      <span style={{ width:size==='lg'?8:6, height:size==='lg'?8:6, borderRadius:'50%', background:c }}></span>
      {score.toFixed(1)}
    </span>
  );
}

// ─── Type pill ────────────────────────────────────────────────────
function WTypePill({ type }) {
  const colors = { vendor:'#5A3F9B', license:'#0C6B99', partnership:'#0A7A6E', customer:'#9B1865', lease:'#7A5200', nda:'#3A5040' };
  const bgs    = { vendor:'#F2EFF9', license:'#EBF5FA', partnership:'#EAF7F5', customer:'#FAF0F6', lease:'#FAF6EC', nda:'#EDF2EF' };
  return (
    <span style={{ background:bgs[type]||bgs.nda, color:colors[type]||colors.nda, borderRadius:3, padding:'2px 8px', fontSize:11, fontWeight:600, textTransform:'capitalize', letterSpacing:'0.02em' }}>{type}</span>
  );
}

// ─── Flag summary ─────────────────────────────────────────────────
function WFlags({ flags }) {
  return (
    <span style={{ display:'inline-flex', gap:6 }}>
      {flags.red>0    && <span style={{ color:W.red,    fontWeight:700, fontSize:12, fontFamily:"'IBM Plex Mono',monospace" }}>●{flags.red}</span>}
      {flags.orange>0 && <span style={{ color:W.orange, fontWeight:700, fontSize:12, fontFamily:"'IBM Plex Mono',monospace" }}>●{flags.orange}</span>}
      {flags.green>0  && <span style={{ color:W.green,  fontWeight:700, fontSize:12, fontFamily:"'IBM Plex Mono',monospace" }}>●{flags.green}</span>}
      {flags.red===0 && flags.orange===0 && <span style={{ color:W.textMute, fontSize:11 }}>—</span>}
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────
function WBtn({ children, variant='primary', onClick, small, disabled, style:ex }) {
  const s = {
    primary:   { background:W.accent, color:'#fff', border:'none' },
    secondary: { background:W.surface, color:W.textMid, border:`1px solid ${W.border2}` },
    ghost:     { background:'transparent', color:W.textSoft, border:'none' },
    danger:    { background:W.redBg, color:W.red, border:`1px solid ${W.redBorder}` },
    success:   { background:W.greenBg, color:W.green, border:`1px solid ${W.greenBorder}` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...s[variant], borderRadius:4, cursor:disabled?'not-allowed':'pointer',
      padding:small?'4px 11px':'7px 14px', fontSize:small?11:13, fontWeight:600,
      display:'inline-flex', alignItems:'center', gap:5,
      opacity:disabled?0.4:1, transition:'opacity 0.1s',
      fontFamily:"'Lato', sans-serif", letterSpacing:'0.01em',
      ...ex,
    }}>{children}</button>
  );
}

// ─── Modal ────────────────────────────────────────────────────────
function WModal({ title, onClose, children, width=500 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.45)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000 }}
      onClick={e => e.target===e.currentTarget&&onClose()}>
      <div style={{ background:W.surface, border:`1px solid ${W.border}`, borderRadius:6, width, maxWidth:'95vw', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.15)' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${W.border}`, background:W.surface2, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:W.text, fontFamily:"'Lato',sans-serif" }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:W.textSoft }}>✕</button>
        </div>
        <div style={{ padding:18 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Page shell ───────────────────────────────────────────────────
function PageShell({ title, subtitle, actions, children }) {
  return (
    <div style={{ flex:1, display:'flex', flexDirection:'column', background:W.bg, overflow:'auto' }}>
      <div style={{ padding:'18px 28px 14px', background:W.surface, borderBottom:`1px solid ${W.border}`, display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
        <div>
          <h1 style={{ margin:0, fontSize:20, fontWeight:700, color:W.text, fontFamily:"'Lato',sans-serif", letterSpacing:'-0.02em' }}>{title}</h1>
          {subtitle && <p style={{ margin:'3px 0 0', fontSize:12, color:W.textSoft }}>{subtitle}</p>}
        </div>
        {actions && <div style={{ display:'flex', gap:7 }}>{actions}</div>}
      </div>
      <div style={{ flex:1, overflow:'auto' }}>{children}</div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function WTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', borderBottom:`1px solid ${W.border}`, paddingLeft:0, background:W.surface }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding:'10px 16px', border:'none', background:'transparent', cursor:'pointer',
          fontSize:12, fontWeight:active===t.id?700:400,
          color:active===t.id?W.accent:W.textSoft,
          borderBottom:active===t.id?`2px solid ${W.accent}`:'2px solid transparent',
          marginBottom:-1, whiteSpace:'nowrap',
          fontFamily:"'Lato',sans-serif",
        }}>{t.label}</button>
      ))}
    </div>
  );
}

// ─── Mini sparkline bar ───────────────────────────────────────────
function RiskBar({ score }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
      <div style={{ width:60, height:5, background:W.border, borderRadius:2, overflow:'hidden' }}>
        <div style={{ width:`${score*10}%`, height:'100%', background:wRisk(score), borderRadius:2 }}></div>
      </div>
      <span style={{ fontSize:11, fontWeight:700, color:wRisk(score), fontFamily:"'IBM Plex Mono',monospace" }}>{score.toFixed(1)}</span>
    </div>
  );
}

Object.assign(window, {
  W, wRisk, wRiskBg, wRiskLabel, wSev, wSevBg,
  TopNav, WRiskBadge, WTypePill, WFlags, WBtn, WModal, PageShell, WTabs, RiskBar,
});
