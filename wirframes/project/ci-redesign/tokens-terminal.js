// ContractIntel — Terminal / Bloomberg Tokens

const T = {
  // Backgrounds
  bg:         '#0A0A0A',
  bgAlt:      '#111111',
  surface:    '#141414',
  surfaceAlt: '#1A1A1A',
  surfaceRaised: '#1F1F1F',

  // Borders
  border:     '#242424',
  borderMid:  '#2E2E2E',
  borderBright:'#3A3A3A',

  // Ink
  ink:        '#E8E4DC',       // warm white
  inkMid:     '#A8A29E',       // mid grey
  inkSoft:    '#6B6560',       // muted
  inkMute:    '#3D3A37',       // very muted

  // Accent — amber
  amber:      '#D4A847',
  amberDark:  '#B8912E',
  amberDim:   '#1E1800',
  amberBorder:'#3A2E00',

  // Semantic (desaturated, terminal-style)
  red:        '#E05252',
  redDark:    '#C43A3A',
  redDim:     '#1A0808',
  redBorder:  '#3D1212',

  orange:     '#C47B2A',
  orangeDark: '#A86020',
  orangeDim:  '#181008',
  orangeBorder:'#3A2010',

  green:      '#4A9E6B',
  greenDark:  '#3A8558',
  greenDim:   '#081410',
  greenBorder:'#143020',

  // Nav
  nav:        '#0A0A0A',
  navBorder:  '#1E1E1E',

  // Risk
  riskColor: (s) => s >= 7 ? '#E05252' : s >= 4 ? '#C47B2A' : '#4A9E6B',
  riskBg:    (s) => s >= 7 ? '#1A0808' : s >= 4 ? '#181008' : '#081410',
  riskBorder:(s) => s >= 7 ? '#3D1212' : s >= 4 ? '#3A2010' : '#143020',
  riskLabel: (s) => s >= 7 ? 'HIGH RISK' : s >= 4 ? 'MEDIUM RISK' : 'LOW RISK',
  riskShort: (s) => s >= 7 ? 'HIGH' : s >= 4 ? 'MED' : 'LOW',
  riskCode:  (s) => s >= 7 ? 'HIGH' : s >= 4 ? 'MED' : 'LOW',
  sevColor:  (sev) => sev === 'red' ? '#E05252' : sev === 'orange' ? '#C47B2A' : '#4A9E6B',
  sevBg:     (sev) => sev === 'red' ? '#1A0808' : sev === 'orange' ? '#181008' : '#081410',
  sevBorder: (sev) => sev === 'red' ? '#3D1212' : sev === 'orange' ? '#3A2010' : '#143020',
  sevLabel:  (sev) => sev === 'red' ? 'CRITICAL' : sev === 'orange' ? 'CAUTION' : 'INFO',
};

window.T = T;
