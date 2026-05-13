export const colors = {
  bg: '#FAFAF9',
  bgAlt: '#F4F3F1',
  surface: '#FFFFFF',
  surfaceAlt: '#F8F8F7',

  ink: '#0F172A',
  inkMid: '#334155',
  inkSoft: '#64748B',
  inkMute: '#94A3B8',

  border: '#E2E8F0',
  borderMid: '#CBD5E1',

  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#DBEAFE',
  blueMid: '#93C5FD',

  green: '#10B981',
  greenDark: '#059669',
  greenBg: '#ECFDF5',
  greenBorder: '#6EE7B7',

  orange: '#F59E0B',
  orangeDark: '#D97706',
  orangeBg: '#FFFBEB',
  orangeBorder: '#FCD34D',

  red: '#EF4444',
  redDark: '#DC2626',
  redBg: '#FEF2F2',
  redBorder: '#FCA5A5',

  nav: '#0F172A',
  navBorder: '#1E293B',
} as const;

export const typography = {
  fontFamily: {
    sans: ['DM Sans', 'sans-serif'],
    mono: ['DM Mono', 'monospace'],
  },
  fontSize: {
    xs: '12px',
    sm: '13px',
    base: '14px',
    lg: '15px',
    xl: '16px',
    '2xl': '20px',
    '3xl': '24px',
    '4xl': '32px',
  },
  fontWeight: {
    normal: '400',
    semibold: '600',
    bold: '700',
    extrabold: '800',
  },
  letterSpacing: {
    tighter: '-0.03em',
    tight: '-0.01em',
    normal: '0em',
  },
} as const;

export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '16px',
  lg: '24px',
  xl: '32px',
  xxl: '48px',
} as const;

export const radius = {
  none: '0',
  sm: '4px',
  md: '6px',
  lg: '8px',
  xl: '12px',
  full: '9999px',
} as const;

export const shadow = {
  sm: '0 1px 2px rgba(15, 23, 42, 0.04)',
  md: '0 4px 8px rgba(15, 23, 42, 0.06)',
  lg: '0 8px 16px rgba(15, 23, 42, 0.08)',
  xl: '0 16px 32px rgba(15, 23, 42, 0.10)',
} as const;

export const breakpoints = {
  mobile: '420px',
  sm: '640px',
  md: '860px',
  lg: '1100px',
  xl: '1280px',
} as const;

export type RiskLevel = 'low' | 'medium' | 'high';
export type Severity = 'red' | 'orange' | 'green';

const HIGH_RISK_THRESHOLD = 70;
const MEDIUM_RISK_THRESHOLD = 40;

function normalize(score: number, max: number): number {
  if (max === 100) return score;
  return (score / max) * 100;
}

export function riskLevel(score: number, max: number = 100): RiskLevel {
  const normalized = normalize(score, max);
  if (normalized >= HIGH_RISK_THRESHOLD) return 'high';
  if (normalized >= MEDIUM_RISK_THRESHOLD) return 'medium';
  return 'low';
}

export function riskColor(score: number, max: number = 100): string {
  const level = riskLevel(score, max);
  if (level === 'high') return colors.red;
  if (level === 'medium') return colors.orange;
  return colors.green;
}

export function riskBg(score: number, max: number = 100): string {
  const level = riskLevel(score, max);
  if (level === 'high') return colors.redBg;
  if (level === 'medium') return colors.orangeBg;
  return colors.greenBg;
}

export function riskLabel(score: number, max: number = 100): string {
  const level = riskLevel(score, max);
  if (level === 'high') return 'High Risk';
  if (level === 'medium') return 'Medium Risk';
  return 'Low Risk';
}

export function riskShort(score: number, max: number = 100): string {
  const level = riskLevel(score, max);
  if (level === 'high') return 'High';
  if (level === 'medium') return 'Medium';
  return 'Low';
}

export function sevColor(sev: Severity): string {
  if (sev === 'red') return colors.red;
  if (sev === 'orange') return colors.orange;
  return colors.green;
}

export function sevBg(sev: Severity): string {
  if (sev === 'red') return colors.redBg;
  if (sev === 'orange') return colors.orangeBg;
  return colors.greenBg;
}

export const designTokens = {
  colors,
  typography,
  spacing,
  radius,
  shadow,
  breakpoints,
} as const;

export type DesignTokens = typeof designTokens;
