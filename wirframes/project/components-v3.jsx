
// ContractIntel v3 — Document workspace / legal inbox design tokens + components

const { useState, useRef, useEffect } = React;

// ─── Tokens ──────────────────────────────────────────────────────
const V = {
  bg:       '#f6f8fa',
  panel:    '#ffffff',
  surface:  '#f6f8fa',
  surface2: '#eaeef2',
  border:   '#d0d7de',
  border2:  '#b0b8c2',
  text:     '#1f2328',
  textMid:  '#3d444d',
  textSoft: '#656d76',
  textMute: '#b0b8c2',
  accent:   '#0969da',
  accentBg: 'rgba(9,105,218,0.08)',
  red:      '#cf222e', redBg: 'rgba(207,34,46,0.08)',
  orange:   '#9a6700', orangeBg: 'rgba(154,103,0,0.08)',
  green:    '#1a7f37', greenBg: 'rgba(26,127,55,0.08)',
};

function vRiskColor(s)  { if (s >= 7) return V.red;    if (s >= 4) return V.orange; return V.green; }
function vRiskBg(s)     { if (s >= 7) return V.redBg;  if (s >= 4) return V.orangeBg; return V.greenBg; }
function vRiskLabel(s)  { if (s >= 7) return 'High';   if (s >= 4) return 'Medium'; return 'Low'; }
function vSevColor(sev) { return sev === 'red' ? V.red : sev === 'orange' ? V.orange : V.green; }

// ─── Inline risk dot ─────────────────────────────────────────────
function RiskDot({ score, showLabel }) {
  const c = vRiskColor(score);
  return (
    <span style={{ display:'inline-flex', alignItems:'center', gap:5 }}>
      <span style={{ width:6, height:6, borderRadius:'50%', background:c, flexShrink:0, display:'inline-block' }}></span>
      <span style={{ fontFamily:"'IBM Plex Mono',monospace", fontSize:11, fontWeight:700, color:c }}>{score.toFixed(1)}</span>
      {showLabel && <span style={{ fontSize:10, color:V.textSoft, textTransform:'uppercase', fontWeight:600 }}>{vRiskLabel(score)}</span>}
    </span>
  );
}

