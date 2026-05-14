// ContractIntel Redesign — Design Tokens

const T = {
  // Backgrounds
  bg:        '#FAFAF9',
  bgAlt:     '#F4F3F1',
  surface:   '#FFFFFF',
  surfaceAlt:'#F8F8F7',
  ink:       '#0F172A',
  inkMid:    '#334155',
  inkSoft:   '#64748B',
  inkMute:   '#94A3B8',
  border:    '#E2E8F0',
  borderMid: '#CBD5E1',

  // Accent
  blue:      '#2563EB',
  blueDark:  '#1D4ED8',
  blueLight: '#DBEAFE',
  blueMid:   '#93C5FD',

  // Semantic
  green:     '#10B981',
  greenDark: '#059669',
  greenBg:   '#ECFDF5',
  greenBorder:'#6EE7B7',

  orange:    '#F59E0B',
  orangeDark:'#D97706',
  orangeBg:  '#FFFBEB',
  orangeBorder:'#FCD34D',

  red:       '#EF4444',
  redDark:   '#DC2626',
  redBg:     '#FEF2F2',
  redBorder: '#FCA5A5',

  // Nav
  nav:       '#0F172A',
  navBorder: '#1E293B',

  // Risk thresholds
  riskColor: (s) => s >= 7 ? '#EF4444' : s >= 4 ? '#F59E0B' : '#10B981',
  riskBg:    (s) => s >= 7 ? '#FEF2F2' : s >= 4 ? '#FFFBEB' : '#ECFDF5',
  riskLabel: (s) => s >= 7 ? 'High Risk' : s >= 4 ? 'Medium Risk' : 'Low Risk',
  riskShort: (s) => s >= 7 ? 'High' : s >= 4 ? 'Medium' : 'Low',
  sevColor:  (sev) => sev === 'red' ? '#EF4444' : sev === 'orange' ? '#F59E0B' : '#10B981',
  sevBg:     (sev) => sev === 'red' ? '#FEF2F2' : sev === 'orange' ? '#FFFBEB' : '#ECFDF5',
};

window.T = T;