// ─── Icon rail ────────────────────────────────────────────────────
function IconRail({ active, onNav }) {
  const items = [
    { id:'contracts', icon:'▤', title:'Contracts' },
    { id:'portfolio', icon:'◫', title:'Portfolio' },
    { id:'calendar',  icon:'◻', title:'Renewals'  },
    { id:'playbook',  icon:'⊟', title:'Playbook'  },
    { id:'settings',  icon:'⊙', title:'Settings'  },
  ];
  return (
    <div style={{
      width:44, flexShrink:0, background:V.bg,
      borderRight:`1px solid ${V.border}`,
      display:'flex', flexDirection:'column', alignItems:'center',
      height:'100vh', padding:'10px 0', gap:2,
    }}>
      <div style={{ width:26, height:26, borderRadius:6, background:V.accent, display:'flex', alignItems:'center', justifyContent:'center', fontSize:11, fontWeight:900, color:'#fff', marginBottom:12 }}>CI</div>
      {items.map(item => (
        <button key={item.id} onClick={() => onNav(item.id)} title={item.title}
          style={{
            width:32, height:32, borderRadius:6, border:'none',
            background: active === item.id ? V.accentBg : 'transparent',
            color: active === item.id ? V.accent : V.textSoft,
            cursor:'pointer', fontSize:14,
            display:'flex', alignItems:'center', justifyContent:'center',
            transition:'all 0.1s',
          }}
        >{item.icon}</button>
      ))}
      <div style={{ flex:1 }}></div>
      <div style={{ width:26, height:26, borderRadius:'50%', background:'linear-gradient(135deg,#2f81f7,#6e40c9)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:9, fontWeight:700, color:'#fff' }}>JW</div>
    </div>
  );
}

// ─── Contract List Panel ──────────────────────────────────────────
function ContractListPanel({ contracts, selectedId, onSelect, onUpload }) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const filtered = contracts.filter(c => {
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) &&
        !c.parties.join(' ').toLowerCase().includes(search.toLowerCase())) return false;
    if (filter === 'high'   && c.riskScore < 7)   return false;
    if (filter === 'medium' && (c.riskScore < 4 || c.riskScore >= 7)) return false;
    if (filter === 'low'    && c.riskScore >= 4)   return false;
    return true;
  });

  const typeColors = { vendor:'#818cf8', license:'#38bdf8', partnership:'#2dd4bf', customer:'#f472b6', lease:'#fb923c', nda:'#768390' };

  return (
    <div style={{
      width:288, flexShrink:0, background:V.panel,
      borderRight:`1px solid ${V.border}`,
      display:'flex', flexDirection:'column', height:'100vh',
    }}>
      {/* Header */}
      <div style={{ padding:'14px 14px 10px', borderBottom:`1px solid ${V.border}` }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10 }}>
          <span style={{ fontSize:13, fontWeight:700, color:V.text }}>Contracts</span>
          <button onClick={onUpload} style={{
            background:V.accentBg, border:`1px solid ${V.accent}44`,
            borderRadius:5, padding:'3px 9px', fontSize:11, fontWeight:700,
            color:V.accent, cursor:'pointer',
          }}>+ Upload</button>
        </div>
        {/* Search */}
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search contracts…"
          style={{
            width:'100%', background:V.surface, border:`1px solid ${V.border}`,
            borderRadius:5, padding:'6px 10px', fontSize:12, color:V.text,
            marginBottom:8,
          }} />
        {/* Filters */}
        <div style={{ display:'flex', gap:4 }}>
          {[['all','All'],['high','High'],['medium','Med'],['low','Low']].map(([val, lbl]) => (
            <button key={val} onClick={() => setFilter(val)} style={{
              flex:1, padding:'3px 0', borderRadius:4, border:'none',
              background: filter === val ? V.accentBg : 'transparent',
              color: filter === val ? V.accent : V.textSoft,
              fontSize:11, fontWeight:600, cursor:'pointer',
            }}>{lbl}</button>
          ))}
        </div>
      </div>

      {/* Count */}
      <div style={{ padding:'6px 14px', fontSize:10, color:V.textMute, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', borderBottom:`1px solid ${V.border}` }}>
        {filtered.length} contract{filtered.length !== 1 ? 's' : ''}
      </div>

      {/* List */}
      <div style={{ flex:1, overflow:'auto' }}>
        {filtered.map(c => {
          const isSelected = c.id === selectedId;
          const tc = typeColors[c.type] || V.textSoft;
          return (
            <div key={c.id}
              onClick={() => c.status === 'complete' && onSelect(c.id)}
              style={{
                padding:'10px 14px', cursor: c.status === 'complete' ? 'pointer' : 'default',
                borderBottom:`1px solid ${V.border}`,
                background: isSelected ? V.accentBg : 'transparent',
                borderLeft: isSelected ? `2px solid ${V.accent}` : '2px solid transparent',
                transition:'background 0.1s',
              }}
              onMouseEnter={e => { if (!isSelected && c.status === 'complete') e.currentTarget.style.background = V.surface; }}
              onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
            >
              <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                <div style={{ fontSize:12, fontWeight:600, color:isSelected ? V.text : V.textMid, lineHeight:1.3, flex:1, marginRight:8, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
                  {c.name.replace(/\.[^.]+$/, '')}
                </div>
                {c.status === 'complete' && <RiskDot score={c.riskScore} />}
                {c.status === 'processing' && <span style={{ fontSize:10, color:V.accent, fontWeight:600 }}>●</span>}
              </div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <span style={{ fontSize:10, fontWeight:700, color:tc, textTransform:'capitalize' }}>{c.type}</span>
                <span style={{ fontSize:10, color:V.textMute }}>·</span>
                <span style={{ fontSize:10, color:V.textSoft, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{c.parties[0]}</span>
              </div>
              {c.status === 'complete' && (c.flags.red > 0 || c.flags.orange > 0) && (
                <div style={{ display:'flex', gap:6, marginTop:5 }}>
                  {c.flags.red > 0 && <span style={{ fontSize:10, color:V.red, fontWeight:600 }}>{c.flags.red} high</span>}
                  {c.flags.orange > 0 && <span style={{ fontSize:10, color:V.orange, fontWeight:600 }}>{c.flags.orange} med</span>}
                </div>
              )}
              {c.status === 'processing' && (
                <div style={{ marginTop:5, height:2, background:V.border, borderRadius:1 }}>
                  <div style={{ width:`${c.progress}%`, height:'100%', background:V.accent, borderRadius:1 }}></div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Small button ─────────────────────────────────────────────────
function VBtn({ children, variant='primary', onClick, small, disabled, style:ex }) {
  const s = {
    primary:   { background:V.accent, color:'#fff', border:'none' },
    secondary: { background:V.surface2, color:V.textMid, border:`1px solid ${V.border}` },
    ghost:     { background:'transparent', color:V.textSoft, border:'none' },
    danger:    { background:V.redBg, color:V.red, border:`1px solid ${V.red}33` },
    success:   { background:V.greenBg, color:V.green, border:`1px solid ${V.green}33` },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{
      ...s[variant], borderRadius:5, cursor:disabled?'default':'pointer',
      padding: small ? '4px 10px' : '6px 12px',
      fontSize: small ? 11 : 12, fontWeight:600,
      display:'inline-flex', alignItems:'center', gap:4,
      opacity:disabled?0.4:1, transition:'opacity 0.1s', ...ex,
    }}>{children}</button>
  );
}

// ─── Dark modal ───────────────────────────────────────────────────
function VModal({ title, onClose, children, width=500 }) {
  return (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1000, backdropFilter:'blur(3px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:V.panel, border:`1px solid ${V.border2}`, borderRadius:10, width, maxWidth:'95vw', maxHeight:'90vh', overflow:'auto', boxShadow:'0 20px 60px rgba(0,0,0,0.6)' }}>
        <div style={{ padding:'14px 18px', borderBottom:`1px solid ${V.border}`, display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:V.text }}>{title}</h2>
          <button onClick={onClose} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, color:V.textSoft }}>✕</button>
        </div>
        <div style={{ padding:18 }}>{children}</div>
      </div>
    </div>
  );
}

// ─── Tabs ─────────────────────────────────────────────────────────
function VTabs({ tabs, active, onChange }) {
  return (
    <div style={{ display:'flex', borderBottom:`1px solid ${V.border}`, paddingLeft:0 }}>
      {tabs.map(t => (
        <button key={t.id} onClick={() => onChange(t.id)} style={{
          padding:'9px 16px', border:'none', background:'transparent', cursor:'pointer',
          fontSize:12, fontWeight: active===t.id ? 700 : 400,
          color: active===t.id ? V.text : V.textSoft,
          borderBottom: active===t.id ? `2px solid ${V.accent}` : '2px solid transparent',
          marginBottom:-1, whiteSpace:'nowrap',
        }}>{t.label}</button>
      ))}
    </div>
  );
}

Object.assign(window, { V, vRiskColor, vRiskBg, vRiskLabel, vSevColor, RiskDot, IconRail, ContractListPanel, VBtn, VModal, VTabs });
